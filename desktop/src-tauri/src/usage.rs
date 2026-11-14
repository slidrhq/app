//! How many installations of the app there are, and how many are in use
//! (docs/adr/ADR-142-installations-and-starts-counted.md): every start of the app sends one
//! request that says "this installation started", and nothing else of the machine or the user.
//!
//! The request carries an id made at random on the first start and kept in
//! `<app_data>/usage.json`, the version of the app, the operating system and the language of the
//! interface. The server counts installations by their ids, and the ids seen on a day as that
//! day's users; it keeps no address. Never a file, a deck, a chat, a prompt or a key.
//!
//! The user turns it off in Settings: the `usage` section, `{ "send": false }`. Nothing is sent
//! - by a build that is not the released app: a debug build (unless it is pointed at a stand-in
//!   on this machine through [`VARIABLE`]), or one under another identifier, as the packaged
//!   suites are;
//! - by an installation whose library the organization chose (by policy or by the installation's
//!   own file, docs/media-library.md): it may be on a network that is closed;
//! - where the organization's policy turns it off: `SendUsageData`, a DWORD of 0, under
//!   `HKLM\SOFTWARE\Policies\Slidr`, else under `HKCU`.
//!
//! A start that cannot send (no network, the service down) is not sent again: the next start is
//! counted as usual.

use std::{
    fs,
    io::Write,
    path::{Path, PathBuf},
    sync::{
        Arc,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};

use reqwest::Url;
use serde::{Deserialize, Serialize};
use uuid::Uuid;

use crate::{media_library, net, settings::Settings, storage::TempFile, updates};

/// The section of the settings that holds the user's choice.
pub const SECTION: &str = "usage";
/// The file, in the app's data folder, that keeps the id of this installation.
const FILE: &str = "usage.json";
/// Where the starts of the released app are counted.
const ENDPOINT: &str = "https://usage.slidr.studio/v1/start";
/// In a debug build, a stand-in on this machine to send the starts to, e.g.
/// `http://127.0.0.1:8787/v1/start`. Nothing else is accepted.
const VARIABLE: &str = "SLIDR_USAGE_URL";
/// How long the request may take; it runs in the background and nothing waits for it.
const TIMEOUT: Duration = Duration::from_secs(20);
/// The longest language tag sent; a longer one is sent as `und`.
const MAX_LANGUAGE: usize = 16;

/// The user's choice: on unless they turned it off.
#[derive(Debug, PartialEq, Eq, Deserialize)]
struct Choice {
    #[serde(default = "on")]
    send: bool,
}

const fn on() -> bool {
    true
}

impl Default for Choice {
    fn default() -> Self {
        Self { send: true }
    }
}

/// What a start sends.
#[derive(Debug, Serialize)]
struct Start<'a> {
    install: &'a str,
    version: &'a str,
    os: &'a str,
    language: &'a str,
}

/// What is kept of this installation.
#[derive(Serialize, Deserialize)]
struct Kept {
    id: String,
}

/// The counting of this run of the app.
pub struct Usage {
    /// Where to send the start; none when this build sends nothing.
    endpoint: Option<Url>,
    /// Whether the organization turned the counting off for this installation.
    blocked: bool,
    /// [`FILE`], in the app's data folder.
    file: PathBuf,
    /// Whether this run has already sent its start: a page that loads again does not count twice.
    started: AtomicBool,
}

/// What the settings screen shows of it.
#[derive(Debug, Serialize, PartialEq, Eq)]
#[serde(rename_all = "camelCase")]
pub struct Status {
    /// The organization turned it off: the switch is off and cannot be turned on.
    blocked: bool,
}

impl Usage {
    /// The counting of the app with `identifier`, whose data folder is `data`.
    pub fn new(data: &Path, identifier: &str) -> Self {
        Self::with(
            data,
            endpoint(identifier),
            media_library::chosen_by_organization() || policy_off(),
        )
    }

    fn with(data: &Path, endpoint: Option<Url>, blocked: bool) -> Self {
        Self {
            endpoint: endpoint.filter(net::allowed),
            blocked,
            file: data.join(FILE),
            started: AtomicBool::new(false),
        }
    }

    pub fn status(&self) -> Status {
        Status {
            blocked: self.blocked,
        }
    }

    /// The request of this start, once a run: none when nothing is to be sent.
    fn request(&self, settings: &Settings) -> Option<Url> {
        if self.blocked || !settings.read::<Choice>(SECTION).send {
            return None;
        }
        let endpoint = self.endpoint.clone()?;
        (!self.started.swap(true, Ordering::SeqCst)).then_some(endpoint)
    }

    /// The id of this installation: the one kept, else a new one, kept. None when it cannot be
    /// kept: an id that changed at every start would count every start as an installation.
    fn id(&self) -> Option<String> {
        let kept = fs::read(&self.file)
            .ok()
            .and_then(|bytes| serde_json::from_slice::<Kept>(&bytes).ok())
            .filter(|kept| Uuid::parse_str(&kept.id).is_ok());
        if let Some(kept) = kept {
            return Some(kept.id);
        }
        let kept = Kept {
            id: Uuid::new_v4().to_string(),
        };
        let json = serde_json::to_vec_pretty(&kept).ok()?;
        let dir = self.file.parent()?;
        fs::create_dir_all(dir).ok()?;
        let temp = TempFile::new_in(dir).ok()?;
        temp.file()
            .and_then(|mut file| file.write_all(&json))
            .ok()?;
        temp.persist(&self.file).ok()?;
        Some(kept.id)
    }
}

/// Where this build sends its starts.
fn endpoint(identifier: &str) -> Option<Url> {
    if cfg!(debug_assertions) {
        let url = Url::parse(&std::env::var(VARIABLE).ok()?).ok()?;
        return (url.scheme() == "http" && net::is_loopback(&url)).then_some(url);
    }
    if identifier != updates::RELEASED {
        return None;
    }
    Url::parse(ENDPOINT).ok()
}

/// Whether the organization's policy turns the counting off.
#[cfg(windows)]
fn policy_off() -> bool {
    [
        windows_registry::LOCAL_MACHINE,
        windows_registry::CURRENT_USER,
    ]
    .into_iter()
    .find_map(|root| {
        root.open(r"SOFTWARE\Policies\Slidr")
            .and_then(|key| key.get_u32("SendUsageData"))
            .ok()
    }) == Some(0)
}

#[cfg(not(windows))]
fn policy_off() -> bool {
    false
}

/// The language of the interface as it is sent: a short tag of letters, digits and `-`.
fn language_tag(language: &str) -> &str {
    let plain = !language.is_empty()
        && language.len() <= MAX_LANGUAGE
        && language
            .bytes()
            .all(|b| b.is_ascii_alphanumeric() || b == b'-');
    if plain { language } else { "und" }
}

/// Sends one start. Its answer is not read: a failure is the same as no request.
async fn send(endpoint: Url, start: &Start<'_>) {
    let _ = net::client()
        .post(endpoint)
        .timeout(TIMEOUT)
        .json(start)
        .send()
        .await;
}

/// `usage_status()`: whether the organization turned the counting off.
#[tauri::command]
pub fn usage_status(usage: tauri::State<'_, Arc<Usage>>) -> Status {
    usage.status()
}

/// `usage_start({ language })`: counts this start, in the background, unless the user, the
/// organization or the build says not to. The page calls it once it knows its language.
#[tauri::command]
pub fn usage_start(
    app: tauri::AppHandle,
    usage: tauri::State<'_, Arc<Usage>>,
    settings: tauri::State<'_, Arc<Settings>>,
    language: String,
) {
    let Some(endpoint) = usage.request(&settings) else {
        return;
    };
    let usage = Arc::clone(&usage);
    let version = app.package_info().version.to_string();
    tauri::async_runtime::spawn(async move {
        let Some(id) = tauri::async_runtime::spawn_blocking(move || usage.id())
            .await
            .ok()
            .flatten()
        else {
            return;
        };
        let start = Start {
            install: &id,
            version: &version,
            os: std::env::consts::OS,
            language: language_tag(&language),
        };
        send(endpoint, &start).await;
    });
}

#[cfg(test)]
mod tests {
    use serde_json::{Value, json};

    use super::*;
    use crate::net::testing::{Reply, serve};

    type TestResult<T = ()> = std::result::Result<T, Box<dyn std::error::Error>>;

    fn settings(dir: &Path, usage: Option<Value>) -> TestResult<Settings> {
        let settings = Settings::open(dir.join("settings.json"));
        if let Some(usage) = usage {
            settings.write(SECTION, usage)?;
        }
        Ok(settings)
    }

    fn stand_in() -> Option<Url> {
        Url::parse("http://127.0.0.1:9/v1/start").ok()
    }

    #[test]
    fn the_choice_is_on_unless_turned_off() -> TestResult {
        let dir = tempfile::tempdir()?;
        for (usage, send) in [
            (None, true),
            (Some(json!({})), true),
            (Some(json!({ "send": true })), true),
            (Some(json!({ "send": "no" })), true),
            (Some(json!({ "send": false })), false),
        ] {
            let settings = settings(dir.path(), usage.clone())?;
            assert_eq!(settings.read::<Choice>(SECTION).send, send, "{usage:?}");
        }
        Ok(())
    }

    #[test]
    fn a_start_is_sent_once_a_run_and_only_when_allowed() -> TestResult {
        let dir = tempfile::tempdir()?;
        let allowed = settings(dir.path(), None)?;

        let usage = Usage::with(dir.path(), stand_in(), false);
        assert_eq!(usage.request(&allowed), stand_in());
        assert_eq!(
            usage.request(&allowed),
            None,
            "a second call in the same run"
        );

        let turned_off = settings(dir.path(), Some(json!({ "send": false })))?;
        assert_eq!(
            Usage::with(dir.path(), stand_in(), false).request(&turned_off),
            None
        );

        let blocked = Usage::with(dir.path(), stand_in(), true);
        assert_eq!(blocked.request(&allowed), None);
        assert_eq!(blocked.status(), Status { blocked: true });

        assert_eq!(
            Usage::with(dir.path(), None, false).request(&allowed),
            None,
            "no endpoint"
        );
        let elsewhere = Url::parse("http://example.com/v1/start").ok();
        assert_eq!(
            Usage::with(dir.path(), elsewhere, false).request(&allowed),
            None,
            "plain HTTP to another machine"
        );
        Ok(())
    }

    #[test]
    fn the_id_is_made_once_and_kept() -> TestResult {
        let dir = tempfile::tempdir()?;
        let usage = Usage::with(dir.path(), None, false);
        let first = usage.id().ok_or("no id")?;
        assert!(Uuid::parse_str(&first).is_ok());
        assert_eq!(usage.id().as_deref(), Some(first.as_str()));
        assert_eq!(
            Usage::with(dir.path(), None, false).id().as_deref(),
            Some(first.as_str()),
            "the next run"
        );

        fs::write(dir.path().join(FILE), r#"{ "id": "not an id" }"#)?;
        let replaced = usage.id().ok_or("no id")?;
        assert_ne!(replaced, first);
        assert!(Uuid::parse_str(&replaced).is_ok());
        Ok(())
    }

    #[test]
    fn no_id_when_it_cannot_be_kept() -> TestResult {
        let dir = tempfile::tempdir()?;
        // The data folder is a file: nothing can be written under it.
        let data = dir.path().join("data");
        fs::write(&data, "")?;
        assert_eq!(Usage::with(&data, None, false).id(), None);
        Ok(())
    }

    #[test]
    fn the_language_is_sent_as_a_plain_tag() {
        assert_eq!(language_tag("he"), "he");
        assert_eq!(language_tag("pt-BR"), "pt-BR");
        assert_eq!(language_tag(""), "und");
        assert_eq!(language_tag("he\"}"), "und");
        assert_eq!(language_tag(&"a".repeat(MAX_LANGUAGE + 1)), "und");
    }

    #[tokio::test]
    async fn a_start_says_what_it_is_and_no_more() -> TestResult {
        let server = serve(|_| Reply::json(204, Vec::new())).await?;
        let endpoint = Url::parse(&format!("{}/v1/start", server.base))?;
        let start = Start {
            install: "6f1c2a52-8a1e-4c55-9a8e-1a2b3c4d5e6f",
            version: "0.4.0",
            os: "windows",
            language: "he",
        };
        send(endpoint, &start).await;
        let seen = server.seen();
        let [request] = seen.as_slice() else {
            return Err(format!("{} requests", seen.len()).into());
        };
        assert_eq!(request.method, "POST");
        assert_eq!(request.path, "/v1/start");
        assert_eq!(
            serde_json::from_slice::<Value>(&request.body)?,
            json!({
                "install": "6f1c2a52-8a1e-4c55-9a8e-1a2b3c4d5e6f",
                "version": "0.4.0",
                "os": "windows",
                "language": "he",
            })
        );
        Ok(())
    }

    #[tokio::test]
    async fn a_start_that_fails_is_let_go() -> TestResult {
        let server = serve(|_| Reply::json(500, Vec::new())).await?;
        let endpoint = Url::parse(&format!("{}/v1/start", server.base))?;
        let start = Start {
            install: "x",
            version: "0",
            os: "windows",
            language: "en",
        };
        // An error answer ends nothing, and is not sent again.
        send(endpoint, &start).await;
        assert_eq!(server.seen().len(), 1);
        Ok(())
    }
}
