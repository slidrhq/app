//! The organization's settings of the app (ADR-117): which agents it offers and starts with, the
//! agents of the organization's own, the languages of its interface, web access, the image
//! providers and the photo libraries. Slidr Library publishes them as one file of the media
//! library, `system/settings.json` (its README, "System settings"), and the app reads it through
//! the library, as it reads the rest of it.
//!
//! - It is read when the app first starts, and kept in `<app_data>/system-settings.json` with the
//!   address of the library it came from and the version of the app that read it (ADR-124). Every
//!   later start goes by what is kept, at once, without waiting for the network; and reads the
//!   library again in the background, for the next start: what the library says now is kept when
//!   it is not what was kept, and the running app goes on by what it started with. A change in
//!   the library so reaches each app at the start after the one that read it.
//! - A start that reads another library than the one kept, or that has nothing kept, waits for
//!   the library: the settings are of the library they came from. Until it has read it, it goes
//!   by what was kept.
//! - A library that does not have the file has no settings: the app's own defaults stand, and
//!   that is kept too. A library that cannot be read now says nothing: what was kept before stands,
//!   and the next start reads it again.
//! - What the file names that this version does not know, or that does not hold (an agent whose
//!   id is one of the app's own, a script for a program), is left out, and the rest stands.

use std::{
    collections::{BTreeMap, HashSet},
    path::{Path, PathBuf},
    sync::Arc,
    time::Duration,
};

use reqwest::Url;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use tokio::sync::watch;

use crate::media_library::{Fresh, MediaLibrary};

/// Where the library publishes them.
pub const PATH: &str = "system/settings.json";

/// Where the app keeps them, in its data folder.
pub const FILE: &str = "system-settings.json";

/// A development build may read them from a file of this machine instead, every start.
const DEVELOPMENT: &str = "SLIDR_SYSTEM_SETTINGS";

/// How long a reader waits for the first read of a start: the manifest's time, and the file's.
const WAIT: Duration = Duration::from_secs(20);

/// The ids of the app's own agents and image providers, which an agent of the organization's may
/// not take (docs/custom-agent-cli.md §3).
const RESERVED: [&str; 7] = [
    "claude-code",
    "codex-cli",
    "copilot-cli",
    "gemini-cli",
    "grok-cli",
    "openai-api",
    "mock",
];

/// The folder an agent's package is unpacked into (ADR-125): `%SLIDR_AGENT_DIR%` in its program,
/// arguments and environment, and a variable of its environment.
pub const AGENT_DIR: &str = "SLIDR_AGENT_DIR";

/// Where the library keeps the agents' packages: `system/agents/<id>.zip`.
const PACKAGES: &str = "system/agents/";

/// What the app sets in an agent's environment itself (docs/custom-agent-cli.md §4).
const OWN_ENV: [&str; 3] = ["SLIDR_PROTOCOL", "SLIDR_MCP_TOKEN", AGENT_DIR];

/// What is offered of one kind, and the one the app starts with. None offered: every one.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Offer {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub offered: Option<Vec<String>>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub default: Option<String>,
}

impl Offer {
    fn parse(value: &Value) -> Self {
        let offered = value["offered"].as_array().map(|ids| {
            ids.iter()
                .filter_map(Value::as_str)
                .map(str::to_owned)
                .collect::<Vec<_>>()
        });
        Self {
            // A list that names nothing this version can read offers nothing, as it says.
            offered,
            default: value["default"].as_str().map(str::to_owned),
        }
    }

    /// Whether `id` is offered.
    pub fn allows(&self, id: &str) -> bool {
        self.offered
            .as_ref()
            .is_none_or(|offered| offered.iter().any(|one| one == id))
    }

    /// The default, when it is offered.
    pub fn chosen(&self) -> Option<&str> {
        self.default.as_deref().filter(|id| self.allows(id))
    }

    /// `items` as the organization offers them: only those offered, in their own order, with the
    /// default first. `exempt` are kept whatever is offered (the stand-ins of the tests).
    pub fn arrange<T>(
        &self,
        items: Vec<T>,
        id: impl Fn(&T) -> String,
        exempt: impl Fn(&T) -> bool,
    ) -> Vec<T> {
        let (mut first, mut rest): (Vec<T>, Vec<T>) = items
            .into_iter()
            .filter(|item| exempt(item) || self.allows(&id(item)))
            .partition(|item| self.chosen() == Some(id(item).as_str()));
        first.append(&mut rest);
        first
    }
}

/// Web search and fetch for the agent.
#[derive(Debug, Clone, Copy, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "snake_case")]
pub enum WebAccess {
    /// On to start with; each user's to turn off.
    On,
    /// Off to start with; each user's to turn on.
    Off,
    /// Never.
    Blocked,
}

/// How the app installs an agent's CLI once the user approves.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(untagged)]
pub enum Install {
    /// WinGet's package, from the community's source or the one named.
    Winget {
        winget: String,
        #[serde(default, skip_serializing_if = "Option::is_none")]
        source: Option<String>,
    },
    /// npm's package, after Node.js when npm is missing.
    Npm { npm: String },
    /// A package of the organization's library (ADR-125): a .zip of the CLI and every file it
    /// needs, downloaded from the library alone and unpacked into a folder of the agent's own.
    /// `sha256` and `size` are of the package as the settings were published; the app installs it
    /// as the library has it at the start that installs it.
    Package {
        package: String,
        sha256: String,
        size: u64,
    },
}

/// An agent of the organization's own: a CLI of the custom agent protocol
/// (docs/custom-agent-cli.md), offered as the app offers its own agents.
#[derive(Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct CustomAgent {
    pub id: String,
    pub name: String,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub glyph: Option<String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub tone: Option<String>,
    /// A native executable: its absolute path, which `%NAME%` of the environment may begin, or its
    /// name, found where the app finds the CLIs it installs.
    pub command: String,
    #[serde(default)]
    pub args: Vec<String>,
    #[serde(default)]
    pub env: BTreeMap<String, String>,
    #[serde(default, skip_serializing_if = "Option::is_none")]
    pub install: Option<Install>,
}

fn is_id(id: &str) -> bool {
    let mut chars = id.chars();
    (2..=32).contains(&id.len())
        && chars.next().is_some_and(|c| c.is_ascii_lowercase())
        && chars.all(|c| c.is_ascii_lowercase() || c.is_ascii_digit() || c == '-')
}

fn is_plain(value: &str, more: &[char], longest: usize) -> bool {
    !value.is_empty()
        && value.len() <= longest
        && value
            .chars()
            .next()
            .is_some_and(|c| c.is_ascii_alphanumeric())
        && value
            .chars()
            .all(|c| c.is_ascii_alphanumeric() || more.contains(&c))
}

/// A path within an agent's package, `bin\acme.exe`: each part plain, so none of them leaves it.
fn is_within(path: &str) -> bool {
    path.split(['\\', '/'])
        .all(|part| is_plain(part, &['.', '_', '-', ' '], 128))
}

/// A command as the protocol takes it: an absolute path or a program's name, or for an agent that
/// comes as a package, a path within it; and not a script, which would leave the CLI running when
/// the app ends the process it started.
fn is_command(command: &str, packaged: bool) -> bool {
    let lower = command.to_ascii_lowercase();
    let script = [".cmd", ".bat", ".ps1", ".vbs", ".js"]
        .iter()
        .any(|extension| lower.ends_with(extension));
    let bytes = command.as_bytes();
    let absolute = (bytes.len() > 3
        && bytes[0].is_ascii_alphabetic()
        && bytes[1] == b':'
        && bytes[2] == b'\\')
        || command.starts_with('/')
        || command
            .strip_prefix('%')
            .and_then(|rest| rest.split_once('%'))
            .is_some_and(|(name, rest)| {
                is_plain(name, &['_'], 64) && (rest.starts_with('\\') || rest.starts_with('/'))
            });
    !script
        && command.len() <= 260
        && !command.contains('\0')
        && (absolute
            || is_plain(command, &['.', '_', '-'], 260)
            || (packaged && is_within(command)))
}

fn is_hash(value: &str) -> bool {
    value.len() == 64
        && value
            .chars()
            .all(|c| c.is_ascii_digit() || matches!(c, 'a'..='f'))
}

impl CustomAgent {
    /// The path of its package in the library, when it comes as one (ADR-125).
    pub fn package(&self) -> Option<&str> {
        match &self.install {
            Some(Install::Package { package, .. }) => Some(package),
            _ => None,
        }
    }

    /// Whether it is an agent the app may offer (docs/custom-agent-cli.md §3).
    fn holds(&self) -> bool {
        let glyph = self
            .glyph
            .as_deref()
            .map_or(1, |glyph| glyph.chars().count());
        let name = self.name.trim();
        let install = match &self.install {
            None => true,
            Some(Install::Winget { winget, source }) => {
                is_plain(winget, &['.', '+', '_', '-'], 128)
                    && source
                        .as_deref()
                        .is_none_or(|source| is_plain(source, &['.', '_', '-'], 64))
            }
            Some(Install::Npm { npm }) => {
                let (scope, package) = match npm.strip_prefix('@') {
                    Some(rest) => match rest.split_once('/') {
                        Some((scope, package)) => (Some(scope), package),
                        None => return false,
                    },
                    None => (None, npm.as_str()),
                };
                let plain = |part: &str| {
                    is_plain(part, &['.', '_', '-'], 214)
                        && !part.chars().any(|c| c.is_ascii_uppercase())
                };
                scope.is_none_or(plain) && plain(package)
            }
            // A .zip of the library's agents' folder, by a path the media library reads.
            Some(Install::Package {
                package,
                sha256,
                size,
            }) => {
                package.strip_prefix(PACKAGES).is_some_and(|name| {
                    name.ends_with(".zip") && is_plain(name, &['.', '_', '-'], 64)
                }) && is_hash(sha256)
                    && *size > 0
            }
        };
        is_id(&self.id)
            && !RESERVED.contains(&self.id.as_str())
            && !name.is_empty()
            && name.chars().count() <= 40
            && (1..=2).contains(&glyph)
            && is_command(self.command.trim(), self.package().is_some())
            && self.args.len() <= 32
            && self.env.keys().all(|key| {
                is_plain(key, &['_'], 64)
                    && !key.starts_with(|c: char| c.is_ascii_digit())
                    && !OWN_ENV.contains(&key.to_ascii_uppercase().as_str())
            })
            && install
    }
}

/// The agents part of the settings.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Agents {
    #[serde(flatten)]
    pub offer: Offer,
    pub custom: Vec<CustomAgent>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub web_access: Option<WebAccess>,
}

/// The settings, as this version of the app reads them.
#[derive(Debug, Clone, Default, PartialEq, Eq, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct Policy {
    pub agents: Agents,
    pub languages: Offer,
    pub images: Offer,
    pub stock: Offer,
}

impl Policy {
    /// The settings of a published file; none for one that is not of version 1.
    pub fn parse(value: &Value) -> Option<Self> {
        if value["version"].as_u64() != Some(1) {
            return None;
        }
        let agents = &value["agents"];
        let mut seen = HashSet::new();
        let custom = agents["custom"]
            .as_array()
            .into_iter()
            .flatten()
            .filter_map(|agent| serde_json::from_value::<CustomAgent>(agent.clone()).ok())
            .map(|mut agent| {
                agent.command = agent.command.trim().to_owned();
                agent.name = agent.name.trim().to_owned();
                agent
            })
            .filter(|agent| agent.holds() && seen.insert(agent.id.clone()))
            .collect();
        Some(Self {
            agents: Agents {
                offer: Offer::parse(agents),
                custom,
                web_access: serde_json::from_value(agents["webAccess"].clone()).ok(),
            },
            languages: Offer::parse(&value["languages"]),
            images: Offer::parse(&value["images"]),
            stock: Offer::parse(&value["stock"]),
        })
    }

    /// Whether the agent may search and read the web, when the user would have it.
    pub fn web_allowed(&self) -> bool {
        self.agents.web_access != Some(WebAccess::Blocked)
    }
}

/// What the app keeps of the settings, and of where and when they were read.
#[derive(Debug, PartialEq, Serialize, Deserialize)]
struct Kept {
    /// The version of the app that read them: a record, which no longer decides when they are
    /// read again (ADR-124).
    app: String,
    /// The library they were read from.
    library: Option<String>,
    /// The file as it was published; none when the library had none.
    settings: Option<Value>,
}

/// The settings of this run: the ones it goes by now, and whether they stay so to its end (what
/// was kept of this library from the start; else once this start has read the library).
#[derive(Debug, Clone, Default)]
struct Read {
    policy: Option<Arc<Policy>>,
    done: bool,
}

/// The settings of the running app.
pub struct SystemSettings {
    file: PathBuf,
    app: String,
    library: Option<String>,
    /// What was kept when the app started: the file is written again only when the library says
    /// something else.
    kept: Option<Kept>,
    state: watch::Sender<Read>,
}

impl SystemSettings {
    /// The settings kept in `file`, for this version of the app reading `library`. What is kept is
    /// gone by at once. When it is of this library, or the app has no library at all, it is what
    /// this start goes by to the end, and [`Self::start`] reads the library only for the next
    /// start; otherwise this start goes by what it reads.
    pub fn new(file: PathBuf, app: &str, library: Option<&Url>) -> Arc<Self> {
        let kept = std::fs::read(&file)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Kept>(&bytes).ok());
        let library = library.map(Url::to_string);
        let policy = kept
            .as_ref()
            .and_then(|kept| kept.settings.as_ref())
            .and_then(Policy::parse)
            .map(Arc::new);
        let current = kept.as_ref().is_some_and(|kept| kept.library == library);
        let done = current || library.is_none();
        Arc::new(Self {
            file,
            app: app.to_owned(),
            library,
            kept,
            state: watch::Sender::new(Read { policy, done }),
        })
    }

    /// In a development build, the settings of the file [`DEVELOPMENT`] names, read every start
    /// and never kept: a file that cannot be read is no settings.
    pub fn development() -> Option<Arc<Self>> {
        if !cfg!(debug_assertions) {
            return None;
        }
        let path = std::env::var_os(DEVELOPMENT)?;
        let policy = std::fs::read(&path)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Value>(&bytes).ok())
            .as_ref()
            .and_then(Policy::parse)
            .map(Arc::new);
        Some(Arc::new(Self {
            file: PathBuf::new(),
            app: String::new(),
            library: None,
            kept: None,
            state: watch::Sender::new(Read { policy, done: true }),
        }))
    }

    /// Reads the settings from `library` in the background, at every start: for this start when
    /// it waits for them, and for the next start in any case.
    pub fn start(self: &Arc<Self>, library: Option<Arc<MediaLibrary>>) {
        // Without a library, or in a development build that reads its settings from a file of this
        // machine, there is nothing to read.
        let (Some(library), Some(_)) = (library, self.library.as_ref()) else {
            self.settle();
            return;
        };
        let settings = Arc::clone(self);
        tauri::async_runtime::spawn(async move {
            settings.read(&library).await;
        });
    }

    /// Reads the settings from the library, and keeps what it says when it is not what was kept.
    /// A start that waits for them goes by them at once; one that went by what was kept goes on by
    /// it, and the next start goes by these.
    async fn read(&self, library: &MediaLibrary) {
        let published = match library.read_fresh(PATH).await {
            // A file that is not JSON is as good as none: the library has no settings.
            Fresh::Found(bytes) => serde_json::from_slice::<Value>(&bytes).ok(),
            Fresh::Missing => None,
            Fresh::Unavailable => {
                // Nothing said: what was kept stands, and the next start reads again.
                self.settle();
                return;
            }
        };
        let kept = Kept {
            app: self.app.clone(),
            library: self.library.clone(),
            settings: published,
        };
        // A failure to keep them only means the next start goes by what was kept before, and
        // reads the library again.
        if self.kept.as_ref() != Some(&kept)
            && let Ok(json) = serde_json::to_vec_pretty(&kept)
        {
            let _ = write_atomic(&self.file, &json);
        }
        let policy = kept.settings.as_ref().and_then(Policy::parse).map(Arc::new);
        // The settings of this run change only while it waits for them.
        self.state.send_if_modified(|read| {
            if read.done {
                return false;
            }
            *read = Read { policy, done: true };
            true
        });
    }

    /// The read of this start is over, if it was not: what stands now stays.
    fn settle(&self) {
        self.state
            .send_if_modified(|read| !std::mem::replace(&mut read.done, true));
    }

    /// The settings the app goes by now: what was kept, until a start that waits for the library
    /// has read it.
    pub fn current(&self) -> Option<Arc<Policy>> {
        self.state.borrow().policy.clone()
    }

    /// The settings this start goes by: at once when it goes by what was kept; else once it has
    /// read the library, or what stands when that takes too long.
    pub async fn wait(&self) -> Option<Arc<Policy>> {
        let mut read = self.state.subscribe();
        let _ = tokio::time::timeout(WAIT, read.wait_for(|read| read.done)).await;
        self.current()
    }

    /// Calls `apply` with the settings now, and again once this start has read the library, when
    /// it waits for it.
    pub fn apply(self: &Arc<Self>, apply: impl Fn(Option<&Policy>) + Send + Sync + 'static) {
        apply(self.current().as_deref());
        if self.state.borrow().done {
            return;
        }
        let mut read = self.state.subscribe();
        tauri::async_runtime::spawn(async move {
            if read.wait_for(|read| read.done).await.is_ok() {
                let policy = read.borrow().policy.clone();
                apply(policy.as_deref());
            }
        });
    }
}

/// Writes `file` whole or not at all: to a file of its own first, then renamed.
fn write_atomic(file: &Path, bytes: &[u8]) -> std::io::Result<()> {
    let dir = file
        .parent()
        .ok_or_else(|| std::io::Error::other("the file has no folder"))?;
    std::fs::create_dir_all(dir)?;
    let temp = dir.join(format!(".{FILE}.{}.tmp", uuid::Uuid::new_v4()));
    std::fs::write(&temp, bytes)?;
    std::fs::rename(&temp, file).inspect_err(|_| {
        let _ = std::fs::remove_file(&temp);
    })
}

/// `system_settings_read()`: the settings this start goes by ([`SystemSettings::wait`]); null when
/// the organization set none.
#[tauri::command]
pub async fn system_settings_read(
    settings: tauri::State<'_, Arc<SystemSettings>>,
) -> Result<Option<Policy>, crate::error::AppError> {
    Ok(settings.wait().await.as_deref().cloned())
}

#[cfg(test)]
mod tests {
    use std::sync::{Mutex, PoisonError};

    use serde_json::json;

    use super::*;

    type TestResult = std::result::Result<(), Box<dyn std::error::Error>>;

    fn agent() -> Value {
        json!({
            "id": "acme",
            "name": " Acme Agent ",
            "glyph": "A",
            "tone": "teal",
            "command": "%LOCALAPPDATA%\\Programs\\Acme\\acme.exe",
            "args": ["--quiet"],
            "env": { "ACME_REGION": "eu" },
            "install": { "winget": "Acme.Agent" }
        })
    }

    fn published() -> Value {
        json!({
            "version": 1,
            "updated": "2026-10-27T10:00:00.000Z",
            "agents": {
                "offered": ["claude-code", "acme"],
                "default": "acme",
                "webAccess": "blocked",
                "custom": [agent()],
                "later": "a field of a later version"
            },
            "languages": { "offered": ["he", "en"], "default": "he" },
            "images": { "offered": ["codex-cli"] },
            "stock": { "default": "pexels" }
        })
    }

    #[test]
    fn a_published_file_is_read_as_this_version_knows_it() -> TestResult {
        let policy = Policy::parse(&published()).ok_or("no settings")?;
        assert_eq!(
            policy.agents.offer.offered.as_deref(),
            Some(&["claude-code".to_owned(), "acme".to_owned()][..])
        );
        assert_eq!(policy.agents.offer.chosen(), Some("acme"));
        assert_eq!(policy.agents.web_access, Some(WebAccess::Blocked));
        assert!(!policy.web_allowed());
        let acme = &policy.agents.custom[0];
        assert_eq!(acme.name, "Acme Agent");
        assert_eq!(acme.args, ["--quiet"]);
        assert_eq!(
            acme.install,
            Some(Install::Winget {
                winget: "Acme.Agent".into(),
                source: None
            })
        );
        assert!(policy.languages.allows("he") && !policy.languages.allows("fr"));
        assert!(policy.stock.allows("unsplash"));
        assert_eq!(policy.stock.chosen(), Some("pexels"));
        // Another version of the file, or none, is no settings.
        assert_eq!(Policy::parse(&json!({ "version": 2 })), None);
        assert_eq!(Policy::parse(&json!("text")), None);
        Ok(())
    }

    #[test]
    fn an_agent_that_does_not_hold_is_left_out_and_the_rest_stands() {
        let with = |change: Value| {
            let mut agent = agent();
            for (key, value) in change.as_object().into_iter().flatten() {
                agent[key] = value.clone();
            }
            let mut file = published();
            file["agents"]["custom"] = json!([agent]);
            Policy::parse(&file).map(|policy| policy.agents.custom.len())
        };
        assert_eq!(with(json!({})), Some(1));
        for wrong in [
            json!({ "id": "claude-code" }),
            json!({ "id": "Acme" }),
            json!({ "id": "a" }),
            json!({ "name": "  " }),
            json!({ "glyph": "ABC" }),
            json!({ "command": "acme.cmd" }),
            json!({ "command": "C:\\Tools\\acme.ps1" }),
            json!({ "command": "tools\\acme.exe" }),
            json!({ "command": "acme & calc" }),
            json!({ "env": { "SLIDR_MCP_TOKEN": "x" } }),
            json!({ "env": { "1ST": "x" } }),
            json!({ "install": { "winget": "Acme Agent" } }),
            json!({ "install": { "npm": "@Acme/agent" } }),
            json!({ "install": { "npm": "@acme" } }),
        ] {
            assert_eq!(with(wrong.clone()), Some(0), "{wrong}");
        }
        for right in [
            json!({ "command": "acme" }),
            json!({ "command": "acme.exe" }),
            json!({ "command": "C:\\Program Files\\Acme\\acme.exe" }),
            json!({ "command": "/usr/local/bin/acme" }),
            json!({ "install": { "npm": "@acme/agent" } }),
            json!({ "install": { "winget": "Acme.Agent", "source": "acme-store" } }),
        ] {
            assert_eq!(with(right.clone()), Some(1), "{right}");
        }
        // Two of one id: the first is offered.
        let mut file = published();
        file["agents"]["custom"] = json!([agent(), agent()]);
        assert_eq!(
            Policy::parse(&file).map(|policy| policy.agents.custom.len()),
            Some(1)
        );
    }

    #[test]
    fn an_agent_may_come_as_a_package_of_the_library_with_paths_within_it() {
        let hash = "ab".repeat(32);
        let package = json!({ "package": "system/agents/acme.zip", "sha256": hash, "size": 2048 });
        let with = |change: Value| {
            let mut agent = agent();
            agent["install"] = package.clone();
            for (key, value) in change.as_object().into_iter().flatten() {
                agent[key] = value.clone();
            }
            let mut file = published();
            file["agents"]["custom"] = json!([agent]);
            Policy::parse(&file).and_then(|policy| policy.agents.custom.into_iter().next())
        };
        let acme = with(json!({})).expect("a package holds");
        assert_eq!(acme.package(), Some("system/agents/acme.zip"));
        assert_eq!(
            acme.install,
            Some(Install::Package {
                package: "system/agents/acme.zip".into(),
                sha256: hash.clone(),
                size: 2048
            })
        );
        for right in [
            json!({ "command": "acme.exe" }),
            json!({ "command": "bin\\acme.exe" }),
            json!({ "command": "Acme Agent/bin/acme.exe" }),
            json!({ "command": "%SLIDR_AGENT_DIR%\\bin\\acme.exe" }),
            json!({ "command": "pwsh.exe", "args": ["-File", "%SLIDR_AGENT_DIR%\\agent.ps1"] }),
        ] {
            assert!(with(right.clone()).is_some(), "{right}");
        }
        for wrong in [
            json!({ "command": "..\\acme.exe" }),
            json!({ "command": "bin\\..\\..\\acme.exe" }),
            json!({ "command": "bin\\acme.cmd" }),
            json!({ "command": ".hidden\\acme.exe" }),
            json!({ "env": { "SLIDR_AGENT_DIR": "C:\\Elsewhere" } }),
            json!({ "install": { "package": "fonts/acme.zip", "sha256": hash, "size": 1 } }),
            json!({ "install": { "package": "system/agents/../x.zip", "sha256": hash, "size": 1 } }),
            json!({ "install": { "package": "system/agents/acme.exe", "sha256": hash, "size": 1 } }),
            json!({ "install": { "package": "system/agents/acme.zip", "sha256": "AB", "size": 1 } }),
            json!({ "install": { "package": "system/agents/acme.zip", "sha256": hash, "size": 0 } }),
        ] {
            assert!(with(wrong.clone()).is_none(), "{wrong}");
        }
        // A path within a package is no command of an agent without one.
        let mut file = published();
        let mut plain = agent();
        plain["command"] = json!("bin\\acme.exe");
        file["agents"]["custom"] = json!([plain]);
        assert_eq!(
            Policy::parse(&file).map(|policy| policy.agents.custom.len()),
            Some(0)
        );
    }

    #[test]
    fn what_is_offered_comes_in_its_order_with_the_default_first() {
        let offer = Offer {
            offered: Some(vec!["b".into(), "c".into()]),
            default: Some("c".into()),
        };
        let items = vec!["a", "b", "c", "mock"];
        assert_eq!(
            offer.arrange(items.clone(), |id| (*id).to_owned(), |id| *id == "mock"),
            ["c", "b", "mock"]
        );
        // A default that is not offered is none.
        let offer = Offer {
            offered: Some(vec!["b".into()]),
            default: Some("c".into()),
        };
        assert_eq!(offer.chosen(), None);
        assert_eq!(
            offer.arrange(items, |id| (*id).to_owned(), |_| false),
            ["b"]
        );
    }

    fn keep(dir: &Path, app: &str, library: &str, settings: Option<Value>) -> TestResult {
        let kept = Kept {
            app: app.into(),
            library: Some(library.into()),
            settings,
        };
        std::fs::write(dir.join(FILE), serde_json::to_vec(&kept)?)?;
        Ok(())
    }

    fn done(settings: &SystemSettings) -> bool {
        settings.state.borrow().done
    }

    #[test]
    fn what_was_kept_of_this_library_is_gone_by_without_waiting() -> TestResult {
        let dir = tempfile::tempdir()?;
        let file = dir.path().join(FILE);
        let library = Url::parse("https://media.example.org/slidr/")?;
        keep(dir.path(), "0.2.1", library.as_str(), Some(published()))?;

        let same = SystemSettings::new(file.clone(), "0.2.1", Some(&library));
        assert!(done(&same));
        let chosen = same
            .current()
            .and_then(|policy| policy.agents.offer.chosen().map(str::to_owned));
        assert_eq!(chosen.as_deref(), Some("acme"));
        // Another version goes by it as well.
        let newer = SystemSettings::new(file.clone(), "0.3.0", Some(&library));
        assert!(done(&newer) && newer.current().is_some());
        // Another library waits for its own, and goes by what was kept meanwhile.
        let other = Url::parse("https://other.example.org/")?;
        let moved = SystemSettings::new(file.clone(), "0.2.1", Some(&other));
        assert!(!done(&moved) && moved.current().is_some());
        // Without a library, what was kept stands.
        let none = SystemSettings::new(file, "0.3.0", None);
        assert!(done(&none) && none.current().is_some());
        // Nothing kept, and a library to read.
        let empty = tempfile::tempdir()?;
        let fresh = SystemSettings::new(empty.path().join(FILE), "0.2.1", Some(&library));
        assert!(!done(&fresh) && fresh.current().is_none());
        Ok(())
    }

    #[tokio::test]
    async fn the_library_is_read_at_every_start_and_kept_for_the_next() -> TestResult {
        use sha2::Digest;

        use crate::net::testing::{Reply, Seen, serve};

        let answer: Arc<Mutex<Option<Vec<u8>>>> =
            Arc::new(Mutex::new(Some(serde_json::to_vec(&published())?)));
        let served = Arc::clone(&answer);
        let server = serve(move |seen: &Seen| {
            let file = served
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .clone();
            match (seen.path.as_str(), file) {
                ("/manifest.json", file) => {
                    let mut files = serde_json::Map::new();
                    if let Some(bytes) = file {
                        let sha256 = format!("{:x}", sha2::Sha256::digest(&bytes));
                        files.insert(
                            PATH.into(),
                            json!({ "size": bytes.len(), "sha256": sha256 }),
                        );
                    }
                    let manifest = json!({ "version": 1, "files": files });
                    Reply::json(200, serde_json::to_vec(&manifest).unwrap_or_default())
                }
                ("/system/settings.json", Some(bytes)) => Reply::json(200, bytes),
                _ => Reply::bytes(404, "text/html", Vec::new()),
            }
        })
        .await?;
        let base = Url::parse(&server.base)?;
        let data = tempfile::tempdir()?;
        let file = data.path().join(FILE);
        let media = tempfile::tempdir()?;
        let library = || MediaLibrary::new(base.clone(), media.path().to_path_buf());

        // The first start has nothing kept: it waits for the library, goes by it, and keeps it.
        let first = library();
        let settings = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
        assert!(!done(&settings));
        let ((), ()) = tokio::join!(
            async {
                first.refresh().await;
            },
            settings.read(&first)
        );
        assert!(done(&settings));
        let languages = settings.current().map(|p| p.languages.offered.clone());
        assert_eq!(
            languages,
            Some(Some(vec!["he".to_owned(), "en".to_owned()]))
        );

        // A later start goes by what was kept at once, and reads the library again. What it says
        // is what was kept, so the file is left as it was (kept here as `serde_json` writes it
        // compact, which the app never writes).
        keep(data.path(), "0.2.1", base.as_str(), Some(published()))?;
        let before = std::fs::read(&file)?;
        let next = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
        assert!(done(&next) && next.current().is_some());
        let again = library();
        let ((), ()) = tokio::join!(
            async {
                again.refresh().await;
            },
            next.read(&again)
        );
        assert_eq!(std::fs::read(&file)?, before);

        // The library takes its settings away. A start goes on by what was kept, and keeps none
        // for the next one, which goes by none.
        *answer.lock().unwrap_or_else(PoisonError::into_inner) = None;
        let third = library();
        let running = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
        let ((), ()) = tokio::join!(
            async {
                third.refresh().await;
            },
            running.read(&third)
        );
        assert!(done(&running) && running.current().is_some());
        let after = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
        assert!(done(&after) && after.current().is_none());

        // A library that cannot be read says nothing. To a start that went by what was kept of it,
        // what was kept stands, and stays kept.
        let gone = Url::parse("http://127.0.0.1:9/")?;
        keep(data.path(), "0.3.0", gone.as_str(), Some(published()))?;
        let unreachable = MediaLibrary::new(gone.clone(), media.path().to_path_buf());
        let offline = SystemSettings::new(file.clone(), "0.4.0", Some(&gone));
        let ((), ()) = tokio::join!(
            async {
                unreachable.refresh().await;
            },
            offline.read(&unreachable)
        );
        assert!(done(&offline) && offline.current().is_some());
        let later = SystemSettings::new(file.clone(), "0.4.0", Some(&gone));
        assert!(done(&later) && later.current().is_some());
        // To a start that waits for it, having kept another library's: what was kept stands for
        // this run, and the next start waits again.
        keep(data.path(), "0.4.0", base.as_str(), Some(published()))?;
        let moved = SystemSettings::new(file.clone(), "0.4.0", Some(&gone));
        assert!(!done(&moved));
        moved.read(&unreachable).await;
        assert!(done(&moved) && moved.current().is_some());
        assert!(!done(&SystemSettings::new(file, "0.4.0", Some(&gone))));
        Ok(())
    }
}
