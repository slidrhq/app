import type { Point, ShapeElement } from '@slidr/model';
import {
  adjustDefaults,
  adjustHandles,
  adjustTo,
  outlineHandle,
  outlineWidthTo,
  type AdjustHandle,
} from '@slidr/renderer';
import type { Patch } from './groups';

/*
 * The yellow handles of a shape on the Stage: one for each value its preset has (ADR-133), then,
 * on a shape with an outline, the one that sets how thick the outline is (ADR-137). They are one
 * row, which a drag, the menu and Tab treat alike.
 */

/** The handles of the preset's own values. */
function presetHandles(shape: ShapeElement): AdjustHandle[] {
  const { geometry, frame } = shape;
  return geometry.kind === 'preset'
    ? adjustHandles(geometry.preset, frame.w, frame.h, geometry.adjust)
    : [];
}

/** The outline handle of a shape with an outline to see. */
function ownOutlineHandle(shape: ShapeElement): AdjustHandle | undefined {
  const { stroke, frame } = shape;
  return stroke && stroke.width > 0
    ? outlineHandle(shape.geometry, frame.w, frame.h, stroke.width)
    : undefined;
}

/** Every handle of a shape: its preset's, then its outline's. */
export function shapeHandles(shape: ShapeElement): AdjustHandle[] {
  const outline = ownOutlineHandle(shape);
  return outline ? [...presetHandles(shape), outline] : presetHandles(shape);
}

/** Where the outline handle is among a shape's handles; undefined for a shape without one. */
export function outlineHandleIndex(shape: ShapeElement): number | undefined {
  return ownOutlineHandle(shape) ? presetHandles(shape).length : undefined;
}

/** Whether the Stage sets how thick the shape's outline is, by its handle. */
export const hasOutlineHandle = (shape: ShapeElement): boolean =>
  outlineHandleIndex(shape) !== undefined;

/**
 * The shape with handle `index` brought as near `at` (in the shape's own pixels) as it goes;
 * undefined when nothing changes.
 */
export function shapeHandlePatch(shape: ShapeElement, index: number, at: Point): Patch | undefined {
  const { geometry, frame, stroke } = shape;
  if (index === outlineHandleIndex(shape)) {
    const width = outlineWidthTo(geometry, frame.w, frame.h, at);
    if (!stroke || width === undefined || width === stroke.width) return undefined;
    return { stroke: { ...stroke, width } };
  }
  if (geometry.kind !== 'preset') return undefined;
  const adjust = adjustTo(geometry.preset, index, frame.w, frame.h, geometry.adjust ?? [], at);
  // What it has now, its defaults filled in as the renderer draws it.
  const now = adjustDefaults(geometry.preset)?.map((d, i) => geometry.adjust?.[i] ?? d);
  if (!adjust || adjust.every((v, i) => v === now?.[i])) return undefined;
  return { geometry: { ...geometry, adjust } };
}
