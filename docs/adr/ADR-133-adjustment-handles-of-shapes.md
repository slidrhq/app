# ADR-133 — Adjustment handles of shapes

Status: Implemented on 2026-11-05 in the working tree; **not committed** at the time of this record.

## Request

"אני רוצה יותר שליטה על הצורות, למשל במקרה הנ"ל יכולת לקבוע את עובי הקו (באמצעות "נקודת עובי" שניתן להזיז)"

A picture came with it: a selected ring (`donut`) on the Stage, with its eight resize handles and its rotation handle, and nothing to set how thick the ring is.

## Context

- A preset shape already has values that shape it: `geometry.adjust` (`packages/model/src/schema/elements.ts`), fractions that `packages/renderer/src/geometry.ts` documents per preset. The ring's thickness, the corner of a rounded rectangle, the head and the shaft of an arrow, the inner radius of a star, the tail of a speech bubble, and so on. The renderer draws them, the PowerPoint export writes them and the import reads them.
- Nothing in the editor set them, except the corner of a rounded rectangle, which row B's corner control sets as a percentage (`radiusControl` in `desktop/src/objects/effects.ts`). A ring was as thick as it was inserted.
- Other editors put a yellow handle on such a value, on the part of the shape it sizes.

## Decision

- **Where the handles are** (`packages/renderer/src/adjustHandles.ts`, beside the geometry it follows). `adjustHandles(preset, w, h, adjust)` gives the handles of a preset at a size: each one's point in the shape's own pixels, before it is mirrored, and the way it runs. `adjustTo(preset, index, w, h, adjust, p)` gives the values that bring handle `index` as near the point `p` as it goes, the values of the other handles kept. `adjustDefaults` gives what the preset is drawn with when it has no values; a test holds it to the fallbacks of `geometry.ts`.
- **One handle for each value**, on the part it sizes:
  - ring and frame: the inner edge, at the height of the middle;
  - rounded rectangle: where the top left corner ends, on the top edge;
  - triangle: its apex; parallelogram and trapezoid: the top left corner;
  - stars: the inner radius, on the upright line through the centre;
  - plus: the inner corner of the top arm and the left one;
  - arrows (four ways, and the double one): the corner of the head's base, for its length, and the edge of the shaft where it meets the head, for its thickness;
  - chevron and pentagon arrow: the corner where the point begins;
  - speech bubbles: the tip of the tail, which goes anywhere (two values);
  - brackets: where the corner ends, as deep as half the height.
  The braces, the heart, the polygons, the rectangle, the ellipse and the shapes of `extraShapes.ts` have no values, and so no handles.
- **A handle slides along its way.** A drag takes the value whose point is nearest the pointer, within the value's range: the handle follows along its own path however the pointer wanders, and stops at either end. The tail of a bubble follows the pointer itself.
- **On the Stage** (`AdjustHandles` in `desktop/src/stage/overlays.tsx`): a yellow diamond, which tells it from the white resize handles and from a line's points in the accent colour, with a resize cursor along its way. It shows for one selected shape that is not locked, when its resize handles show, and lies over them. A handle that would lie on a resize handle (a triangle's apex lies on the top edge's bar) is drawn 18 screen pixels in from it, towards the middle of the shape, and the drag counts from where the handle really is, so it does not jump. While it is dragged it is lit in the accent colour.
- **A drag is one undo step** (`adjust` gesture in `desktop/src/stage/Stage.tsx`); Escape during the drag puts the shape back. A press that changes nothing writes nothing. The shape keeps every value its preset has once a handle is moved, the others at their defaults.
- **The keyboard** (UI-06), as for the points of a line: the right-click menu of a shape that has handles has **Adjust shape**, which takes the keyboard to its first handle (`adjust` in `stageKeys`, `{ type: 'adjust' }` among the Stage's commands). Tab and Shift+Tab go from one handle to the next, past either end out of the Stage; the arrows move the handle a slide pixel along its way, ten with Shift, and an arrow across its way does nothing; a burst of presses is one undo step. Enter and Escape leave the handles; the selection stays. Enter on a shape still opens its text, so the handles are reached from the menu only. The screen reader hears "Adjustment handle 1 of 2. The arrows move it." (`stage:at.adjust`).
- **Strings** in all sixteen languages of the interface: `stage:menu.adjust`, `stage:at.adjust`, and `stage:keys.part`, which now names the handles too.

## Consequences

- Every value the renderer already had for a preset can now be set by hand. The corner of a rounded rectangle has two ways, its handle and row B's control, which write the same value.
- No change to the model, the renderer's drawing, the export or the agent: they already carried `adjust`. The agent sets the values with `element_update` as before.
- The Stage dev page (`/dev/stage.html?deck=stage&slide=4`) has a slide of shapes with handles, and `desktop/e2e/stage-adjust.spec.ts` drives them: a ring, an arrow, a turned and mirrored ring, Escape during a drag, and the keyboard from the menu in the app.
- Open: a handle shows no number while it is dragged (the size and the angle do), and a value cannot be typed in. Row B could gain a field for each value, named by what it sizes, in sixteen languages.
- Open: the shapes of `extraShapes.ts` take no values; giving them some is a change to each of their drawings.
