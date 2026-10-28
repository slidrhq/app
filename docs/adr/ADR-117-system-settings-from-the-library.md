# ADR-117 — System settings, published by the library

Status: Implemented in the 2026-10-27 working trees of the app and of Slidr Library; **not committed** at the time of this record, and the library **not deployed**. It implements the agent half of [docs/custom-agent-cli.md](../custom-agent-cli.md), which was a proposal, and leaves its image half for later.

## Request

"אני רוצה יכולת בספריה לייצר הגדרות מערכת (ישמש מערכות אירגוניות) ובכלל זה: 1. לבחור אילו סוכנים נתמכים, מה הדיפולט, יכולת הגדרה של סוכנים custom (כולל בחירת שם וכו') 2. הגדרת אילו שפות נתמכות, ברירת מחדל 3. הגדרות נוספות. בנוסף, בעליה הראשונה של האפליקציה, היא תקרא את קובץ ההגדרות ותפעל בהתאם. הקובץ ישמר מקומית לכל עליה חדשה. טעינה חדשה מהספריה נדרש רק בשינוי גרסא של האפליקציה."

Asked how far the organization's own agents go, the user chose to build the protocol's harness now. Asked who decides that such an agent runs on a machine: "צריך להתייחס ל'סוכן' הזה כמו לכל אחד, כלומר: בבחירה שלו, לאפשר התקנה ואח"כ לוגין ואז לבחור מודלים ומאמץ. כמו ב-claude cli למשל". The other settings chosen were web access for the agent, and the image providers and photo libraries.

## Context

- An organization points its apps at a library of its own by a policy or a file beside the executable ([ADR-107](ADR-107-a-library-of-your-own.md)). It had no way to say what those apps offer.
- The app reads the library through its `media` protocol, by a manifest it reads at each start ([ADR-114](ADR-114-no-copy-of-the-library.md)). A file of the media is public to whoever reaches the library.
- The agents were a fixed list (`harness/registry.rs`). [docs/custom-agent-cli.md](../custom-agent-cli.md) proposed a protocol for any CLI, registered in Settings, and none was built. Slidr Library already holds a CLI that speaks it, the Open WebUI agent (`custom-agent/` of the library).
- The UI's language is chosen by the user, or follows the system (UI-05). The ready-made content follows it ([ADR-101](ADR-101-ready-made-content-in-the-ui-language.md), [ADR-103](ADR-103-elements-only-in-the-ui-language.md)).

## Decision

- **The settings are one file of the media, `system/settings.json`.** Slidr Library's admins edit them on a page of their own, **System settings**, and saving publishes the file at once, as a publication of files: under the lease, kept in the history, recorded, the cache emptied of it (`server/core/system.ts` of the library; its README, "System settings"). `DELETE` takes it away. The file holds nothing secret and no person's address: everyone who reads the library reads it.

  ```json
  {
    "version": 1,
    "updated": "2026-10-27T10:00:00.000Z",
    "agents": {
      "offered": ["claude-code", "acme"],
      "default": "acme",
      "webAccess": "off",
      "custom": [
        {
          "id": "acme", "name": "Acme Agent", "glyph": "A", "tone": "teal",
          "command": "%LOCALAPPDATA%\\Programs\\Acme\\acme.exe", "args": [], "env": {},
          "install": { "winget": "Acme.Agent", "source": "acme-store" }
        }
      ]
    },
    "languages": { "offered": ["he", "en"], "default": "he" },
    "images": { "offered": ["codex-cli"] },
    "stock": { "default": "pexels" }
  }
  ```

  Each part is an offer: `offered`, absent for every one, the app's later ones too; and `default`, one of those offered. `webAccess` is `on` or `off` to start with, each user's to change, or `blocked`; absent, on.
- **The app reads it on its first start, and again only as another version** (`src-tauri/src/system_settings.rs`). It keeps what it read in `<app_data>/system-settings.json`, with the version of the app and the address of the library. A start of the same version and the same library goes by that file, without the network. Another version, or another library, reads the library again, and goes by what was kept until it has. A library without the file has no settings, and that is kept too. A library that cannot be read says nothing: what was kept stands for that run, and the next start reads it again. The read goes by the manifest of that very start (`MediaLibrary::read_fresh`), never by one kept from before, which may not have the file yet. A development build reads the file `SLIDR_SYSTEM_SETTINGS` names instead, at every start.
  - Another library is read again as well as another version: the settings are of the library they came from, and a machine moved to another library takes that library's.
  - So a change in the library reaches an installed app when the app is updated, not before. That is what was asked: the organization's IT ships a version, and the settings with it.
- **What does not hold is left out, and the rest stands.** The app reads the file as this version knows it, field by field: an agent whose id is one of the app's own, a script as its program (`.cmd`, `.bat`, `.ps1`), a relative path, a variable the app sets itself (`SLIDR_PROTOCOL`, `SLIDR_MCP_TOKEN`), an id offered that names no agent. The library refuses the same on saving, with where each fails.
- **The core holds to them what it runs.** `HarnessManager::offer` takes the harnesses offered, the default first (`registry::offered`), once at start from what was kept and again once the read is over; `agent_harnesses` answers once that read is over. A session's `webAccess` is off whatever the webview asks when the organization blocks it. The image service and the photo libraries offer only theirs, the default first: the user's choice while it is offered, else the organization's, else the first. The stand-ins of the tests (`mock`) are offered whatever the settings say.
- **The interface follows them** (`desktop/src/settings/systemSettings.ts`). The language picker offers the languages offered, and the UI starts in the user's own choice while it is offered; else the organization's default; else the system's, when offered; else the first offered (`offerLanguages`). A choice not offered is kept, and comes back if it is offered again. The chat's setup has the default agent chosen to begin with, and Settings → Agent shows the first offered when the agent chosen is no longer offered. The switch of web access shows the default and is off and closed when blocked.
- **An agent of the organization's own is one like the others** (`harness/custom_cli.rs`), as the user asked. Its name, mark and tint are the settings' (`harnessLook`). It is installed on the user's approval, by WinGet from the source named or by npm after Node.js, as the built-in CLIs are; one without `install` is the organization's to install, and the app says to ask the administrator. Then it signs in (`slidr login` in a terminal), lists its models and efforts (`slidr models`), and runs a process per turn (`slidr turn`), with the request on standard input and the protocol's events mapped one to one. Its program is found by its path, `%NAME%` expanded, or by its name where the app finds the CLIs it installs, npm's package started as Node.js on its script. It gets the app's `attachment_read`. No approval beyond the installation's is asked: the organization named the program, and the user chose the agent.
- **The harness trait has three optional hooks**, `models`, `install` and `login`, which a harness that knows its own setup answers; the built-in CLIs leave them to `setup.rs` as before.

## Consequences

- An organization's library decides which agents, languages, image providers and photo libraries its apps offer, and which programs they may run as agents. Whoever is an admin of that library can name a program for every app that reads it. The program runs only once a user chose the agent and, where the app installs it, approved the installation.
- A change of the settings waits for the next version of the app on each machine. The page says so.
- The image half of the protocol (`slidr image`) is not built: an agent of the organization's own makes no images yet.
- On the very first start, the UI may show the system's language for the moment the library takes to answer, and then the organization's.

## Checks

- Slidr Library, `server/core/system.test.ts` (5 tests): the file published with its hash in the manifest and recorded as a publication; replaced and taken away; twelve settings refused, each at its path; refused to a reviewer and to someone without a role; refused before the library is in its bucket. `tsc` (page and server), `eslint` and `prettier` pass for the changed files.
- The app's Rust tests, 315 of them, pass. New: the file read field by field, fourteen agents that do not hold and six that do; the offer's order; the kept file by version and library; the library read, read again as a new version without the file, and offline (`system_settings`); a fresh read by this start's manifest (`media_library`); the offer of agents (`registry`). `custom_cli` runs a stand-in CLI under Node.js (`custom_cli/fake-cli.mjs`): describe, status and models; not installed; a turn's request and events, and the next turn resumed; an id the CLI has given up, one it lacks ending the conversation; a turn stopped, a crash and a quota. `cargo clippy --tests` reports nothing.
- Webview: `settings/systemSettings.test.ts` (web access, the organization's agents' looks, the languages offered), with the tests of settings, agent and i18n. The whole suite: 3,228 passed, 4 failed outside this change: `designs.test.ts` and `look.test.ts`, which read the published library, and `designRules.test.ts`, on `elements/collections.tsx`.
- The page **System settings** was looked at in Hebrew and English, with its API answered by the test (an admin, settings with one agent of the organization's).
- Not run: the app reading the file from a library in Tauri, a version change, the installation of a custom agent by WinGet or npm, and its sign-in terminal; the Open WebUI agent under the new harness.
