//! The organization's own agents (ADR-117): CLIs of the custom agent protocol
//! (docs/custom-agent-cli.md), named by the system settings. Each is offered as the built-in CLIs
//! are: installed once the user approves, signed in, its models listed, and its turns run a
//! process each, as the one-shot CLIs' are (`one_shot.rs`). The request goes on standard input, the
//! protocol's events come on standard output, one JSON object a line, and the app's tools are
//! reached over MCP. Stopping a turn ends its process; the next turn resumes the conversation.

use std::{
    io,
    path::{Path, PathBuf},
    process::Stdio,
    sync::{
        Arc, Mutex, PoisonError,
        atomic::{AtomicBool, Ordering},
    },
    time::Duration,
};

use async_trait::async_trait;
use serde::Deserialize;
use serde_json::{Value, json};
use tokio::{
    io::{AsyncBufReadExt, AsyncReadExt, AsyncWriteExt, BufReader},
    process::Command,
    sync::{Notify, watch},
    time::timeout,
};

use super::one_shot::Launch;
use crate::{
    harness::{
        ATTACHMENTS, AgentError, AgentErrorKind, AgentEvent, AgentHarness, AgentSession,
        Capabilities, EventSink, HarnessDescriptor, HarnessState, HarnessStatus, ModelOption,
        Result, SessionConfig, ToolSource, TurnOutcome, UserTurn, setup,
    },
    system_settings::{CustomAgent, Install},
};

/// The version of the protocol the app speaks.
const PROTOCOL: u64 = 1;
/// How long `describe` and `status` may take (§5.1, §5.2).
const SETUP_TIMEOUT: Duration = Duration::from_secs(15);
/// How long `models` may take (§5.3).
const MODELS_TIMEOUT: Duration = Duration::from_secs(60);
const CLOSE_TIMEOUT: Duration = Duration::from_secs(5);
/// The name the app's tools are given (§6.1).
const SERVER: &str = "slidr";
/// Where the tool endpoint's token is (§4).
const TOKEN_ENV: &str = "SLIDR_MCP_TOKEN";
const PROTOCOL_ENV: &str = "SLIDR_PROTOCOL";
/// How much of a failed run's standard error becomes its message (§4).
const STDERR_LINES: usize = 20;
/// The longest summary of a tool call (§6.5).
const SUMMARY_CHARS: usize = 300;

/// `%NAME%` at the start of a path, as the environment has it.
fn expand(command: &str) -> Option<PathBuf> {
    let Some(rest) = command.strip_prefix('%') else {
        return Some(PathBuf::from(command));
    };
    let (name, rest) = rest.split_once('%')?;
    let value = std::env::var_os(name)?;
    Some(PathBuf::from(value).join(rest.trim_start_matches(['\\', '/'])))
}

/// The folders WinGet installed `package` into, where a portable package's program is.
fn winget_folders(package: &str) -> Vec<PathBuf> {
    let roots = [
        std::env::var_os("LOCALAPPDATA").map(|dir| PathBuf::from(dir).join("Microsoft/WinGet")),
        std::env::var_os("ProgramFiles").map(|dir| PathBuf::from(dir).join("WinGet")),
    ];
    let mut folders = Vec::new();
    for root in roots.into_iter().flatten() {
        let installed = std::fs::read_dir(root.join("Packages"))
            .into_iter()
            .flatten()
            .flatten()
            .map(|entry| entry.path())
            .filter(|path| {
                path.file_name()
                    .and_then(|name| name.to_str())
                    .and_then(|name| name.split_once('_'))
                    .is_some_and(|(id, _)| id.eq_ignore_ascii_case(package))
            });
        for folder in installed {
            let inner = std::fs::read_dir(&folder)
                .into_iter()
                .flatten()
                .flatten()
                .map(|entry| entry.path())
                .filter(|path| path.is_dir())
                .collect::<Vec<_>>();
            folders.push(folder);
            folders.extend(inner);
        }
    }
    folders
}

/// The script of a CLI npm installed, which Node.js runs: the `bin` of its package that is named
/// `command`, or its only one.
fn npm_launch(package: &str, command: &str) -> Option<Launch> {
    let dirs = setup::search_paths();
    let name = command.trim_end_matches(".exe");
    for dir in &dirs {
        let root = package
            .split('/')
            .fold(dir.join("node_modules"), |path, part| path.join(part));
        let Ok(text) = std::fs::read(root.join("package.json")) else {
            continue;
        };
        let Ok(manifest) = serde_json::from_slice::<Value>(&text) else {
            continue;
        };
        let bin = &manifest["bin"];
        let script = bin.as_str().or_else(|| {
            let scripts = bin.as_object()?;
            scripts
                .get(name)
                .or_else(|| {
                    (scripts.len() == 1)
                        .then(|| scripts.values().next())
                        .flatten()
                })
                .and_then(Value::as_str)
        })?;
        let script = root.join(script);
        if !script.is_file() {
            continue;
        }
        let node = if cfg!(windows) { "node.exe" } else { "node" };
        // As npm's shim does: the Node.js beside it first, then the one on PATH.
        let program = std::iter::once(dir)
            .chain(&dirs)
            .map(|dir| dir.join(node))
            .find(|path| path.is_file())?;
        return Some(Launch {
            program,
            script: Some(script),
        });
    }
    None
}

/// How the agent's CLI is started on this machine; none when it is not installed. An absolute
/// path is the program itself. A name is looked for where the app finds the CLIs it installs:
/// npm's package, as Node.js on its script, and WinGet's folders.
pub(crate) fn launch(agent: &CustomAgent) -> Option<Launch> {
    let command = agent.command.as_str();
    if command.contains(['\\', '/', '%', ':']) {
        let program = expand(command)?;
        return program.is_file().then(|| Launch::new(program));
    }
    if let Some(Install::Npm { npm }) = &agent.install
        && let Some(launch) = npm_launch(npm, command)
    {
        return Some(launch);
    }
    let name = if cfg!(windows) && Path::new(command).extension().is_none() {
        format!("{command}.exe")
    } else {
        command.to_owned()
    };
    let mut dirs = setup::search_paths();
    if let Some(Install::Winget { winget, .. }) = &agent.install {
        dirs.extend(winget_folders(winget));
    }
    dirs.into_iter()
        .map(|dir| dir.join(&name))
        .find(|path| path.is_file())
        .map(Launch::new)
}

/// What `slidr describe` says of the CLI (§5.1), as far as the app reads it.
#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
struct Description {
    protocol: Vec<u64>,
    version: Option<String>,
    agent: Option<AgentPart>,
}

#[derive(Debug, Clone, Default, Deserialize)]
#[serde(default)]
struct AgentPart {
    capabilities: Caps,
}

#[derive(Debug, Clone, Copy, Deserialize)]
#[serde(default, rename_all = "camelCase")]
struct Caps {
    streaming: bool,
    image_input: bool,
    thinking: bool,
}

impl Default for Caps {
    fn default() -> Self {
        Self {
            streaming: true,
            image_input: true,
            thinking: false,
        }
    }
}

/// An agent of the organization's own.
pub struct CustomCliHarness {
    agent: CustomAgent,
    /// What its CLI said of itself when it was last probed.
    described: Mutex<Option<Caps>>,
}

impl CustomCliHarness {
    pub fn new(agent: CustomAgent) -> Self {
        Self {
            agent,
            described: Mutex::new(None),
        }
    }

    /// The CLI started on one of the protocol's subcommands, with the agent's own arguments and
    /// environment, and without a window.
    fn command(&self, launch: &Launch, subcommand: &str) -> Command {
        let mut command = Command::new(&launch.program);
        command
            .args(&launch.script)
            .args(&self.agent.args)
            .args(["slidr", subcommand])
            .envs(&self.agent.env)
            .env(PROTOCOL_ENV, PROTOCOL.to_string())
            .env_remove(TOKEN_ENV)
            .kill_on_drop(true);
        #[cfg(windows)]
        command.creation_flags(0x0800_0000);
        command
    }

    fn launch(&self) -> Result<Launch> {
        launch(&self.agent).ok_or_else(|| {
            AgentError::new(
                AgentErrorKind::NotInstalled,
                format!("{} is not installed on this computer.", self.agent.name),
            )
        })
    }

    /// Runs a setup subcommand in an empty folder of its own, and reads its answer: the last JSON
    /// object it wrote, or the error it reported.
    async fn ask(&self, subcommand: &str, limit: Duration) -> Result<Value> {
        let launch = self.launch()?;
        let folder = std::env::temp_dir().join(format!("slidr-agent-{}", uuid::Uuid::new_v4()));
        std::fs::create_dir_all(&folder)
            .map_err(|error| AgentError::io("create the agent's folder", &error))?;
        struct Folder(PathBuf);
        impl Drop for Folder {
            fn drop(&mut self) {
                let _ = std::fs::remove_dir_all(&self.0);
            }
        }
        let _folder = Folder(folder.clone());
        let mut command = self.command(&launch, subcommand);
        command
            .current_dir(&folder)
            .stdin(Stdio::null())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        let output = match timeout(limit, command.output()).await {
            Err(_) => {
                return Err(AgentError::new(
                    AgentErrorKind::ProcessExited,
                    format!(
                        "{} did not answer `slidr {subcommand}` in time.",
                        self.agent.name
                    ),
                ));
            }
            Ok(Err(error)) if error.kind() == io::ErrorKind::NotFound => {
                return Err(AgentError::new(
                    AgentErrorKind::NotInstalled,
                    format!("{} is not installed on this computer.", self.agent.name),
                ));
            }
            Ok(Err(error)) => {
                return Err(AgentError::io(format!("start {}", self.agent.name), &error));
            }
            Ok(Ok(output)) => output,
        };
        let stdout = String::from_utf8_lossy(&output.stdout);
        let answer = serde_json::from_str::<Value>(stdout.trim())
            .ok()
            .filter(Value::is_object)
            .map_or_else(
                || {
                    stdout
                        .lines()
                        .filter_map(|line| serde_json::from_str::<Value>(line).ok())
                        .filter(Value::is_object)
                        .collect::<Vec<_>>()
                },
                |value| vec![value],
            );
        if let Some(error) = answer.iter().find(|value| value["type"] == "error") {
            return Err(AgentError::new(
                error_kind(error["kind"].as_str().unwrap_or("")),
                error["message"]
                    .as_str()
                    .unwrap_or("The agent reported an error."),
            ));
        }
        if !output.status.success() {
            return Err(AgentError::new(
                AgentErrorKind::ProcessExited,
                failure(
                    &self.agent.name,
                    &output.status,
                    &String::from_utf8_lossy(&output.stderr),
                ),
            ));
        }
        answer.into_iter().last().ok_or_else(|| {
            AgentError::new(
                AgentErrorKind::ProcessExited,
                format!(
                    "{} answered `slidr {subcommand}` with no JSON.",
                    self.agent.name
                ),
            )
        })
    }

    fn capabilities(&self) -> Caps {
        self.described
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .unwrap_or_default()
    }
}

/// The message of a run that failed without saying why: the end of what it wrote to standard
/// error, or its exit status.
fn failure(name: &str, status: &std::process::ExitStatus, stderr: &str) -> String {
    let lines: Vec<&str> = stderr
        .lines()
        .filter(|line| !line.trim().is_empty())
        .collect();
    let tail = lines[lines.len().saturating_sub(STDERR_LINES)..].join("\n");
    if tail.is_empty() {
        format!("{name} exited with {status}")
    } else {
        tail
    }
}

/// The app's kind of an error the protocol names (§6.6).
fn error_kind(kind: &str) -> AgentErrorKind {
    match kind {
        "not_logged_in" => AgentErrorKind::NotLoggedIn,
        "quota" => AgentErrorKind::Quota,
        "network" => AgentErrorKind::Network,
        "tools_unavailable" => AgentErrorKind::ToolsUnavailable,
        "resume_failed" => AgentErrorKind::ResumeFailed,
        "invalid_input" => AgentErrorKind::InvalidInput,
        _ => AgentErrorKind::TurnFailed,
    }
}

/// The models of a `slidr models` answer (§5.3): explicit ones, by plain ids.
fn parse_models(value: &Value) -> Vec<ModelOption> {
    value["models"]
        .as_array()
        .into_iter()
        .flatten()
        .filter_map(|model| {
            let id = model["id"].as_str()?;
            if id.is_empty() || id.starts_with('-') || id == "auto" {
                return None;
            }
            let label = model["label"]
                .as_str()
                .filter(|label| !label.is_empty())
                .unwrap_or(id);
            let effort_levels = model["effortLevels"].as_array().map(|levels| {
                levels
                    .iter()
                    .filter_map(Value::as_str)
                    .filter(|level| {
                        !level.is_empty()
                            && level.chars().all(|c| c.is_ascii_lowercase() || c == '_')
                    })
                    .map(str::to_owned)
                    .collect::<Vec<_>>()
            });
            Some(ModelOption {
                id: id.to_owned(),
                label: label.to_owned(),
                effort_levels: effort_levels.filter(|levels| !levels.is_empty()),
            })
        })
        .collect()
}

#[async_trait]
impl AgentHarness for CustomCliHarness {
    fn descriptor(&self) -> HarnessDescriptor {
        let caps = self.capabilities();
        HarnessDescriptor {
            id: self.agent.id.clone(),
            name: self.agent.name.clone(),
            capabilities: Capabilities {
                streaming: caps.streaming,
                // A turn is a process the app ends, and the next resumes (§5.1).
                resume: true,
                interrupt: true,
                image_input: caps.image_input,
                tool_endpoint: true,
                thinking: caps.thinking,
            },
            models: Vec::new(),
            default_model: None,
            effort_levels: Vec::new(),
        }
    }

    async fn probe(&self) -> HarnessStatus {
        let make =
            |state, version: Option<String>, account: Option<String>, detail| HarnessStatus {
                state,
                version,
                account,
                detail,
            };
        let unavailable = |error: AgentError| {
            let state = if error.kind == AgentErrorKind::NotInstalled {
                HarnessState::NotInstalled
            } else {
                HarnessState::Unavailable
            };
            make(state, None, None, Some(error.message))
        };
        let description = match self.ask("describe", SETUP_TIMEOUT).await {
            Ok(value) => serde_json::from_value::<Description>(value).unwrap_or_default(),
            Err(error) => return unavailable(error),
        };
        let version = description.version.clone();
        if !description.protocol.contains(&PROTOCOL) {
            return make(
                HarnessState::Unavailable,
                version,
                None,
                Some(format!(
                    "{} does not speak version {PROTOCOL} of Slidr's agent protocol.",
                    self.agent.name
                )),
            );
        }
        let Some(agent) = description.agent else {
            return make(
                HarnessState::Unavailable,
                version,
                None,
                Some(format!("{} offers no agent.", self.agent.name)),
            );
        };
        *self
            .described
            .lock()
            .unwrap_or_else(PoisonError::into_inner) = Some(agent.capabilities);
        let status = match self.ask("status", SETUP_TIMEOUT).await {
            Ok(status) => status,
            Err(error) => {
                return make(
                    HarnessState::Unavailable,
                    version,
                    None,
                    Some(error.message),
                );
            }
        };
        let text = |key: &str| status[key].as_str().map(str::to_owned);
        let state = match status["state"].as_str() {
            Some("ready") => HarnessState::Ready,
            Some("not_logged_in") => HarnessState::NotLoggedIn,
            _ => HarnessState::Unavailable,
        };
        make(state, version, text("account"), text("detail"))
    }

    async fn start(&self, config: SessionConfig, sink: EventSink) -> Result<Box<dyn AgentSession>> {
        if let Some(model) = &config.model
            && (model.is_empty() || model.starts_with('-'))
        {
            return Err(AgentError::invalid_input("invalid model"));
        }
        if let Some(effort) = &config.effort
            && (effort.is_empty() || !effort.chars().all(|c| c.is_ascii_lowercase() || c == '_'))
        {
            return Err(AgentError::invalid_input("unknown effort level"));
        }
        if let Some(resume) = &config.resume
            && uuid::Uuid::parse_str(resume).is_err()
        {
            return Err(AgentError::invalid_input("invalid native session id"));
        }
        tokio::fs::create_dir_all(config.workdir.join(ATTACHMENTS))
            .await
            .map_err(|error| AgentError::io("create agent folder", &error))?;
        let native = config
            .resume
            .clone()
            .unwrap_or_else(|| uuid::Uuid::new_v4().to_string());
        Ok(Box::new(CustomSession {
            harness: Arc::new(Self {
                agent: self.agent.clone(),
                described: Mutex::new(Some(self.capabilities())),
            }),
            known: Arc::new(AtomicBool::new(config.resume.is_some())),
            native: Arc::new(Mutex::new(native)),
            config,
            sink,
            active: None,
            started: false,
        }))
    }

    async fn models(&self) -> Option<Result<Vec<ModelOption>>> {
        Some(
            self.ask("models", MODELS_TIMEOUT)
                .await
                .map(|answer| parse_models(&answer)),
        )
    }

    async fn install(&self) -> Option<Result<()>> {
        Some(match &self.agent.install {
            Some(install) => setup::install_package(install).await,
            None => Err(AgentError::new(
                AgentErrorKind::NotInstalled,
                format!(
                    "{} is installed by your organization. Ask your administrator to install it on this computer.",
                    self.agent.name
                ),
            )),
        })
    }

    async fn login(&self) -> Option<Result<()>> {
        let launch = match self.launch() {
            Ok(launch) => launch,
            Err(error) => return Some(Err(error)),
        };
        let mut start: Vec<String> = vec![launch.program.to_string_lossy().into_owned()];
        start.extend(
            launch
                .script
                .iter()
                .map(|script| script.to_string_lossy().into_owned()),
        );
        start.extend(self.agent.args.iter().cloned());
        start.extend(["slidr".into(), "login".into()]);
        let mut env = self.agent.env.clone();
        env.insert(PROTOCOL_ENV.into(), PROTOCOL.to_string());
        Some(setup::sign_in_terminal(&start, &env).await)
    }
}

struct Active {
    stop: Arc<Notify>,
    done: watch::Receiver<bool>,
}

struct CustomSession {
    harness: Arc<CustomCliHarness>,
    config: SessionConfig,
    sink: EventSink,
    /// The conversation's id: the app's, chosen when the session started (§6.2).
    native: Arc<Mutex<String>>,
    /// The CLI has the conversation `native` names: a resumed session, or one a turn has reached
    /// the model in. Until then a turn creates it.
    known: Arc<AtomicBool>,
    active: Option<Active>,
    started: bool,
}

#[async_trait]
impl AgentSession for CustomSession {
    async fn send(&mut self, turn: UserTurn) -> Result<()> {
        if self
            .active
            .as_ref()
            .is_some_and(|active| !*active.done.borrow())
        {
            return Err(AgentError::new(
                AgentErrorKind::Busy,
                "a turn is still running",
            ));
        }
        // A conversation resumed is there from the first; a new one is announced by the turn
        // that reaches the model (`session_started`).
        if !self.started && self.known.load(Ordering::SeqCst) {
            self.sink.emit(AgentEvent::SessionStarted {
                native_session_id: lock(&self.native).clone(),
                model: self.config.model.clone().unwrap_or_default(),
            });
        }
        self.started = true;
        let (done_tx, done) = watch::channel(false);
        let stop = Arc::new(Notify::new());
        let run = Run {
            harness: Arc::clone(&self.harness),
            config: self.config.clone(),
            native: Arc::clone(&self.native),
            known: Arc::clone(&self.known),
            sink: self.sink.clone(),
            stop: Arc::clone(&stop),
        };
        tokio::spawn(async move {
            run.run(turn).await;
            done_tx.send_replace(true);
        });
        self.active = Some(Active { stop, done });
        Ok(())
    }

    async fn interrupt(&mut self) -> Result<()> {
        if let Some(active) = &self.active
            && !*active.done.borrow()
        {
            active.stop.notify_one();
        }
        Ok(())
    }

    async fn close(self: Box<Self>) -> Result<()> {
        if let Some(active) = &self.active
            && !*active.done.borrow()
        {
            active.stop.notify_one();
            let mut done = active.done.clone();
            let _ = timeout(CLOSE_TIMEOUT, done.wait_for(|done| *done)).await;
        }
        self.sink.emit(AgentEvent::Exited { code: Some(0) });
        Ok(())
    }

    fn native_session_id(&self) -> Option<String> {
        self.known
            .load(Ordering::SeqCst)
            .then(|| lock(&self.native).clone())
    }
}

fn lock<T>(mutex: &Mutex<T>) -> std::sync::MutexGuard<'_, T> {
    mutex.lock().unwrap_or_else(PoisonError::into_inner)
}

struct Run {
    harness: Arc<CustomCliHarness>,
    config: SessionConfig,
    native: Arc<Mutex<String>>,
    known: Arc<AtomicBool>,
    sink: EventSink,
    stop: Arc<Notify>,
}

/// How one start of the CLI for a turn ended.
enum Ended {
    Completed,
    Interrupted,
    /// It reported an error, or failed without one: its kind and message.
    Failed(AgentErrorKind, String),
    /// `resume: false` on an id the CLI already has (§6.2).
    SessionExists,
}

impl Run {
    async fn run(self, turn: UserTurn) {
        let outcome = match self.execute(turn).await {
            Ok(outcome) => outcome,
            Err(error) => {
                self.sink.emit(AgentEvent::Error {
                    kind: error.kind,
                    message: error.message,
                    recoverable: true,
                });
                TurnOutcome::Failed
            }
        };
        self.sink.emit(AgentEvent::TurnCompleted { outcome });
    }

    async fn execute(&self, turn: UserTurn) -> Result<TurnOutcome> {
        let launch = self.harness.launch()?;
        let mut retried = false;
        loop {
            match self.attempt(&launch, &turn).await? {
                Ended::Completed => return Ok(TurnOutcome::Completed),
                Ended::Interrupted => return Ok(TurnOutcome::Interrupted),
                // Nothing of the turn ran: it starts once more, as a new conversation (§6.2).
                Ended::SessionExists if !retried && !self.known.load(Ordering::SeqCst) => {
                    *lock(&self.native) = uuid::Uuid::new_v4().to_string();
                    retried = true;
                }
                Ended::SessionExists => {
                    self.fail(
                        AgentErrorKind::TurnFailed,
                        "The agent already has a conversation under this id.".into(),
                    );
                    return Ok(TurnOutcome::Failed);
                }
                Ended::Failed(kind, message) => {
                    self.fail(kind, message);
                    return Ok(TurnOutcome::Failed);
                }
            }
        }
    }

    fn fail(&self, kind: AgentErrorKind, message: String) {
        self.sink.emit(AgentEvent::Error {
            kind,
            message,
            recoverable: kind != AgentErrorKind::ResumeFailed,
        });
    }

    /// The request of the turn (§6.1).
    fn request(&self, turn: &UserTurn) -> Value {
        let images: Vec<Value> = if self.harness.capabilities().image_input {
            turn.images
                .iter()
                .map(|image| json!({ "mediaType": image.media_type, "data": image.data }))
                .collect()
        } else {
            Vec::new()
        };
        json!({
            "protocol": PROTOCOL,
            "session": { "id": *lock(&self.native), "resume": self.known.load(Ordering::SeqCst) },
            "systemPrompt": self.config.system_prompt,
            "context": turn.context,
            "text": turn.text,
            "images": images,
            "model": self.config.model,
            "effort": self.config.effort,
            "webAccess": self.config.web_access,
            "tools": self.config.tool_endpoint.as_ref().map(|endpoint| json!({
                "url": endpoint.url,
                "server": SERVER,
            })),
        })
    }

    async fn attempt(&self, launch: &Launch, turn: &UserTurn) -> Result<Ended> {
        let mut command = self.harness.command(launch, "turn");
        command
            .current_dir(self.config.workdir.join(ATTACHMENTS))
            .stdin(Stdio::piped())
            .stdout(Stdio::piped())
            .stderr(Stdio::piped());
        if let Some(endpoint) = &self.config.tool_endpoint {
            command.env(TOKEN_ENV, &endpoint.token);
        }
        let name = &self.harness.agent.name;
        let mut child = command.spawn().map_err(|error| match error.kind() {
            io::ErrorKind::NotFound => AgentError::new(
                AgentErrorKind::NotInstalled,
                format!("{name} is not installed on this computer."),
            ),
            _ => AgentError::io(format!("start {name}"), &error),
        })?;
        let request = serde_json::to_vec(&self.request(turn)).map_err(AgentError::internal)?;
        if let Some(mut stdin) = child.stdin.take() {
            let write = async move {
                stdin.write_all(&request).await?;
                // End of file: the CLI never waits for more (§4).
                stdin.shutdown().await
            };
            tokio::select! {
                result = write => result.map_err(|error| AgentError::io("send the turn", &error))?,
                () = self.stop.notified() => {
                    let _ = child.start_kill();
                    let _ = child.wait().await;
                    return Ok(Ended::Interrupted);
                }
            }
        }
        let stdout = child
            .stdout
            .take()
            .ok_or_else(|| AgentError::internal("the agent's output is unavailable"))?;
        let stderr = child
            .stderr
            .take()
            .ok_or_else(|| AgentError::internal("the agent's error output is unavailable"))?;
        let stderr = tokio::spawn(async move {
            let mut text = String::new();
            let _ = BufReader::new(stderr).read_to_string(&mut text).await;
            text
        });
        let mut mapper = Mapper {
            sink: self.sink.clone(),
            native: Arc::clone(&self.native),
            known: Arc::clone(&self.known),
            model: self.config.model.clone(),
            error: None,
            outcome: None,
        };
        let mut lines = BufReader::new(stdout).lines();
        let mut stopped = false;
        loop {
            tokio::select! {
                line = lines.next_line() => match line {
                    Ok(Some(line)) => { self.sink.raw(&line); mapper.line(&line); }
                    Ok(None) => break,
                    Err(error) => return Err(AgentError::io("read the agent's output", &error)),
                },
                () = self.stop.notified() => {
                    stopped = true;
                    let _ = child.start_kill();
                    break;
                }
            }
        }
        let status = child
            .wait()
            .await
            .map_err(|error| AgentError::io("wait for the agent", &error))?;
        let stderr = stderr.await.unwrap_or_default();
        if stopped {
            return Ok(Ended::Interrupted);
        }
        if let Some((kind, message)) = mapper.error {
            return Ok(if kind == "session_exists" {
                Ended::SessionExists
            } else {
                Ended::Failed(error_kind(&kind), message)
            });
        }
        if !status.success() {
            return Ok(Ended::Failed(
                AgentErrorKind::TurnFailed,
                failure(name, &status, &stderr),
            ));
        }
        if mapper.outcome.as_deref() == Some("failed") {
            return Ok(Ended::Failed(
                AgentErrorKind::TurnFailed,
                format!("{name} reported the turn as failed."),
            ));
        }
        Ok(Ended::Completed)
    }
}

/// The protocol's events, as the app's (§6.5): the same names and fields.
struct Mapper {
    sink: EventSink,
    native: Arc<Mutex<String>>,
    known: Arc<AtomicBool>,
    model: Option<String>,
    /// The error the CLI reported: its kind, as the protocol names it, and its message.
    error: Option<(String, String)>,
    outcome: Option<String>,
}

impl Mapper {
    fn line(&mut self, line: &str) {
        let Ok(value) = serde_json::from_str::<Value>(line) else {
            return;
        };
        let text = |key: &str| value[key].as_str().unwrap_or_default().to_owned();
        match value["type"].as_str() {
            Some("session_started") => {
                // A conversation is announced once, when it is created; the id is the app's.
                if !self.known.swap(true, Ordering::SeqCst) {
                    let model = value["model"]
                        .as_str()
                        .map(str::to_owned)
                        .or_else(|| self.model.clone())
                        .unwrap_or_default();
                    self.sink.emit(AgentEvent::SessionStarted {
                        native_session_id: lock(&self.native).clone(),
                        model,
                    });
                }
            }
            Some("text_delta") => self.sink.emit(AgentEvent::TextDelta { text: text("text") }),
            Some("thinking_delta") => self
                .sink
                .emit(AgentEvent::ThinkingDelta { text: text("text") }),
            Some("tool_call_started") => {
                let name = text("name");
                let name = name
                    .strip_prefix("mcp__slidr__")
                    .unwrap_or(&name)
                    .to_owned();
                self.sink.emit(AgentEvent::ToolCallStarted {
                    id: text("id"),
                    name,
                    source: if value["source"] == "harness" {
                        ToolSource::Harness
                    } else {
                        ToolSource::App
                    },
                    input: if value["input"].is_object() {
                        value["input"].clone()
                    } else {
                        json!({})
                    },
                });
            }
            Some("tool_call_finished") => self.sink.emit(AgentEvent::ToolCallFinished {
                id: text("id"),
                ok: value["ok"].as_bool().unwrap_or(false),
                summary: text("summary").chars().take(SUMMARY_CHARS).collect(),
            }),
            Some("error") => {
                self.error = Some((text("kind"), text("message")));
            }
            Some("turn_completed") => self.outcome = Some(text("outcome")),
            _ => {}
        }
    }
}

#[cfg(test)]
mod tests {
    use std::collections::BTreeMap;

    use tokio::sync::mpsc::UnboundedReceiver;

    use super::*;
    use crate::harness::{Scope, ToolEndpoint};

    type TestResult = std::result::Result<(), Box<dyn std::error::Error>>;

    const FAKE: &str = concat!(
        env!("CARGO_MANIFEST_DIR"),
        "/src/harness/custom_cli/fake-cli.mjs"
    );

    /// The stand-in CLI, run by Node.js as the organization would register a Node.js CLI, with
    /// its conversations in `store`.
    fn agent(store: &Path, state: &str) -> CustomAgent {
        CustomAgent {
            id: "acme".into(),
            name: "Acme Agent".into(),
            glyph: Some("A".into()),
            tone: None,
            command: "node".into(),
            args: vec![FAKE.into()],
            env: BTreeMap::from([
                ("ACME_REGION".into(), "eu-test".into()),
                ("FAKE_STORE".into(), store.to_string_lossy().into_owned()),
                ("FAKE_STATE".into(), state.into()),
            ]),
            install: None,
        }
    }

    async fn turn_events(events: &mut UnboundedReceiver<AgentEvent>) -> Vec<AgentEvent> {
        let mut seen = Vec::new();
        while let Ok(Some(event)) = timeout(Duration::from_secs(30), events.recv()).await {
            let last = matches!(event, AgentEvent::TurnCompleted { .. });
            seen.push(event);
            if last {
                break;
            }
        }
        seen
    }

    fn config(workdir: &Path) -> SessionConfig {
        let mut config = SessionConfig::new(Scope::Deck, "You are Slidr's agent.", workdir.into());
        config.model = Some("acme-large".into());
        config.effort = Some("high".into());
        config.web_access = false;
        config.tool_endpoint = Some(ToolEndpoint {
            url: "http://127.0.0.1:1/mcp/x".into(),
            token: "secret-token".into(),
        });
        config
    }

    #[tokio::test]
    async fn the_cli_says_what_it_is_and_lists_its_models() -> TestResult {
        let store = tempfile::tempdir()?;
        let harness = CustomCliHarness::new(agent(store.path(), "ready"));
        let status = harness.probe().await;
        assert_eq!(status.state, HarnessState::Ready, "{:?}", status.detail);
        assert_eq!(status.version.as_deref(), Some("0.4.2"));
        assert_eq!(status.account.as_deref(), Some("Acme Pro"));
        let descriptor = harness.descriptor();
        assert_eq!(
            (descriptor.id.as_str(), descriptor.name.as_str()),
            ("acme", "Acme Agent")
        );
        assert!(descriptor.capabilities.thinking && descriptor.capabilities.image_input);

        let models = harness.models().await.ok_or("no models")??;
        assert_eq!(models.len(), 2);
        assert_eq!(models[0].id, "acme-large");
        assert_eq!(
            models[0].effort_levels.as_deref(),
            Some(&["low".to_owned(), "high".to_owned()][..])
        );
        assert_eq!(models[1].effort_levels, None);

        let signed_out = CustomCliHarness::new(agent(store.path(), "not_logged_in"));
        assert_eq!(signed_out.probe().await.state, HarnessState::NotLoggedIn);
        let refused = signed_out.models().await.ok_or("no answer")?;
        assert_eq!(
            refused.err().map(|error| error.kind),
            Some(AgentErrorKind::NotLoggedIn)
        );
        Ok(())
    }

    #[tokio::test]
    async fn a_cli_that_is_not_there_is_not_installed() {
        let mut missing = agent(Path::new("."), "ready");
        missing.command = "C:\\Nowhere\\acme-agent-that-is-not-there.exe".into();
        let harness = CustomCliHarness::new(missing.clone());
        assert_eq!(harness.probe().await.state, HarnessState::NotInstalled);
        missing.command = "acme-agent-that-is-not-there".into();
        assert!(launch(&missing).is_none());
        // Without a way to install it, the organization does.
        let refused = CustomCliHarness::new(missing).install().await;
        assert_eq!(
            refused
                .and_then(|result| result.err())
                .map(|error| error.kind),
            Some(AgentErrorKind::NotInstalled)
        );
    }

    #[tokio::test]
    async fn a_turn_sends_the_request_and_maps_the_events_one_to_one() -> TestResult {
        let store = tempfile::tempdir()?;
        let work = tempfile::tempdir()?;
        let harness = CustomCliHarness::new(agent(store.path(), "ready"));
        harness.probe().await;
        let (sink, mut events) = EventSink::channel();
        let mut session = harness.start(config(work.path()), sink).await?;
        assert_eq!(session.native_session_id(), None);

        let mut turn = UserTurn::text("תוסיף שקף");
        turn.context = Some("<slidr_context>scope: deck</slidr_context>".into());
        session.send(turn).await?;
        let seen = turn_events(&mut events).await;
        let id = session.native_session_id().ok_or("no conversation")?;
        assert_eq!(
            seen,
            vec![
                AgentEvent::SessionStarted {
                    native_session_id: id.clone(),
                    model: "acme-large".into()
                },
                AgentEvent::ThinkingDelta {
                    text: "thinking".into()
                },
                AgentEvent::TextDelta {
                    text: "echo: ".into()
                },
                AgentEvent::TextDelta {
                    text: "תוסיף שקף".into()
                },
                AgentEvent::ToolCallStarted {
                    id: "call_1".into(),
                    name: "slide_render".into(),
                    source: ToolSource::App,
                    input: json!({ "slideId": "s_1" }),
                },
                AgentEvent::ToolCallFinished {
                    id: "call_1".into(),
                    ok: true,
                    summary: "rendered s_1".into()
                },
                AgentEvent::TurnCompleted {
                    outcome: TurnOutcome::Completed
                },
            ]
        );
        // What the CLI was given: the request on standard input, the token in its environment.
        let probe: Value = serde_json::from_slice(&std::fs::read(
            work.path().join(ATTACHMENTS).join("probe.json"),
        )?)?;
        let request = &probe["request"];
        assert_eq!(request["session"], json!({ "id": id, "resume": false }));
        assert_eq!(request["systemPrompt"], "You are Slidr's agent.");
        assert_eq!(
            request["context"],
            "<slidr_context>scope: deck</slidr_context>"
        );
        assert_eq!(request["text"], "תוסיף שקף");
        assert_eq!(
            (&request["model"], &request["effort"], &request["webAccess"]),
            (&json!("acme-large"), &json!("high"), &json!(false))
        );
        assert_eq!(
            request["tools"],
            json!({ "url": "http://127.0.0.1:1/mcp/x", "server": "slidr" })
        );
        assert_eq!(probe["argv"], json!(["slidr", "turn"]));
        assert_eq!(probe["protocol"], "1");
        assert_eq!(probe["token"], "secret-token");
        assert_eq!(probe["region"], "eu-test");

        // The next turn resumes it.
        session.send(UserTurn::text("again")).await?;
        let seen = turn_events(&mut events).await;
        assert!(
            !seen
                .iter()
                .any(|e| matches!(e, AgentEvent::SessionStarted { .. }))
        );
        let probe: Value = serde_json::from_slice(&std::fs::read(
            work.path().join(ATTACHMENTS).join("probe.json"),
        )?)?;
        assert_eq!(
            probe["request"]["session"],
            json!({ "id": id, "resume": true })
        );
        session.close().await?;
        Ok(())
    }

    #[tokio::test]
    async fn an_id_the_cli_has_is_given_up_and_one_it_lacks_ends_the_conversation() -> TestResult {
        let store = tempfile::tempdir()?;
        let work = tempfile::tempdir()?;
        let harness = CustomCliHarness::new(agent(store.path(), "ready"));
        // A conversation the CLI stored before the model answered.
        let taken = uuid::Uuid::new_v4().to_string();
        std::fs::write(store.path().join(format!("{taken}.json")), "{}")?;
        let mut resumed = config(work.path());
        resumed.resume = Some(taken.clone());
        // Resumed, it is there: announced as the session starts, and resumed.
        let (sink, mut events) = EventSink::channel();
        let mut session = harness.start(resumed, sink).await?;
        session.send(UserTurn::text("hello")).await?;
        let seen = turn_events(&mut events).await;
        assert!(
            matches!(&seen[0], AgentEvent::SessionStarted { native_session_id, .. } if *native_session_id == taken)
        );
        assert_eq!(
            seen.last(),
            Some(&AgentEvent::TurnCompleted {
                outcome: TurnOutcome::Completed
            })
        );

        // A new session that lands on that id starts once more under another.
        let (sink, mut events) = EventSink::channel();
        let mut session = CustomSession {
            harness: Arc::new(CustomCliHarness::new(agent(store.path(), "ready"))),
            config: config(work.path()),
            sink,
            native: Arc::new(Mutex::new(taken.clone())),
            known: Arc::new(AtomicBool::new(false)),
            active: None,
            started: false,
        };
        session.send(UserTurn::text("hello")).await?;
        let seen = turn_events(&mut events).await;
        let id = session.native_session_id().ok_or("no conversation")?;
        assert_ne!(id, taken);
        assert!(!seen.iter().any(|e| matches!(e, AgentEvent::Error { .. })));

        // One the CLI does not have ends the conversation.
        let mut gone = config(work.path());
        gone.resume = Some(uuid::Uuid::new_v4().to_string());
        let (sink, mut events) = EventSink::channel();
        let mut session = harness.start(gone, sink).await?;
        session.send(UserTurn::text("hello")).await?;
        let seen = turn_events(&mut events).await;
        assert!(seen.iter().any(|e| matches!(
            e,
            AgentEvent::Error {
                kind: AgentErrorKind::ResumeFailed,
                recoverable: false,
                ..
            }
        )));
        Ok(())
    }

    #[tokio::test]
    async fn a_turn_is_stopped_by_ending_its_process_and_a_crash_says_why() -> TestResult {
        let store = tempfile::tempdir()?;
        let work = tempfile::tempdir()?;
        let harness = CustomCliHarness::new(agent(store.path(), "ready"));
        let (sink, mut events) = EventSink::channel();
        let mut session = harness.start(config(work.path()), sink).await?;
        session.send(UserTurn::text("hang")).await?;
        // Once it streams, stop it.
        while let Ok(Some(event)) = timeout(Duration::from_secs(30), events.recv()).await {
            if matches!(event, AgentEvent::TextDelta { .. }) {
                break;
            }
        }
        session.interrupt().await?;
        let seen = turn_events(&mut events).await;
        assert_eq!(
            seen.last(),
            Some(&AgentEvent::TurnCompleted {
                outcome: TurnOutcome::Interrupted
            })
        );

        session.send(UserTurn::text("crash")).await?;
        let seen = turn_events(&mut events).await;
        assert!(seen.iter().any(|e| matches!(
            e,
            AgentEvent::Error { kind: AgentErrorKind::TurnFailed, message, .. } if message.contains("the model went away")
        )));
        session.send(UserTurn::text("quota")).await?;
        let seen = turn_events(&mut events).await;
        assert!(seen.iter().any(|e| matches!(
            e,
            AgentEvent::Error {
                kind: AgentErrorKind::Quota,
                recoverable: true,
                ..
            }
        )));
        Ok(())
    }
}
