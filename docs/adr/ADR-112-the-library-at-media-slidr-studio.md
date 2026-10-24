# ADR-112 — The library is read at media.slidr.studio

Status: Implemented in the 2026-10-25 working trees of the app, Slidr Library and Slidr Studio; not committed at the time of this record. The domain has served the Pages project since that day (below). It changes the address of [ADR-090](ADR-090-media-library-on-the-web.md)'s site; [ADR-110](ADR-110-library-published-through-its-api.md)'s forwarding is unchanged.

## Request

"I want to add a media subdomain and send slidr-media of Pages (https://slidr-media.pages.dev) there, so that it is reached at https://media.slidr.studio. The app needs to change as well (and every reference)."

## Context

- Every released build reads `https://slidr-media.pages.dev/` (`DEFAULT_URL`, `src-tauri/src/media_library.rs`). So do the dev server, the unit tests and the scripts (`MEDIA_LIBRARY_URL` of `@slidr/media-library`), Slidr Library's page and Worker, and Slidr Studio (their copies of that package in `vendor/`, their font readers, the studio's default `SLIDR_MEDIA_URL`).
- slidr.studio is a zone of the same Cloudflare account as the Pages project `slidr-media`.
- The core follows a redirect only within the library's origin (`REDIRECTS`): a library on one host is never read from another.
- What is kept on the machine is kept by path and SHA-256, not by the site's address: the app's `media\manifest.json` and `media\objects\<sha256>`, and the dev server's `node_modules/.cache/slidr-media`.

## Decision

- **media.slidr.studio is a custom domain of the Pages project `slidr-media`.** Both addresses serve the same production deployment: its files, `_headers` and Function today, and its `_worker.js` once ADR-110 is set up.
- **The app and its siblings read the library there**: `DEFAULT_URL`, `MEDIA_LIBRARY_URL` and its vendored copies in Slidr Library and Slidr Studio (the one line, as the app has it, until their next `pnpm vendor`), their font readers, the studio's `SLIDR_MEDIA_URL` default, and the scripts and tests that named the site.
- **slidr-media.pages.dev stays, and does not redirect.** Released builds read it, and would not follow a redirect to another host. Preview and per-publication deployments stay at `<id>.slidr-media.pages.dev`, and the publication records under `desktop/scripts/design-locales/` keep the addresses they were published at.

## Setting it up

The domain was added to the project on 2026-10-20, and Pages held it as pending: "CNAME record not set". On 2026-10-25 the record was made in the DNS of slidr.studio, `CNAME media → slidr-media.pages.dev`, proxied, through the API with a token for the zone's DNS made for this one change, to be deleted after it. Wrangler's sign-in may read the zone but not write its DNS. Pages then checked the record and issued the certificate, about a minute and a half later; the domain is `active`.

## Consequences

- An app built from this tree reads the library at the project's own domain; one released before reads it where it always did, from the same deployment. Nothing published changes, and nothing kept on a machine is read again.
- slidr-media.pages.dev can be given up only once no release in use reads it.
- An organization's own copy ([ADR-107](ADR-107-a-library-of-your-own.md)) is not affected.

## Verification

- The app: `packages/media-library` and `desktop/src/elements/designThumbs.test.ts`, 15 tests; `cargo test --lib media_library`, 16 tests.
- Slidr Library: the Worker's 66 tests, `site.test.ts` among them.
- Prettier on every changed file of the three repositories.
- The site: `manifest.json` at media.slidr.studio is byte for byte the one at slidr-media.pages.dev, with the same `Access-Control-Allow-Origin: *`, `Cache-Control: no-cache` and ETag; a missing path answers 404; slidr-media.pages.dev answers without a redirect. Sixteen files read from the new address matched the manifest's sizes and SHA-256: the four largest catalogs (`elements/designs/index.json`, 40.6 MB, served in parts by the Function, among them) and twelve fonts and pictures.
