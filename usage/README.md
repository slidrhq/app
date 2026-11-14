# usage — how many people use Slidr

The Worker `usage`, at `https://usage.slidr.studio`, counts Slidr's installations and how many of them start each day ([ADR-142](../docs/adr/ADR-142-installations-and-starts-counted.md)).

## What it gets and keeps

Each start of the released app sends `POST /v1/start` (`desktop/src-tauri/src/usage.rs`), unless the user turned it off in **Settings → General → Privacy**, or the organization did:

```json
{
  "install": "6f1c2a52-8a1e-4c55-9a8e-1a2b3c4d5e6f",
  "version": "0.4.0",
  "os": "windows",
  "language": "he"
}
```

`install` is a random UUID the app made on its first start and keeps in `%APPDATA%\slidr.app\usage.json`. Nothing else of the machine or the user is sent: no file, slide, chat, prompt or key.

The Worker (`count.ts`) keeps, in the D1 database `slidr-usage` (`schema.sql`):

- `installs`: one row per installation: its id, the days it was first and last seen, and the version, system, language and country of its last start. The country is Cloudflare's reading of the request; the address itself is not kept, and the Worker has no request logs.
- `days`: one row per installation per day (UTC) it started, with the version and how many starts. Rows older than 400 days are deleted every day at 03:17 UTC.

It answers only with a status: `204` counted, `400` not a start, `503` the database failed. The app reads no answer.

## Reading the numbers

```sh
pnpm install      # once, in usage/: wrangler (a standalone install, not of the app's workspace)
pnpm report       # signed in to Cloudflare (pnpm exec wrangler login)
```

`report` prints the installations (all, new in 7 and 30 days), the users (distinct installations that started today, in 7 and in 30 days), each of the last 14 days, and the installations active in 30 days by version, language, country and system. Any other question is a query: `pnpm exec wrangler d1 execute slidr-usage --remote --command "SELECT …"`, or the D1 console of the Cloudflare dashboard.

"Installations" counts ids, so it counts a reinstall that removed `%APPDATA%\slidr.app` twice, and one person on two computers twice. An installation that never starts with the network, or has the count turned off, is not counted at all.

## Deploying

```sh
pnpm migrate      # the schema; every statement may run again
pnpm deploy       # the Worker, its custom domain usage.slidr.studio, and its daily job
```

The test (`worker.test.ts`) runs with the app's: `pnpm test` at the root of the repository. `pnpm dev` runs the Worker on this machine with a local database (`pnpm exec wrangler d1 execute slidr-usage --local --file schema.sql` first); a debug build of the app sends to it when `SLIDR_USAGE_URL=http://127.0.0.1:8787/v1/start`.
