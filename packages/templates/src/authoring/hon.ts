import {
  CONTENT_LANGUAGES,
  type Background,
  type ContentLanguage,
  type Element,
  type Frame,
  type Layout,
  type Localized,
  type Theme,
} from '@slidr/model';
import { copyJson } from '../json';
import { mirrorLayout } from '../mirror';
import type { Template } from '../template';
import {
  assetTable,
  at,
  atEnd,
  drawing,
  pageNumber,
  place,
  points,
  rect,
  sampleSlides,
  solid,
  SURFACE,
  text,
  token,
  type SampleSlide,
  withObjects,
} from '../builtin/kit';
import { HON_COPY, type HonCopy } from './hon/copy';
import { picture } from './pictures';

const pictures = {
  homes: picture('honHomes'),
  street: picture('honStreet'),
  team: [1, 2, 3, 4].map((n) => picture(`honTeam${n}`)),
};

/**
 * Hon (capital): the slide is a sheet of security paper, printed the way money is. Guilloche
 * rosettes and braided bands as a geometric lathe engraves them, a windowed copper thread
 * through the paper, ascending serial numbers, bond coupons and their perforation, the ledger's
 * double rule and the double underline of a total, coins with reeded edges, and the foil seal of
 * a share certificate. Claret intaglio and aubergine ink on warm paper, banknote green for
 * growth, copper for the metal. For investor relations, quarterly and annual results, funds,
 * banks and budgets.
 *
 * No drawing holds a word, so one set of layouts reads in every language; the figures a drawing
 * holds (a serial number, the number on a coin) stand upright in both directions.
 */
const threadOn = (side: 'right' | 'left') =>
  [
    // The paper over the thread, but for its windows: where the thread comes to the surface.
    `repeating-linear-gradient(180deg, transparent 0 44px, color-mix(in srgb, var(--color-bg) 80%, transparent) 44px 96px) ${side} 54px top 0 / 10px 100% no-repeat`,
    // The thread: a strip of copper foil, lit along its middle.
    `linear-gradient(90deg, var(--color-accent), color-mix(in srgb, var(--color-accent) 30%, var(--color-surface)) 50%, var(--color-accent)) ${side} 54px top 0 / 10px 100% no-repeat`,
    'var(--color-bg)',
  ].join(', ');

const ground = (side: 'right' | 'left'): Background => ({
  fill: { kind: 'css', value: threadOn(side) },
});

export const honTheme: Theme = {
  id: 'hon',
  name: 'Capital',
  colors: {
    bg: '#f4efe7',
    surface: '#fcfaf5',
    text: '#2a1820',
    muted: '#6b5b61',
    primary: '#7d1d3f',
    secondary: '#2b6a50',
    accent: '#9e5c28',
    chart: ['#7d1d3f', '#2b6a50', '#c27a3c', '#2a1820', '#56708f', '#c9909f'],
  },
  // A serif of engraved lettering, with lining figures, for what is said aloud and for the
  // figures (Lora, with Frank Ruhl Libre for Hebrew), and a plain sans for what is read.
  fonts: {
    heading: { he: 'Frank Ruhl Libre', latin: 'Lora' },
    body: { he: 'Heebo', latin: 'Manrope' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 100,
      weight: 700,
      lineHeight: 1.06,
      letterSpacing: -1,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 58,
      weight: 700,
      lineHeight: 1.14,
      letterSpacing: -0.4,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 36, weight: 700, lineHeight: 1.25, color: { token: 'text' } },
    body: { font: 'body', size: 27, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: 0.3,
      color: { token: 'muted' },
    },
  },
  radius: 6,
  shadow: { x: 0, y: 16, blur: 40, color: { value: '#3b1626', alpha: 0.12 } },
  // Security paper with its thread: copper foil that comes to the surface in windows, down the
  // start edge of every slide.
  background: ground('right'),
  backgroundVariants: [
    SURFACE,
    // The paper alone, without its thread.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#2a1820';
const MUTED = '#6b5b61';
const CLARET = '#7d1d3f';
const GREEN = '#2b6a50';
const COPPER = '#9e5c28';
const PAPER = '#f4efe7';
const WHITE = '#fcfaf5';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [CLARET]: token('primary'),
  [GREEN]: token('secondary'),
  [COPPER]: token('accent'),
  [PAPER]: token('bg'),
  [WHITE]: token('surface'),
};

/** The faces a figure in a drawing is set in: the theme's heading family. */
const FIGURES = 'Lora, Frank Ruhl Libre, serif';

const TAU = Math.PI * 2;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings a left-to-right deck must not see mirrored: those with figures in them. Their
 * mirror moves them to the other side and leaves them as they are.
 */
const UPRIGHT = new Set<string>();

const upright = (id: string, frame: Frame, body: string) => {
  UPRIGHT.add(id);
  return art(id, frame, body);
};

/** A soft shadow under a drawing of paper or metal: a coupon, a seal. */
const lifted = (element: Element, y = 14, blur = 30, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#3b1626', alpha } } },
});

/** Part of a drawing seen through a window of its own: what runs past the window is cut. */
const win = (x: number, y: number, w: number, h: number, body: string) =>
  `<svg x="${r1(x)}" y="${r1(y)}" width="${r1(w)}" height="${r1(h)}">${body}</svg>`;

const stroke = (colour: string, width: number, opacity = 1) =>
  `stroke="${colour}" stroke-width="${width}"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''}`;

// ---------------------------------------------------------------------------------------------
// The geometric lathe: guilloche

/** A number of a path, as short as it is written: `.5` for 0.5, `-.5` for -0.5. */
const short = (v: number) => String(v).replace(/^(-?)0\./, '$1.');

/**
 * A path through points to the tenth of a pixel, each step after the first written from the
 * point before it, which keeps a dense curve short; `z` closes it.
 */
function trace(points: Iterable<readonly [number, number]>, close: boolean): string {
  let d = '';
  let px = 0;
  let py = 0;
  for (const [x, y] of points) {
    const X = Math.round(x * 10);
    const Y = Math.round(y * 10);
    if (!d) d = `M${short(X / 10)} ${short(Y / 10)}l`;
    else if (X !== px || Y !== py) {
      const dx = short((X - px) / 10);
      const dy = short((Y - py) / 10);
      d += `${d.endsWith('l') || dx.startsWith('-') ? '' : ' '}${dx}${dy.startsWith('-') ? '' : ' '}${dy}`;
    }
    px = X;
    py = Y;
  }
  return close ? `${d}z` : d;
}

/** A short name for a part of a drawing, from what it draws: the same part, the same name. */
function partId(markup: string): string {
  let h = 0x811c9dc5;
  for (let i = 0; i < markup.length; i++) {
    h ^= markup.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return `d_hon_part_${(h >>> 0).toString(36)}`;
}

/**
 * A line drawn once and placed again turned about (cx, cy) by each of `angles` (degrees): the
 * strands of a braid or of petals are the same curve turned by a share of a lobe.
 */
function turned(d: string, style: string, cx: number, cy: number, angles: number[]): string {
  const id = partId(d + style);
  return (
    `<path id="${id}" d="${d}" ${style}/>` +
    angles
      .map((a) => `<use href="#${id}" transform="rotate(${Math.round(a * 1000) / 1000} ${cx} ${cy})"/>`)
      .join('')
  );
}

/** A closed curve around (cx, cy), its radius at each angle given by `r`. */
function polar(cx: number, cy: number, r: (a: number) => number, steps: number): string {
  return trace(
    Array.from({ length: steps }, (_, i) => {
      const a = (i / steps) * TAU;
      const radius = r(a);
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
    }),
    true,
  );
}

/**
 * A braided ring: `strands` waves around a circle of radius `r`, each shifted along by a share
 * of a lobe, so that they cross one another as the lathe's lines do; drawn in `style`.
 */
function braidRing(
  cx: number,
  cy: number,
  r: number,
  amp: number,
  lobes: number,
  strands: number,
  style: string,
  perLobe = 7,
): string {
  const d = polar(cx, cy, (a) => r + amp * Math.sin(lobes * a), lobes * perLobe);
  const angles = Array.from({ length: strands - 1 }, (_, k) => (-360 * (k + 1)) / (strands * lobes));
  return turned(d, style, r1(cx), r1(cy), angles);
}

/** Interlaced petals between two radii: `petals` of them, `strands` times over, in `style`. */
function petals(
  cx: number,
  cy: number,
  r0: number,
  r1_: number,
  n: number,
  strands: number,
  style: string,
) {
  const d = polar(cx, cy, (a) => r0 + (r1_ - r0) * Math.abs(Math.cos((n / 2) * a)), n * 12);
  const angles = Array.from({ length: strands - 1 }, (_, k) => (-360 * (k + 1)) / (n * strands));
  return turned(d, style, r1(cx), r1(cy), angles);
}

/** The star a spirograph draws: a hypotrochoid of `p` lobes, closed after `q` turns. */
function spiro(cx: number, cy: number, size: number, p: number, q: number, depth: number) {
  const big = p;
  const small = q;
  const d = depth * q;
  const k = size / (big - small + d);
  const steps = p * q * 10;
  return trace(
    Array.from({ length: steps + 1 }, (_, i) => {
      const t = (i / steps) * TAU * q;
      const x = (big - small) * Math.cos(t) + d * Math.cos(((big - small) / small) * t);
      const y = (big - small) * Math.sin(t) - d * Math.sin(((big - small) / small) * t);
      return [cx + x * k, cy + y * k] as const;
    }),
    false,
  );
}

/** Waves along a line from (x, y) to the right: `strands` of them, each shifted by a share. */
function braidH(x: number, y: number, length: number, amp: number, period: number, strands = 3) {
  const half = period / 2;
  const n = Math.ceil(length / half) + 3;
  let d = '';
  for (let k = 0; k < strands; k++) {
    const start = x - period - (k / strands) * period;
    d += `M${r1(start)} ${r1(y)}q${r1(period / 4)} ${r1(-2 * amp)} ${r1(half)} 0${`t${r1(half)} 0`.repeat(n)}`;
  }
  return d;
}

/** Waves along a line from (x, y) downwards. */
function braidV(x: number, y: number, length: number, amp: number, period: number, strands = 3) {
  const half = period / 2;
  const n = Math.ceil(length / half) + 3;
  let d = '';
  for (let k = 0; k < strands; k++) {
    const start = y - period - (k / strands) * period;
    d += `M${r1(x)} ${r1(start)}q${r1(-2 * amp)} ${r1(period / 4)} 0 ${r1(half)}${`t0 ${r1(half)}`.repeat(n)}`;
  }
  return d;
}

/** A band of braided waves, `w` by `h`, cut at its ends. */
function band(x: number, y: number, w: number, h: number, colour: string, opacity = 0.8, strands = 3) {
  const vertical = h > w;
  const amp = (vertical ? w : h) * 0.3;
  const period = (vertical ? w : h) * 2.4;
  const width = Math.max(0.8, Math.min(1.3, (vertical ? w : h) / 14));
  const body = vertical
    ? braidV(w / 2, 0, h, amp, period, strands)
    : braidH(0, h / 2, w, amp, period, strands);
  return win(x, y, w, h, `<path d="${body}" ${stroke(colour, width, opacity)}/>`);
}

/**
 * A guilloche rosette of radius `r`: hairline rings, a braided outer ring, a braided ring in
 * the second ink, interlaced petals and a spirograph star at the heart. `detail` thins the
 * lobes for a small one.
 */
function rosette(
  cx: number,
  cy: number,
  r: number,
  o: { outer?: string; inner?: string; detail?: number; opacity?: number; reverse?: boolean } = {},
): string {
  const outer = o.outer ?? CLARET;
  const inner = o.inner ?? COPPER;
  const k = o.detail ?? 1;
  const op = o.opacity ?? 1;
  const lobes = (n: number) => Math.max(6, Math.round(n * k));
  const w = r1(Math.max(0.9, Math.min(1.5, r / 260)));
  const o1 = r1(op);
  const o2 = r1(op * 0.7);
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.965)}" fill="${outer}" fill-opacity="${r1(op * 0.04 * 100) / 100}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${inner}" fill-opacity="${r1(op * 0.06 * 100) / 100}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.53)}" fill="${WHITE}" fill-opacity="${r1(op * 0.7 * 100) / 100}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r)}" ${stroke(outer, r1(w * 1.6), o1)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.965)}" ${stroke(outer, w, o2)}/>` +
    // The outer braid, or with `reverse` cut white out of a solid ring of the ink, as a
    // banknote's border is.
    (o.reverse
      ? `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8825)}" ${stroke(outer, r1(r * 0.165), o1)}/>` +
        braidRing(cx, cy, r * 0.885, r * 0.055, lobes(54), 5, stroke(WHITE, w, 0.8))
      : braidRing(cx, cy, r * 0.885, r * 0.055, lobes(54), 5, stroke(outer, w, o1))) +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" ${stroke(outer, w, o2)}/>` +
    braidRing(cx, cy, r * 0.665, r * 0.1, lobes(30), 6, stroke(inner, w, o1), 8) +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.53)}" ${stroke(outer, w, o2)}/>` +
    petals(cx, cy, r * 0.2, r * 0.5, lobes(16), 4, stroke(outer, w, r1(op * 0.75))) +
    `<path d="${spiro(cx, cy, r * 0.19, 11, 4, 0.8)}" ${stroke(inner, w, o1)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.035)}" fill="${outer}"${op < 1 ? ` fill-opacity="${op}"` : ''}/>`
  );
}

/** A small rosette for a seal, a corner or a mark: fewer lines, so it reads small. */
function rosetteSmall(cx: number, cy: number, r: number, outer = CLARET, inner = COPPER) {
  const w = r1(Math.max(0.8, r / 36));
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r1(r)}" ${stroke(outer, r1(w * 1.4))}/>` +
    braidRing(cx, cy, r * 0.74, r * 0.12, Math.max(8, Math.round(r / 2.6)), 3, stroke(outer, w, 0.85), 8) +
    petals(cx, cy, r * 0.12, r * 0.5, 8, 2, stroke(inner, w)) +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.1)}" fill="${inner}"/>`
  );
}

/** A lozenge, the engraver's mark before a kicker; light on a dark field. */
function lozenge(id: string, frame: Frame, light = false): Element {
  const s = frame.w;
  const c = s / 2;
  const line = light ? WHITE : CLARET;
  return art(
    id,
    frame,
    `<path d="M${c} 1L${s - 1} ${c}L${c} ${s - 1}L1 ${c}Z" ${stroke(line, 1.4)}/>` +
      `<path d="M${c} ${r1(s * 0.27)}L${r1(s * 0.73)} ${c}L${c} ${r1(s * 0.73)}L${r1(s * 0.27)} ${c}Z" fill="${COPPER}"/>`,
  );
}

/** A double rule, the heavier line over the lighter, with a lozenge where it begins. */
function doubleRule(id: string, frame: Frame, colour = CLARET): Element {
  return art(
    id,
    frame,
    `<path d="M18 4H${frame.w}" ${stroke(colour, 1.8)}/><path d="M18 10H${frame.w}" ${stroke(colour, 0.9, 0.7)}/>` +
      `<path d="M7 1L13 7L7 13L1 7Z" fill="${colour}"/>`,
  );
}

/** A row of perforation, as between the coupons of a bond. */
const perforation = (w: number, y = 3, colour = INK, opacity = 0.4) =>
  `<path d="M3 ${y}H${r1(w - 3)}" ${stroke(colour, 3.2, opacity)} stroke-dasharray="0 9" stroke-linecap="round"/>`;

/**
 * A coin seen face on, `d` across: the reeded edge, the rim, a ring of beads and a fine
 * guilloche inside, the face left plain for its figure.
 */
function coin(d: number, x = 0, y = 0): string {
  const c = d / 2;
  const cx = r1(x + c);
  const cy = r1(y + c);
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r1(c - 1)}" fill="${COPPER}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(c - 3.5)}" ${stroke(WHITE, 4, 0.45)} stroke-dasharray="1.3 2.7"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(c - 7)}" fill="${WHITE}" ${stroke(COPPER, 1.5)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(c - 12.5)}" ${stroke(COPPER, 3.4)} stroke-dasharray="0 7.2" stroke-linecap="round"/>` +
    (d >= 100
      ? braidRing(x + c, y + c, c - 21, 2.2, Math.round(c / 3.2), 2, stroke(CLARET, 0.8, 0.55), 6)
      : '')
  );
}

/** A coin with its figure, for a numbered list: the figure reads the same in both directions. */
function coinBadge(id: string, frame: Frame, n: number): Element {
  const d = frame.w;
  return upright(
    id,
    frame,
    coin(d) +
      `<text x="${d / 2}" y="${r1(d / 2 + d * 0.15)}" text-anchor="middle" font-family="${FIGURES}" font-size="${r1(d * 0.42)}" font-weight="700" fill="${CLARET}">${n}</text>`,
  );
}

/**
 * A serial number as a banknote prints it: each figure a size larger than the one before it.
 */
function serial(figures: string, from: number, to: number, colour = CLARET): string {
  const count = figures.replace(/ /g, '').length;
  let x = 0;
  let i = 0;
  let out = '';
  for (const ch of figures) {
    if (ch === ' ') {
      x += from * 0.42;
      continue;
    }
    const size = from + ((to - from) * i) / Math.max(1, count - 1);
    out += `<text x="${r1(x + size * 0.3)}" y="${to}" text-anchor="middle" font-family="${FIGURES}" font-size="${r1(size)}" font-weight="700" fill="${colour}">${ch}</text>`;
    x += size * 0.6;
    i += 1;
  }
  return out;
}

/** A frame of braided bands around a box `w` by `h`, `edge` deep, a rosette on each corner. */
function braidedFrame(w: number, h: number, edge: number, colour: string, corner: number) {
  const inset = 1;
  const inner = inset + edge;
  return (
    `<rect x="${inset}" y="${inset}" width="${r1(w - inset * 2)}" height="${r1(h - inset * 2)}" ${stroke(CLARET, 1.6)}/>` +
    `<rect x="${inner}" y="${inner}" width="${r1(w - inner * 2)}" height="${r1(h - inner * 2)}" ${stroke(CLARET, 1)}/>` +
    band(inset + 2, inset + 2, w - (inset + 2) * 2, edge - 4, colour, 0.85) +
    band(inset + 2, h - inner + 2, w - (inset + 2) * 2, edge - 4, colour, 0.85) +
    band(inset + 2, inset + 2, edge - 4, h - (inset + 2) * 2, colour, 0.85) +
    band(w - inner + 2, inset + 2, edge - 4, h - (inset + 2) * 2, colour, 0.85) +
    corners(r1(inset + edge / 2), r1(w - inset - edge / 2), r1(h - inset - edge / 2), corner)
  );
}

/**
 * The rosettes on the corners of a frame: one drawn at (at, at), placed again at the other
 * three corners, `right` and `bottom` being where the far ones stand.
 */
function corners(at: number, right: number, bottom: number, r: number): string {
  const part = `<circle cx="${at}" cy="${at}" r="${r}" fill="${WHITE}"/>` + rosetteSmall(at, at, r);
  const id = partId(part);
  return (
    `<g id="${id}">${part}</g>` +
    [
      [right - at, 0],
      [0, bottom - at],
      [right - at, bottom - at],
    ]
      .map(([dx, dy]) => `<use href="#${id}" transform="translate(${r1(dx!)} ${r1(dy!)})"/>`)
      .join('')
  );
}

/**
 * A foil seal: a serrated disc of copper on two claret ribbons, a claret ring and a guilloche
 * heart. The ribbons hang `tails` below the middle.
 */
function seal(cx: number, cy: number, r: number, tails: number): string {
  const teeth = 44;
  const star = trace(
    Array.from({ length: teeth * 2 }, (_, i) => {
      const a = (i / (teeth * 2)) * TAU;
      const radius = i % 2 ? r * 0.93 : r;
      return [cx + Math.cos(a) * radius, cy + Math.sin(a) * radius] as const;
    }),
    false,
  );
  const ribbon = (side: -1 | 1) => {
    const x0 = cx + side * r * 0.18;
    const x1 = cx + side * r * 0.62;
    const top = cy + r * 0.3;
    const bottom = cy + tails;
    const w = r * 0.42;
    const notch = r * 0.2;
    return (
      `<path d="M${r1(x0)} ${r1(top)}L${r1(x1)} ${r1(top - 6)}L${r1(x1 + side * w * 0.42)} ${r1(bottom)}L${r1(x1 + side * w * 0.42 - side * w * 0.5)} ${r1(bottom - notch)}L${r1(x0 + side * w * 0.2)} ${r1(bottom - 6)}Z" fill="${CLARET}"/>` +
      `<path d="M${r1(x0 + side * w * 0.2)} ${r1(top + 30)}L${r1(x0 + side * w * 0.38)} ${r1(bottom - 30)}" ${stroke(WHITE, 1.2, 0.35)}/>`
    );
  };
  return (
    ribbon(-1) +
    ribbon(1) +
    `<path d="${star}Z" fill="${COPPER}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.86)}" ${stroke(WHITE, 1.4, 0.55)}/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.8)}" fill="${CLARET}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.74)}" ${stroke(WHITE, 3, 0.8)} stroke-dasharray="0 9" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.66)}" fill="${WHITE}"/>` +
    rosette(cx, cy, r * 0.6, { detail: r > 150 ? 0.8 : 0.45 })
  );
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const START = 136;
const END = 136;
const WIDTH = 1920 - START - END;

/** The kicker on its lozenge, and the title; without a kicker, the title on the lozenge. */
function head(name: string, width = 1100, lines = 2, kicker = true) {
  // Room for the leading a script may need beyond the theme's (`LEADING`).
  const title = at(START, 134, width, Math.round(58 * 1.3 * lines) + 4);
  if (!kicker) {
    return {
      placeholders: [place('p_title', 'title', at(START + 40, 104, width - 40, title.h), 'title')],
      decorations: [lozenge(`d_hon_${name}_lozenge`, at(START, 127, 22, 22))],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 34, 90, Math.min(900, width - 34), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [lozenge(`d_hon_${name}_lozenge`, at(START, 97, 22, 22))],
  };
}

/** The mark of the deck: a small seal, which the user may replace with a logo. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const c = s / 2;
  return drawing(id, frame, svg(s, s, rosetteSmall(c, c, c - 1.5)), PAINT, {
    role: 'logo',
    name: 'logo',
  });
}

/**
 * The foot of a content slide: the mark and the deck's name at the start; at the end a row of
 * perforation that runs to the slide's number, set in a numeral's cartouche as a banknote sets
 * its value.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 62, 966, 860, 36), 'caption')]
      : [],
    decorations: [
      mark(`d_hon_${name}_mark`, at(START, 961, 44, 44)),
      art(`d_hon_${name}_perforation`, atEnd(END + 122, 980, 500, 6), perforation(500)),
      art(
        `d_hon_${name}_cartouche`,
        atEnd(END, 958, 104, 50),
        `<path d="M16 1.5H88L102.5 25L88 48.5H16L1.5 25Z" ${stroke(CLARET, 1.6)}/>` +
          `<path d="M19 6H85L97 25L85 44H19L7 25Z" ${stroke(CLARET, 0.8, 0.6)}/>`,
      ),
      pageNumber(`d_hon_${name}_number`, atEnd(END, 965, 104, 36), 'caption', {
        color: token('primary'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A sheet of paper on the slide: a card. */
const card = (id: string, frame: Frame) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('primary', 0.22), width: 1.2 },
    effects: { radius: 4, shadow: { x: 0, y: 14, blur: 36, color: { value: '#3b1626', alpha: 0.1 } } },
  });

/** The braided band along the head of a card or a panel, `w` wide. */
const headBand = (id: string, frame: Frame, colour = CLARET) =>
  art(
    id,
    frame,
    `<rect x="0" y="0" width="${frame.w}" height="${frame.h}" fill="${colour}" fill-opacity=".07"/>` +
      band(0, 2, frame.w, frame.h - 4, colour, 0.75) +
      `<path d="M0 ${frame.h - 0.5}H${frame.w}" ${stroke(colour, 1, 0.5)}/>`,
  );

/** The two hairlines of a ledger's margin, down the start of a sheet. */
const ledgerRule = (id: string, frame: Frame) =>
  art(
    id,
    frame,
    `<path d="M1 0V${frame.h}M${frame.w - 1} 0V${frame.h}" ${stroke(CLARET, 1.2, 0.5)}/>`,
  );

// ---------------------------------------------------------------------------------------------
// Pictograms: line drawings, without a word

const LINE = (colour = INK, w = 2.6) =>
  `stroke="${colour}" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"`;

/** A balance, on the junction of the T-account. */
function balance(s: number): string {
  const c = s / 2;
  return (
    `<circle cx="${c}" cy="${c}" r="${c - 2}" fill="${WHITE}" ${stroke(CLARET, 2)}/>` +
    `<circle cx="${c}" cy="${c}" r="${c - 7}" ${stroke(CLARET, 0.8, 0.6)}/>` +
    `<path d="M${c} ${r1(s * 0.22)}V${r1(s * 0.72)}M${r1(s * 0.38)} ${r1(s * 0.72)}H${r1(s * 0.62)}M${r1(s * 0.24)} ${r1(s * 0.32)}H${r1(s * 0.76)}" ${LINE(INK, 2.4)}/>` +
    `<path d="M${r1(s * 0.24)} ${r1(s * 0.32)}L${r1(s * 0.15)} ${r1(s * 0.52)}M${r1(s * 0.24)} ${r1(s * 0.32)}L${r1(s * 0.33)} ${r1(s * 0.52)}M${r1(s * 0.76)} ${r1(s * 0.32)}L${r1(s * 0.67)} ${r1(s * 0.52)}M${r1(s * 0.76)} ${r1(s * 0.32)}L${r1(s * 0.85)} ${r1(s * 0.52)}" ${LINE(INK, 1.6)}/>` +
    `<path d="M${r1(s * 0.13)} ${r1(s * 0.52)}A${r1(s * 0.11)} ${r1(s * 0.07)} 0 0 0 ${r1(s * 0.35)} ${r1(s * 0.52)}ZM${r1(s * 0.65)} ${r1(s * 0.52)}A${r1(s * 0.11)} ${r1(s * 0.07)} 0 0 0 ${r1(s * 0.87)} ${r1(s * 0.52)}Z" fill="${COPPER}"/>` +
    `<circle cx="${c}" cy="${r1(s * 0.2)}" r="${r1(s * 0.04)}" fill="${CLARET}"/>`
  );
}

/** A row of houses on a baseline: the town, `colour` lines. */
function town(x: number, base: number, colour: string): string {
  const houses: [number, number, number][] = [
    [0, 38, 46],
    [44, 44, 66],
    [92, 36, 52],
    [132, 42, 40],
  ];
  return (
    houses
      .map(
        ([dx, w, h]) =>
          `<path d="M${x + dx} ${base}V${base - h}L${r1(x + dx + w / 2)} ${r1(base - h - w * 0.45)}L${x + dx + w} ${base - h}V${base}" ${LINE(colour, 2.2)}/>` +
          `<path d="M${r1(x + dx + w / 2 - 5)} ${base}V${base - 14}H${r1(x + dx + w / 2 + 5)}V${base}" ${LINE(colour, 1.6)}/>`,
      )
      .join('') + `<path d="M${x - 10} ${base}H${x + 186}" ${LINE(colour, 2.2)}/>`
  );
}

/** A coin on a path, `r` across its middle. */
const token_ = (x: number, y: number, r: number, fill: string, line: string, opacity = 1) =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r}" fill="${fill}" fill-opacity="${opacity}" ${stroke(line, 1.6, opacity)}/>` +
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r * 0.55)}" ${stroke(WHITE, 1.2, opacity * 0.8)}/>`;

/** The profit that leaves: coins along a dashed path out of the town, off the far edge. */
const leaving = (w: number, h: number) =>
  town(14, h - 10, MUTED) +
  `<path d="M190 ${h - 70}C240 ${h - 120} 280 ${h - 128} ${w - 8} ${h - 136}" ${stroke(MUTED, 2.4, 0.8)} stroke-dasharray="4 7" stroke-linecap="round"/>` +
  `<path d="M${w - 22} ${h - 146}L${w - 6} ${h - 136}L${w - 22} ${h - 125}" ${LINE(MUTED, 2.4)}/>` +
  token_(214, h - 92, 11, MUTED, MUTED, 0.55) +
  token_(254, h - 117, 9, MUTED, MUTED, 0.4) +
  token_(292, h - 128, 7, MUTED, MUTED, 0.28);

/** The profit that stays: coins on a loop that leaves the town and comes back into it. */
const returning = (w: number, h: number) =>
  town(14, h - 10, INK) +
  `<path d="M180 ${h - 64}C214 ${h - 150} ${w - 16} ${h - 150} ${w - 22} ${h - 78}C${w - 28} ${h - 30} 250 ${h - 18} 204 ${h - 36}" ${stroke(CLARET, 2.6)} stroke-linecap="round"/>` +
  `<path d="M220 ${h - 24}L202 ${h - 36}L218 ${h - 50}" ${LINE(CLARET, 2.6)}/>` +
  token_(214, h - 112, 11, COPPER, CLARET) +
  token_(276, h - 136, 11, COPPER, CLARET) +
  token_(w - 34, h - 108, 11, COPPER, CLARET) +
  token_(w - 74, h - 34, 11, COPPER, CLARET);

/** The glyphs of the closing's lines: a ballot, a calendar, a bank's portico. */
const CLOSING_GLYPHS = [
  `<rect x="5" y="15" width="26" height="18" rx="2" ${LINE(INK, 2.2)}/><path d="M12 15V5H24V15M10 24H26" ${LINE(INK, 2.2)}/><path d="M14 9L17 12L22 6" ${LINE(CLARET, 2.2)}/>`,
  `<rect x="4" y="7" width="28" height="25" rx="3" ${LINE(INK, 2.2)}/><path d="M4 14H32M11 4V10M25 4V10" ${LINE(INK, 2.2)}/><circle cx="24" cy="23" r="3" fill="${CLARET}"/>`,
  `<path d="M3 13L18 4L33 13Z" ${LINE(INK, 2.2)}/><path d="M7 16V28M14 16V28M22 16V28M29 16V28M3 32H33" ${LINE(INK, 2.2)}/><circle cx="18" cy="9.5" r="1.8" fill="${CLARET}"/>`,
];

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of notes, tickets, stops, steps and people. */
const cards3 = [START, START + 561, START + 1122];
const stops4 = [START, START + 418, START + 836, START + 1254];
const steps5 = [START, START + 337, START + 674, START + 1011, START + 1348];
const team4 = [START, START + 425, START + 850, START + 1275];

/** The diameters of the process's coins: each step a coin larger than the last. */
const COINS = [132, 154, 176, 198, 220];
const COIN_BASE = 560;

function layouts(): Layout[] {
  // The opening's medallion: a rosette at the end of the slide, its serial number over it.
  const heroArt = atEnd(34, 130, 860, 860);

  // The strip of coupons of a part, and the one torn from it.
  const strip = atEnd(104, 0, 340, 1080);
  const couponH = 200;
  const pulled = atEnd(104 + 236, 344, 440, 252);

  // The growth curve of the timeline: capital rising over the years, hatched beneath.
  const curve = at(START - 30, 282, WIDTH + 60, 236);
  const cw = curve.w;
  const curveY = (t: number) =>
    196 - 178 * (0.3 * t + 0.7 * ((Math.exp(2.2 * t) - 1) / (Math.exp(2.2) - 1)));
  const tAt = (x: number) => (cw - 24 - x) / (cw - 48);
  const markerX = stops4.map((s) => 1920 - s - 14 - curve.x);

  return [
    {
      id: 'l_hon_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 34, 290, 840, 36), 'caption', {
          color: token('primary'),
        }),
        // Room for two lines at the leading of a tall script (`LEADING`).
        place('p_title', 'title', at(START, 334, 900, 240), 'display'),
        place('p_subtitle', 'subtitle', at(START, 580, 860, 104), 'heading'),
        place('p_meta', 'caption', at(START + 34, 774, 820, 36), 'caption'),
      ],
      decorations: [
        mark('d_hon_hero_mark', at(START, 96, 46, 46)),
        art(
          'd_hon_hero_rosette',
          heroArt,
          `<circle cx="430" cy="430" r="428" fill="${WHITE}" fill-opacity=".55"/>` +
            rosette(430, 430, 424, { reverse: true }),
        ),
        upright(
          'd_hon_hero_serial',
          atEnd(56, 64, 420, 52),
          serial('0412 1931 2026', 24, 40),
        ),
        lozenge('d_hon_hero_lozenge', at(START, 297, 22, 22)),
        doubleRule('d_hon_hero_rule', at(START, 726, 860, 14)),
        art(
          'd_hon_hero_meta_mark',
          at(START, 781, 22, 22),
          `<circle cx="11" cy="11" r="9.5" ${stroke(COPPER, 1.6)}/><circle cx="11" cy="11" r="4" fill="${CLARET}"/>`,
        ),
      ],
    },
    {
      id: 'l_hon_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place(
          'p_number',
          'number',
          { x: pulled.x + 170, y: pulled.y + 40, w: 240, h: 172 },
          'display',
          { align: 'center', vAlign: 'middle', color: token('primary') },
        ),
        place('p_kicker', 'caption', at(START + 34, 376, 780, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 420, 960, 224), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 664, 820, 100), 'heading'),
      ],
      decorations: [
        // The coupon sheet of a bond, running off the slide; one coupon is gone from it.
        art(
          'd_hon_section_strip',
          strip,
          `<rect x="0" y="0" width="${strip.w}" height="${strip.h}" fill="${WHITE}" fill-opacity=".7"/>` +
            `<path d="M1 0V${strip.h}M${strip.w - 1} 0V${strip.h}" ${stroke(CLARET, 1.4, 0.6)}/>` +
            (() => {
              // One coupon drawn, the others of the strip placed as copies of it.
              const y = -60;
              const coupon =
                `<rect x="16" y="${y + 12}" width="${strip.w - 32}" height="${couponH - 24}" ${stroke(CLARET, 1, 0.55)}/>` +
                band(22, y + 18, strip.w - 44, 16, CLARET, 0.4) +
                band(22, y + couponH - 34, strip.w - 44, 16, CLARET, 0.4) +
                rosetteSmall(84, y + couponH / 2, 44) +
                `<path d="M150 ${y + couponH / 2 - 14}H${strip.w - 40}M150 ${y + couponH / 2 + 14}H${strip.w - 70}" ${stroke(CLARET, 1, 0.35)}/>` +
                `<path d="M0 ${y + couponH}H${strip.w}" ${stroke(INK, 3.2, 0.3)} stroke-dasharray="0 9" stroke-linecap="round"/>`;
              const id = partId(coupon);
              return (
                `<g id="${id}">${coupon}</g>` +
                [1, 3, 4, 5]
                  .map((i) => `<use href="#${id}" transform="translate(0 ${i * couponH})"/>`)
                  .join('') +
                `<rect x="16" y="${y + 2 * couponH + 12}" width="${strip.w - 32}" height="${couponH - 24}" ${stroke(CLARET, 1.2, 0.5)} stroke-dasharray="6 6"/>`
              );
            })(),
        ),
        lifted(
          art(
            'd_hon_section_coupon',
            pulled,
            `<rect x="0" y="0" width="${pulled.w}" height="${pulled.h}" fill="${WHITE}"/>` +
              `<rect x="0" y="0" width="${pulled.w}" height="${pulled.h}" fill="${CLARET}" fill-opacity=".05"/>` +
              `<rect x="12" y="12" width="${pulled.w - 24}" height="${pulled.h - 24}" ${stroke(CLARET, 1.4)}/>` +
              band(18, 18, pulled.w - 36, 20, CLARET, 0.7) +
              band(18, pulled.h - 38, pulled.w - 36, 20, CLARET, 0.7) +
              `<circle cx="96" cy="${pulled.h / 2}" r="64" fill="${WHITE}"/>` +
              rosetteSmall(96, pulled.h / 2, 62) +
              `<path d="M174 54V${pulled.h - 54}" ${stroke(CLARET, 1, 0.4)}/>` +
              // The edge it was torn along: the perforation, on the side of the sheet.
              `<path d="M2 3V${pulled.h - 3}" ${stroke(PAPER, 5)} stroke-dasharray="0 10" stroke-linecap="round"/>`,
          ),
          20,
          40,
          0.2,
        ),
        lozenge('d_hon_section_lozenge', at(START, 383, 22, 22)),
      ],
    },
    {
      id: 'l_hon_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1100, 1).placeholders,
        place('p_number', 'number', at(START, 290, 980, 132), 'display', {
          color: token('primary'),
        }),
        place('p_label', 'subtitle', at(START, 426, 900, 96), 'heading'),
        place('p_note', 'body', at(START, 532, 880, 92), 'body'),
        ...cards3.flatMap((s, i) => [
          place(`p_number${i + 2}`, 'number', at(s + 34, 712, 384, 70), 'title', {
            color: i === 2 ? token('secondary') : token('primary'),
          }),
          place(`p_label${i + 2}`, 'caption', at(s + 34, 786, 384, 100), 'caption'),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1100, 1).decorations,
        art(
          'd_hon_big_number_rosette',
          atEnd(END + 70, 214, 440, 440),
          rosette(220, 220, 214, { detail: 0.6, outer: GREEN, inner: CLARET, reverse: true }),
        ),
        ...cards3.flatMap((s, i) => {
          const f = at(s, 686, 525, 210);
          const notch = 16;
          return [
            lifted(
              art(
                `d_hon_big_number_ticket${i + 1}`,
                f,
                `<path d="M0 0H${f.w}V${f.h / 2 - notch}A${notch} ${notch} 0 0 0 ${f.w} ${f.h / 2 + notch}V${f.h}H0V${f.h / 2 + notch}A${notch} ${notch} 0 0 0 0 ${f.h / 2 - notch}Z" fill="${WHITE}"/>` +
                  band(0, 0, f.w, 14, [CLARET, CLARET, GREEN][i]!, 0.7) +
                  `<path d="M${f.w - 448} 30V${f.h - 16}" ${stroke(INK, 3, 0.3)} stroke-dasharray="0 9" stroke-linecap="round"/>` +
                  rosetteSmall(r1((f.w - 448) / 2), f.h / 2 + 6, 26, [CLARET, CLARET, GREEN][i]!),
              ),
              8,
              22,
              0.12,
            ),
          ];
        }),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_hon_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(340, 284, 1240, 322), 'title', {
          align: 'center',
          vAlign: 'middle',
        }),
        place('p_attribution', 'attribution', at(700, 628, 520, 56), 'heading', {
          align: 'center',
          vAlign: 'bottom',
        }),
        place('p_caption', 'caption', at(700, 700, 520, 70), 'caption', { align: 'center' }),
        ...foot('quote').placeholders,
      ],
      decorations: [
        lifted(
          rect('d_hon_quote_paper', at(220, 128, 1480, 776), solid(token('surface'))),
          22,
          50,
          0.14,
        ),
        art('d_hon_quote_border', at(220, 128, 1480, 776), braidedFrame(1480, 776, 30, CLARET, 20)),
        art(
          'd_hon_quote_vignette',
          at(960 - 150, 176, 300, 92),
          // A sunburst rising from the head of the certificate, as its vignette.
          Array.from({ length: 29 }, (_, i) => {
            const a = Math.PI + (i / 28) * Math.PI;
            const r0 = 26;
            const r = i % 2 ? 62 : 84;
            return `<path d="M${r1(150 + Math.cos(a) * r0)} ${r1(90 + Math.sin(a) * r0)}L${r1(150 + Math.cos(a) * r)} ${r1(90 + Math.sin(a) * r)}" ${stroke(i % 2 ? COPPER : CLARET, i % 2 ? 1.2 : 1.6)}/>`;
          }).join('') +
            `<path d="M124 90A26 26 0 0 1 176 90Z" fill="${CLARET}"/>` +
            `<path d="M40 90H260" ${stroke(CLARET, 1.4)}/>`,
        ),
        rect('d_hon_quote_signature', at(700, 690, 520, 1.6), solid(token('text', 0.45))),
        lifted(
          art('d_hon_quote_seal', at(236, 640, 240, 290), seal(120, 112, 104, 168)),
          10,
          18,
          0.2,
        ),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_hon_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a ledger sheet from margin to margin, down to over the foot, from its
      // top; a small seal is pressed on the sheet's corner, beside the title.
      placeholders: [
        ...head('text', WIDTH - 280, 1, false).placeholders,
        place('p_body', 'body', at(START + 60, 290, WIDTH - 100, 590), 'body'),
      ],
      decorations: [
        ...head('text', WIDTH - 280, 1, false).decorations,
        card('d_hon_text_sheet', at(START, 232, WIDTH, 696)),
        headBand('d_hon_text_band', at(START, 232, WIDTH, 22)),
        ledgerRule('d_hon_text_ledger', at(START + 24, 254, 8, 674)),
        lifted(
          art(
            'd_hon_text_seal',
            atEnd(END + 40, 150, 124, 124),
            `<circle cx="62" cy="62" r="61" fill="${WHITE}"/>` + rosetteSmall(62, 62, 58),
          ),
          6,
          14,
          0.16,
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_hon_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 960).placeholders,
        place('p_image', 'image', atEnd(END + 26, 154, 592, 732)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 88, 312 + i * 186, 860, 48), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 88, 364 + i * 186, 860, 122), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 960).decorations,
        art('d_hon_text_image_frame', atEnd(END, 128, 644, 784), braidedFrame(644, 784, 26, COPPER, 16)),
        art(
          'd_hon_text_image_thread',
          at(START + 26, 337, 16, 372),
          `<path d="M8 4V368" ${stroke(CLARET, 2.2, 0.6)} stroke-dasharray="0 8" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          coinBadge(`d_hon_text_image_coin${i + 1}`, at(START, 303 + i * 186, 68, 68), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_hon_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', atEnd(0, 0, 1180, 1080)),
        place('p_place', 'caption', at(START + 34, 360, 500, 36), 'caption', {
          color: token('surface', 0.8),
        }),
        place('p_title', 'title', at(START, 404, 520, 200), 'title', { color: token('surface') }),
        place('p_body', 'body', at(START, 644, 500, 200), 'body', {
          color: token('surface', 0.88),
        }),
      ],
      decorations: [
        // The plate the words are engraved on, the photograph running off the other edges.
        rect('d_hon_full_image_plate', at(0, 0, 740, 1080), solid(token('primary'))),
        art(
          'd_hon_full_image_watermark',
          at(0, 700, 380, 380),
          rosette(380, 380, 340, { outer: WHITE, inner: WHITE, detail: 0.7, opacity: 0.16 }),
        ),
        art(
          'd_hon_full_image_band',
          at(740 - 34, 0, 26, 1080),
          band(0, 0, 26, 1080, COPPER, 1) + band(0, 0, 26, 1080, WHITE, 0.3, 2),
        ),
        lozenge('d_hon_full_image_lozenge', at(START, 367, 22, 22), true),
        art(
          'd_hon_full_image_rule',
          at(START, 622, 120, 4),
          `<path d="M0 2H120" ${stroke(COPPER, 3)}/>`,
        ),
      ],
    },
    {
      id: 'l_hon_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 34, 478, 455, 36), 'caption', {
            color: [token('primary'), token('secondary'), token('accent')][i]!,
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 34, 518, 455, 52), 'heading'),
          place(`p_card${i + 1}_body`, 'body', at(s + 34, 576, 455, 150), 'body'),
        ]),
        place('p_note', 'body', at(START + 34, 788, WIDTH - 34, 84), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => {
          const colour = [CLARET, GREEN, COPPER][i]!;
          const f = at(s, 282, 525, 172);
          return [
            card(`d_hon_cards_note${i + 1}`, at(s, 282, 525, 460)),
            art(
              `d_hon_cards_head${i + 1}`,
              f,
              `<rect x="10" y="10" width="${f.w - 20}" height="${f.h - 10}" fill="${colour}" fill-opacity=".08"/>` +
                `<rect x="10" y="10" width="${f.w - 20}" height="${f.h - 10}" ${stroke(colour, 1.2, 0.7)}/>` +
                win(
                  10,
                  10,
                  f.w - 20,
                  f.h - 10,
                  `<path d="${braidH(-20, (f.h - 10) / 2, f.w + 40, 26, 92, 6)}" ${stroke(colour, 1, 0.45)}/>`,
                ) +
                `<circle cx="${f.w - 92}" cy="${r1(f.h / 2 + 5)}" r="64" fill="${WHITE}"/>` +
                rosetteSmall(f.w - 92, r1(f.h / 2 + 5), 60, colour, colour === COPPER ? CLARET : COPPER) +
                `<path d="M34 ${f.h - 34}H${f.w - 190}" ${stroke(colour, 1, 0.5)}/>`,
            ),
          ];
        }),
        lozenge('d_hon_cards_note_lozenge', at(START, 797, 22, 22)),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_hon_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 530, 380, 66), 'title', {
            color: i === 3 ? token('secondary') : token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 600, 380, 96), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 704, 380, 126), 'body'),
        ]),
        place('p_note', 'caption', at(START + 34, 856, 1400, 70), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        art(
          'd_hon_timeline_curve',
          curve,
          (() => {
            const base = 210;
            // The hatching, each line moved to from the foot of the one before it.
            let hatch = '';
            for (let x = 26; x <= cw - 26; x += 6) {
              const top = r1(curveY(tAt(x)) + 3);
              hatch += x === 26 ? `M${x} ${top}V${base}` : `m6 ${short(r1(top - base))}V${base}`;
            }
            const along = (lift: number) => {
              let line = '';
              for (let i = 0; i <= 80; i++) {
                const t = i / 80;
                line += `${i ? 'L' : 'M'}${r1(cw - 24 - t * (cw - 48))} ${r1(curveY(t) - lift)}`;
              }
              return line;
            };
            return (
              [60, 110, 160]
                .map((y) => `<path d="M24 ${y}H${cw - 24}" ${stroke(INK, 1, 0.14)} stroke-dasharray="2 6"/>`)
                .join('') +
              `<path d="${along(0)}L24 ${base}H${cw - 24}Z" fill="${CLARET}" fill-opacity=".06"/>` +
              `<path d="${hatch}" ${stroke(CLARET, 1.1, 0.42)}/>` +
              `<path d="${along(12)}" ${stroke(COPPER, 1.4, 0.8)} stroke-dasharray="2 5"/>` +
              `<path d="${along(0)}" ${stroke(CLARET, 3.2)} stroke-linecap="round"/>` +
              `<path d="M24 ${base}H${cw - 24}" ${stroke(INK, 1.6, 0.8)}/>` +
              band(24, base + 6, cw - 48, 16, CLARET, 0.55) +
              markerX
                .map((x, i) => {
                  const y = curveY(tAt(x));
                  return (
                    `<path d="M${r1(x)} ${r1(y + 14)}V${base}" ${stroke(INK, 1.6, 0.7)} stroke-dasharray="3 4"/>` +
                    `<circle cx="${r1(x)}" cy="${r1(y)}" r="13" fill="${WHITE}" ${stroke(i === 3 ? GREEN : CLARET, 3)}/>` +
                    `<circle cx="${r1(x)}" cy="${r1(y)}" r="4.5" fill="${i === 3 ? GREEN : CLARET}"/>`
                  );
                })
                .join('')
            );
          })(),
        ),
        lozenge('d_hon_timeline_note_lozenge', at(START, 862, 22, 22)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_hon_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => {
          const d = COINS[i]!;
          const cy = COIN_BASE - d / 2;
          return [
            place(`p_station${i + 1}`, 'number', at(s + 150 - 60, cy - 40, 120, 80), 'title', {
              align: 'center',
              vAlign: 'middle',
              color: i === 4 ? token('secondary') : token('primary'),
            }),
            place(`p_step${i + 1}`, 'subtitle', at(s, 584, 300, 50), 'heading', { align: 'center' }),
            place(`p_step${i + 1}_caption`, 'caption', at(s, 638, 300, 100), 'caption', {
              align: 'center',
            }),
          ];
        }),
        place('p_note', 'body', at(START + 118, 778, WIDTH - 158, 92), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        art(
          'd_hon_process_shelf',
          at(START, COIN_BASE - 2, WIDTH, 10),
          `<path d="M0 2H${WIDTH}" ${stroke(INK, 1.6, 0.7)}/><path d="M0 7H${WIDTH}" ${stroke(INK, 0.8, 0.4)}/>`,
        ),
        ...steps5.map((s, i) => {
          const d = COINS[i]!;
          return lifted(
            art(`d_hon_process_coin${i + 1}`, at(s + 150 - d / 2, COIN_BASE - d, d, d), coin(d)),
            6,
            12,
            0.18,
          );
        }),
        ...steps5.slice(0, 4).map((s, i) => {
          const d = COINS[i]!;
          const y = COIN_BASE - d / 2;
          return art(
            `d_hon_process_arrow${i + 1}`,
            at(s + 300 + 8, y - 12, 22, 24),
            `<path d="M17 2L5 12L17 22" ${LINE(CLARET, 2.6)}/>`,
          );
        }),
        card('d_hon_process_receipt', at(START, 764, WIDTH, 120)),
        art(
          'd_hon_process_stack',
          at(START + 24, 780, 62, 88),
          [0, 1, 2, 3]
            .map(
              (j) =>
                `<ellipse cx="31" cy="${70 - j * 14}" rx="28" ry="10" fill="${COPPER}" ${stroke(WHITE, 1.4, 0.8)}/>`,
            )
            .join('') +
            `<ellipse cx="31" cy="28" rx="20" ry="6" ${stroke(WHITE, 1.2, 0.6)}/>`,
        ),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_hon_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      // A T-account: the heavy double rule across, the ruled middle with a balance on its
      // junction, each side a picture of where the profit goes, and the double underline of a
      // total under each.
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', START + 34],
            ['after', START + WIDTH / 2 + 50],
          ] as const
        ).flatMap(([side, s]) => [
          place(`p_${side}_label`, 'caption', at(s, 520, 720, 36), 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', at(s, 562, 720, 56), 'heading'),
          place(`p_${side}_body`, 'body', at(s, 626, 720, 164), 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        rect(
          'd_hon_comparison_field',
          at(START + WIDTH / 2 + 12, 312, WIDTH / 2 - 12, 520),
          solid(token('primary', 0.06)),
        ),
        art(
          'd_hon_comparison_t',
          at(START, 296, WIDTH, 536),
          `<path d="M0 2H${WIDTH}" ${stroke(INK, 2.4)}/><path d="M0 9H${WIDTH}" ${stroke(INK, 1, 0.7)}/>` +
            `<path d="M${WIDTH / 2} 12V536" ${stroke(INK, 1.6, 0.8)}/>`,
        ),
        art('d_hon_comparison_balance', at(START + WIDTH / 2 - 44, 254, 88, 88), balance(88)),
        // Each side's picture, the town on the side its words start from.
        art(
          'd_hon_comparison_before_art',
          at(START + 34, 326, 408, 180),
          `<g transform="translate(408 0) scale(-1.2 1.2)">${leaving(340, 150)}</g>`,
        ),
        art(
          'd_hon_comparison_after_art',
          at(START + WIDTH / 2 + 50, 326, 408, 180),
          `<g transform="translate(408 0) scale(-1.2 1.2)">${returning(340, 150)}</g>`,
        ),
        // The double underline of a total under each side.
        art(
          'd_hon_comparison_totals',
          at(START, 800, WIDTH, 10),
          `<path d="M34 2H${WIDTH / 2 - 40}M${WIDTH / 2 + 50} 2H${WIDTH - 34}" ${stroke(INK, 1.4, 0.8)}/>` +
            `<path d="M34 8H${WIDTH / 2 - 40}M${WIDTH / 2 + 50} 8H${WIDTH - 34}" ${stroke(INK, 1.4, 0.8)}/>`,
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_hon_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(START + 34, 326, 990, 466)),
        place('p_source', 'caption', at(START + 34, 806, 990, 70), 'caption'),
        place('p_figure1', 'number', atEnd(END, 290, 470, 124), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 418, 470, 124), 'body'),
        place('p_figure2', 'number', atEnd(END, 594, 470, 124), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 722, 470, 124), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1080).decorations,
        card('d_hon_chart_panel', at(START, 288, 1060, 608)),
        headBand('d_hon_chart_band', at(START, 288, 1060, 20)),
        art(
          'd_hon_chart_spine',
          atEnd(END + 512, 300, 10, 560),
          `<path d="M2 0V560M8 0V560" ${stroke(CLARET, 1, 0.45)}/>`,
        ),
        art('d_hon_chart_divider', atEnd(END, 568, 470, 6), perforation(470)),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_hon_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 50, 300, WIDTH - 86, 456)),
        place('p_note', 'caption', at(START + 34, 894, WIDTH - 34, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1200).decorations,
        card('d_hon_table_panel', at(START, 268, WIDTH, 604)),
        headBand('d_hon_table_band', at(START, 268, WIDTH, 18)),
        ledgerRule('d_hon_table_ledger', at(START + 24, 286, 8, 586)),
        art(
          'd_hon_table_total',
          at(START + 50, 764, WIDTH - 86 - 150, 10),
          `<path d="M0 2H${WIDTH - 236}M0 8H${WIDTH - 236}" ${stroke(INK, 1.4, 0.75)}/>`,
        ),
        lifted(
          art(
            'd_hon_table_seal',
            atEnd(END + 36, 764, 96, 96),
            `<circle cx="48" cy="48" r="47" fill="${WHITE}"/>` + rosetteSmall(48, 48, 44, GREEN, COPPER),
          ),
          4,
          10,
          0.14,
        ),
        lozenge('d_hon_table_note_lozenge', at(START, 901, 22, 22)),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_hon_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s + 24, 290, 324, 324)),
          place(`p_desk${i + 1}`, 'caption', at(s, 660, 372, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s, 700, 372, 50), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s, 754, 372, 122), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        ...team4.map((s, i) =>
          art(`d_hon_team_frame${i + 1}`, at(s, 266, 372, 372), braidedFrame(372, 372, 22, COPPER, 13)),
        ),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_hon_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 34, 262, 900, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 306, 940, 240), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 60, 584 + i * 86, 860, 78), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START + 34, 904, 900, 36), 'caption'),
      ],
      decorations: [
        mark('d_hon_closing_mark', at(START, 96, 46, 46)),
        lozenge('d_hon_closing_lozenge', at(START, 269, 22, 22)),
        lifted(
          art('d_hon_closing_seal', atEnd(150, 120, 620, 820), seal(310, 330, 280, 440)),
          18,
          40,
          0.2,
        ),
        ...[0, 1, 2].map((i) =>
          art(`d_hon_closing_glyph${i + 1}`, at(START, 586 + i * 86, 36, 36), CLOSING_GLYPHS[i]!),
        ),
        doubleRule('d_hon_closing_rule', at(START, 866, 900, 14)),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that hold figures moved
 * across as they are, and the thread down the other edge.
 */
function flipped(drawn: readonly Layout[]): Layout[] {
  return drawn.map((layout) => {
    const mirrored = mirrorLayout(layout);
    return {
      ...mirrored,
      background: ground('left'),
      decorations: mirrored.decorations.map((decoration) => {
        if (!UPRIGHT.has(decoration.id) || decoration.type !== 'svg') return decoration;
        const { flipH: _flipH, ...rest } = decoration;
        return rest;
      }),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The sample: the annual results of a savings bank its members own, at their general meeting

const TABLE_COLS = [430, 270, 220, 300, 342];
const TABLE_ROW = 76;
const SAVINGS = [5.2, 5.6, 5.9, 6.3];
const LOANS = [4.2, 4.5, 4.8, 5.1];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari meet across lines set as tight as Latin display type.
 * The display titles of the opening, a part and the closing, and every other title.
 */
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number }>
> = {
  hi: { display: 1.18, title: 1.3, subtitle: 1.42 },
};
const DISPLAYED = new Set(['l_hon_hero', 'l_hon_section', 'l_hon_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: HonCopy, lang: ContentLanguage): SampleSlide[] {
  const slides = drawSample(copy);
  const leading = LEADING[lang];
  if (!leading) return slides;
  return slides.map((slide) => {
    const content = { ...slide.content };
    const lineHeight = DISPLAYED.has(slide.layout) ? leading.display : leading.title;
    const roles = { title: lineHeight, quote: lineHeight, subtitle: leading.subtitle };
    for (const [role, value] of Object.entries(roles) as [keyof typeof roles, number][]) {
      if (role === 'subtitle' && !DISPLAYED.has(slide.layout)) continue;
      const fill = content[role];
      if (fill && !Array.isArray(fill) && 'paragraphs' in fill) {
        content[role] = {
          paragraphs: fill.paragraphs.map((p) => ({ ...p, lineHeight: value })),
        };
      }
    }
    return { ...slide, content };
  });
}

function drawSample(copy: HonCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_hon_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_hon_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 36 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('primary'), gap: 22 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_hon_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_hon_big_number',
      name: copy.figures.name,
      content: {
        caption: [
          text(copy.figures.kicker),
          ...copy.figures.others.map(([, label]) => lines(label)),
        ],
        title: lines(copy.figures.title),
        number: [
          text(copy.figures.hero.value),
          ...copy.figures.others.map(([value]) => text(value)),
        ],
        subtitle: text(copy.figures.hero.label),
        body: text(copy.figures.hero.note),
        footer,
      },
    },
    {
      layout: 'l_hon_chart',
      name: copy.savings.name,
      content: {
        caption: [text(copy.savings.kicker), text(copy.savings.source)],
        title: lines(copy.savings.title),
        number: copy.savings.figures.map(([value]) => text(value)),
        body: copy.savings.figures.map(([, body]) => lines(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.savings.series[0], values: SAVINGS },
            { name: copy.savings.series[1], values: LOANS },
          ],
        },
      },
    },
    {
      layout: 'l_hon_table',
      name: copy.lines.name,
      content: {
        caption: [text(copy.lines.kicker), text(copy.lines.note)],
        title: lines(copy.lines.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.lines.header, ...copy.lines.rows],
      },
    },
    {
      layout: 'l_hon_cards',
      name: copy.profit.name,
      content: {
        caption: [text(copy.profit.kicker), ...copy.profit.cards.map(([label]) => text(label))],
        title: lines(copy.profit.title),
        subtitle: copy.profit.cards.map(([, title]) => text(title)),
        body: [...copy.profit.cards.map(([, , body]) => lines(body)), text(copy.profit.note)],
        footer,
      },
    },
    {
      layout: 'l_hon_comparison',
      name: copy.owners.name,
      content: {
        caption: [
          text(copy.owners.kicker),
          text(copy.owners.before[0]),
          text(copy.owners.after[0]),
        ],
        title: lines(copy.owners.title),
        subtitle: [text(copy.owners.before[1]), text(copy.owners.after[1])],
        body: [text(copy.owners.before[2]), text(copy.owners.after[2])],
        footer,
      },
    },
    {
      layout: 'l_hon_text_image',
      name: copy.homes.name,
      content: {
        caption: text(copy.homes.kicker),
        title: lines(copy.homes.title),
        image: { assetId: pictures.homes.id },
        subtitle: copy.homes.items.map(([title]) => text(title)),
        body: copy.homes.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_hon_full_image',
      name: copy.street.name,
      content: {
        image: { assetId: pictures.street.id },
        caption: text(copy.street.place),
        title: text(...copy.street.title),
        body: text(copy.street.body),
      },
    },
    {
      layout: 'l_hon_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_hon_process',
      name: copy.lending.name,
      content: {
        caption: [
          text(copy.lending.kicker),
          ...copy.lending.steps.map(([, caption]) => lines(caption)),
        ],
        title: lines(copy.lending.title),
        number: copy.lending.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.lending.steps.map(([step]) => text(step)),
        body: text(copy.lending.note),
        footer,
      },
    },
    {
      layout: 'l_hon_timeline',
      name: copy.history.name,
      content: {
        caption: [text(copy.history.kicker), text(copy.history.note)],
        title: lines(copy.history.title),
        number: copy.history.stops.map(([year]) => text(year)),
        subtitle: copy.history.stops.map(([, title]) => text(title)),
        body: copy.history.stops.map(([, , body]) => lines(body)),
        footer,
      },
    },
    {
      layout: 'l_hon_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([desk]) => text(desk))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => lines(role)),
        footer,
      },
    },
    {
      layout: 'l_hon_closing',
      name: copy.closing.name,
      content: {
        caption: [text(copy.closing.kicker), text(copy.closing.meta)],
        title: text(...copy.closing.title),
        body: copy.closing.lines.map((line) => text(line)),
      },
    },
  ];
}

/** The sample decks of the template: one in every language its copy is written in. */
export const honSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => HON_COPY[lang]).map((lang) => [
    lang,
    sample(HON_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Hon template: the theme, its layouts for both directions, and its sample deck. */
export function honTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(honTheme),
    description:
      'Security printing for finance: guilloche rosettes and braided bands on paper with a copper thread, bond coupons, ledger rules, coins and a foil seal, in claret, banknote green and copper.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.homes, pictures.street, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, honSamples.he);
  return finished;
}

export const entry = { id: 'hon', template: honTemplate, samples: honSamples };
