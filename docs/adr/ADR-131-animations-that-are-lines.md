# ADR-131 — Animations that are lines

Status: Implemented on 2026-11-05 in the working tree; **not committed** at the time of this record. It follows [ADR-127](ADR-127-animations-and-backgrounds-in-elements.md) and [ADR-128](ADR-128-motion-that-repeats-and-animated-shapes.md). Superseded in part by [ADR-138](ADR-138-animations-and-backgrounds-from-the-library.md) on 2026-11-09: the two lines are items of the media library's catalog of animations.

## Request

"הצורה הזו צריכה להתנהג כ"קו" עם אנימציה (כלומר ללא מרובע חוסם, הגדלה של הקצוות מגדילה את הצורה וכו' (בדיוק כמו שמוגדר קו מעוגל)"

A picture came with it: the boxes on a path of ADR-127, selected, with the eight handles of a box around it.

## Context

- An animation of ADR-127 is an `svg` element: a picture that moves by itself. It is selected by its box. Resizing it scales the whole drawing, so a longer path also gets larger boxes and thicker dashes. Its path cannot be bent, and its ends cannot be placed on what it joins.
- A `line` element is selected by its points. Each point has a handle (`data-line-point`), and the line has no resize box, only its turn handle. A curved line with two points is the S of the picture (`linePath`, `curve: 'curved'`).
- Two of the 18 animations are a line with something running along it: the boxes on a path (`conveyor`) and the flowing connector (`flowArrow`). The others are made of many parts, or are not lines.

## Decision

- **A line can flow: `flow`, a field of `LineElement`** (`LineFlow` in `packages/model/src/schema/elements.ts`). It has a `speed` in slide pixels a second, a `rider` (`box`, `dot`, or none: the dashes alone), a `count` of riders (1 to 12, default 3), a `size` (a rider's longest side; by default in proportion to the line's width), a `color` (by default the line's) and `reverse`. `LINE_FLOW_DEFAULTS` holds the default speed (80) and count. The dashes and the riders go at the same speed, so the boxes move with the dashes, as on a belt. The line keeps its points, so the flow follows any change of them.
- **The renderer** (`packages/renderer/src/flow.tsx`) draws the flow inside the line's own `svg`. It uses two CSS animations that never end. The stroke's `stroke-dashoffset` moves by one period of its dash pattern each round. Each rider goes along the line's own path (`offset-path: path(...)`, `offset-rotate: auto`), fades in as it sets out and fades out as it arrives, so it never stands on a head. The riders are spaced evenly by negative delays. The length of the path (`pathLength`) is measured from the path data `linePath` writes, so a round takes length ÷ speed. The keyframes (`slidr-flow`, `slidr-ride`) join the ambient keyframes of ADR-128 (`AMBIENT_KEYFRAMES`). A slide writes them once if it has such a line (`hasAmbient`). Because these are CSS animations, not SMIL, whatever holds a page's animations holds them too: a show's black screen, a still tile of Elements. A rider is a rounded box or a dot with a ring in the slide's ground (`bg`), which sets it apart from the dashes.
- **The two animations are lines now** (`motionPieces.ts`). `MotionPiece` is either a `PicturePiece` (an `svg`, as before) or a `LinePiece`: points, stroke, heads, curve and flow, in the theme's tokens. The boxes on a path are a curved line of two points, 380 by 160. Its dashes are in `secondary`, and four boxes in `text` ride it at 90 px/s. The flowing connector is a curved line of three points through an arc, with a dot at its start and a triangle at its end. Its dashes flow at 40 px/s. Both keep their ids, names, groups and places in the collection. In a deck that reads from the right, a line is drawn from its right end, as a new line is (`newLine`), and is not mirrored. `motionElement` builds either kind. `motionPictures` lists the pictures alone, for what only a picture has: its markup and its speed (`pieceOf`, `pieceMarkup`). A line piece's tile scales its points, width and pace, so it looks and moves on the tile as on a slide.
- **Row B's Motion tool** (`MotionTool.tsx`) shows **Along the line** for any selected line. Its four buttons are None, Dashes, Boxes and Dots. Below them are **Speed** (Slow, Medium, Fast: 40, 80, 160 px/s), **Pixels per second**, **Direction** (To the end, To the start), and for riders **How many**, **Size** and **Colour**. Choosing Dashes on a solid line also makes it dashed, in the same undo step, or nothing would be seen to move. A choice is one undo step, and a drag is one step. The repeating motion of ADR-128 stays below, for a line as for any element. The tool's icon is unchanged.
- **Strings** in all sixteen languages of the interface (`elements` namespace: `motion.flow.*`).

## Consequences

- The boxes on a path and the flowing connector are selected, dragged and bent as any curved line: by their points, with no box around them. A longer line gets more path, not larger boxes or thicker dashes. Their width, dash, heads and curve are the line tools of row B. Paste style carries a line's heads and curve, not its flow.
- Any line can flow, not just those of Elements: a connector drawn with the Insert menu can carry boxes as well.
- An `svg` conveyor or connector put on a slide before this record still draws and moves as it did. It is no longer recognized as an animation of Elements, so the Motion tool does not show its **Animation speed**.
- A slide with nothing on it but such a line gets L16's finding ("No visual element") besides L07's: the design check counts a line as a connector, not as a visual. As a picture it counted as one.
- The PowerPoint export writes the line, still. The dashes do not flow and the riders are not there.
- The agent sees `flow` in the schema of a line. Its tool descriptions do not mention it. The listing size budget of `element_add` was raised by 0.5 KB.
- Under `prefers-reduced-motion` the theme's rule shortens these animations as it does every other animation of the app's page.

## Verification

- Unit tests: `motion.test.ts` checks that both pieces land as valid `line` elements whose points span their frame, in theme tokens, dashed and flowing. It checks that a deck reading from the right draws the line from its other end, not mirrored, and that a piece is a copy of the catalogue's. The checks of the pictures (ADR-127, ADR-128) now run over `motionPictures`. `listing.test.ts` of agent-tools passes with the new budget. `translations.test.ts` passes.
- In Edge (`packages/renderer/src/flow.browser.test.tsx`, 4): `pathLength` matches the engine's `getTotalLength` for straight, elbow and curved lines. The dashes move one period a round, toward the end. Four riders each go the path the stroke is drawn with, a quarter apart: within 3 pixels of `getPointAtLength` at 30% of their round. A mirrored line with a dot going back keeps the dot on the line. A line without a flow runs nothing and writes no keyframes. `motion.browser.test.tsx` draws both pieces as lines, not pictures, in the theme's colour, with their dashes flowing and the conveyor's four boxes riding. `packages/html-export/src/ambient.browser.test.ts`: an exported file carries the two keyframes once, and the line's dashes and three riders run there along their path. The renderer and html-export browser suites pass whole (16 files, 135 tests).
- End to end in Edge (`e2e/elements-motion.spec.ts`, 5): the flowing connector lands as a line drawn in the reading direction. The boxes on a path land as a line, in one undo step, with two point handles and no resize handle. Its dashes flow and four boxes run on the stage. Dragging its end 120 pixels out makes the line wider and taller with the same flow. The Motion tool shows Boxes pressed and changes them to dots, to dashes alone (no riders on the stage), and to nothing, and undo brings the flow back. Screenshots in English and Hebrew were looked at. In Hebrew both lines start at their right end.
- Type check of the desktop app: no errors in the files of this record. It reports two errors in `desktop/src/elements/zz-perf-scratch.browser.test.tsx`, which is not part of it. ESLint and Prettier pass on the changed files.
- In the full unit suite (3401 of 3408), the failures that remain are outside this record: `designs.test.ts` (4), `ai/look.test.ts`, the template round trip of `builtin.test.ts`, and `designRules.test.ts`, whose one violation is the inline `rowGap` of `collections.tsx` that ADR-128 recorded.

## Open for the user

- Whether other line-like animations of ADR-127, the drawn arrow, the circuit trace and the heartbeat, should become lines too. Their motion is not a flow along the line: the arrow draws itself, and the trace and the heartbeat send a light along with a trail.
- Whether a line that flows should count as a visual in the design check (L16).
- Whether the PowerPoint export should write the flow, for example as an emphasis effect repeated until the end of the slide.
- Whether the agent should be told about `flow` in its tools.
