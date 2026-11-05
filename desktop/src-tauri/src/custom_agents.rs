//! The organization's agents that come as packages of its library (ADR-125): a .zip of the
//! agent's CLI and every file it needs, which Slidr Library publishes at `system/agents/<id>.zip`
//! as its system settings name it (`install.package`). Once the user approves the agent's
//! installation, the app downloads the package from the library alone, never from the internet,
//! and unpacks it into a folder of the agent's own: `<app_local_data>/custom_agents/<id>/`, which
//! the agent's program, arguments and environment name as `%SLIDR_AGENT_DIR%`.
//!
//! - The package is the one the manifest of this start names, checked against it, whatever the
//!   settings the app goes by recorded: those may be of the start before (ADR-124).
//! - It is unpacked into a folder beside the agent's, which then takes the agent's place whole. A
//!   package that is not a .zip, that has a path leaving its folder or a link, or more than
//!   [`MOST_FILES`] files or [`MOST_BYTES`] unpacked, is refused, and what was installed stays.
//! - What is installed is recorded in its folder, [`MARKER`]: the package and its SHA-256.
//! - Once installed, an agent is brought up to date in the background, once a run, when the
//!   library has another package for it: the user approved the agent, and the organization ships
//!   what it runs. A folder in use, a turn's CLI running from it, stays as it is until a later run.

use std::{
    collections::HashSet,
    fs,
    io::{self, Read as _},
    path::{Path, PathBuf},
    sync::{Arc, Mutex, PoisonError},
};

use serde::{Deserialize, Serialize};

use crate::{
    harness::{AgentError, AgentErrorKind},
    media_library::{Fetched, MediaLibrary},
};

/// The folder of the agents' folders, in the app's local data: a program is not to roam.
pub const FOLDER: &str = "custom_agents";

/// What an agent's folder records of the package unpacked into it.
const MARKER: &str = ".slidr-package.json";

/// The most files a package may hold.
const MOST_FILES: usize = 20_000;

/// The most a package may come to unpacked: a package is at most 95 MiB.
const MOST_BYTES: u64 = 1024 * 1024 * 1024;

/// The package an agent's folder holds.
#[derive(Debug, Serialize, Deserialize)]
struct Installed {
    /// Its path in the library.
    package: String,
    sha256: String,
}

/// The agents' folders of this machine, and the library their packages come from.
pub struct CustomAgents {
    dir: PathBuf,
    library: Option<Arc<MediaLibrary>>,
    /// One installation at a time.
    installing: tokio::sync::Mutex<()>,
    /// The agents brought up to date in this run, or tried.
    checked: Mutex<HashSet<String>>,
}

impl CustomAgents {
    /// The agents' folders in `dir`, their packages read from `library`.
    pub fn new(dir: PathBuf, library: Option<Arc<MediaLibrary>>) -> Arc<Self> {
        Arc::new(Self {
            dir,
            library,
            installing: tokio::sync::Mutex::new(()),
            checked: Mutex::new(HashSet::new()),
        })
    }

    /// The folder of the agent `id`'s own, where its package is unpacked.
    pub fn folder(&self, id: &str) -> PathBuf {
        self.dir.join(id)
    }

    /// The SHA-256 of the package installed for the agent `id`; none when none is.
    pub fn installed(&self, id: &str) -> Option<String> {
        let bytes = fs::read(self.folder(id).join(MARKER)).ok()?;
        serde_json::from_slice::<Installed>(&bytes)
            .ok()
            .map(|installed| installed.sha256)
    }

    /// Installs the agent `id`, `name` to the user, from `package` as the library has it now;
    /// nothing to do when that is the one installed.
    pub async fn install(&self, id: &str, name: &str, package: &str) -> Result<(), AgentError> {
        let Some(library) = &self.library else {
            return Err(AgentError::new(
                AgentErrorKind::NotInstalled,
                format!(
                    "{name} is installed from your organization's library, and this app reads no library."
                ),
            ));
        };
        let _one = self.installing.lock().await;
        let have = self.installed(id);
        let (zip, sha256) = match library.fetch_fresh(package, have.as_deref()).await {
            Fetched::Same => return Ok(()),
            Fetched::New(zip, sha256) => (zip, sha256),
            Fetched::Missing => {
                return Err(AgentError::new(
                    AgentErrorKind::NotInstalled,
                    format!(
                        "Your organization's library has no package of {name}. Ask your administrator."
                    ),
                ));
            }
            Fetched::Unavailable => {
                return Err(AgentError::new(
                    AgentErrorKind::Network,
                    format!(
                        "{name} could not be downloaded from your organization's library. Try again when the library can be reached."
                    ),
                ));
            }
        };
        let dir = self.dir.clone();
        let installed = Installed {
            package: package.to_owned(),
            sha256,
        };
        let agent = id.to_owned();
        tokio::task::spawn_blocking(move || place(&dir, &agent, &zip, &installed))
            .await
            .map_err(|error| AgentError::new(AgentErrorKind::Internal, error.to_string()))?
            .map_err(|error| {
                AgentError::new(
                    AgentErrorKind::ProcessExited,
                    format!("{name} could not be installed: {error}"),
                )
            })
    }

    /// Brings the agent `id` up to date with the library in the background, once a run, when it
    /// is installed.
    pub fn update(self: &Arc<Self>, id: &str, name: &str, package: &str) {
        if self.library.is_none() || self.installed(id).is_none() {
            return;
        }
        let first = self
            .checked
            .lock()
            .unwrap_or_else(PoisonError::into_inner)
            .insert(id.to_owned());
        if !first {
            return;
        }
        let agents = Arc::clone(self);
        let (id, name, package) = (id.to_owned(), name.to_owned(), package.to_owned());
        tauri::async_runtime::spawn(async move {
            // What fails stays as it was: the agent runs what is installed, and a later run tries
            // again.
            let _ = agents.install(&id, &name, &package).await;
        });
    }
}

fn refused(why: impl Into<String>) -> io::Error {
    io::Error::new(io::ErrorKind::InvalidData, why.into())
}

/// Unpacks `zip` into a folder beside the agent `id`'s, then puts that in its folder's place.
fn place(dir: &Path, id: &str, zip: &[u8], installed: &Installed) -> io::Result<()> {
    fs::create_dir_all(dir)?;
    clear_leftovers(dir, id);
    let staging = dir.join(format!(".{id}.{}.new", uuid::Uuid::new_v4()));
    let unpacked = unpack(zip, &staging).and_then(|()| {
        let marker = serde_json::to_vec_pretty(installed).map_err(io::Error::other)?;
        fs::write(staging.join(MARKER), marker)
    });
    if let Err(error) = unpacked {
        let _ = fs::remove_dir_all(&staging);
        return Err(error);
    }
    let target = dir.join(id);
    let old = dir.join(format!(".{id}.{}.old", uuid::Uuid::new_v4()));
    let had = target.exists();
    // A folder whose program runs cannot be moved on Windows: it stays, and so does its agent.
    if had && let Err(error) = rename(&target, &old) {
        let _ = fs::remove_dir_all(&staging);
        return Err(io::Error::new(
            error.kind(),
            format!("its folder is in use ({error})"),
        ));
    }
    if let Err(error) = rename(&staging, &target) {
        if had {
            let _ = rename(&old, &target);
        }
        let _ = fs::remove_dir_all(&staging);
        return Err(error);
    }
    if had {
        // A file of it still open is taken away by the next installation.
        let _ = fs::remove_dir_all(&old);
    }
    Ok(())
}

/// Moves a folder, again for a moment when it fails: on Windows a scanner of the files just
/// written may hold one of them open a little while.
fn rename(from: &Path, to: &Path) -> io::Result<()> {
    let mut tries = 0;
    loop {
        match fs::rename(from, to) {
            Err(_) if tries < 4 => {
                tries += 1;
                std::thread::sleep(std::time::Duration::from_millis(250));
            }
            done => return done,
        }
    }
}

/// Takes away what installations of `id` left beside its folder: one stopped halfway, or an old
/// folder that was in use.
fn clear_leftovers(dir: &Path, id: &str) {
    let prefix = format!(".{id}.");
    for entry in fs::read_dir(dir).into_iter().flatten().flatten() {
        let name = entry.file_name();
        let Some(name) = name.to_str() else {
            continue;
        };
        if name.starts_with(&prefix) && (name.ends_with(".new") || name.ends_with(".old")) {
            let _ = fs::remove_dir_all(entry.path());
        }
    }
}

/// Unpacks `zip` into the folder `to`, whole or not at all: a file whose path leaves the folder,
/// a link, too many files or too many bytes refuse the package.
fn unpack(zip: &[u8], to: &Path) -> io::Result<()> {
    let mut archive = zip::ZipArchive::new(io::Cursor::new(zip))
        .map_err(|error| refused(format!("the package is not a .zip file ({error})")))?;
    if archive.len() > MOST_FILES {
        return Err(refused(format!(
            "the package holds more than {MOST_FILES} files"
        )));
    }
    fs::create_dir_all(to)?;
    let mut left = MOST_BYTES;
    for index in 0..archive.len() {
        let mut file = archive.by_index(index).map_err(io::Error::other)?;
        let Some(path) = file.enclosed_name() else {
            return Err(refused(format!(
                "{} is outside the package's folder",
                file.name()
            )));
        };
        if file.is_symlink() {
            return Err(refused(format!("{} is a link", file.name())));
        }
        let target = to.join(&path);
        if file.is_dir() {
            fs::create_dir_all(&target)?;
            continue;
        }
        if let Some(parent) = target.parent() {
            fs::create_dir_all(parent)?;
        }
        let mut out = fs::File::create(&target)?;
        let written = io::copy(&mut (&mut file).take(left + 1), &mut out)?;
        if written > left {
            return Err(refused(format!(
                "the package comes to more than {} MiB unpacked",
                MOST_BYTES / 1024 / 1024
            )));
        }
        left -= written;
        #[cfg(unix)]
        {
            use std::os::unix::fs::PermissionsExt as _;
            if let Some(mode) = file.unix_mode() {
                fs::set_permissions(&target, fs::Permissions::from_mode(mode & 0o755))?;
            }
        }
    }
    Ok(())
}

/// A library of packages on this machine, for the tests of what installs them.
#[cfg(test)]
pub(crate) mod testing {
    use std::{
        collections::BTreeMap,
        io::Write as _,
        sync::{Arc, Mutex, PoisonError},
    };

    use reqwest::Url;
    use serde_json::json;
    use sha2::Digest as _;

    use crate::{
        media_library::MediaLibrary,
        net::testing::{Reply, Seen, Server, serve},
    };

    /// A .zip of `files`, each its path and its bytes.
    pub fn zip_of(files: &[(&str, &[u8])]) -> Vec<u8> {
        let mut writer = zip::ZipWriter::new(std::io::Cursor::new(Vec::new()));
        for (path, bytes) in files {
            writer
                .start_file(*path, zip::write::SimpleFileOptions::default())
                .expect("a file of the zip");
            writer.write_all(bytes).expect("its bytes");
        }
        writer.finish().expect("the zip").into_inner()
    }

    /// A library that serves `files`, which the test may change; and its address.
    pub struct Library {
        pub files: Arc<Mutex<BTreeMap<String, Vec<u8>>>>,
        pub server: Server,
        pub base: Url,
    }

    impl Library {
        pub async fn serve() -> Library {
            let files: Arc<Mutex<BTreeMap<String, Vec<u8>>>> = Arc::default();
            let served = Arc::clone(&files);
            let server = serve(move |seen: &Seen| {
                let files = served
                    .lock()
                    .unwrap_or_else(PoisonError::into_inner)
                    .clone();
                if seen.path == "/manifest.json" {
                    let entries: serde_json::Map<_, _> = files
                        .iter()
                        .map(|(path, bytes)| {
                            let sha256 = format!("{:x}", sha2::Sha256::digest(bytes));
                            (
                                path.clone(),
                                json!({ "size": bytes.len(), "sha256": sha256 }),
                            )
                        })
                        .collect();
                    let manifest = json!({ "version": 1, "files": entries });
                    return Reply::json(200, serde_json::to_vec(&manifest).unwrap_or_default());
                }
                match files.get(seen.path.trim_start_matches('/')) {
                    Some(bytes) => Reply::bytes(200, "application/octet-stream", bytes.clone()),
                    None => Reply::bytes(404, "text/html", Vec::new()),
                }
            })
            .await
            .expect("a library on this machine");
            let base = Url::parse(&format!("{}/", server.base)).expect("its address");
            Library {
                files,
                server,
                base,
            }
        }

        pub fn put(&self, path: &str, bytes: Vec<u8>) {
            self.files
                .lock()
                .unwrap_or_else(PoisonError::into_inner)
                .insert(path.to_owned(), bytes);
        }

        /// The library as a start of the app reads it: its manifest read now.
        pub async fn start(&self, cache: &std::path::Path) -> Arc<MediaLibrary> {
            let library = MediaLibrary::new(self.base.clone(), cache.to_path_buf());
            library.refresh().await;
            library
        }

        /// How many times `path` was downloaded.
        pub fn downloads(&self, path: &str) -> usize {
            let path = format!("/{path}");
            self.server
                .seen()
                .iter()
                .filter(|seen| seen.path == path)
                .count()
        }
    }
}

#[cfg(test)]
mod tests {
    use super::{testing::*, *};

    type TestResult = std::result::Result<(), Box<dyn std::error::Error>>;

    const PACKAGE: &str = "system/agents/acme.zip";

    #[tokio::test]
    async fn a_package_is_downloaded_from_the_library_and_unpacked_into_its_own_folder()
    -> TestResult {
        let served = Library::serve().await;
        served.put(
            PACKAGE,
            zip_of(&[
                ("acme.exe", b"MZ one"),
                ("lib/data.json", b"{}"),
                ("lib/", b""),
            ]),
        );
        let cache = tempfile::tempdir()?;
        let home = tempfile::tempdir()?;
        let agents = CustomAgents::new(
            home.path().join(FOLDER),
            Some(served.start(cache.path()).await),
        );
        assert_eq!(agents.installed("acme"), None);

        agents.install("acme", "Acme", PACKAGE).await?;
        let folder = agents.folder("acme");
        assert_eq!(folder, home.path().join("custom_agents").join("acme"));
        assert_eq!(fs::read(folder.join("acme.exe"))?, b"MZ one");
        assert_eq!(fs::read(folder.join("lib").join("data.json"))?, b"{}");
        let first = agents.installed("acme").ok_or("not installed")?;
        assert_eq!(served.downloads(PACKAGE), 1);
        // Installed already: nothing is downloaded again.
        agents.install("acme", "Acme", PACKAGE).await?;
        assert_eq!(served.downloads(PACKAGE), 1);

        // The library has another package: it takes the folder's place whole.
        served.put(PACKAGE, zip_of(&[("acme.exe", b"MZ two")]));
        let next = CustomAgents::new(
            home.path().join(FOLDER),
            Some(served.start(cache.path()).await),
        );
        next.install("acme", "Acme", PACKAGE).await?;
        assert_eq!(fs::read(folder.join("acme.exe"))?, b"MZ two");
        assert!(!folder.join("lib").exists());
        assert_ne!(next.installed("acme"), Some(first));
        // Nothing is left beside it, and the media library kept no copy of the package.
        let beside: Vec<_> = fs::read_dir(home.path().join(FOLDER))?
            .flatten()
            .map(|entry| entry.file_name())
            .collect();
        assert_eq!(beside, ["acme"]);
        assert!(
            fs::read_dir(cache.path().join("objects"))
                .map(|objects| objects.count() == 0)
                .unwrap_or(true)
        );
        Ok(())
    }

    #[tokio::test]
    async fn a_package_that_does_not_hold_is_refused_and_what_was_installed_stays() -> TestResult {
        let served = Library::serve().await;
        served.put(PACKAGE, zip_of(&[("acme.exe", b"MZ good")]));
        let cache = tempfile::tempdir()?;
        let home = tempfile::tempdir()?;
        let dir = home.path().join(FOLDER);
        CustomAgents::new(dir.clone(), Some(served.start(cache.path()).await))
            .install("acme", "Acme", PACKAGE)
            .await?;

        for bad in [
            zip_of(&[("../evil.exe", b"MZ")]),
            zip_of(&[("ok.txt", b"x"), ("lib/../../evil.exe", b"MZ")]),
            b"MZ not a zip at all".to_vec(),
        ] {
            served.put(PACKAGE, bad);
            let agents = CustomAgents::new(dir.clone(), Some(served.start(cache.path()).await));
            let error = agents
                .install("acme", "Acme", PACKAGE)
                .await
                .err()
                .ok_or("a package that does not hold was installed")?;
            assert_eq!(
                error.kind,
                AgentErrorKind::ProcessExited,
                "{}",
                error.message
            );
            assert_eq!(fs::read(dir.join("acme").join("acme.exe"))?, b"MZ good");
            assert!(!home.path().join("evil.exe").exists());
            assert!(!dir.join("evil.exe").exists());
            assert_eq!(fs::read_dir(&dir)?.count(), 1);
        }
        Ok(())
    }

    #[tokio::test]
    async fn without_the_library_or_its_package_nothing_is_installed() -> TestResult {
        let home = tempfile::tempdir()?;
        let cache = tempfile::tempdir()?;
        // No library at all.
        let none = CustomAgents::new(home.path().join(FOLDER), None);
        let error = none.install("acme", "Acme", PACKAGE).await.err();
        assert_eq!(
            error.map(|error| error.kind),
            Some(AgentErrorKind::NotInstalled)
        );
        // A library without the package.
        let served = Library::serve().await;
        let agents = CustomAgents::new(
            home.path().join(FOLDER),
            Some(served.start(cache.path()).await),
        );
        let error = agents.install("acme", "Acme", PACKAGE).await.err();
        assert_eq!(
            error.map(|error| error.kind),
            Some(AgentErrorKind::NotInstalled)
        );
        // A library that cannot be reached: the network's fault.
        served.put(PACKAGE, zip_of(&[("acme.exe", b"MZ")]));
        let library = served.start(cache.path()).await;
        drop(served);
        let offline = CustomAgents::new(home.path().join(FOLDER), Some(library));
        let error = offline.install("acme", "Acme", PACKAGE).await.err();
        assert_eq!(error.map(|error| error.kind), Some(AgentErrorKind::Network));
        assert_eq!(offline.installed("acme"), None);
        Ok(())
    }
}
