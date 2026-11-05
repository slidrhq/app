# ADR-125 — An agent of the organization's own, as a package of its library

Status: Implemented on 2026-11-05 in the working trees of the app and of Slidr Library; not committed at the time of this record, and the library not deployed. It adds to [ADR-117](ADR-117-system-settings-from-the-library.md) a third way to install an agent of the organization's own, beside WinGet and npm.

## Request

"אני רוצה לעדכן את טעינת הסוכן ה-custom. הוא יועלה כ-zip (עם כל הקבצים הנדרשים) לספריה ויורד לאפליקציה, לתיקיה custom_agents (בתיקיה עצמית). שים לב שבחלק מהמקרים אין גישה חיצונית לאינטרנט ולכן לא להשתמש בקריאות חיצוניות."

Asked whether a package should carry its own PowerShell, for the Open WebUI agent of the library, the user answered that it need not: PowerShell is the machines'.

## Context

- Under ADR-117 an agent of the organization's own is installed by WinGet, from the community's source or the one named, or by npm, after Node.js; or by the organization itself. WinGet and npm reach the internet, which some organizations' networks do not.
- The app reaches the organization's library over its own network (ADR-107), through the `media` protocol and its manifest, which names every file with its size and SHA-256 (ADR-114). The library publishes files by first sending each by its hash, then publishing them all at once (`media/files.ts` of the library).
- Since ADR-124 the settings an app goes by are those of the start before, while the manifest it reads is this start's.

## Decision

- **An agent may come as a package of the library**: `"install": { "package": "system/agents/<id>.zip", "sha256": "…", "size": … }` in its entry of `system/settings.json`, a .zip of its program and every file it needs, up to 95 MiB (the largest file a publication takes).
- **In the library**, the admin picks the agent's .zip on **System settings**. The page takes its SHA-256 there (WebCrypto, or `sha256Here` on a page that is not secure: nothing of the network but the library), sends it, `PUT /api/settings/system/packages/<sha256>`, and the settings name it by its hash and size. Publishing the settings writes it at `system/agents/<id>.zip` in the same publication as `system/settings.json`, and takes away every package no agent names. An agent whose id changed takes its package from the library without its being sent again (`server/core/system.ts` of the library). Export and import carry `system/` whole, so a library on a closed network gets its packages as it gets its settings.
- **In the app**, installing the agent, once the user approves as for any agent, downloads the package from the library alone, never from WinGet, npm or the internet (`src-tauri/src/custom_agents.rs`). It is the one the manifest of this start names, checked against it, whatever the hash the settings recorded: those may be of the start before (ADR-124). It is not kept in the media cache.
- **It is unpacked into a folder of the agent's own**, `<app_local_data>/custom_agents/<id>/` (`%LOCALAPPDATA%\<the app's identifier>\custom_agents\<id>`, a program not being a thing to roam): into a folder beside it first, which then takes its place whole. A package that is not a .zip, that has a path leaving its folder or a link, more than 20,000 files or more than 1 GiB unpacked, is refused, and what was installed stays. The folder records what it holds, `.slidr-package.json`: the package and its SHA-256.
- **The program may be a path within the package** (`bin\acme.exe`), or a name looked for there first and then where the app finds the CLIs it installs, as `pwsh.exe` for a script the package holds. `%SLIDR_AGENT_DIR%`, in any case, in the program, the arguments and the environment's values is the folder, and the app sets `SLIDR_AGENT_DIR` in the agent's environment too: the organization's settings may not. A package not installed is not there, whatever its program names. The library and the app refuse a path within a package, and `%SLIDR_AGENT_DIR%`, for an agent without one.
- **An installed agent is brought up to date** with the library in the background, once a run, when it is probed and the library has another package for it: the user approved the agent, and the organization ships what it runs. A folder in use, a turn's CLI running from it, stays as it is, and a later run tries again. This was not asked about; it follows ADR-117, where the user approves an agent once.
- **The webview** says the agent is installed from the organization's library, in the chat's setup and in Settings → Agent (`installer: 'library'` of `harnessLook.ts`).

## Consequences

- An organization without the internet can offer an agent of its own that the app installs and updates, by its library alone.
- A package holds no secret: the media is public to whoever reads the library, as the settings are.
- A program in `%LOCALAPPDATA%` may be refused where AppLocker or Windows Defender Application Control allows programs only from `Program Files`: such an organization installs the agent itself, or allows the folder.
- An agent the settings no longer name keeps its folder on the machines that installed it.
- The Open WebUI agent of the library goes as a package of its script and its page, run by the machine's PowerShell 7.5: `pwsh.exe` and `-File %SLIDR_AGENT_DIR%\openwebui-agent.ps1` (its README).

## Checks

- The app's Rust tests: `custom_agents` (3): a package downloaded and unpacked into its folder, not downloaded again when it is installed, and replaced whole by another; packages that leave their folder or are no .zip refused, with what was installed staying; no library, no package, and a library that cannot be reached. `custom_cli` (2 new): an agent of a package not installed, installed from a library on this machine and run from its folder by Node.js on its script, its arguments and environment naming its folder; a program within the package found first. `system_settings` (1 new): packages, and paths within them, that hold and that do not. With those of `media_library`, `registry` and the rest of the harnesses, 95 tests passed; `cargo clippy --tests` reports nothing, and `rustfmt` nothing for the files changed.
- Webview: `settings/systemSettings.test.ts` (the installer of a package, and what its approval says); `tsc` passes. `i18n/translations.test.ts` fails at the time of this record on keys of `elements` that another change in the working tree is adding, none of this one's.
- Slidr Library: `server/core/system.test.ts` (6, one new): a package refused when it is no .zip or not of its hash, sent, published with the settings and kept no longer as sent, not sent again, taken along when its agent's id changes, refused when it was never sent, and taken away when no agent names it and when the settings are; a path within a package and `%SLIDR_AGENT_DIR%` refused for an agent without one. All 205 tests of the library pass; `tsc` (page and server) and `eslint` pass for the files changed.
- Not run: the page **System settings** in a browser; the app in Tauri installing a package from a library; a package's folder in use while an update replaces it; the Open WebUI agent as a package.
