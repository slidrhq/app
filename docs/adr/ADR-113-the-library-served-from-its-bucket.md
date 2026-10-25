# ADR-113 — The library is served from its bucket, through Cloudflare's cache

Status: Implemented and set up on Cloudflare on 2026-10-25: Slidr Library `4e2bef5` and `5f8a6e1`; this record and the app's side **not committed** at the time of this record. It replaces the forwarding of [ADR-110](ADR-110-library-published-through-its-api.md) (a Pages project in front of the Worker), and gives up `slidr-media.pages.dev`, which [ADR-112](ADR-112-the-library-at-media-slidr-studio.md) kept.

## Request

"Keep the bucket, but connect media.slidr.studio to it directly as an R2 custom domain with a cache: publishing stays immediate and the cost is almost nothing. The Pages project goes away entirely, since there are no old versions." And then: commit it, set it up on Cloudflare, and delete the Pages project once everything is verified in R2 and in the cache.

## Context

- Since ADR-110 the library lives in the R2 bucket `slidr-media` of Slidr Library's Worker, which a publication writes as soon as an editor publishes. The Pages project `slidr-media` was to forward every request to the Worker. Then every read of the library runs code: a Pages Function is billed as a Worker request ($0.30 a million beyond 10 million a month), and the Worker reads R2 ($0.36 a million beyond 10 million). At a million users that would be some $45 a month, and more in a month when many install the app. The static Pages site cost nothing, but nothing can publish into it from a Worker.
- The app reads the manifest at each start and a file only the first time it needs it, and keeps it by its SHA-256 ([ADR-090](ADR-090-media-library-on-the-web.md)). It sends no `If-None-Match`, and it trusts no ETag.
- No release of the app in use reads `slidr-media.pages.dev` (the user).
- The zone `slidr.studio` rewrote the e-mail addresses of HTML (Email Obfuscation). Since ADR-112, the five reference decks (`templates/reference-decks/*.html`) were answered with bytes that are not the manifest's, and the app showed them without keeping them.

## Decision

- **media.slidr.studio is a custom domain of the bucket `slidr-media`**, with Cloudflare's cache in front of it. No Worker runs when the library is read. The bucket holds the library and nothing else; a publication keeps its history, staged files and lock beside the uploads.
- **Each file is answered as it was written**: its type, and the caching Pages gave it (the manifest `no-cache`, every other file `public, max-age=0, must-revalidate`). Slidr Library writes both with every file.
- **The zone's rules for the host** (the library's README, "Serving the library"):
  - Smart Tiered Cache, so one data center reads the bucket for the others;
  - cache rules that keep a file a day at the edge, and the manifest two hours, the least the Free plan allows;
  - a response-header rule for CORS, `nosniff`, and `X-Slidr-Library: live`, which tells `pnpm media:publish` to publish through the API;
  - a configuration rule that rewrites no HTML (Email Obfuscation, Automatic HTTPS Rewrites, Server Side Excludes and Rocket Loader off; no Web Analytics or Zaraz).
- **A publication empties the cache of what it wrote**, and of the manifest, as soon as the manifest is written. It purges them by their addresses, or the whole host when they are more than 300, with the account token `slidr-library-purge` (Cache Purge on the zone only). A publication whose cache cannot be emptied is still written, and says so; the cache then holds the old files for a day at most, and the manifest for two hours.
- **The Pages project `slidr-media` is deleted**, and `slidr-media.pages.dev` no longer answers.
- **`pnpm media:publish` deploys nothing.** It publishes through the API when the site answers `live`. Otherwise it stages the copy as a static site, for a library of one's own (`--out`), and publishes nothing. `--branch` is gone with the Pages project.

## Setting it up

On 2026-10-25 the 8,687 files were copied from the Pages site into the bucket, each checked against the manifest's size and SHA-256 and written with its type, caching and hash. The five reference decks came from `slidr-media.pages.dev`, outside the zone, as they were deployed. The manifest was written last. The bucket was checked file by file. Then the domain moved:
1. It left the Pages project, and its CNAME was removed.
2. It was attached to the bucket; ownership and certificate were active in about two minutes.
3. The cache of the host was purged.

Every file was then read through media.slidr.studio twice. Each one had the manifest's bytes, and on both passes each one was answered from the cache. Only then was the Pages project deleted.

## Consequences

- Reading the library costs nothing by the request. R2 counts only the reads that reach the bucket, about one a file a day and after a publication, whatever the number of apps. Ten million a month are free.
- A publication reaches an app at its next start, as before.
- The reference decks are answered byte for byte, and the app keeps them.
- A release built before ADR-112 has no library: `slidr-media.pages.dev` is gone (no such release is in use). The preview deployments `<id>.slidr-media.pages.dev` are gone too. The publication records under `desktop/scripts/design-locales/` keep the addresses they were published at, which no longer answer.
- A library of one's own ([ADR-107](ADR-107-a-library-of-your-own.md)) is unchanged. `pnpm media:publish --out` still stages it as a static site, with `_headers`, `404.html`, and, for a site on Pages, the large catalogs in parts.
- A new address of the library needs the same rules of its zone, or HTML is rewritten and files are not cached.
