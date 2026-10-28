//! The organization's settings of the app (ADR-117): which agents it offers and starts with, the
//! agents of the organization's own, the languages of its interface, web access, the image
//! providers and the photo libraries. Slidr Library publishes them as one file of the media
//! library, `system/settings.json` (its README, "System settings"), and the app reads it through
//! the library, as it reads the rest of it.
//!
//! - It is read when the app first starts, and kept in `<app_data>/system-settings.json` with the
//!   version of the app and the address of the library it came from. Every later start goes by
//!   what is kept, without the network. It is read again only when the app starts as another
//!   version, or reads another library.
//! - A library that does not have the file has no settings: the app's own defaults stand, and
//!   that is kept too. A library that cannot be read now says nothing: what was kept before stands
//!   for this run, and the next start reads it again.
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

/// What the app sets in an agent's environment itself (docs/custom-agent-cli.md §4).
const OWN_ENV: [&str; 2] = ["SLIDR_PROTOCOL", "SLIDR_MCP_TOKEN"];

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

/// A command as the protocol takes it: an absolute path or a program's name, and not a script,
/// which would leave the CLI running when the app ends the process it started.
fn is_command(command: &str) -> bool {
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
        && (absolute || is_plain(command, &['.', '_', '-'], 260))
}

impl CustomAgent {
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
        };
        is_id(&self.id)
            && !RESERVED.contains(&self.id.as_str())
            && !name.is_empty()
            && name.chars().count() <= 40
            && (1..=2).contains(&glyph)
            && is_command(self.command.trim())
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
#[derive(Debug, Serialize, Deserialize)]
struct Kept {
    /// The version of the app that read them.
    app: String,
    /// The library they were read from.
    library: Option<String>,
    /// The file as it was published; none when the library had none.
    settings: Option<Value>,
}

/// The settings of this run: the ones it goes by now, and whether the read of this start is over.
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
    state: watch::Sender<Read>,
}

impl SystemSettings {
    /// The settings kept in `file`, for this version of the app reading `library`. What is kept is
    /// gone by at once. It is all there is to read when it is of this version and this library,
    /// or when the app has no library at all; otherwise [`Self::start`] reads the library.
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
        let current = kept
            .as_ref()
            .is_some_and(|kept| kept.app == app && kept.library == library);
        let done = current || library.is_none();
        Arc::new(Self {
            file,
            app: app.to_owned(),
            library,
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
            state: watch::Sender::new(Read { policy, done: true }),
        }))
    }

    /// Reads the settings from `library` in the background, when what is kept is not of this
    /// start's version and library.
    pub fn start(self: &Arc<Self>, library: Option<Arc<MediaLibrary>>) {
        if self.state.borrow().done {
            return;
        }
        let Some(library) = library else {
            self.state.send_modify(|read| read.done = true);
            return;
        };
        let settings = Arc::clone(self);
        tauri::async_runtime::spawn(async move {
            settings.read(&library).await;
        });
    }

    /// Reads the settings from the library, and keeps what it says.
    async fn read(&self, library: &MediaLibrary) {
        let published = match library.read_fresh(PATH).await {
            // A file that is not JSON is as good as none: the library has no settings.
            Fresh::Found(bytes) => serde_json::from_slice::<Value>(&bytes).ok(),
            Fresh::Missing => None,
            Fresh::Unavailable => {
                // Nothing said: what was kept stands for this run, and the next start reads again.
                self.state.send_modify(|read| read.done = true);
                return;
            }
        };
        let policy = published.as_ref().and_then(Policy::parse).map(Arc::new);
        let kept = Kept {
            app: self.app.clone(),
            library: self.library.clone(),
            settings: published,
        };
        // A failure to keep them only means they are read from the library again next time.
        if let Ok(json) = serde_json::to_vec_pretty(&kept) {
            let _ = write_atomic(&self.file, &json);
        }
        self.state.send_replace(Read { policy, done: true });
    }

    /// The settings the app goes by now: what was kept, until the read of this start is over.
    pub fn current(&self) -> Option<Arc<Policy>> {
        self.state.borrow().policy.clone()
    }

    /// The settings once the read of this start is over, or what stands when it takes too long.
    pub async fn wait(&self) -> Option<Arc<Policy>> {
        let mut read = self.state.subscribe();
        let _ = tokio::time::timeout(WAIT, read.wait_for(|read| read.done)).await;
        self.current()
    }

    /// Calls `apply` with the settings now, and again once the read of this start is over.
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

/// `system_settings_read()`: the settings the app goes by, once the read of this start is over;
/// null when the organization set none.
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
    fn what_was_kept_is_all_there_is_until_the_version_or_the_library_changes() -> TestResult {
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
        // Another version reads again, and goes by what was kept meanwhile.
        let newer = SystemSettings::new(file.clone(), "0.3.0", Some(&library));
        assert!(!done(&newer) && newer.current().is_some());
        // So does another library.
        let other = Url::parse("https://other.example.org/")?;
        assert!(!done(&SystemSettings::new(
            file.clone(),
            "0.2.1",
            Some(&other)
        )));
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
    async fn the_library_is_read_and_what_it_says_is_kept() -> TestResult {
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

        // The first start reads the library, and keeps what it read.
        let first = library();
        let settings = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
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
        let next = SystemSettings::new(file.clone(), "0.2.1", Some(&base));
        assert!(done(&next) && next.current().is_some());

        // A new version reads it again: the library has none now, and that is kept.
        *answer.lock().unwrap_or_else(PoisonError::into_inner) = None;
        let second = library();
        let newer = SystemSettings::new(file.clone(), "0.3.0", Some(&base));
        let ((), ()) = tokio::join!(
            async {
                second.refresh().await;
            },
            newer.read(&second)
        );
        assert!(newer.current().is_none());
        let after = SystemSettings::new(file.clone(), "0.3.0", Some(&base));
        assert!(done(&after) && after.current().is_none());

        // A library that cannot be read says nothing: what was kept stands, and is read again.
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
        assert!(!done(&SystemSettings::new(file, "0.4.0", Some(&gone))));
        Ok(())
    }
}
