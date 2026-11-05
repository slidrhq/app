import type { AmbientMotion, ColorToken, Deck, Frame, ShapeElement } from '@slidr/model';
import { centredFrame, newShape } from '../objects/shapes';

/*
 * The animated shapes of Elements (ADR-128): a shape of the library that repeats a motion of its
 * own, a turning hexagon, a beating heart, a floating circle. Unlike the animations of ADR-127,
 * which are pictures, each is a plain shape: its fill, its outline, its size and its text are
 * edited as any shape's, and its motion (`ambient`) is edited in row B, as anything's can be.
 */

/** How a shape is painted: filled, or drawn as an outline, whole or in dashes. */
export type MotionShapeLook = 'fill' | 'outline' | 'dashed';

export interface MotionShape {
  id: string;
  /** The shape of the library it is. One that `reads` points toward the end of a line. */
  preset: string;
  /** Its longest side on the slide, in slide pixels. */
  side: number;
  /** Proportions of its own, in place of those the library gives the shape. */
  aspect?: number;
  look: MotionShapeLook;
  ink: Extract<ColorToken, 'primary' | 'secondary' | 'accent'>;
  ambient: AmbientMotion;
  /**
   * Whether it points the way a line runs, as an arrow does: to the right in a deck that reads
   * from the left, to the left in one that reads from the right.
   */
  reads?: boolean;
}

/** The outline of an outlined shape: thick enough to turn visibly, in whole pixels. */
const OUTLINE = 16;

/**
 * In the order the collections show them: what turns, then what beats, floats, swings and
 * blinks. Every shape that turns is symmetric about the middle of its box, which it turns around:
 * one with an odd number of corners would wobble as it went.
 */
export const MOTION_SHAPES: readonly MotionShape[] = [
  {
    id: 'ring',
    preset: 'ellipse',
    side: 260,
    look: 'dashed',
    ink: 'primary',
    ambient: { kind: 'spin', duration: 8000 },
  },
  {
    id: 'hexagon',
    preset: 'hexagon',
    side: 260,
    look: 'fill',
    ink: 'primary',
    ambient: { kind: 'spin', duration: 6000 },
  },
  {
    id: 'star',
    preset: 'star6',
    side: 260,
    look: 'fill',
    ink: 'accent',
    ambient: { kind: 'spin', duration: 9000 },
  },
  {
    id: 'octagon',
    preset: 'octagon',
    side: 260,
    look: 'outline',
    ink: 'secondary',
    ambient: { kind: 'spin', duration: 10000, reverse: true },
  },
  {
    id: 'square',
    preset: 'roundRect',
    side: 200,
    aspect: 1,
    look: 'outline',
    ink: 'primary',
    ambient: { kind: 'spin', duration: 3200, rhythm: 'pause' },
  },
  {
    id: 'pulse',
    preset: 'ellipse',
    side: 220,
    look: 'fill',
    ink: 'primary',
    ambient: { kind: 'pulse', duration: 2000 },
  },
  {
    id: 'heart',
    preset: 'heart',
    side: 220,
    look: 'fill',
    ink: 'accent',
    ambient: { kind: 'pulse', duration: 1400, rhythm: 'pause', amount: 0.16 },
  },
  {
    id: 'float',
    preset: 'ellipse',
    side: 200,
    look: 'fill',
    ink: 'secondary',
    ambient: { kind: 'float', duration: 3000, amount: 20 },
  },
  {
    id: 'arrow',
    preset: 'arrowRight',
    side: 260,
    look: 'fill',
    ink: 'primary',
    ambient: { kind: 'swing', duration: 2400, rhythm: 'pause', amount: 10 },
    reads: true,
  },
  {
    id: 'blink',
    preset: 'ellipse',
    side: 120,
    look: 'fill',
    ink: 'accent',
    ambient: { kind: 'blink', duration: 1600 },
  },
];

/** The preset a shape is drawn with in a deck that reads `dir`. */
export function motionShapePreset(shape: MotionShape, dir: 'ltr' | 'rtl'): string {
  return shape.reads && dir === 'rtl' ? shape.preset.replace('Right', 'Left') : shape.preset;
}

/**
 * An animated shape as a new element, in the theme's colours, in the middle of the slide beside
 * whatever already stands there. It has the proportions the library gives its shape.
 */
export function motionShapeElement(
  shape: MotionShape,
  deck: Deck,
  taken: readonly Frame[] = [],
): ShapeElement {
  const preset = motionShapePreset(shape, deck.meta.dir);
  const base = newShape(preset, deck.size);
  const [w, h] = shape.aspect ? [shape.aspect, 1] : [base.frame.w, base.frame.h];
  const scale = shape.side / Math.max(w, h);
  const size = { w: Math.round(w * scale), h: Math.round(h * scale) };
  const color = { token: shape.ink } as const;
  const paint: Pick<ShapeElement, 'fill' | 'stroke'> =
    shape.look === 'fill'
      ? { fill: { kind: 'solid', color } }
      : {
          fill: { kind: 'none' },
          stroke: {
            color,
            width: OUTLINE,
            join: 'round',
            ...(shape.look === 'dashed' ? { dash: 'dashed', cap: 'round' } : {}),
          },
        };
  // A closed shape of the library comes without an outline: the look decides it.
  return {
    ...base,
    ...paint,
    frame: centredFrame(size, deck.size, taken),
    ambient: { ...shape.ambient },
  };
}
