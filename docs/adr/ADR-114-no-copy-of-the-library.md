# ADR-114 — No copy of the library: `media:pull` and `media:publish` are gone

Status: Implemented in the 2026-10-25 working tree; **not committed** at the time of this record. It completes the request of [ADR-110](ADR-110-library-published-through-its-api.md) ("I no longer want to work with a path to a copy, and with syncing"), and leaves the generators of the library without a way to publish until they are moved to the library's API (below).

## Request

"I don't want media:pull or media:publish used: delete them." Before that: "There should no longer be a local copy, `../Slidr-media`; there is no need for media:pull or push."

## Context

- Since [ADR-113](ADR-113-the-library-served-from-its-bucket.md) the library is Slidr Library's bucket. Uploads reach it through the library's API, and a publication writes them in. An author's copy reached it only through `pnpm media:publish`.
- On 2026-10-25 the copy `../Slidr-media` held 3,284 files outside its unpublished folders.
  - 3,276 were the published library's own bytes.
  - One note (`images/designs/PROMPTS.md`) differed.
  - Seven, `tags/<kind>.json`, were in no published library.
- That day the copy was staged as a site (`packages/templates/src/authoring/tools/stage.mjs`), and a development build read it through `SLIDR_MEDIA_URL`. There the search tags worked, and they looked published. No installed app had them: media.slidr.studio answered 404 for every `tags/` file.
- The unpublished folders held five files that no repository has:
  - `elements/source/tech/design-packs/` (`defence.ts`, `hitech.ts`, `techproduct.ts`);
  - `elements/source/tech/designKit.ts`;
  - `elements/source/tech/PROMPTS.md`.

  The template sources of `archive/templates-source/` and the design packs of `elements/source/design-packs/` and `archive/elements-source/`, which `export-templates.mjs` and `export-designs.mjs` read, were in no repository and no longer in the copy either. Their folders were empty. The library's catalogs are what is left of them.

## Decision

- **`pnpm media:pull` and `pnpm media:publish` are removed**, with `desktop/build/mediaApi.ts` (their part of comparing a copy with the library) and its test, and `publishedUrl` of `build/media.ts`.
- **Nothing publishes a copy of the library.** What comes from outside the app comes through Slidr Library's upload API, as before. An author's files are to be published by the scripts that make them, through the library's own API for them (`PUT /api/library/staged/<sha256>`, `POST /api/library/files`), not through a copy.
- **A library of one's own** ([ADR-107](ADR-107-a-library-of-your-own.md)) is copied from the published library by its manifest, with any tool that downloads a list of addresses; `--out` staging is gone with `media:publish`.

## The scripts that wrote into the copy

Until each is moved to the library's API, what it makes reaches no installed app. The date is that of its last change in this repository; the move to `desktop/` on 2026-10-20 is not counted.

| Script                                                   | What it makes                                                  | Last change |
| -------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
| `desktop/scripts/export-templates.mjs`                   | the built-in templates' catalog, from `archive/templates-source/` (gone) | 2026-10-20  |
| `desktop/scripts/export-designs.mjs`                     | the ready-made slides' catalog, from the design packs (all but `tech` gone) | 2026-10-15  |
| `desktop/scripts/generate-graphics-catalog.mjs`          | the graphics catalog and the art sets                         | 2026-10-10  |
| `desktop/scripts/generate-emoji-catalog.mjs`             | the emoji catalog                                              | 2026-10-10  |
| `desktop/scripts/generate-frames-catalog.mjs`            | the photo frames' catalog                                      | 2026-10-15  |
| `desktop/scripts/generate-frames-thumbs.mjs`             | the pictures of the event magnets                              | 2026-10-15  |
| `desktop/scripts/generate-design-thumbs.mjs`             | the pictures of the ready-made slides                          | 2026-10-25  |
| `desktop/scripts/gen-builtin-fonts.mjs`                  | the deck fonts and their catalog, from `@fontsource`           | 2026-10-17  |
| `desktop/scripts/design-fonts.mjs`                       | the fonts of the designs' text in every language               | 2026-10-17  |
| `desktop/scripts/gen-letter-heights.mjs`                 | the letter heights of the font catalog                         | 2026-10-25  |
| `desktop/scripts/generate-trek-art.mjs`                  | one design's illustration                                      | 2026-10-10  |
| `packages/templates/src/authoring/tools/merge-into-library.mjs` | the technology templates and slides, merged into a copy | 2026-10-17  |
| `packages/templates/src/authoring/tools/stage.mjs`       | a copy staged as a site for a dev server                       | 2026-10-15  |
| `desktop/scripts/design-asset-sizes.mjs`                 | reads the copy: the sizes of the designs' pictures             | 2026-10-20  |
| `desktop/scripts/review-culture-designs.mjs`             | reads the copy: renders fifteen designs for review             | 2026-10-25  |
| `desktop/scripts/review-media-migration.mjs`             | reads the copy: a one-time review                              | 2026-10-10  |
| `desktop/scripts/zz-probe-templates.mjs`                 | reads the copy: a temporary review harness                     | 2026-10-15  |

## Consequences

- No command copies the library to this machine, or publishes from it.
- A generator's output waits in `../Slidr-media` until its script publishes through the API. Which of the scripts above to move, and which to remove, is open.
- The five `tech` sources exist only in `../Slidr-media/elements/source/tech/`: they are lost with the folder unless they move into a repository first.
- The search tags were published on 2026-10-25 through the uploads, not the copy. `tags/cards.json` and `tags/shapes.json` reached the library. The other five uploads stayed accepted, because the library's rule since 2026-10-21 (Slidr Library `db9e231`) wants every English tag to hold a Latin letter, and they hold tags of digits alone (`16:9`, `24/7`, `911`, `1+1`).
