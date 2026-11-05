# ADR-129 — Backgrounds of Elements from edge to edge, and their colours, speed and opacity

Status: Implemented on 2026-11-05 in the working tree; **not committed** at the time of this record. It amends [ADR-127](ADR-127-animations-and-backgrounds-in-elements.md) (the backgrounds of Elements) and builds on [ADR-125](ADR-125-a-drawing-in-the-background.md) (a drawing in the background). The speed of a picture is the one of [ADR-128](ADR-128-motion-that-repeats-and-animated-shapes.md) for the animations of Elements, written by a session that worked at the same time: the same function and the same attribute.

## Request

"הצורה לא מגיעה עד סוף הרקע (בדוק בכולם)
2. חשוב על שיטה לשלוט בפרמטרי הצורה ברקע (צבע, מהירות)"

Two pictures came with it, of a dark template: the `waves` background and the `flow` background, each stopping about two thirds of the way across the slide.

## Context

- ADR-127 drew the four motions of the reference deck as the deck draws them: on the half of the slide beside its text. `waves` ran to 68% of the width, and `flow` to 62% and a step more. As a background, the drawing simply stopped.
- All eleven were rendered at full size and looked at, one by one. Five stopped before the edge: `flow` and `waves`; `dots`, whose dot field faded out from the light beside the text and was gone by about 70% of the width; `contours`, whose last ring ended at about 75%; and `arcs`, whose rings stopped 560 pixels from the corner. `network`, `drift` and `particles` already covered the slide. `converge`, `orbit` and `radar` are one object beside the text, not a field.
- The drawing of a background is no object of the slide (ADR-125): nothing selects it on the stage, so row B, where an `svg` element's colours are changed, never sees it. The Background tool (row B with nothing selected) only offered the fill, blur and dim, removing the drawing, and going back to the template's background.
- The motion is inside the picture: CSS `@keyframes` and SMIL. SMIL has no playback rate that can be set from outside the markup, and the deck holds no script. A session working at the same time on the animations of Elements ([ADR-128](ADR-128-motion-that-repeats-and-animated-shapes.md)) wrote the speed into the markup: `atSpeed` (`motionKit.ts`) divides every time of the picture by the speed, and `markupAtSpeed` (`elements/motion.ts`) does so from a picture at its own pace, within `PIECE_SPEEDS` (a quarter to four times), and writes the speed on the root (`data-slidr-speed`), where `pieceSpeed` reads it.

## Decision

- **Edge to edge.** Every background that is a field covers the slide (`motionBackgrounds.ts`):
  - `flow`: each trace starts beyond the left edge and steps on until it is beyond the right one. A light runs at half the share of its path per frame that it ran before, so it keeps about the same pace in pixels on a path twice as long.
  - `waves`: across the whole width. They still swell in the middle and lie still at the two edges. A point every 24 units instead of 20 keeps seven lines of ten shapes each under the size a background may have (39 KB).
  - `dots`: the mask is centred on the slide, and fades the dots only to a third toward the corners, never out. The light beside the text stays where it was.
  - `contours`: 20 rings instead of 11, opening out as they go (`80 + 76k + 2k²`), so the outermost one passes beyond every corner of the slide.
  - `arcs`: six more faint rings, from 720 to 2120 units, spaced wider and wider, out to the far corner.
  - `converge`, `orbit` and `radar` stay one object beside the text.
  - `flow` and `waves` stay `sided`. They no longer stand on one side, but they run one way across the slide, so a deck that reads from the left still gets them mirrored.
- **Where they are set.** The Background tool shows a section for the drawing when the background the slide shows has one (`DrawingFields` in `BackgroundTool.tsx`). It sits under the fill, as no object to select:
  - **Drawing colours:** a colour button for each colour the drawing's pictures replace (`colorOverrides`). For a background of Elements, these are the colours that stand for the theme's: `waves` has two, `arcs` three. A colour picked from the theme is stored as its token, so the drawing keeps following the template. A drawing whose pictures replace no colour lists the colours its markup is drawn in, as row B does for an SVG, up to twelve.
  - **Motion speed:** 25% to 400%, only when a picture of the drawing is a background of Elements that moves. The picture is drawn again from the collection's picture at its own pace (`markupAtSpeed`), never from the one on the slide, whose times are already divided: two speeds in a row would compound. So the drawing also becomes the collection's drawing as it is now. A deck made before this record gets the edge-to-edge drawing at its first change of speed. The colours, the mirror and the opacity are fields of the element, and stay.
  - **Drawing opacity:** 10% to 100%, the `opacity` of every element of the drawing.
- **The model and the files.** Nothing new in the schema. A speed is in the markup, so it holds on the stage, in the filmstrip, in a show and in an exported file. Each change is a `slide.update` of the slide's background, one undo step per gesture, as a change of the fill is. A slide that showed its layout's or the theme's background gets one of its own, as with any edit in the tool, and **Apply to all slides** spreads it, drawing included.
- **The functions** are pure, in `objects/background.ts`: `drawingPictures`, `drawingColours` / `drawingColour` / `withDrawingColour`, `drawingSpeed` / `withDrawingSpeed`, and `drawingOpacity` / `withDrawingOpacity`. A background of Elements is known by the name its picture was given (`background-<id>`), as `shownMotionBackground` already knows it.
- **Strings** in all sixteen languages (`objects:background.drawingColours`, `drawingColour`, `speed`, `drawingOpacity`).

## Consequences

- The backgrounds are larger: `flow` 35 KB (was 28), `waves` 39 KB (was 33), `contours` 29 KB (was 15), `arcs` 1.3 KB. All stay under the 48 KB the unit tests hold them to.
- `waves` and `flow` now run behind the text as well. The tool's opacity is how to quiet them there.
- The speed is set only for the backgrounds of Elements. A moving picture of another kind in a background (none exists in the library yet) can have its colours and its opacity changed, not its speed, because there is no picture at its own pace to draw it from.
- A slide whose drawing was given a speed and is then given another background from Elements gets the new one at its own pace.

## Verification

- All eleven backgrounds were rendered at full size in Edge before and after the change, and the five that changed were looked at again.
- Unit tests:
  - `objects/background.test.ts`, 6 new: the colours listed and what they are drawn in; a colour changed in every picture under the right key, the rest of the background kept; a speed drawn again from the collection each time (2 and then 0.5 gives the picture at 0.5, and 1 gives back the collection's own markup), with the colours and the mirror kept; no speed for a still background; the opacity; one undo step.
  - `elements/motionBackgrounds.test.ts`, 4 new: every trace of `flow` starts beyond the left edge and ends beyond the right one; every line of `waves` starts at 0 and spans 1920; the arcs reach 95% of the diagonal; every corner of the slide is inside the outermost contour; the dots' mask never fades below a third.
  - The background tests of `motion.test.ts` (sizes, colours, motion, hidden paths) pass.
  - `translations.test.ts` finds every key of this record in every language.
- End to end in Edge (`background-drawing.spec.ts`, 2), against the mocked backend. `waves` is applied from Elements, and the tool shows two colour buttons, a speed of 100% and an opacity of 100%. The accent is changed to the theme's primary (stored as its token). A speed of 200% is one undo step, and every `dur` the stage draws is halved. An opacity of 40% is one step. Undo takes both back, and the stage draws the original times again. In Hebrew, `arcs` shows three colours and an opacity, and no speed. The screenshots were looked at: the waves run edge to edge on the stage.
- `objects-background.spec.ts` (8) and the background tests of `elements-motion.spec.ts` pass. "A picture with blur and dim" failed once when the dev server reloaded the page in the middle of the test, while another session was editing files, and passed when run again.
- Type check of the desktop app: no error. ESLint and Prettier on the changed files.
- Once ADR-128's work was in place, run again together: `background.test.ts`, `motionBackgrounds.test.ts`, `motion.test.ts` and `translations.test.ts` (153 tests), `background-drawing.spec.ts` and `elements-motion.spec.ts` (6) all pass.

## Open for the user

- Whether `converge`, `orbit` and `radar`, which are one object beside the text, should also be offered larger, or centred, in a variant that fills the slide.
- Whether the Background tool should also offer a way back to the theme's colours for the drawing. Today undo does it, or the background applied again from Elements.
- Whether the speed should also be offered for the drawing of a template's background, when one moves. It would need the picture at its own pace kept somewhere.
