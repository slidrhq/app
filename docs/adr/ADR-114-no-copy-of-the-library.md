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

All of them are removed (below). The date is that of each one's last change in this repository; the move to `desktop/` on 2026-10-20 is not counted.

| Script                                                   | What it makes                                                  | Last change |
| -------------------------------------------------------- | -------------------------------------------------------------- | ----------- |
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
| `desktop/scripts/review-culture-designs.mjs`             | reads the copy: renders a batch of designs for review (`design-locales/*/README.md`) | 2026-10-25  |
| `desktop/scripts/frames-magnets/kit.mjs`                 | reads the copy's `elements/source/frames/pictures/` (empty)   | 2026-10-15  |
| `docs/reference-decks/scripts/picture.mjs`               | a picture of a template or a design, into the copy's `images/` | 2026-10-15  |
| `docs/reference-decks/scripts/decks.mjs`, `pictures.mjs` | the reference decks and their pictures' records, in the copy   | 2026-10-15  |

Removed the same day:
- first, as they served only the copy or were spent: the temporary review harness (`desktop/scripts/zz-probe-templates.mjs`, `zz-shot.mjs`, `zz-switch.mjs`, `desktop/dev/zz-tpl.html`, `zz-switch.html`, `desktop/src/dev/zz-tpl/`), `desktop/scripts/review-media-migration.mjs` (a one-time review), and `desktop/scripts/export-templates.mjs`, whose sources (`archive/templates-source/`) were gone. `vitest.config.ts` no longer allows the copy: the tests read the site.
- then, at the user's word ("delete all these scripts"), every script of the table, with what served them alone:
  - `desktop/scripts/frames-magnets.mjs` and `frames-magnets/`, the magnets that `generate-frames-catalog.mjs` drew;
  - the dev pages the picture scripts photographed (`desktop/dev/design-thumbs.html`, `frame-thumbs.html`, and `desktop/src/dev/design-thumbs.tsx`, `frame-thumbs.tsx`);
  - all of `docs/reference-decks/scripts/`, with its test (`desktop/src/templates/referenceScripts.test.ts`);
  - the template tools that served the copy (`package.sh`, `up.sh`, `README-delta.md`);
  - the test that ran `design-asset-sizes.mjs` against the copy.

  The five `tech` sources were deleted from the copy too.

`desktop/scripts/frames-art.mjs` stays: `desktop/src/elements/frames.ts` draws with it.

## Consequences

- No command copies the library to this machine, or publishes from it, and nothing in this repository makes the library's content: its catalogs, pictures and fonts are what the library holds. A change comes through Slidr Library (an upload, or a file sent through its API).
- `fonts/catalog.json`, the frames' and the designs' pictures, and `packages/templates/src/letters.generated.ts` are made again by no script: a new font, frame or design comes with its files, through the library.
- The 30 technology designs (`hitech`, `techproduct`, `defense` of `managed.json`) have no sources any more: they are what the library holds.
- The search tags were published on 2026-10-25 through the uploads, not the copy: all seven kinds, 13,124 items. Five of the uploads waited for Slidr Library `1280814`, which takes a tag of numbers alone (`16:9`, `24/7`, `911`) in any language; since `db9e231` (2026-10-21) an English tag had to hold a Latin letter.
