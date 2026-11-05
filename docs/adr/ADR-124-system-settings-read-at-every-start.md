# ADR-124 — System settings, read again at every start

Status: Implemented on 2026-11-05 in the working trees of the app and of Slidr Library; not committed at the time of this record. It supersedes in part [ADR-117](ADR-117-system-settings-from-the-library.md): when the app reads the library's settings again. What the settings are, how the app reads them field by field, and what it does with them are unchanged.

## Request

"אני רוצה לשנות את טעינת הגדרות המערכת מה-library ע"י האפליקציה. כרגע קורה רק בעידכון גרסא. אני רוצה לשנות כך שבעלית האפליקציה היא תמשיך לקרוא מה-local (כדי לא לאחר את עלית המערכת), אבל במקביל יקרא הערך מה-library ויעודכן אם נדרש לעליה הבאה."

## Context

- Under ADR-117 the app read `system/settings.json` on its first start, kept it in `<app_data>/system-settings.json` with its version and the library's address, and read it again only as another version or with another library. A start that read it waited for it: the webview's `system_settings_read` and `agent_harnesses` answered once the read was over, up to 20 seconds.
- So a change in the library reached a machine only with the next version of the app, and the start of each new version waited for the network.
- What is kept is the file as it was published, and each version reads it as it knows it (`Policy::parse`). A new version needs no read of its own to understand what an older one kept.

## Decision

- **Every start goes by what is kept of its library, at once, and reads the library again in the background** (`src-tauri/src/system_settings.rs`). What the library says now is kept for the next start when it is not what was kept; the file is not written otherwise. The running app goes on by what it started with: the agents, languages and offers do not change under the user.
- **The version of the app no longer decides.** A new version goes by what was kept, as any start does. The version is still recorded in the file, for whoever reads it, and an older version can still read the file.
- **A start waits for the library only when nothing is kept, or what is kept is of another library**, as before: the settings are of the library they came from. Until it has read it, it goes by what was kept.
- A library without the file has no settings, and that is kept for the next start. A library that cannot be read says nothing: what was kept stands, and is not touched. A development build still reads `SLIDR_SYSTEM_SETTINGS` at every start, and never the library.

## Consequences

- A change of the settings reaches each app at its next start, and holds from the start after: two starts at most, and no version needed. The library's page **System settings** says so on publishing and on removing.
- No start but a first one, or one with another library, waits for the network for its settings, a new version's included.
- Each start downloads the manifest of the library, as it did before, and the file of the settings when its hash is not in the cache.

## Checks

- The app's Rust tests of `system_settings`: what was kept of this library is gone by at once, another version's included; another library and nothing kept wait. A later start reads the library and leaves the file as it was when nothing changed; a library that took its settings away keeps none for the next start, and the running start goes on by what it had; a library that cannot be read leaves what was kept, and a start with another library goes by what was kept and waits again at the next start.
- Not run: the app in Tauri with a library whose settings change between two starts.
