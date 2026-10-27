# ADR-116 — The pictures of the designs are kept up by the library

Status: Implemented in the 2026-10-27 working trees of the app, Slidr Library and Slidr Studio; **not committed** at the time of this record, and the library **not deployed**. It changes how the words of [ADR-109](ADR-109-ready-slides-by-language-and-as-pictures.md) are written and read, and what [ADR-110](ADR-110-library-published-through-its-api.md) left to an author's publication, which [ADR-114](ADR-114-no-copy-of-the-library.md) took away.

## Request

Shown the Ready slides gallery: "Why aren't the pictures made ahead in the library used?" Then, on the cause and the three changes proposed: "Do it as recommended, on every platform." Then, of the eight designs left without pictures: "How can they be made? In every language?"; and, of a script of the app proposed for it: "This is a capability of the studio, not of the app."

## Context

- On 2026-10-27 the library held a picture made ahead of every design in every language: 336 designs, 16 languages, 5,376 pictures. Each was of its design's word as `revs.json` gave it.
- No installed app showed any of them. A gallery drew every design live: the full picture of each, and its text laid out in fonts read for it.
- `elements/designs/revs.json` was written on 2026-10-25 at 13:12. On 2026-10-26 at 06:22 a publication of uploads put eight designs of Slidr Studio into `managed.json`. `revs.json` names the hash of each file it was made from, and `managed.json` was no longer the file it named. The app takes the words only when every file is the one they name (`designRevs`, `madeFrom`), so it took none, and no picture was shown.
- Under ADR-110 a publication of uploads does not write the files made of the catalogs: they "wait for the next author's publication". ADR-114 removed that publication, with `generate-design-thumbs.mjs`, which drew the pictures. So nothing would write them again, and each new design would undo them anew.
- One file out of date put every picture out of date, though one catalog changed and the 286 authored designs and the 50 earlier ones of the studio were as drawn.

## Decision

- **Slidr Library writes the files made of the catalogs of the designs on every publication** (`server/core/media/designFiles.ts`), of uploads or of an author's files:
  - each catalog in each language, `elements/designs/<language>/index.json` and `managed.json`;
  - `revs.json`, with what it was made from and, new, the designs each catalog gave words (`catalogs`).

  A catalog whose words `revs.json` holds as it is, with the pictures of its designs, is not read again. The authored catalog is some 43 MB, more than a Worker holds as objects, so a catalog is read by the structure of its JSON, a slide at a time. A publication that takes no upload (**Try again**) writes the files where they are of another library.
- **The word has one definition, in the app** (`desktop/src/elements/designWord.ts`): the SHA-256 of `[DESIGN_DRAWING, slide, picture hashes]`, as `designFiles` of `build/media.ts` made it. The library copies the module into its `vendor/` and makes the words with it. `DESIGN_DRAWING` moved there from `build/media.ts`.
- **A design comes with the pictures of its slides.** Slidr Studio's render draws each slide at 320 × 180 too (`<lang>-gallery`), and its upload brings them as `thumb-<language>`, WebP at quality 85. The library takes them on `designs: add` and on `designs: translate` (each 320 × 180, at most 1 MiB), writes them to `images/designs/thumbs/320/<language>/<id>.webp`, and names each in `images/designs/thumbs/index.json` by the word of the slide it is of. A slide changed without its picture keeps the word of its last picture, so it is drawn live.
- **Slidr Studio draws the pictures the library lacks.** The library takes `designs: draw`: pictures of a published design's slides, of any design, the app's own too, in any language. Each names the word of the slide it was drawn of, as `revs.json` gives it. It changes no slide, and the picture is named by that word while the slide still has it, else the slide stays drawn live. The studio's Publish panel says how many slides have no picture of them as they are, and draws them (`src-tauri/src/gallery.rs`): a hidden render window draws each slide as the library publishes it in its language, as the app's gallery draws it (`web/src/gallery.tsx`), and each design's pictures go as one upload. It draws only while `revs.json` is of the library its manifest lists. The app's script that drew them before (`generate-design-thumbs.mjs`, removed by ADR-114) is not brought back.
- **The app makes the word of each design it reads** (`Designs.designWord`), of the slide in the gallery's language and the hashes of its pictures in the manifest. The gallery shows a picture while that word is the picture's (`FindDesignThumb(id, lang, word)`). A design changed puts out of date the picture of that design alone. Without the word, in a language not read, the one `revs.json` gives stands, as before: Slidr Library's detail view shows a design in every language without reading them.

## Consequences

- Once the library is deployed, a publication, or **Try again** on its own, writes `revs.json` and the catalogs of the studio in each language. Every installed app then shows the pictures of the 336 designs that have them.
- The eight designs of 2026-10-26 have no pictures made ahead: the studio's renders of them are from before it drew `<lang>-gallery`. Once **Try again** has written `revs.json`, the studio's Publish panel draws their 128 slides, and any other slide without its picture, and sends them as `designs: draw`.
- A design published by the studio from now on has its pictures at once, in each language it was rendered in.
- A release of the app with this change shows the pictures of every design that is as drawn, even beside a `revs.json` of another library.
- Reading the authored catalog by its structure, in Node on the published library: 1.25 s, within a heap of 48 MB beside its 42 MB of bytes. A Worker gives 128 MB. It happens only when that catalog, or a picture of its designs, changes.
- Slidr Library's `vendor/` holds `designs.ts`, `designThumbs.ts` and `designWord.ts` from the app's working tree. Its `COMMIT` names an older commit until `pnpm vendor` is run once the app's change is committed.

## Verification

- The app: `designThumbs.test.ts` and `build/media.test.ts`, 26 pass. The word the gallery makes is the one `designFiles` writes. A design read as drawn shows its picture beside a `revs.json` of another library, and one changed since does not. `tsc`, ESLint and Prettier pass on the changed files.
- Slidr Library: `pnpm test`, 181 pass. Of them, new:
  - a design in each language, with its words as the app makes them;
  - the authored catalog's words kept without reading it;
  - pictures of slides taken and named by the slide they are of, and of the wrong size refused;
  - **Try again** writing what was of another library;
  - a drawing taken and named by its words, the slides unchanged; one of a slide changed since, a picture of no language, a language without its picture and a design the library lacks refused.

  The type check and ESLint pass on the server and the page.
- Slidr Studio: `cargo test`, 56 pass. A design's upload takes the gallery pictures of the right size. The slides missing a picture are found from `revs.json` and the pictures' index, and none while `revs.json` is of another library. A drawing goes as one upload a design, with its words. Clippy (`-D warnings`), the web type check, ESLint and Prettier pass.
- `designFiles.ts` on the published library of 2026-10-27, in a scratch folder:
  - It read `revs.json` and `managed.json` only, in 257 ms.
  - All 5,376 words were as published, plus 128 new (eight designs, 16 languages), and `revs.json` matched the manifest.
  - Made to read the authored catalog too, it wrote `he/index.json` with each of its 286 slides as published.
- The studio's gallery page (`gallery.tsx`) in Edge, on the published library. It drew seven slides at 320 × 180: `cover` in Hebrew and Japanese, `agenda` in Arabic, `concert` in English and `book` in Hindi with their backdrops, `m-techmeetup` in Hebrew and `m-quantumtalk` in Chinese. Against the pictures the app's script drew of them, the mean difference was 1.4 to 3.5 of 255 a channel, and no pixel was more than 48 apart.
