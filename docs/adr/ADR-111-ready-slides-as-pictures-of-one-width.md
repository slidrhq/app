# ADR-111 — Ready slides are shown as pictures of one width

Status: Implemented in the 2026-10-24 working tree; **not committed** at the time of this record. The author copy of the media library (`../Slidr-media`) holds the change, and it is **not published** yet. It changes one point of [ADR-109](ADR-109-ready-slides-by-language-and-as-pictures.md): the pictures of the designs were made at two widths.

## Request

"In storing the slides in the library, the ready-made slides use large sizes (there are two sizes, why?) Is this size needed?" Then, on seeing where each width is used: "I want to give up the large files. I don't expect a picture of that size to be used. 320 is quite enough."

## Context

- ADR-109 made each design's picture at 320 pixels wide, for a tile of the app's panel (160 pixels), and at 640, for a card of Slidr Library. The galleries give both to the browser (`srcset`), which takes what the tile needs at the screen's density.
- A card of Slidr Library is 250 pixels wide and more (`minmax(250px, 1fr)`), 254 on a screen 1,920 pixels wide. The 640 picture was needed only on a screen scaled by 150% or more, and in the library's detail view, which showed the pictures 384 pixels wide. The app's panel never took it.
- The 640 pictures were 5,376 files and 145 MB of the published library's 14,063 files and 478.8 MB. Pages takes 20,000 files on its free plan.
- The library's page asked for both widths of every picture it listed, at every visit: an `img` without its `sizes` before its card was measured, so the browser took the width of the screen; and a reload drew the 640 picture at twice the card's width until the 320 came. That was fixed the same day in Slidr Library (`src/Designs.tsx`), apart from this decision.

## Decision

- **A design's picture is made at one width, 320 pixels** (`WIDTHS` in `desktop/scripts/generate-design-thumbs.mjs`).
- **A width no longer made takes its pictures with it, and redraws nothing.** The script keeps a design's pictures when the index named every width it makes (it compared the list exactly before), and removes the folders of widths it does not make.
- **The readers are unchanged.** `designThumbs.ts` takes the widths from `images/designs/thumbs/index.json`, so the galleries give one picture once the index names one width, and the browser takes it at any density.
- **Slidr Library's detail view shows the pictures at 320 pixels**, their own width, not 384.

## Consequences

- The library loses 5,376 files and 145 MB once published.
- On a screen scaled by 150% or more, a card of Slidr Library shows a picture of 320 pixels over 381 device pixels: a little soft. The app's panel is as it was.
- To make a width again, add it to `WIDTHS` and run the script: since the index does not name it, every picture is drawn again.

## Verification

- The script, run on a copy of the pictures in a scratch folder (`--out`), reading the author copy: 0 of 5,376 designs drawn again, the folder `640/` removed, the index naming `[320]` with the same words for every design, the folder `320/` byte for byte as it was.
- The author copy was then given the same index, without `640/`. `pnpm media:publish --dry-run` against the published library: 0 added, 1 changed (`images/designs/thumbs/index.json`), 5,376 removed, all under `images/designs/thumbs/640/`; not blocked.
- `designThumbs.test.ts`, 7 pass; ESLint and Prettier on the changed files.
- Slidr Library, the page in a browser at 1,920 × 1,000: the designs section fetched 66 pictures on opening, at 320 alone (622 before, both widths of every design); after a reload, no picture drawn wider than its card (311 of 311 before).
