# ADR-128 — Motion that repeats, and animated shapes

Status: Implemented on 2026-11-05 in the working tree; **not committed** at the time of this record. It follows [ADR-127](ADR-127-animations-and-backgrounds-in-elements.md) and answers its open question about speed. Superseded in part by [ADR-138](ADR-138-animations-and-backgrounds-from-the-library.md) on 2026-11-09: the animated shapes are listed, and named, by the media library.

## Request

"זה כיווץ כל צורות אנימציה:
1. כדאי שגם בצורות הן יופיעו
2. רוצה שתהיה גם אנימציה בסיסית (סיבוב עיגול, פוליגון)
3. רוצה שאפשר יהיה לשלוט ברכיבי הבסיסי (צבע וכו')
4. רוצה שיהיו פרמטרים לאנימציה (למשל מהירות, קצב)"

Two pictures came with it: the turning hexagons and the orbit of ADR-127, each a single selected object.

## Context

- An animation of ADR-127 is an `svg` element whose markup moves by itself. It is one picture: its parts cannot be selected, its colours are six inks shared between parts (the Colours tool of row B lists them as hex codes), and its times are written in its markup, so its speed cannot be changed.
- The Shapes collection of Elements and row B's shape tools (fill, outline, corners, shadow, opacity) already give full control over a plain shape. Nothing could make a shape move except the steps of the Animations panel, which play once, in a show, on a click.
- Another session (slidr-11, ADR-129) gave the backgrounds of ADR-127 a speed at the same time, with the helpers of this record.

## Decision

- **Motion is a field of every element: `ambient`** (`AmbientMotion` in `packages/model/src/schema/elements.ts`). It is a motion the element repeats while it is shown, outside the slide's timeline: `spin`, `pulse`, `float`, `swing` or `blink`. It has a `duration` (milliseconds per round), a `rhythm` (`steady`, `smooth`, or `pause`: move in the first half of the round and rest in the second), `reverse` (counterclockwise, or a swing that sets out the other way), and an `amount` (a pulse grows by a share of its size, a float rises a number of slide pixels, a swing leans a number of degrees, a blink fades by a share of its opacity). `AMBIENT_DEFAULTS` holds each kind's own values. The field is named `ambient` because `loop` is already a field of video and audio. `AmbientMotion` is a named schema of the agent's JSON Schema, written once under `$defs` and not inside every element type.
- **The renderer** (`packages/renderer/src/ambient.ts`) draws the element's content inside a box of its own, in the element's flow and as large as the element, that runs a CSS animation without end. The box sits under the element's rotation and mirror, so a turn stays clockwise in a mirrored element, and a show's steps animate the element's own box beside it. How far a motion goes is a custom property of the box (`--slidr-ambient`), which the keyframes read. A slide that has such an element writes the keyframes once in a `<style data-slidr-ambient>`. So the motion plays on the stage, in the filmstrip, in a show and in an exported HTML file. A show's black screen already pauses every running animation of the stage, and this one with them. While the stage edits an element (its text, or a crop), the element stands still at rest.
- **Animated shapes** (`desktop/src/elements/motionShapes.ts`, 10 of them): plain shapes of the library, each with a motion. They are a turning dashed ring, hexagon, six-pointed star, octagon outline, a square that turns and rests, a beating circle and heart, a floating circle, a wiggling arrow, and a blinking dot. Every shape that turns is symmetric about the middle of its box, which it turns around. A shape with an odd number of corners would wobble. They are in the theme's tokens. The arrow points the way the deck reads. Their fill, outline, size and text are edited as any shape's.
- **Where they appear.** The Shapes collection opens with an **Animated shapes** group, before the library's groups, because its Basic group is long. Each tile is a glyph in the collection's black. It shows its kind of motion as a small icon, moves while the pointer or the keyboard is on it, and never when the system asks for less motion. The group's **All animations** button opens the Animations collection. That collection now begins with the same shapes as a **Animated shapes** group of slide tiles, held at rest, and the first screen's search finds them.
- **Row B's Motion tool** (`desktop/src/elements/MotionTool.tsx`), for any single element. It has six buttons for the kind (None, Spin, Pulse, Float, Swing, Blink). Below them: **Speed** (Slow, Medium, Fast: twice, once and half the kind's own round), **Seconds per round** as a slider and a number, **Rhythm**, **Direction** for a turn and a swing, and the reach of the motion with its unit. Its icon is the element's current motion. A choice is one undo step, a drag one step.
- **The speed of an animation of ADR-127.** Its picture names itself (`data-slidr-motion` on its root). The Motion tool shows **Animation speed** (×0.25 to ×4) above the rest, and draws the picture again from the catalogue at that speed: every time in it (SMIL's `dur` and `begin`, and the durations and delays of its stylesheet and `style` attributes) divided by the speed (`atSpeed`), with the speed written on the root (`data-slidr-speed`). Its colours stay where they were, so the element's replacements still hold. Markup is never sped up twice: it is always drawn from the catalogue. A picture put on a slide before this record is found by its element name (`animation-<id>`). `markupAtSpeed` and `pieceSpeed` serve the backgrounds of ADR-129 too.
- **Strings** in all sixteen languages of the interface (`elements` namespace: `motion.*`, `animatedShapes.*`, `animations.group.basic`, `history.motion`).

## Consequences

- An element can move by itself, without a script. The motion is CSS, and the deck holds only a few numbers.
- The PowerPoint export does not write the motion: there the element stands still. The PowerPoint emphasis effects Spin, Pulse, Teeter and Blink, repeated until the end of the slide, would carry it; that was not done.
- The agent sees the field in the schema of every element, without words of its own: its tool descriptions do not mention it yet.
- Three plain motions repeat what an animation picture can do (a turning ring, a ripple). The pictures stay, for what is made of many parts.
- The thumbnail of a slide in the filmstrip moves with its elements, as it already did for the pictures of ADR-127.
- Under `prefers-reduced-motion` the theme's own rule shortens every animation of the app's page, and the stage's motion with it.
- The listing size budgets of `agent-tools` were raised by 0.5 KB (`element_add`) and 1 KB (the whole listing).

## Verification

- Unit tests: `desktop/src/elements/ambient.test.ts` (10) checks the field on every kind of element and the animated shapes: plain shapes, in the theme's tokens, every kind of motion, outlines, the arrow by reading direction. It also checks the speed: every time divided and nothing else changed, for all 18 animations; the speed read back; the bounds; and an animation put on a slide before its picture named itself. `motion.test.ts` of ADR-127 was updated for the new group. In the renderer, `SlideRenderer.test.tsx` checks the box inside the element, under its rotation, for each kind, and keyframes once, and none without motion. `translations.test.ts` passes, and so do the model (304) and agent-tools (151) suites.
- In Edge (`ambient.browser.test.tsx`, 11): each of the ten animated shapes runs one CSS animation of its own round, moved early in the round and back at its end. The orbit at twice the speed runs every CSS animation of its picture in half the time. `packages/html-export/src/ambient.browser.test.ts`: an exported file carries the keyframes once and the element turns there, under its own rotation.
- End to end in Edge (`e2e/elements-ambient.spec.ts`, 4, and `elements-motion.spec.ts` updated): the Shapes collection opens with ten animated shapes, a hexagon lands selected in one undo step and turns on the stage, and **All animations** leads to them first among the animations. The Motion tool turns a plain circle, makes it fast, with pauses, counterclockwise; makes it float 40 pixels; takes the motion away; undo brings it back. It sets the orbit to twice its speed with its colours kept. The Hebrew interface shows the tool from the right, and the arrow points left. A square that turns stands still while its text is typed.
- Visual review of screenshots in English and Hebrew led to: the group moved to the top of the Shapes collection (the library's Basic group is long), the square drawn square in its tile, each tile's glyph sized as it lands, an icon of its kind of motion on each tile, and slide tiles held at rest (the blinking dot was at its faintest four seconds in).
- Type check of the desktop app (no errors), ESLint and Prettier on the changed files. The glyph of an animated shape is drawn in `shapeArt.tsx`, with the collection's other pictures. `designRules.test.ts` now exempts `motionKit.ts`, whose inks of ADR-127 stand for the theme's tokens. Its one other violation, an inline `rowGap` in `collections.tsx`, was there before this record.
- In the full unit suite, the failures that remain are outside this record: `designs.test.ts` (as in ADR-127), `ai/look.test.ts` and the template round trip of `builtin.test.ts` (31 templates where 32 are expected, from template work under way in the tree).
- With three workers beside other sessions' browsers, the e2e run of the Elements specs timed out in places; run one at a time, every test named above passed.

## Open for the user

- Whether the PowerPoint export should write the motion as repeated emphasis effects.
- Whether the agent should be told about `ambient` in its tools, and be able to choose a motion for what it makes.
- Whether several selected elements should take a motion together (the tool is for one element now).
- Whether a motion should be able to start late, so that several elements do not move in step.
