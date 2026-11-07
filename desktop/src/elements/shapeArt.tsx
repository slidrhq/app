import { Fragment, useMemo } from 'react';
import { ambientAnimation, presetPath } from '@slidr/renderer';
import { cx } from '@slidr/ui';
import { CARD_GLYPH } from '../objects/card';
import { GLYPH_BOX, lineGlyphs, shapeGlyph, type LineKind } from '../objects/shapes';
import { motionShapePreset, type MotionShape } from './motionShapes';

/* Shape and line previews use neutral black. The separate card preview keeps its accent ink. */

/** An ink, from the lit corner of a drawing to its far one. */
const INKS = {
  violet: ['#b49bff', '#6d28d9'],
  pink: ['#fda4cf', '#db2777'],
  teal: ['#5eead4', '#0d9488'],
  orange: ['#fcd34d', '#f97316'],
  blue: ['#7cc4ff', '#2563eb'],
  indigo: ['#a5b4fc', '#4f46e5'],
} as const;

export type Ink = keyof typeof INKS;

/** The same ink across the whole glyph box: a straight line has a box of no height to span. */
const boxPaint = (ink: Ink) => `url(#elements-ink-${ink}-box)`;
const shadow = (ink: Ink) => `url(#elements-ink-${ink}-shadow)`;

/** Room around the glyph box for a shadow, in the units of the box. */
const SHADOW_ROOM = 6;

/**
 * The inks, once for the collection: every picture of it paints with them by name. Not hidden
 * with `display`, which would take the inks from the pictures as well.
 */
export function ShapeInks() {
  return (
    <svg aria-hidden className="pointer-events-none absolute size-0">
      <defs>
        {(Object.keys(INKS) as Ink[]).map((ink) => {
          const [lit, far] = INKS[ink];
          const stops = (
            <>
              <stop offset="0" stopColor={lit} />
              <stop offset="1" stopColor={far} />
            </>
          );
          return (
            <Fragment key={ink}>
              <linearGradient id={`elements-ink-${ink}`} x1="0" y1="0" x2="1" y2="1">
                {stops}
              </linearGradient>
              <linearGradient
                id={`elements-ink-${ink}-box`}
                gradientUnits="userSpaceOnUse"
                x1="0"
                y1="0"
                x2={GLYPH_BOX}
                y2={GLYPH_BOX}
              >
                {stops}
              </linearGradient>
              <filter
                id={`elements-ink-${ink}-shadow`}
                filterUnits="userSpaceOnUse"
                x={-SHADOW_ROOM}
                y={-SHADOW_ROOM}
                width={GLYPH_BOX + 2 * SHADOW_ROOM}
                height={GLYPH_BOX + 2 * SHADOW_ROOM}
              >
                <feDropShadow
                  dx="0"
                  dy="1"
                  stdDeviation="0.9"
                  floodColor={far}
                  floodOpacity=".32"
                />
              </filter>
            </Fragment>
          );
        })}
      </defs>
    </svg>
  );
}

const box = `0 0 ${GLYPH_BOX} ${GLYPH_BOX}`;
const picture = 'overflow-visible';

/** A shape of the library in neutral black, matching its outline on the slide. */
export function ShapeArt({ preset, className }: { preset: string; className?: string }) {
  const glyph = useMemo(() => shapeGlyph(preset), [preset]);
  if (!glyph) return null;
  return (
    <svg aria-hidden viewBox={box} className={cx(picture, className)}>
      <path
        d={glyph.d}
        transform={`translate(${glyph.x} ${glyph.y})`}
        fill={glyph.closed ? '#111111' : 'none'}
        stroke="#111111"
        strokeWidth={glyph.closed ? 0 : 1.7}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A line of the Insert menu. `flip` draws it as a deck that reads from the right gets it. */
export function LineArt({
  kind,
  flip,
  className,
}: {
  kind: LineKind;
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg aria-hidden viewBox={box} className={cx(picture, className)}>
      <path
        d={lineGlyphs()[kind]}
        transform={flip ? `translate(${GLYPH_BOX} 0) scale(-1 1)` : undefined}
        fill="none"
        stroke="#111111"
        strokeWidth="1.9"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** A card: a sheet with its accent along the top and two lines of text, the heading shorter. */
export function CardArt({
  ink,
  flip,
  className,
}: {
  ink: Ink;
  flip?: boolean;
  className?: string;
}) {
  return (
    <svg aria-hidden viewBox={box} className={cx(picture, className)}>
      <path d={CARD_GLYPH.box} fill="#ffffff" filter={shadow(ink)} />
      <path d={CARD_GLYPH.accent} fill={boxPaint(ink)} />
      <path
        d={CARD_GLYPH.lines}
        transform={flip ? `translate(${GLYPH_BOX} 0) scale(-1 1)` : undefined}
        fill="none"
        stroke="#c5c3d1"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

/** The width of an outline in a tile's glyph, as `LineArt` draws a line. */
const GLYPH_OUTLINE = 1.7;

/**
 * An animated shape drawn small, in the neutral black of the other shapes: filled, or its
 * outline whole or in dashes. While `playing`, it moves as it does on a slide, over a reach
 * scaled down with it, so a float stays in its tile.
 */
export function MotionShapeArt({
  shape,
  rtl,
  playing,
  className,
}: {
  shape: MotionShape;
  rtl: boolean;
  playing: boolean;
  className?: string;
}) {
  const glyph = useMemo(() => motionGlyph(shape, rtl), [shape, rtl]);
  if (!glyph) return null;
  // As large against the others as it lands on a slide: the blinking dot is small.
  const size = Math.max(0.5, Math.min(1, shape.side / 260));
  const { ambient } = shape;
  const motion =
    ambient.kind === 'float'
      ? { ...ambient, amount: ((ambient.amount ?? 16) * 18) / shape.side }
      : ambient;
  const outlined = shape.look !== 'fill';
  return (
    <svg aria-hidden viewBox={box} className={cx(picture, className)}>
      <g style={playing ? ambientAnimation(motion) : undefined}>
        <path
          d={glyph.d}
          transform={`translate(12 12) scale(${size}) translate(${glyph.x - 12} ${glyph.y - 12})`}
          fill={outlined ? 'none' : '#111111'}
          stroke={outlined ? '#111111' : 'none'}
          strokeWidth={outlined ? GLYPH_OUTLINE / size : 0}
          strokeDasharray={shape.look === 'dashed' ? `${2.4 / size} ${2 / size}` : undefined}
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </g>
    </svg>
  );
}

/** The longest side of a glyph in its box of 24, as the shapes of the library are drawn. */
const GLYPH_INK = 18;

/**
 * The glyph of an animated shape: the library's, or in proportions of its own (a square of the
 * rounded box, which the library draws wide).
 */
function motionGlyph(shape: MotionShape, rtl: boolean) {
  const preset = motionShapePreset(shape, rtl ? 'rtl' : 'ltr');
  if (!shape.aspect) return shapeGlyph(preset);
  const [w, h] =
    shape.aspect >= 1
      ? [GLYPH_INK, GLYPH_INK / shape.aspect]
      : [GLYPH_INK * shape.aspect, GLYPH_INK];
  const path = presetPath(preset, w, h);
  return path && { ...path, x: (24 - w) / 2, y: (24 - h) / 2 };
}
