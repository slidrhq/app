# ADR-142 — The app counts its installations and their starts, anonymously, unless turned off

Status: Implemented on 2026-11-14 in the working tree; **not committed** at the time of this record. The Worker is deployed at `usage.slidr.studio` (by the user, 2026-11-14), with its database `slidr-usage`.

## Request

"אני רוצה להוסיף לאפליקציה את 3" — the third of three ways to learn how many people download and use Slidr: an anonymous id made on the first start, sent with an "install" and with each "app opened". Then two choices: the starts go to a Worker of Slidr's own on Cloudflare, not to Aptabase; and the count is on by default, with a switch in Settings to turn it off.

## Context

- The README's privacy policy said Slidr "collects no telemetry, and sends nothing to its authors", and the site said "Zero telemetry" and "0 bytes of telemetry sent out". GitHub shows a release's downloads but not who runs the app, nor for how long.
- Aptabase keeps no lasting id by design: it counts sessions, not people. A Worker of our own counts distinct installations and keeps the data with Slidr's other services (Cloudflare, ADR-112, ADR-113), with no third party added to the privacy policy.
- Organizations install Slidr on networks that may be closed, reading a library of their own (ADR-107). A call to Slidr's authors from such a network would look like an attempt to get out (`docs/media-library.md`).
- The webview's content security policy is closed to the network (SEC-05); every call to the web is Rust's (`net.rs`).

## Decision

- **One request per start** (`desktop/src-tauri/src/usage.rs`): `POST https://usage.slidr.studio/v1/start` with `{ install, version, os, language }`. `install` is a random UUID made on the first start and kept in `<app_data>/usage.json`; an id that cannot be kept is not sent, so a full disk never counts each start as an installation. The page asks for it once it knows the language it shows (`startUsage` in `main.tsx`, `usage_start`); a run sends once, a reload does not count again. The answer is not read and a failure is not retried.
- **No separate "install" event.** The day an id is first seen is its installation; the days it is seen are its use. A first start without a network is counted at the next start that has one.
- **On unless turned off**: the `usage` section of the settings, `{ "send": false }`, set by a switch in **Settings → General → Privacy** (`UsageChoice` in `SettingsPanel.tsx`), in every language of the UI. Turned on again, the default is not written.
- **Never sent** by a debug build (unless `SLIDR_USAGE_URL` names a stand-in on this machine) or a build under another identifier (the packaged suites); by an installation whose library the organization chose (a `MediaLibraryUrl` policy or a `media-library.json` beside the app: `media_library::chosen_by_organization`); or where the policy value `SendUsageData` is `0` (HKLM, else HKCU). In the last two the switch is off and cannot be turned on, and says the organization turned it off (`usage_status`).
- **The server** is the Worker `usage` in `usage/` of this repository, with a D1 database `slidr-usage`: one row per installation (first and last day, last version, system, language, country) and one per installation per day (version, starts). The country is Cloudflare's; the IP address is not kept, and the Worker has its request logs off. Days are kept 400 days. Nothing is read through the Worker: the numbers are read with `pnpm report` (`usage/scripts/report.mjs`), through wrangler.
- **The privacy policy says it** (README, "Privacy policy"; `docs/media-library.md` for the policy value).

## Consequences

- Slidr's authors learn the number of installations, of daily, weekly and monthly users, and their versions, languages, countries and systems. They do not learn who: an id is not tied to an account, a machine name or an address.
- A reinstall that removes the app's data, or a second computer, is a second installation. Anyone can post a well-formed start, and so inflate the count; there is no key to protect, since the app is open source.
- The site's "Zero telemetry" claims are no longer true and are reworded in the site's repository.
- Releases up to 0.4.0 send nothing; the count starts with the first release that has this.
- Tests: `usage.rs` (the choice, once a run, blocked or without an endpoint, the id kept and replaced, the body sent); `usage/worker.test.ts` (the two upserts, what is kept of a start, what is turned away, a failing database, the days forgotten). Checked by hand on 2026-11-14: the Worker under `wrangler dev` with a local D1 answered 204 to two starts of one id, which left one installation and one day with two starts, 400 to `{}` and 405 to a GET.
- Checked on the deployed Worker on 2026-11-14: a GET answered 405, `{}` 400 and `/` 404; a start of a test id answered 204 and left its two rows (country `IL`), which were then deleted.
- Not run: the switch in the desktop window; a start of a release build reaching the deployed Worker.
