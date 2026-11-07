# ADR-137 — The thickness of a shape's outline, by a handle

Status: Implemented on 2026-11-06 in the working tree; **not committed** at the time of this record.

## Request

"שינוי עובי צריך להיות באמצעות מעויין צהוב קטן, לא בהגדרות"

Two pictures came with it: a circle drawn by a dashed outline alone, its thickness set by the Width slider of the Outline popover, beside a ring (`donut`) whose thickness its yellow handle sets (ADR-133).

## Context

- A shape's outline is drawn inside its edge, as a border is: a box (`rect`, `roundRect`, `ellipse`) by a CSS border or an inset shadow (`BoxStroke`), any other path by a stroke twice as wide clipped to the path (`PathStroke`, `packages/renderer/src/elements.tsx`). An outline `w` thick ends where a point inside the shape is `w` from its edge.
- The adjustment handles of ADR-133 set the values of a preset. A circle has none, so a ring and a circle drawn by its outline, which look alike, were made thicker in two different places.

## Decision

- **A handle for the outline** (`outlineHandle` and `outlineWidthTo` in `packages/renderer/src/outlineHandle.ts`): a yellow diamond on the inner edge of the outline of every closed shape that has one, presets and paths alike. It stands at the height of the shape's middle, where the edge crosses it furthest to the right, and runs in to the left. A drag sets the thickness to how far the handle is from the edge, in whole pixels, from 1 up to where the outline fills the shape there (half the shorter side of a box, half the ring of a ring). A slanted edge or a corner is measured across it, as the outline is drawn, so the handle stays on the inner edge of a triangle, a star or a heart.
- **The right side** keeps it clear of the handles of the presets' own values; none of them stands there, and the ring's is on its left.
- **Open outlines** (brackets, braces, an open path) have no inside to go into, and no handle: their thickness stays in the popover. So does that of a line, of an image's border, and of several elements together.
- **One row of handles.** The outline handle comes after the preset's own (`shapeHandles` in `desktop/src/stage/shapeHandles.ts`), so a drag, Escape, undo, **Adjust shape** in the menu, Tab and the arrows work for it as ADR-133 has them for the others. While it is dragged the thickness shows under the shape ("16 px"), as the size does while a shape is resized. The screen reader hears "Outline thickness handle: 16 px. The arrows move it." (`stage:at.outline`, in all sixteen languages).
- **Not in the popover.** The Outline popover of one shape that has the handle no longer offers Width (`width` of `StrokeEditor`); its style, colour, ends and joins stay there.
- **Paths read as SVG reads them.** `flattenPath` (`geometry.ts`) turns a path into the points it draws, arcs and curves cut into short pieces, to measure it. The pairs after a move are now read as lines, as SVG reads them, in every reader of path data (`segments`): `transformPath` had turned them into moves.

## Consequences

- A circle drawn by its outline is made thicker the way a ring is.
- The thickness of one shape's outline can no longer be typed; ADR-133's open point (a number for a handle) now covers it too. A shape whose outline is too thick for the handle to reach keeps it until the handle is dragged.
- The Stage dev page (`/dev/stage.html?deck=stage&slide=4`) has a dashed circle, and `desktop/e2e/stage-adjust.spec.ts` drags its handle, and in the app checks the popover and the keyboard. `outlineHandle.test.ts` holds the handle to the inner edge of every closed preset.
