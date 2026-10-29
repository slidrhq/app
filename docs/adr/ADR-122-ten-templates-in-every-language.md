# ADR-122 — Ten new templates, written in every language of the app

Status: Implemented in the 2026-10-29 working tree; **not committed**. The templates are staged on a copy of the library and accepted there, **not published**: the library still has the 25 templates it had (below, "Open for the user").

## Request

"צור 10 תבניות חדשות ב-16 שפות, לפי ההגדרות והתוצרים הקיימים היום": ten new templates in the sixteen languages, by the definitions and the work that exist today.

## Context

- A built-in template is a source of `packages/templates/src/authoring/` drawn with the template kit, as Atlas (`atlas.ts`) is: a theme, the fifteen layouts of the role contract (`builtin/contract.ts`) for both directions, what the layouts draw given to the slides as objects (ADR-094), and a sample deck a language. `check.ts` holds it to the contract, the text slide and the foot; the app's acceptance (`desktop/src/templates/acceptance.ts`) to the lint in every language its sample is written in.
- The library takes no new template from a program: its upload API has `templates: translate` only (`library/server/core/uploads/content.ts`), and Slidr Studio makes only translations of samples. Nothing copies the library to this machine (ADR-114); an author's files reach it through the library's files API.
- The app names a built-in template from its messages (`templates:name.<id>`, `tagline.<id>`); a template it has no name for shows its theme's name and no tagline (`templates/names.ts`).

## Decision

- **Ten templates, each from the world of a field**, none like the 25 there are nor like each other. The field was given; the composition of each layout was found in the field's objects:

  | id | Hebrew | English | Field | The world it draws |
  | --- | --- | --- | --- | --- |
  | `dofek` | דופק | Pulse | healthcare | a stethoscope's trace, an IV bag, a patient monitor, wristbands, staff badges |
  | `gir` | גיר | Chalk | schools | a chalkboard in an oak frame, a compass, a wall clock, exercise books, a hand bell |
  | `hon` | הון | Capital | finance | security paper: guilloche rosettes, a security thread, coupons, a share certificate |
  | `tavlin` | תבלין | Spice | food | a spice merchant's counter: sacks, a layered jar, price tags, measuring spoons |
  | `rakia` | רקיע | Cosmos | astronomy | the night over an observatory: star trails, Moon phases, the spectrum, an orrery |
  | `maslul` | מסלול | Track | sport | an athletics stadium: lanes, starting blocks, a stopwatch, bibs, hurdles |
  | `taarucha` | תערוכה | Exhibit | art and museums | gallery walls: a salon hang, plinths, admission tickets, a floor plan |
  | `hadran` | הדרן | Encore | music | a record label's night: a turntable, a kick drum, a VU meter, faders |
  | `tefer` | תפר | Atelier | fashion and making | a cutting table: a pattern piece, a tape measure, a dress form, swatches |
  | `sade` | שדה | Harvest | agriculture | a field in section: wheat over loam and roots, silos, seed packets |

- **Each sample is written in all sixteen languages** (`<id>/<lang>.ts`, listed by `<id>/copy.ts`, as Atlas's are): one story of a fictional organisation of the field, from the English (Arabic from the Hebrew) for each language's readers, with its own terms, figures and dates; names of people that read badly in a language were changed there (Kofi → Kwame in Korean, Meera → Priya in Japanese and Korean, Hana → Юки in Russian). A script's leading (`LEADING`) and explicit lines in Chinese, Japanese and Korean where a short block would break badly; no drawing holds a word.
- **The pictures** (61, `pictures/<id>-*.webp`) were made with Codex's image tool, as Slidr Studio makes the designs' pictures: a photograph for the text-and-image and full-image slides, and four portraits of one series a team; none holds text or a logo.
- **The names and taglines** of the ten are in the app's messages and its fourteen locales, the name by meaning in each language (Zugabe, Bis, Rappel, アンコール for Encore; Pouls, 鼓動 for Pulse).
- **A template weighs at most 900 KB in the catalog** (layouts, flipped layouts and the Hebrew sample each hold every drawing): drawings were written with few points and their repeated parts once (`<defs>`, `<use>`). The ten weigh 389–888 KB; with their samples they take `templates/catalog.json` from 16.7 MB to 26.3 MB. The library writes a sample into that file as bytes (`spliceSample` in `library/server/core/media/merge.ts`), so its size does not stop `templates: translate`.

## Considered and rejected

- **Making them in Slidr Studio**: the studio makes no new template, and the library takes none from it.
- **A `templates: add` upload in Slidr Library**: a template is code drawn with the kit, not data checked by the library; its files go through the files API as an author's do (ADR-114).

## Verification

- `check.ts` of each: ok. `tsc` of the authoring folder: no error. The app's i18n tests: pass (every locale names the ten).
- Every slide of every template rendered in all sixteen languages at 470px and as thumbnails, and at full size where text is close to its box, and looked at; Hebrew and Arabic mirrored. In every language no lint error and no L07/L16; warnings left are L13 (words on a slide, as the English samples and Atlas have), L09 near-alignments in two templates, and L17 on the text slide of three (the card from margin to margin that AGENTS.md asks for).
- The acceptance of the ten on a library staged with them (`builtInTemplates.browser.test.ts -t "the <id> template"`, with the published library as it is for everything else): 190 passed. A first run failed one: the model's English deck, switched to Track, opened with "Plan for the fourth quarter" in three lines of its condensed capitals, over the subtitle; Track's opening title box was widened from 940 to 1,100px, and the sixteen openings were looked at again.
- The ten covers as the galleries draw them (`?covers`), beside the 25.

## Open for the user

- **Publishing**: `templates/catalog.json` (26.3 MB), `templates/pictures.json`, the 61 pictures (`images/templates/`) and the manifest's entries, through the files API with a publishing token. Staged in the session's scratch folder by a script that writes only those files from the published ones.
- The app of this change has to be released for an interface to name the ten in its language; an app of before shows their English names and no tagline.
- Faces the library gives some scripts: Korean headings of Track and Encore fall to Black Han Sans, which has one weight (the sample sets it at 400; a user's bold heading is drawn faux-bold); Chalk's Russian and Vietnamese headings fall to Amatic SC.
- `tools/pictures.py` writes its record with CRLF on Windows, and `tools/render-art.mjs` cannot start Playwright on Windows (it imports it by a `C:` path).
