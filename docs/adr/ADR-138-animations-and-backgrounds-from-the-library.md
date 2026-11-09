# ADR-138 — The animations and the backgrounds of Elements come from the media library

Status: Implemented on 2026-11-09 in the working trees of the app and of Slidr Library; **not committed** at the time of this record, the library **not deployed**, and its two catalogs **not published**. It moves the content of [ADR-127](ADR-127-animations-and-backgrounds-in-elements.md), [ADR-128](ADR-128-motion-that-repeats-and-animated-shapes.md) (the animated shapes) and [ADR-131](ADR-131-animations-that-are-lines.md) out of the app, as [ADR-090](ADR-090-media-library-on-the-web.md) did the rest of Elements. How each of them moves, lands on a slide and is edited is unchanged.

## Request

"למה בספריה אין תצוגה של רקעים ואנימציות?" and, once the answer was that the app's code drew them, "כן. לא מהקוד!"

## Context

- Every other part of Elements (designs, card sets, frames, shapes, graphics, emoji, icons) is a catalog of the media library, read while the app runs ([docs/media-library.md](../media-library.md)). The 11 backgrounds, 18 animations and 10 animated shapes were not: `motionBackgrounds.ts` and `motionPieces.ts` drew them in code, from formulas and seeded random numbers, `motionShapes.ts` listed the shapes, and their names were strings of the app in sixteen languages. So Slidr Library's page had nothing of them to show, and a new one needed a release of the app.
- The library takes new content through its upload API ([ADR-110](ADR-110-library-published-through-its-api.md)), as designs are added; content is made by Slidr Studio or by hand, never by a script of the app.

## Decision

- **Two catalogs of the library.** `elements/backgrounds/catalog.json` holds the backgrounds and `elements/animations/catalog.json` the animations (`animations`: a picture with its `markup`, or a line with its `line`) and the animated shapes (`shapes`). Each item has its id, its name in every language of the app, and what the code had: a background's `animated` and `sided` and its picture; an animation's `group`, `size`, `reads` and its picture or line; a shape's `preset`, `side`, `aspect`, `look`, `ink`, `ambient` and `reads`. A picture paints in the colours that stand for the theme's (`INK`, and the white `GLINT`), which are now the catalog's contract with whoever draws one.
- **The app reads them** as it reads the card sets: `backgroundCatalog` (`motionBackgrounds.ts`) and `animationCatalog` (`motionPieces.ts`), catalogs of `@slidr/media-library`, read while the app is idle after it starts, or when a panel wants them first. Until they have come, and without the library, the Animations and Backgrounds collections show nothing (and the "could not load" line), and the Shapes collection has no group of animated shapes. An item the app cannot draw (no Hebrew or English name, an unknown group, a line the model does not take) is left out. The app gives each picture its `data-slidr-motion` attribute (ADR-128) as it reads it, so the catalog does not carry it.
- **Names from the catalog.** The `name` maps of `animations`, `backgrounds` and `animatedShapes` are gone from the app's strings in every language; a tile, a tooltip and the search use the item's own name in the interface's language, else its English one (`motionName`). The names of the groups and of the collections stay strings of the app.
- **Search tags.** `animations` and `backgrounds` are kinds of `tags/<kind>.json` (ADR-108): an animation by its id, an animated shape as `shape:<id>`, a background by its id. Until the library has them, the search finds these by their names and groups, as before.
- **Already on a slide.** A picture or a line put on a slide is the deck's own, and is drawn as it is without the catalog. Only what reads the catalog by an element's name waits for it: the speed of an animation in the Motion tool (`pieceOf`) and of a moving background in the Background tool (`drawingSpeed`), which draw again when it comes.
- **No drawing code.** `motionKit.ts` keeps only what works on a picture that exists: the colours (`INK`, `GLINT`, `inkOverrides`), `atSpeed` and `withRootAttribute`. The builders and their helpers (paths, running lights, travelling dots, random numbers) are gone.
- **Slidr Library** takes both as parts of its own (its README, "Uploading"): `backgrounds: add` and `animations: add` add an item, written in Hebrew and English and accepted once named in every language, with its markup checked (one `svg`, no script, handler, outside link or the app's own attributes), and publishing appends it to the catalog; `tag` gives their search tags. Its page shows both parts, drawn by the app's own code.

## Consequences

- The library's page shows the backgrounds and the animations, and a new one reaches every app with the next manifest, without a release.
- The first catalogs are exactly what the code drew on this day: they were exported from it before it was removed, and are published through the library's API (`add`, one upload an item, with a `publish` token). Until they are published the published library has neither file, so the collections are empty, and the tests that read the published library fail (below).
- An app of before reads nothing of these files, and keeps drawing its own.

## Verification

- With the library's site stood in by a local server that serves the published library and the two exported catalogs: `motion.test.ts` (with new tests of reading a catalog: what is left out, the order, the attribute, names by language), `motionBackgrounds.test.ts`, `ambient.test.ts`, `background.test.ts`, and the rest of `desktop/src/elements`, `objects`, `i18n` and `media` (486 pass; `designs.test.ts` fails as before, "296 first designs" finds 286); `motion.browser.test.tsx` and `ambient.browser.test.tsx` (43); and the Playwright specs of Elements on a dev server of its own reading that site (`elements-motion`, `elements-ambient`, `elements-panel` and `elements-cards`, 37, and `background-drawing`, 2: all pass).
- Against the library as it is published today these tests fail for want of the catalogs, by design: they are tests of the library's content, as `designs.test.ts` is.
- Type check of the desktop app, ESLint and Prettier on the changed files.
