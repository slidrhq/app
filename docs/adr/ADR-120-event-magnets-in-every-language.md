# ADR-120 — The event magnets in every language of the app

Status: Implemented in the 2026-10-28 working tree of the app; **not committed**. The translated catalog, its pictures and its tags are staged in `Slidr/translation-work/elements-in-16-languages/`, **not published**: a publication of Slidr Library is stopped by Cloudflare before it ends (below, "Open for the user"), and Slidr Library still serves the magnets in Hebrew and English only. It reverses, for the magnets, "Event frames stay in Hebrew and English" of [ADR-098](ADR-098-content-in-every-language.md), and extends the language rule of [ADR-103](ADR-103-elements-only-in-the-ui-language.md).

## Request

"תרגם לכל השפות את כל מסגרות 'מגנטים לאירועים'": translate all the frames of the "Event magnets" group into all the languages.

## Context

- The 100 magnets of `elements/catalogs/frames-catalog.json` have 304 lines of words (captions, and the lines on labels), each `{ he, en }` with its own text, family, size, weight, spacing and slant per language, in one box shared by both. Their names are `en` and `he` beside the frame's own fields; their tags (`tags/frames.json`) are Hebrew and English.
- `frameIn` offered a frame with words in Hebrew and English only, so the fourteen other interfaces had no magnets. `frameExtras` chose `he` for a Hebrew deck and `en` for every other; only Hebrew was read from the right.
- The panel shows 96 of them from pictures made ahead (`images/frames/<language>/<frame>.webp`, ADR-093), Hebrew and English. `index.json` keeps one word (`frameRev`) per frame, a hash of its box, cut, artwork, extras and shadow: every language's words are in it.

## Decision

- **A line is written in any language of the app under its code, beside `he` and `en`** (`CaptionExtra` is `Localized<CaptionWords>`). A frame's names in the other languages are in `names` (`{ "de": "Magnet zur Verlobung", … }`): Indonesian's code, `id`, cannot stand beside the frame's `id`.
- **A frame says its words in the interface's language when every one of its lines is written in it, else in English** (`frameLanguage`), and the panel offers a frame with words in the languages all its lines are written in (`frameIn`). Its name is the interface's, else English's (`frameName`). Arabic is read from the right as Hebrew is; a line without a Hebrew or Arabic letter still reads from the left. The name of a frame in every language is among the words it is found by; its tags in every language already were (`withTags`).
- **The pictures are of the language the words are said in** (`frameThumb`), and the index keeps its one word per frame: an app of before computes the same word from the same catalog, so after publication its Hebrew and English pictures are of the frame as it is, and its panel is unchanged.
- **The words of each language** were written from the English (Arabic from the Hebrew, as its designs are), by meaning for its readers: the rites and holidays as each language names them, the names of people and places as the English has them, in the language's letters (the family Sagi became Levi in Japanese and Korean, where サギ and 사기 read as "fraud"). Each line is set in the family of the English line (for Arabic, of the Hebrew one) where it has the language's letters, else in its counterpart (`familyIn` of `designFonts.ts`, as the designs' other languages are), at the nearest weight; slant only where the family has it, and no added spacing between Arabic or Devanagari letters.
- **Each line was fitted to its box by the renderer**: every magnet drawn at full size, the ink of each line measured against its box, its size lowered until the ink takes at most 96% of the width, and never below 24px on the slide where a magnet comes as large as the safe margins allow. A line that would have to be smaller was written shorter.
- **The tags**: 6 to 12 in each of the fourteen languages for each magnet, by the library's rules (`checkTags`), with the Hebrew and English as they were.

## Considered and rejected

- **The languages beside the frame's fields, as `he` and `en` are**: Indonesian's `id`.
- **A word of the pictures for each language**: the index would change its form, and an app of before would no longer read it.
- **An upload kind `frames: translate` in Slidr Library**: the library publishes an author's files through its API (`PUT /api/library/staged/<sha256>`, `POST /api/library/files`, ADR-114), which needs no change of it; such a kind is the way for the studio to translate a magnet later.

## Verification

- Unit tests: `frames.test.ts`, 42, with the published library (where every magnet is Hebrew and English) and with the staged one (every magnet in all sixteen languages): a frame written in German and Arabic says its words in them, falls back to English in French, reads Arabic from the right, and is found by its German name; every magnet named in every language it is written in; every line at least 24px on the slide and as high as its box in every language; every line of the fourteen languages in a family with its letters; a picture of every magnet in every language, of the drawing it has now. `tsc` of the desktop app, ESLint and Prettier on the changed files.
- `elements-panel.spec.ts`: the German interface offers the magnets once the library has their words in German. Not run; instead the app on a dev server of the staged library was opened in German, Arabic and Japanese: the panel shows the 100 magnets, the 96 pictures of the interface's language, their names in it, and a magnet added to the slide says its words in it, Arabic from the right, with no error on the page.
- Every magnet was drawn in all fourteen new languages, at full size and at 380px wide, and looked at against the English. The review found lines whose box reaches under a sticker or past the rim of a round badge (the bouquet of `magnet-thirty`, the postmarks of `magnet-sixty` and `magnet-retirement`, the backpack of `magnet-discharge`, the badges of `magnet-magazine`, `magnet-space` and `magnet-mimouna`): there the words were made shorter or no wider than 112% of the Hebrew or English line. It also found display lines in a family of one face that looks bold (DM Serif Display, Suez One, Secular One) drawn light in their counterparts: they are set bold, as the designs are (`looks`).

## Open for the user

- **Publishing is blocked.** The catalog (11.3 MB, from 10.2), the 1,536 pictures (23.5 MB, Hebrew and English drawn again with the others) and `tags/frames.json` go through the files API with a publishing token, in chunks (a request takes some three operations of the bucket a file). But every publication first folds `elements/designs/managed.json` into `index.json` (ADR-118) and writes the per-language design files, some 55 MB, and on the Free plan of Cloudflare Workers that is stopped (error 1102) before the manifest; the plan sets no CPU limit (`limits.cpu_ms` fails the deploy). Two tries on 2026-10-28 left the library's bucket folded and 15 of its 16 languages' design files written, with the manifest of 2026-10-27: `zh-CN` lacks the 58 studio designs, and apps do not keep the changed files in their cache. The way out is the Paid plan with `cpu_ms`, or a library whose design-files step fits the Free plan; the staged folder's `README.md` has the state and the steps.
- The app of this change has to be released for a user of another language to see the magnets; apps of before keep offering them in Hebrew and English.
- The four magnets that follow the deck's theme (`followsTheme`) were fitted in the default theme's fonts; in another theme their lines may need its `autoFit`.
