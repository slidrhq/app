# ADR-121 — The names of Elements in every language, and what is still in Hebrew and English

Status: Implemented in the 2026-10-29 working tree of the app; **not committed**. The names the library holds are staged with the magnets of [ADR-120](ADR-120-event-magnets-in-every-language.md), **not published** (its "Open for the user").

## Request

"בדוק שיש תרגומים ו-tags (בכלל ובכל השפות) לכל האלמנטים במערכת": check that every element has translations and tags, at all and in every language. Asked, the user had the missing names translated and the missing tags written.

## What the check found

Against the published library (manifest of 2026-10-27) and the app's code:

| Kind | Content | Names | Search tags |
| --- | --- | --- | --- |
| Ready slides, 344 | slides in all 16 | the 286 first in all 16 (messages); the 58 of the studio and the groups `techproduct`, `invitations` in Hebrew and English (catalog) | Hebrew and English |
| Templates, 25 | samples in all 16 | all 16 (messages) | none (not searched) |
| Card sets, 5 | words in Hebrew and English (ADR-103) | all 16 (messages) | Hebrew and English |
| Frames, 366 | the magnets' words in Hebrew and English | Hebrew and English (catalog) | Hebrew and English |
| Shapes and lines | — | presets in all 16 (messages); the 150 generated ones (`extraShapes.ts`) in Hebrew and English | Hebrew and English |
| Graphics, 3,296 | — | the drawing's English name in every language, Hebrew too | Hebrew and English |
| Emoji, 1,906 | — | Hebrew and English (catalog) | Hebrew and English |
| Icons, 7,024 | — | the set's English name in every language | Hebrew and English |
| Fonts | — | their family names | — |

The interface's own strings are complete in all 16 (`translations.test.ts`). The 13,124 tagged items have tags in Hebrew and English only: 22,439 distinct English tags, untranslated into the other fourteen.

## Decision

- **A name of the catalogs is read in every language it is given in**, and falls back to English (Hebrew keeps its own): frames (`names` beside `en` and `he`, `frameName`), emoji (`lang=name` fields after the six of a line, `stickerName`; an app of before reads the six), the designs' names and group names (`localName`, whose `DesignNames` now holds any language). The words of every name but the Hebrew are among the words an item is found by, as the tags of those languages are.
- **The generated shapes are named in every language by templates** (`extraShapeNames.ts`): one for each family made with a number, worded to need no agreement with it (Russian `{n}-угольник`, `Шестерня, зубьев: {n}`; Arabic `مضلع، عدد الأضلاع: {n}`; Japanese `{n}角形`), and a name for each other shape. `useShapeNames` takes them.
- **The emoji's names are Unicode's**: the `tts` names of CLDR's annotations (and derived annotations, for sequences) in each language, not a translation of ours. Three keycaps lack one language and keep English there.
- **The frames' and designs' names** were written for each language by meaning, as ADR-120's words were.
- **The search tags** are translated by `translate-tags.mjs` (Sonnet, after Opus came to about $40 a language), and sent with `tag-elements.mjs --upload`, with the magnets' own tags of ADR-120 put back over the script's.

## Not done

- **Graphics and icons** keep the English name of their drawing: they have no name of their own in any catalog to translate.
- **Card sets** keep their words in Hebrew and English: a set in another language is content to write, as ADR-103 has it.
- **The studio designs' names** are translated (`names/<lang>.json` of the staged folder) but not in the library: `designs: translate` takes slides only.

## Verification

- Unit tests: `stickers.test.ts` (an emoji named in German and Japanese, English in French, found by its German name), `designCatalog.test.ts` (a design named in German, English in French, Hebrew alone in Hebrew), `shapes.test.ts` (every generated shape named in every language, with its number, no template left), and `frames.test.ts` (ADR-120), against the published library and against the staged one: 53 of `frames.test.ts` and `stickers.test.ts` on the staged library. `tsc` of the desktop app; Prettier and ESLint on the changed files.
- `designs.test.ts` fails twice, before and after: it wants 296 first designs and every group filled, and the published library has 286.

## Open for the user

- Publishing, as ADR-120 says: blocked by the Free plan.
- The tag translation runs into a scratch folder and has not been uploaded; it stopped once on the subscription's session limit and goes on from what it kept.
