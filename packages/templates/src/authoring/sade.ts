import {
  CONTENT_LANGUAGES,
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
import { SADE_COPY, type SadeCopy } from './sade/copy';
import { picture } from './pictures';

const pictures = {
  drip: picture('sadeDrip'),
  fields: picture('sadeFields'),
  team: [1, 2, 3, 4].map((n) => picture(`sadeTeam${n}`)),
};

/**
 * Harvest (Sade, "field"): the field in section, as an agronomist draws it. Above the line the
 * crop and the sky, below it the soil with its horizons and its roots, and every slide stands on
 * a strip of that loam, where the slide's number is written on a plant label. The objects of a
 * farm do the work: a stand of ripe wheat opens the deck, a wooden plot sign holds the number of
 * a part, grain bins hold figures, a tied sheaf stands beside a farmer's words, seed packets are
 * cards, the year of a field is a timeline, five plots seen from above are a process, two soil
 * profiles compare two ways of farming, a rain gauge stands by a chart, and the furrows of a field
 * run to a low sun at the close. Straw paper, loam for the words and the soil, leaf green, harvest
 * amber and wheat gold. For farms, cooperatives, agritech, food systems and rural development.
 *
 * No drawing holds a word, so one set of layouts reads in every language. The titles are set in
 * Lora, a serif with the stroke of a brush (Cyrillic and Vietnamese too), and in David Libre for
 * Hebrew; the other scripts take their counterparts.
 */
export const sadeTheme: Theme = {
  id: 'sade',
  name: 'Harvest',
  colors: {
    bg: '#f1ead6',
    surface: '#fbf8f0',
    text: '#2a2119',
    muted: '#685a48',
    primary: '#3b6d2a',
    secondary: '#a3601a',
    accent: '#d8a53a',
    chart: ['#3b6d2a', '#d8a53a', '#a3601a', '#4f86a6', '#2a2119', '#9fbf6b'],
  },
  // A serif with the stroke of a brush for what is said aloud (David Libre, the classic Hebrew
  // book face, beside Lora), and a plain sans for what is read (Assistant, Be Vietnam Pro).
  fonts: {
    heading: { he: 'David Libre', latin: 'Lora' },
    body: { he: 'Assistant', latin: 'Be Vietnam Pro' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 104,
      weight: 700,
      lineHeight: 1.04,
      letterSpacing: -1.5,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 58,
      weight: 700,
      lineHeight: 1.12,
      letterSpacing: -0.4,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 36, weight: 700, lineHeight: 1.2, color: { token: 'text' } },
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
  radius: 10,
  shadow: { x: 0, y: 16, blur: 38, color: { value: '#3b2a14', alpha: 0.12 } },
  // The ground: straw paper, a shade lighter at the top, where the sky is.
  background: {
    fill: {
      kind: 'css',
      value:
        'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 70%, var(--color-bg)) 0%, var(--color-bg) 62%)',
    },
  },
  backgroundVariants: [
    SURFACE,
    // The straw alone, without its light.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const STRAW = '#f1ead6';
const PAPER = '#fbf8f0';
const LOAM = '#2a2119';
const MUTED = '#685a48';
const LEAF = '#3b6d2a';
const AMBER = '#a3601a';
const GOLD = '#d8a53a';
/** The blue of water in the drawings and the chart, which no token holds. */
const SKY = '#4f86a6';
/** The fresh green of young leaves, which no token holds. */
const SAGE = '#9fbf6b';

const PAINT = {
  [STRAW]: token('bg'),
  [PAPER]: token('surface'),
  [LOAM]: token('text'),
  [MUTED]: token('muted'),
  [LEAF]: token('primary'),
  [AMBER]: token('secondary'),
  [GOLD]: token('accent'),
};

const r1 = (v: number) => Math.round(v * 10) / 10;
const RAD = Math.PI / 180;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

/**
 * Shapes a drawing places many times (an ear, a grain, a seed), by name: each is drawn once in
 * the drawing's `<defs>` and placed with `<use>`, so the catalog holds it once a drawing.
 */
const SYMBOLS = new Map<string, string>();

/** A `<use>` of the shape `name`, drawn by `draw` the first time it is asked for. */
function reuse(name: string, draw: () => string, attributes: string) {
  if (!SYMBOLS.has(name)) SYMBOLS.set(name, draw());
  return `<use href="#@${name}" ${attributes}/>`;
}

/** A drawing's body with the shapes it places in its defs, their ids prefixed with its own. */
function withSymbols(id: string, body: string) {
  const names = [...new Set([...body.matchAll(/#@([\w-]+)/g)].map((m) => m[1]!))];
  if (names.length === 0) return body;
  const defs = names.map((name) => `<g id="${id}-${name}">${SYMBOLS.get(name)}</g>`).join('');
  return `<defs>${defs}</defs>${body.replaceAll('#@', `#${id}-`)}`;
}

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, withSymbols(id, body)), PAINT);

/** A whole pixel: what a coordinate of a large drawing is rounded to. */
const px = (v: number) => Math.round(v);

/** Dots as one path, a round cap each: `M x y h0` a dot, drawn as wide as the stroke. */
const dots = (points: string, width: number, color: string, opacity: number) =>
  points
    ? `<path d="${points}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" stroke-linecap="round"/>`
    : '';

/** Dots at whole pixels, left to right, each written from the one before: `dots`' points. */
function dotPath(points: readonly (readonly [number, number])[]) {
  const sorted = points.map(([x, y]) => [px(x), px(y)] as const).sort((a, b) => a[0] - b[0]);
  return sorted
    .map(([x, y], i) => {
      const [x0, y0] = sorted[i - 1] ?? [0, 0];
      return i ? `m${x - x0} ${y - y0}h0` : `M${x} ${y}h0`;
    })
    .join('');
}

/**
 * The drawings a left-to-right deck must not see mirrored: those with figures in them. Their
 * mirror moves them to the other side and leaves them as they are.
 */
const UPRIGHT = new Set<string>();

const upright = (id: string, frame: Frame, body: string) => {
  UPRIGHT.add(id);
  return art(id, frame, body);
};

/** A soft shadow under a drawing of paper or wood. */
const lifted = (element: Element, y = 12, blur = 26, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#3b2a14', alpha } } },
});

/** A small seeded generator, so a drawing is the same on every call. */
function rng(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------
// The field: soil, roots, wheat, seed

interface SoilOptions {
  /** How high the ridges the drill leaves on the surface stand; 0 for a flat cut. */
  ridge?: number;
  /** Where the horizons begin, as shares of the depth. */
  horizons?: number[];
  /** How many crumbs and pebbles, against the default. */
  grain?: number;
}

/**
 * A block of soil in section: the surface ridged by the drill, the topsoil dark and crumbly,
 * each horizon below a shade lighter, pebbles in the subsoil.
 */
function soil(w: number, h: number, seed: number, o: SoilOptions = {}) {
  const rand = rng(seed);
  const ridge = o.ridge ?? 4;
  const top = ridge + 1;
  const period = 34;
  // The ridged surface, drawn once: its ridges filled over the block of loam, then outlined.
  const surface = () => {
    let d = `M0 ${top}`;
    for (let x = 0; x < w; x += period) {
      const step = Math.min(period, w - x);
      d += `q${r1(step / 2)} ${-ridge * 2} ${r1(step)} 0`;
    }
    return `<path d="${d}"/>`;
  };
  const ridges = `surface-${w}-${ridge}`;
  let body =
    (ridge > 0 ? reuse(ridges, surface, `fill="${LOAM}"`) : '') +
    `<rect y="${top}" width="${w}" height="${h - top}" fill="${LOAM}"/>`;
  for (const [i, k] of (o.horizons ?? [0.42, 0.76]).entries()) {
    const y0 = top + (h - top) * k;
    let p = `M0 ${px(y0)}`;
    for (let x = 60; x < w; x += 60) {
      p += `L${x} ${px(y0 + Math.sin(x / 150 + seed + i * 2) * 6 + (rand() - 0.5) * 5)}`;
    }
    p += `L${w} ${px(y0)}`;
    body += `<path d="${p}V${h}H0Z" fill="${STRAW}" fill-opacity=".055"/>`;
  }
  const grain = o.grain ?? 1;
  // The crumbs of the topsoil, as dots of three sizes in two strengths.
  const crumbs: Record<string, [number, number][]> = {};
  const topsoil = (h - top) * (o.horizons?.[0] ?? 0.42);
  for (let i = 0; i < Math.round((grain * w * topsoil) / 700); i++) {
    const x = rand() * w;
    const y = top + 4 + rand() * (topsoil - 4);
    const r = 1.2 + rand() * 2;
    const opacity = 0.06 + rand() * 0.08;
    const key = `${r < 1.87 ? 3 : r < 2.53 ? 4.4 : 5.8} ${opacity < 0.1 ? 0.08 : 0.12}`;
    (crumbs[key] ??= []).push([x, y]);
  }
  // The pebbles of the subsoil, each a stroke with round ends as thick as the pebble.
  const pebbles: Record<string, string> = {};
  for (let i = 0; i < Math.round((grain * w * (h - top - topsoil)) / 9000); i++) {
    const x = rand() * w;
    const y = top + topsoil + 8 + rand() * (h - top - topsoil - 12);
    const rx = 4 + rand() * 9;
    const ry = rx * (0.5 + rand() * 0.25);
    const a = Math.round(rand() * 40 - 20) * RAD;
    const width = 5 + 3 * Math.max(0, Math.min(4, Math.round((ry * 2 - 5) / 3)));
    const half = Math.max(0, rx - width / 2);
    pebbles[width] =
      `${pebbles[width] ?? ''}M${px(x - Math.cos(a) * half)} ${px(y - Math.sin(a) * half)}` +
      `l${px(Math.cos(a) * half * 2)} ${px(Math.sin(a) * half * 2)}`;
  }
  return (
    body +
    Object.entries(crumbs)
      .map(([key, points]) => {
        const [width, opacity] = key.split(' ').map(Number) as [number, number];
        return dots(dotPath(points), width, STRAW, opacity);
      })
      .join('') +
    Object.entries(pebbles)
      .map(([width, d]) => dots(d, Number(width), STRAW, 0.1))
      .join('') +
    (ridge > 0
      ? `<use href="#@${ridges}" stroke="${AMBER}" stroke-opacity=".7" stroke-width="2"/>`
      : `<path d="M0 1H${w}" stroke="${AMBER}" stroke-opacity=".7" stroke-width="2"/>`)
  );
}

/** Blades of grass at the surface, every so often. */
function tufts(w: number, y: number, seed: number, every = 160, size = 9) {
  const rand = rng(seed);
  let d = '';
  let tip: [number, number] = [0, 0];
  for (let x = rand() * every; x < w - 10; x += every * (0.55 + rand() * 0.9)) {
    for (let b = 0; b < 3; b++) {
      const bx = x + b * 4 - 4;
      const lean = (b - 1) * 4 + (rand() - 0.5) * 3;
      const hgt = size * (0.6 + rand() * 0.5) * (b === 1 ? 1.2 : 1);
      // The first blade of a tuft from its place, the next two from the tip before.
      const from = b === 0 ? `M${r1(bx)} ${y}` : `m${r1(r1(bx) - r1(bx - 4) - tip[0])} ${r1(-tip[1])}`;
      d += `${from}q${r1(lean * 0.3)} ${r1(-hgt * 0.6)} ${r1(lean)} ${r1(-hgt)}`;
      tip = [r1(lean), r1(-hgt)];
    }
  }
  return `<path d="${d}" stroke="${LEAF}" stroke-width="1.8" stroke-linecap="round"/>`;
}

/** Roots from a point of the surface down, branching as they go. */
function roots(x0: number, y0: number, depth: number, seed: number, spread = 1) {
  const rand = rng(seed);
  let d = '';
  const queue: [number, number, number, number, number][] = [[x0, y0, depth, 90, 0]];
  const sideRoots = 2 + Math.round(rand() * 2);
  for (let i = 0; i < sideRoots; i++) {
    const a = 90 + (i % 2 ? 1 : -1) * (25 + rand() * 30) * spread;
    queue.push([x0, y0, depth * (0.45 + rand() * 0.35), a, 1]);
  }
  while (queue.length) {
    const [sx, sy, len, start, level] = queue.shift()!;
    let x = sx;
    let y = sy;
    let a = start;
    // Whole pixels, each step written from the last as it was rounded, so nothing drifts.
    let [px0, py0] = [px(x), px(y)];
    d += `M${px0} ${py0}`;
    const step = 9;
    for (let s = 0; s < len / step; s++) {
      a += (rand() - 0.5) * 26;
      a = a * 0.86 + 90 * 0.14;
      x += Math.cos(a * RAD) * step;
      y += Math.sin(a * RAD) * step;
      d += `l${px(x) - px0} ${px(y) - py0}`;
      [px0, py0] = [px(x), px(y)];
      if (level < 2 && rand() < 0.12 && s > 1) {
        queue.push([x, y, len * 0.35, a + (rand() < 0.5 ? -1 : 1) * (35 + rand() * 30), level + 1]);
      }
    }
  }
  return d;
}

interface Stalk {
  x: number;
  base: number;
  h: number;
  bend: number;
  ear?: number;
  leaves?: number;
}

/** A spikelet of an ear: a grain in its husk (filled and outlined by the ear), and its awn. */
function spikelet(cx: number, cy: number, angle: number, k: number, side: number) {
  const phi = angle + side * 24 * RAD;
  const tipX = cx + Math.cos(phi) * 10 * k;
  const tipY = cy + Math.sin(phi) * 10 * k;
  const awn = phi + side * 7 * RAD;
  return {
    grain: `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(4.8 * k)}" ry="${r1(10.5 * k)}" transform="rotate(${r1(phi / RAD + 90)} ${r1(cx)} ${r1(cy)})"/>`,
    awn: `M${r1(tipX)} ${r1(tipY)}L${r1(tipX + Math.cos(awn) * 30 * k)} ${r1(tipY + Math.sin(awn) * 30 * k)}`,
  };
}

/**
 * An ear of wheat lying along the x axis from the origin, `length` long: its spikelets and their
 * awns. The grains take the fill of the `<use>` that places the ear.
 */
function earShape(n: number, length: number, scale: number) {
  let grains = '';
  let awns = '';
  for (let i = 0; i < n; i++) {
    const side = i % 2 ? 1 : -1;
    const k = scale * (1 - 0.32 * (i / n));
    const s = spikelet(((i + 0.6) / n) * length, side * 3.4 * k, 0, k, side);
    grains += s.grain;
    awns += s.awn;
  }
  const tx = length + 6 * scale;
  grains += `<ellipse cx="${r1(tx)}" cy="0" rx="${r1(4 * scale)}" ry="${r1(9 * scale)}" transform="rotate(90 ${r1(tx)} 0)"/>`;
  awns += `M${r1(tx)} 0h${r1(26 * scale)}`;
  return (
    `<path d="${awns}" fill="none" stroke="${AMBER}" stroke-opacity=".65" stroke-width="1.1" stroke-linecap="round"/>` +
    `<g stroke="${AMBER}">${grains}</g>`
  );
}

/**
 * An ear of wheat from its foot along `angle` (radians), `length` long, placed from the ears of
 * its drawing: lengths in steps of `step` px, sizes in steps of a twentieth.
 */
function ear(x: number, y: number, angle: number, length: number, scale = 1, fill = GOLD, step = 4) {
  const l = Math.round(length / step) * step;
  // An ear whose size follows its length (a stalk's) keeps doing so.
  const s = scale === length / 74 ? l / 74 : Math.round(scale * 20) / 20;
  const n = Math.max(6, Math.round(l / 9));
  return reuse(
    `ear${n}-${l}-${Math.round(s * 100)}`,
    () => earShape(n, l, s),
    `fill="${fill}" transform="translate(${r1(x)} ${r1(y)}) rotate(${r1(angle / RAD)})"`,
  );
}

/** A stalk of ripe wheat: the stem, a leaf or two, and its ear. */
function wheat(s: Stalk, seed: number, tone = { stem: GOLD, ear: GOLD, opacity: 1 }) {
  const rand = rng(seed);
  const p0 = [s.x, s.base] as const;
  const p1 = [s.x + s.bend, s.base - s.h] as const;
  const c = [s.x + s.bend * 0.12, s.base - s.h * 0.6] as const;
  const point = (t: number) => [
    (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * c[0] + t ** 2 * p1[0],
    (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * c[1] + t ** 2 * p1[1],
  ];
  const angle = Math.atan2(p1[1] - c[1], p1[0] - c[0]);
  let leaves = '';
  for (let j = 0; j < (s.leaves ?? 1); j++) {
    const [lx, ly] = point(0.14 + j * 0.24 + rand() * 0.08) as [number, number];
    const side = (j + seed) % 2 ? 1 : -1;
    const len = Math.min(110, s.h * 0.42) * (0.72 + rand() * 0.38);
    const lift = 0.5 + rand() * 0.25;
    // From the stem out to the tip and back, written from the point before.
    leaves +=
      `M${r1(lx)} ${r1(ly)}q${r1(side * len * 0.42)} ${r1(-len * lift)} ${r1(side * len)} ${r1(-len * (lift - 0.42))}` +
      `q${r1(-side * len * 0.6)} ${r1(-len * 0.32)} ${r1(-side * len)} ${r1(len * (lift - 0.42) - 7)}Z`;
  }
  return (
    (tone.opacity < 1 ? `<g opacity="${tone.opacity}">` : '') +
    `<path d="M${r1(p0[0])} ${r1(p0[1])}q${r1(c[0] - p0[0])} ${r1(c[1] - p0[1])} ${r1(p1[0] - p0[0])} ${r1(p1[1] - p0[1])}" stroke="${tone.stem}" stroke-width="3" stroke-linecap="round"/>` +
    (leaves
      ? `<path d="${leaves}" fill="${tone.stem}" fill-opacity=".8" stroke="${AMBER}" stroke-opacity=".45" stroke-width="1"/>`
      : '') +
    ear(p1[0], p1[1], angle, s.ear ?? 74, (s.ear ?? 74) / 74, tone.ear) +
    (tone.opacity < 1 ? `</g>` : '')
  );
}

/** A seedling: its stem out of the soil at (x, y) and two seed leaves. */
function sprout(x: number, y: number, s: number, leaf = LEAF) {
  const top = y - s;
  return (
    `<path d="M${x} ${y}C${r1(x - s * 0.06)} ${r1(y - s * 0.4)} ${r1(x + s * 0.06)} ${r1(y - s * 0.7)} ${x} ${r1(top)}" stroke="${leaf}" stroke-width="${r1(Math.max(2, s * 0.06))}" stroke-linecap="round"/>` +
    `<path d="M${x} ${r1(top)}C${r1(x - s * 0.18)} ${r1(top - s * 0.32)} ${r1(x - s * 0.52)} ${r1(top - s * 0.3)} ${r1(x - s * 0.62)} ${r1(top - s * 0.12)}C${r1(x - s * 0.44)} ${r1(top + s * 0.06)} ${r1(x - s * 0.16)} ${r1(top + s * 0.04)} ${x} ${r1(top)}Z" fill="${leaf}"/>` +
    `<path d="M${x} ${r1(top)}C${r1(x + s * 0.16)} ${r1(top - s * 0.42)} ${r1(x + s * 0.5)} ${r1(top - s * 0.46)} ${r1(x + s * 0.66)} ${r1(top - s * 0.3)}C${r1(x + s * 0.5)} ${r1(top - s * 0.06)} ${r1(x + s * 0.2)} ${r1(top - s * 0.02)} ${x} ${r1(top)}Z" fill="${leaf}" fill-opacity=".82"/>`
  );
}

/** A seedling as `sprout` draws it, placed from its drawing's shapes: one of a row. */
const sproutUse = (x: number, y: number, s: number, leaf = LEAF) =>
  reuse(`sprout${s}-${leaf.slice(1)}`, () => sprout(0, 0, s, leaf), `x="${x}" y="${y}"`);

/** A grain of wheat seen from its side: a husked oval and its crease. */
function grainGlyph(cx: number, cy: number, len: number, angle: number, fill = GOLD) {
  const rx = len / 2;
  const ry = len * 0.3;
  return (
    `<g transform="rotate(${angle} ${cx} ${cy})">` +
    `<ellipse cx="${cx}" cy="${cy}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${fill}" stroke="${AMBER}" stroke-width="${r1(Math.max(1, len / 22))}"/>` +
    `<path d="M${r1(cx - rx * 0.62)} ${r1(cy + ry * 0.1)}Q${cx} ${r1(cy - ry * 0.45)} ${r1(cx + rx * 0.62)} ${r1(cy + ry * 0.1)}" stroke="${AMBER}" stroke-width="${r1(Math.max(1, len / 26))}" stroke-linecap="round"/>` +
    `</g>`
  );
}

/**
 * A grain as `grainGlyph` draws it, placed from its drawing's shapes: one of many. With no fill
 * (`null`), it takes the fill of what holds it.
 */
function grainUse(cx: number, cy: number, len: number, angle: number, fill: string | null = GOLD) {
  const rx = len / 2;
  const ry = len * 0.3;
  return reuse(
    `grain${len}`,
    () =>
      `<ellipse rx="${r1(rx)}" ry="${r1(ry)}" stroke="${AMBER}" stroke-width="${r1(Math.max(1, len / 22))}"/>` +
      `<path d="M${r1(-rx * 0.62)} ${r1(ry * 0.1)}Q0 ${r1(-ry * 0.45)} ${r1(rx * 0.62)} ${r1(ry * 0.1)}" fill="none" stroke="${AMBER}" stroke-width="${r1(Math.max(1, len / 26))}" stroke-linecap="round"/>`,
    `${fill ? `fill="${fill}" ` : ''}transform="translate(${cx} ${cy}) rotate(${angle})"`,
  );
}

/** The sun low over the field: a disc in its glow. */
function sunGlow(cx: number, cy: number, r: number) {
  return (
    `<circle cx="${cx}" cy="${cy}" r="${r1(r)}" fill="${GOLD}" fill-opacity=".14"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.78)}" fill="${GOLD}" fill-opacity=".2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.56)}" fill="${GOLD}" fill-opacity=".55"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The objects of the farm

/** A wooden plot sign: a board on a post, the post's point pushed into the soil. */
function plotSign(w: number, board: number, post: number) {
  const pw = 54;
  const px = (w - pw) / 2;
  const total = board + post;
  let grainLines = '';
  for (let i = 1; i < 9; i++) {
    const y = (board / 9) * i;
    grainLines += `M14 ${r1(y)}C${r1(w * 0.3)} ${r1(y - 7 + (i % 3) * 4)} ${r1(w * 0.62)} ${r1(y + 6 - (i % 2) * 5)} ${w - 14} ${r1(y - 2)}`;
  }
  return (
    `<path d="M${px} ${board - 4}H${px + pw}V${total - 40}L${w / 2} ${total}L${px} ${total - 40}Z" fill="${AMBER}"/>` +
    `<path d="M${px + 12} ${board + 6}V${total - 52}" stroke="${LOAM}" stroke-opacity=".18" stroke-width="2"/>` +
    `<rect x="0" y="0" width="${w}" height="${board}" rx="16" fill="${GOLD}"/>` +
    `<path d="${grainLines}" stroke="${AMBER}" stroke-opacity=".32" stroke-width="1.6" stroke-linecap="round"/>` +
    `<rect x="9" y="9" width="${w - 18}" height="${board - 18}" rx="10" stroke="${AMBER}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M0 ${board - 16}Q0 ${board} 16 ${board}H${w - 16}Q${w} ${board} ${w} ${board - 16}" stroke="${LOAM}" stroke-opacity=".25" stroke-width="3"/>` +
    [
      [30, 30],
      [w - 30, 30],
      [30, board - 30],
      [w - 30, board - 30],
    ]
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="6" fill="${LOAM}" fill-opacity=".55"/><circle cx="${x! - 1.5}" cy="${y! - 1.5}" r="2" fill="${PAPER}" fill-opacity=".6"/>`,
      )
      .join('')
  );
}

/**
 * A grain bin in section: the cone of its roof with the vent on top, the corrugated wall, and
 * the cut-away showing how full it is.
 */
function grainBin(w: number, h: number, level: number) {
  const roof = 100;
  const wall = h - roof;
  const fillTop = h - wall * level;
  let ribs = '';
  for (let y = roof + 16; y < h - 6; y += 14) ribs += `M6 ${y}H${w - 6}`;
  let bands = '';
  for (let y = roof + 96; y < h - 20; y += 96) bands += `M0 ${y}H${w}`;
  let kernels = '';
  const rand = rng(Math.round(level * 100));
  // Each kernel a short stroke with round ends, as long and as thick as the grain.
  for (let i = 0; i < 70; i++) {
    const x = 14 + rand() * (w - 28);
    const y = fillTop + 14 + rand() * (h - fillTop - 22);
    const a = Math.round(rand() * 180) * RAD;
    kernels += `M${r1(x - Math.cos(a) * 1.4)} ${r1(y - Math.sin(a) * 1.4)}l${r1(Math.cos(a) * 2.8)} ${r1(Math.sin(a) * 2.8)}`;
  }
  kernels = dots(kernels, 4, AMBER, 0.5);
  return (
    `<rect x="0" y="${roof}" width="${w}" height="${wall}" fill="${PAPER}"/>` +
    `<path d="${ribs}" stroke="${LOAM}" stroke-opacity=".07" stroke-width="2"/>` +
    // The cut-away: the grain in it, its surface a gentle cone.
    `<path d="M0 ${r1(fillTop + 18)}Q${w / 2} ${r1(fillTop - 18)} ${w} ${r1(fillTop + 18)}V${h}H0Z" fill="${GOLD}"/>` +
    kernels +
    `<path d="M0 ${r1(fillTop + 18)}Q${w / 2} ${r1(fillTop - 18)} ${w} ${r1(fillTop + 18)}" stroke="${AMBER}" stroke-width="2"/>` +
    `<path d="${bands}" stroke="${LOAM}" stroke-opacity=".22" stroke-width="2.4"/>` +
    `<rect x="1.2" y="${roof}" width="${w - 2.4}" height="${wall - 1.2}" stroke="${LOAM}" stroke-width="2.4"/>` +
    `<path d="M-6 ${roof + 2}L${w / 2} 14L${w + 6} ${roof + 2}Z" fill="${PAPER}" stroke="${LOAM}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M${w * 0.16} ${roof - 12}L${w / 2} 26M${w * 0.33} ${roof - 4}L${w / 2} 22M${w * 0.67} ${roof - 4}L${w / 2} 22M${w * 0.84} ${roof - 12}L${w / 2} 26" stroke="${LOAM}" stroke-opacity=".16" stroke-width="2"/>` +
    `<rect x="${w / 2 - 16}" y="0" width="32" height="18" rx="3" fill="${PAPER}" stroke="${LOAM}" stroke-width="2.4"/>` +
    `<rect x="${w / 2 - 22}" y="${h - 64}" width="44" height="64" fill="${LOAM}" fill-opacity=".12" stroke="${LOAM}" stroke-width="2"/>`
  );
}

/** A sheaf of wheat, bound at its waist with twine, standing on its cut ends. */
function sheaf(w: number, h: number) {
  const rand = rng(17);
  const cx = w / 2;
  const tie = h * 0.6;
  const n = 34;
  const stems: string[] = [];
  const ears: string[] = [];
  for (let k = 0; k < n; k++) {
    const t = k / (n - 1) - 0.5;
    const a = (-90 + t * 58 + (rand() - 0.5) * 8) * RAD;
    const waist = cx + t * 30;
    const up = h * 0.3 + rand() * h * 0.08 - Math.abs(t) * 50;
    const top = [waist + Math.cos(a) * up, tie + Math.sin(a) * up] as const;
    const end = [cx + t * 120 + (rand() - 0.5) * 10, h - 26 - Math.abs(t) * 18] as const;
    const ctrl = [waist + Math.cos(a) * up * 0.4, tie + Math.sin(a) * up * 0.4] as const;
    stems.push(
      `M${r1(end[0])} ${r1(end[1])}L${r1(waist)} ${r1(tie)}Q${r1(ctrl[0])} ${r1(ctrl[1])} ${r1(top[0])} ${r1(top[1])}`,
    );
    const tilt = a + (rand() - 0.5) * 0.2;
    // In a crown this dense, ears in steps of 8px are as varied as any.
    ears.push(ear(top[0], top[1], tilt, 80 + rand() * 20, 1.2, k % 3 ? GOLD : '#e2b75a', 8));
  }
  const band = (dy: number) =>
    `<path d="M${cx - 34} ${r1(tie + dy)}Q${cx} ${r1(tie + dy + 12)} ${cx + 34} ${r1(tie + dy)}" stroke="${LOAM}" stroke-opacity=".75" stroke-width="5" stroke-linecap="round"/>`;
  return (
    `<ellipse cx="${cx}" cy="${h - 22}" rx="${r1(w * 0.36)}" ry="16" fill="${LOAM}" fill-opacity=".12"/>` +
    // The stems once, stroked twice: straw, and a thin line of shade along each.
    reuse(
      'sheaf-stems',
      () => `<path d="${stems.join('')}"/>`,
      `stroke="${GOLD}" stroke-width="3.2" stroke-linecap="round"`,
    ) +
    `<use href="#@sheaf-stems" stroke="${AMBER}" stroke-opacity=".3" stroke-width="1" stroke-linecap="round"/>` +
    ears.join('') +
    band(-10) +
    band(4) +
    `<path d="M${cx + 30} ${r1(tie + 4)}q18 6 22 30M${cx + 30} ${r1(tie + 4)}q30 -4 40 18" stroke="${LOAM}" stroke-opacity=".75" stroke-width="3" stroke-linecap="round"/>`
  );
}

/** The outline of a seed packet: a paper bag with its top crimped shut. */
function packet(w: number, h: number) {
  const teeth = Math.round(w / 16);
  let top = 'M0 18';
  for (let i = 0; i < teeth; i++) {
    const x = (w / teeth) * i;
    top += `L${r1(x + w / teeth / 2)} 6L${r1(x + w / teeth)} 18`;
  }
  return (
    `<path d="${top}V${h - 8}Q${w} ${h} ${w - 8} ${h}H8Q0 ${h} 0 ${h - 8}Z" fill="${PAPER}"/>` +
    `<path d="M0 34H${w}" stroke="${LOAM}" stroke-opacity=".14" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>` +
    `<path d="M${w - 1} 40V${h - 10}" stroke="${LOAM}" stroke-opacity=".08" stroke-width="2"/>`
  );
}

/** Clover and vetch: the cover crop, sown between harvests. */
function coverCrop(w: number, h: number) {
  const rand = rng(5);
  let body = `<rect width="${w}" height="${h}" rx="6" fill="${SAGE}" fill-opacity=".22"/>`;
  body += `<path d="M0 ${h - 34}H${w}V${h - 6}Q${w} ${h} ${w - 6} ${h}H6Q0 ${h} 0 ${h - 6}Z" fill="${LOAM}" fill-opacity=".85"/>`;
  // A clover head drawn once at a size of 10 (nothing in it is stroked) and placed at its size.
  const clover = (x: number, y: number, s: number) =>
    reuse(
      'clover',
      () => {
        const leaf = (a: number) => {
          const lx = Math.cos(a * RAD) * 5.5;
          const ly = Math.sin(a * RAD) * 5.5;
          return `<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="4.2" ry="3.4" transform="rotate(${a} ${r1(lx)} ${r1(ly)})" fill="${LEAF}"/>`;
        };
        return leaf(-90) + leaf(30) + leaf(150) + `<circle r="1.2" fill="${SAGE}"/>`;
      },
      `transform="translate(${r1(x)} ${r1(y)}) scale(${Math.round(s * 10) / 100})"`,
    );
  let stems = '';
  let heads = '';
  for (let i = 0; i < 9; i++) {
    const x = 30 + i * ((w - 60) / 8) + (rand() - 0.5) * 16;
    const top = 50 + rand() * 60;
    stems += `M${r1(x)} ${h - 34}Q${r1(x + (rand() - 0.5) * 30)} ${r1((h - 34 + top) / 2)} ${r1(x)} ${r1(top)}`;
    heads += clover(x, top, 22 + rand() * 8);
  }
  // Vetch climbing between them: a tendril, its paired leaflets, a flower.
  let vetch = '';
  for (let i = 0; i < 4; i++) {
    const x = 70 + i * ((w - 140) / 3);
    const y0 = h - 34;
    vetch += `<path d="M${r1(x)} ${y0}C${r1(x + 20)} ${y0 - 50} ${r1(x - 20)} ${y0 - 90} ${r1(x + 10)} ${y0 - 120}c10 -8 18 -2 12 6" stroke="${LEAF}" stroke-width="2" stroke-linecap="round"/>`;
    for (let j = 1; j < 4; j++) {
      const ly = y0 - j * 30;
      vetch += `<ellipse cx="${r1(x + 9)}" cy="${ly}" rx="7" ry="3" fill="${SAGE}"/><ellipse cx="${r1(x - 7)}" cy="${ly - 6}" rx="7" ry="3" fill="${SAGE}"/>`;
    }
    vetch += `<circle cx="${r1(x + 12)}" cy="${y0 - 128}" r="7" fill="${AMBER}" fill-opacity=".8"/><circle cx="${r1(x + 4)}" cy="${y0 - 134}" r="5" fill="${AMBER}" fill-opacity=".55"/>`;
  }
  return body + `<path d="${stems}" stroke="${LEAF}" stroke-width="2.4" stroke-linecap="round"/>` + vetch + heads;
}

/** A drip line along a row of young plants: an emitter at each, and its drop. */
function dripRow(w: number, h: number) {
  let body = `<rect width="${w}" height="${h}" rx="6" fill="${SKY}" fill-opacity=".14"/>`;
  body += `<path d="M0 ${h - 52}H${w}V${h - 6}Q${w} ${h} ${w - 6} ${h}H6Q0 ${h} 0 ${h - 6}Z" fill="${LOAM}" fill-opacity=".85"/>`;
  const pipeY = h - 46;
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * ((w - 100) / 4);
    body += sproutUse(x + 22, h - 52, 54 + (i % 2) * 18, LEAF);
  }
  body += `<path d="M-2 ${pipeY}H${w + 2}" stroke="${LOAM}" stroke-width="10"/>`;
  body += `<path d="M-2 ${pipeY - 3}H${w + 2}" stroke="${PAPER}" stroke-opacity=".25" stroke-width="2"/>`;
  for (let i = 0; i < 5; i++) {
    const x = 50 + i * ((w - 100) / 4);
    body += `<rect x="${r1(x - 8)}" y="${pipeY - 8}" width="16" height="16" rx="3" fill="${LOAM}" stroke="${PAPER}" stroke-opacity=".4" stroke-width="1.4"/>`;
    body += `<path d="M${r1(x)} ${pipeY + 10}c-4 7 -6 10 -6 13a6 6 0 0 0 12 0c0 -3 -2 -6 -6 -13z" fill="${SKY}"/>`;
  }
  return body;
}

/** A seed tray from above: a cell for each variety the bank keeps. */
function seedTray(w: number, h: number) {
  const cols = 6;
  const rows = 2;
  const pad = 14;
  const cw = (w - pad * 2) / cols;
  const ch = (h - pad * 2) / rows;
  const rand = rng(9);
  let body = `<rect width="${w}" height="${h}" rx="8" fill="${AMBER}" fill-opacity=".14"/>`;
  const seeds = [
    (x: number, y: number) => grainUse(r1(x), r1(y), 20, Math.round(rand() * 180), GOLD),
    (x: number, y: number) =>
      reuse('pea', () => `<circle r="7.5" fill="#e2c07a" stroke="${AMBER}" stroke-width="1.2"/>`, `x="${r1(x)}" y="${r1(y)}"`),
    (x: number, y: number) =>
      reuse('lentil', () => `<ellipse rx="7" ry="5" fill="${AMBER}" fill-opacity=".8"/>`, `x="${r1(x)}" y="${r1(y)}"`),
    (x: number, y: number) =>
      reuse(
        'sunflower',
        () =>
          `<path d="M-11 0Q0 -9 11 0Q0 9 -11 0Z" fill="${LOAM}"/><path d="M-7 0H7" stroke="${PAPER}" stroke-width="1.6"/>`,
        `transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rand() * 180)})"`,
      ),
    (x: number, y: number) => grainUse(r1(x), r1(y), 22, Math.round(rand() * 180), '#e2c07a'),
    (x: number, y: number) =>
      reuse('vetch', () => `<circle r="5" fill="${LEAF}" fill-opacity=".85"/>`, `x="${r1(x)}" y="${r1(y)}"`),
  ];
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      const x = pad + c * cw;
      const y = pad + r * ch;
      body += `<rect x="${r1(x + 5)}" y="${r1(y + 5)}" width="${r1(cw - 10)}" height="${r1(ch - 10)}" rx="10" fill="${PAPER}" stroke="${LOAM}" stroke-opacity=".18" stroke-width="1.5"/>`;
      const kind = seeds[(c + r * 3) % seeds.length]!;
      for (let i = 0; i < 6; i++) {
        body += kind(x + cw / 2 + (rand() - 0.5) * (cw - 34), y + ch / 2 + (rand() - 0.5) * (ch - 34));
      }
    }
  }
  return body;
}

/** The weather of a season, as a small glyph: rain, a sun behind cloud, the sun, the wind. */
function weather(season: number) {
  const cloud = (x: number, y: number, s: number, fill: string, op = 1) =>
    `<g opacity="${op}" fill="${fill}">` +
    `<circle cx="${r1(x + 18 * s)}" cy="${r1(y - 12 * s)}" r="${r1(11 * s)}"/>` +
    `<circle cx="${r1(x + 36 * s)}" cy="${r1(y - 18 * s)}" r="${r1(15 * s)}"/>` +
    `<circle cx="${r1(x + 52 * s)}" cy="${r1(y - 9 * s)}" r="${r1(10 * s)}"/>` +
    `<rect x="${r1(x + 6 * s)}" y="${r1(y - 12 * s)}" width="${r1(56 * s)}" height="${r1(13 * s)}" rx="${r1(6.5 * s)}"/></g>`;
  switch (season) {
    case 0:
      return (
        cloud(22, 38, 1, MUTED, 0.85) +
        `<path d="M32 48l-5 12M48 48l-5 12M64 48l-5 12M40 62l-4 8M56 62l-4 8" stroke="${SKY}" stroke-width="3" stroke-linecap="round"/>`
      );
    case 1:
      return (
        `<circle cx="56" cy="24" r="15" fill="${GOLD}"/>` +
        [0, 45, 90, 135, 180, 225, 270, 315]
          .map(
            (a) =>
              `<path d="M${r1(56 + Math.cos(a * RAD) * 21)} ${r1(24 + Math.sin(a * RAD) * 21)}L${r1(56 + Math.cos(a * RAD) * 27)} ${r1(24 + Math.sin(a * RAD) * 27)}" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
          )
          .join('') +
        cloud(14, 56, 0.9, MUTED, 0.6) +
        `<path d="M24 64l-3 7M40 64l-3 7" stroke="${SKY}" stroke-width="3" stroke-linecap="round"/>`
      );
    case 2:
      return (
        `<circle cx="40" cy="36" r="19" fill="${GOLD}"/>` +
        Array.from({ length: 12 }, (_, i) => i * 30)
          .map(
            (a) =>
              `<path d="M${r1(40 + Math.cos(a * RAD) * 26)} ${r1(36 + Math.sin(a * RAD) * 26)}L${r1(40 + Math.cos(a * RAD) * (a % 60 ? 32 : 36))} ${r1(36 + Math.sin(a * RAD) * (a % 60 ? 32 : 36))}" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`,
          )
          .join('')
      );
    default:
      return (
        `<path d="M8 26h46a10 10 0 1 0 -10 -10M8 40h62a10 10 0 1 1 -10 10M16 54h24" stroke="${MUTED}" stroke-width="3" stroke-linecap="round" fill="none"/>` +
        `<path d="M78 22c10 -8 24 -6 26 6c-10 8 -22 8 -26 -6z" fill="${AMBER}"/><path d="M78 22l24 4" stroke="${PAPER}" stroke-width="1.4"/>`
      );
  }
}

/** The crop of a season over its stretch of the row: sprouts, tillers, ripe ears, stubble and seed. */
function seasonCrop(season: number, w: number, h: number) {
  const base = h;
  const rand = rng(31 + season);
  let body = '';
  const xs = Array.from({ length: 7 }, (_, i) => 30 + i * ((w - 60) / 6));
  switch (season) {
    case 0:
      for (const x of xs) body += sprout(r1(x + (rand() - 0.5) * 10), base, 30 + rand() * 12, LEAF);
      break;
    case 1:
      for (const x of xs) {
        for (let b = 0; b < 5; b++) {
          const lean = (b - 2) * 9 + (rand() - 0.5) * 6;
          const hh = 70 + rand() * 40;
          body += `<path d="M${r1(x)} ${base}Q${r1(x + lean * 0.4)} ${r1(base - hh * 0.6)} ${r1(x + lean * 1.6)} ${r1(base - hh)}" stroke="${b % 2 ? SAGE : LEAF}" stroke-width="4" stroke-linecap="round"/>`;
        }
      }
      break;
    case 2:
      for (const [i, x] of xs.entries()) {
        body += wheat(
          { x: r1(x + (rand() - 0.5) * 8), base, h: 62 + rand() * 22, bend: (rand() - 0.5) * 22, ear: 36, leaves: 1 },
          season * 10 + i,
        );
      }
      break;
    default:
      // Stubble after the harvest, the seed going in, and the first green.
      for (const x of xs) {
        for (let b = 0; b < 3; b++) {
          const sx = x - 10 + b * 10;
          body += `<path d="M${r1(sx)} ${base}L${r1(sx + (b - 1) * 3)} ${r1(base - 16 - rand() * 10)}" stroke="${AMBER}" stroke-width="3" stroke-linecap="round"/>`;
        }
      }
      for (let i = 0; i < 6; i++) {
        const x = 50 + i * ((w - 100) / 5);
        const y = base - 70 + (i % 2) * 22;
        body += grainUse(r1(x + 18), y, 16, 60 + i * 20);
        body += `<path d="M${r1(x + 18)} ${y + 10}V${y + 26}" stroke="${GOLD}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>`;
      }
      break;
  }
  return body;
}

/** A plot seen from above at one step of the switch, its hedge around it. */
function plot(step: number, s: number) {
  const rand = rng(41 + step);
  const clip = `<rect x="6" y="6" width="${s - 12}" height="${s - 12}" rx="8"`;
  let field = '';
  const rows = (color: string, opacity: number, width: number, gap = 18, angle = 0, shift = 0) => {
    let d = '';
    for (let x = -s + shift; x < s * 2; x += gap) {
      d += `M${r1(x)} -10L${r1(x + Math.tan(angle * RAD) * (s + 20))} ${s + 10}`;
    }
    return `<path d="${d}" stroke="${color}" stroke-opacity="${opacity}" stroke-width="${width}" clip-path="url(#sade-plot-${step})"/>`;
  };
  switch (step) {
    case 0:
      // Bare soil, and the cores taken from it.
      field = `${clip} fill="${LOAM}" fill-opacity=".86"/>` + rows(STRAW, 0.06, 6, 22, 12);
      for (const [x, y] of [
        [0.3, 0.3],
        [0.68, 0.42],
        [0.42, 0.72],
        [0.75, 0.78],
      ] as const) {
        field +=
          `<circle cx="${r1(x * s)}" cy="${r1(y * s)}" r="13" stroke="${GOLD}" stroke-width="3"/>` +
          `<circle cx="${r1(x * s)}" cy="${r1(y * s)}" r="4" fill="${GOLD}"/>`;
      }
      break;
    case 1:
      // The plan: the field divided into its strips, staked out.
      field = `${clip} fill="${LOAM}" fill-opacity=".8"/>` + rows(STRAW, 0.06, 6, 22, 12);
      field += `<path d="M${s * 0.36} 6V${s - 6}M${s * 0.68} 6V${s - 6}M6 ${s * 0.5}H${s - 6}" stroke="${PAPER}" stroke-width="2.4" stroke-dasharray="8 7"/>`;
      for (const [x, y] of [
        [0.36, 0.5],
        [0.68, 0.5],
        [0.36, 0.08],
        [0.68, 0.92],
      ] as const) {
        field += `<rect x="${r1(x * s - 6)}" y="${r1(y * s - 6)}" width="12" height="12" rx="2" fill="${GOLD}" stroke="${AMBER}" stroke-width="1.5"/>`;
      }
      break;
    case 2:
      // The cover crop, sown in rows on the soil.
      field = `${clip} fill="${LOAM}" fill-opacity=".8"/>`;
      {
        // Each plant a dot: three sizes, two greens.
        const plants: Record<string, string> = {};
        for (let y = 26; y < s - 14; y += 24) {
          for (let x = 22 + (y % 48 ? 6 : 0); x < s - 14; x += 16) {
            const cx = r1(x + (rand() - 0.5) * 3);
            const cy = r1(y + (rand() - 0.5) * 3);
            const r = 4.5 + rand() * 2.5;
            const key = `${r < 5.33 ? 9.8 : r < 6.17 ? 11.5 : 13.2} ${rand() < 0.3 ? SAGE : LEAF}`;
            plants[key] = `${plants[key] ?? ''}M${cx} ${cy}h0`;
          }
        }
        for (const [key, d] of Object.entries(plants)) {
          const [width, colour] = key.split(' ') as [string, string];
          field += dots(d, Number(width), colour, 1);
        }
      }
      break;
    case 3:
      // Drip lines along the rows, and the pump at the field's edge.
      field = `${clip} fill="${LEAF}" fill-opacity=".85"/>` + rows(SAGE, 0.55, 10, 30);
      field += rows(SKY, 1, 2.6, 30, 0, 15);
      field += `<rect x="${s - 44}" y="${s - 44}" width="26" height="26" rx="4" fill="${PAPER}" stroke="${SKY}" stroke-width="3"/><circle cx="${s - 31}" cy="${s - 31}" r="5" fill="${SKY}"/>`;
      break;
    default:
      // The harvest: the ripe field, and the swath the combine has cut through it.
      field = `${clip} fill="${GOLD}"/>` + rows(AMBER, 0.32, 5, 14);
      {
        // The combine from above: its body, the cab, the header across the swath, the auger.
        const cx = r1(s * 0.6);
        const cy = r1(s * 0.62);
        field += `<path d="M6 ${cy}H${cx}" stroke="${STRAW}" stroke-width="${r1(s * 0.18)}" clip-path="url(#sade-plot-${step})"/>`;
        field += `<path d="M6 ${cy}H${cx}" stroke="${AMBER}" stroke-opacity=".35" stroke-width="2" stroke-dasharray="2 6" clip-path="url(#sade-plot-${step})"/>`;
        field +=
          `<path d="M${cx + 20} ${cy - 15}L${cx + 4} ${r1(cy - s * 0.22)}" stroke="${LEAF}" stroke-width="6" stroke-linecap="round"/>` +
          `<rect x="${cx}" y="${cy - 16}" width="42" height="32" rx="6" fill="${LEAF}"/>` +
          `<rect x="${cx + 22}" y="${cy - 9}" width="14" height="18" rx="3" fill="${PAPER}" fill-opacity=".85"/>` +
          `<rect x="${cx + 44}" y="${r1(cy - s * 0.11)}" width="10" height="${r1(s * 0.22)}" rx="3" fill="${AMBER}" stroke="${LOAM}" stroke-opacity=".3" stroke-width="1"/>`;
      }
      break;
  }
  return (
    `<defs><clipPath id="sade-plot-${step}"><rect x="6" y="6" width="${s - 12}" height="${s - 12}" rx="8"/></clipPath></defs>` +
    `<rect x="0" y="0" width="${s}" height="${s}" rx="12" fill="${PAPER}"/>` +
    field +
    `<rect x="6" y="6" width="${s - 12}" height="${s - 12}" rx="8" stroke="${LOAM}" stroke-opacity=".25" stroke-width="1.5"/>`
  );
}

/**
 * A soil profile, as the comparison shows it: the ploughed field (a bare crust that the rain
 * runs off, a pan at 25 cm where the roots stop) or the field under no-till (straw on the
 * surface, a cover crop, crumbly soil, worms, roots to the bottom, rain that soaks in).
 */
function profile(w: number, h: number, living: boolean) {
  const surface = 70;
  const cm = (h - surface - 14) / 90;
  const rand = rng(living ? 61 : 67);
  let body = `<rect width="${w}" height="${h}" rx="8" fill="${living ? SKY : MUTED}" fill-opacity=".08"/>`;
  body += `<path d="M0 ${surface}H${w}V${h - 8}Q${w} ${h} ${w - 8} ${h}H8Q0 ${h} 0 ${h - 8}Z" fill="${LOAM}" fill-opacity="${living ? 0.92 : 0.78}"/>`;
  // Rain over both.
  let rain = '';
  for (let i = 0; i < 12; i++) {
    const x = 30 + i * ((w - 60) / 11);
    rain += `M${r1(x)} ${12 + (i % 3) * 8}l-4 12`;
  }
  body += `<path d="${rain}" stroke="${SKY}" stroke-width="2.6" stroke-linecap="round"/>`;
  if (!living) {
    // The crust and its cracks, the water running off, the pan, roots that stop at it.
    const pan = surface + 25 * cm;
    body += `<rect x="0" y="${r1(pan)}" width="${w}" height="${r1(9 * cm)}" fill="${MUTED}" fill-opacity=".55"/>`;
    let hatch = '';
    for (let x = -40; x < w; x += 12) hatch += `M${x} ${r1(pan + 9 * cm)}L${x + 22} ${r1(pan)}`;
    body += `<path d="${hatch}" stroke="${LOAM}" stroke-opacity=".4" stroke-width="1.6"/>`;
    let cracks = '';
    for (let i = 0; i < 9; i++) {
      const x = 40 + i * ((w - 80) / 8) + (rand() - 0.5) * 20;
      cracks += `M${r1(x)} ${surface}l${r1((rand() - 0.5) * 8)} 10l${r1((rand() - 0.5) * 8)} 9`;
    }
    body += `<path d="${cracks}" stroke="${STRAW}" stroke-opacity=".35" stroke-width="1.6"/>`;
    let dense = '';
    for (let y = pan + 9 * cm + 14; y < h - 10; y += 16) {
      dense += `M${r1(10 + rand() * 30)} ${r1(y)}H${r1(w - 10 - rand() * 30)}`;
    }
    body += `<path d="${dense}" stroke="${STRAW}" stroke-opacity=".07" stroke-width="2" stroke-dasharray="${Math.round(30 + rand() * 30)} 14"/>`;
    for (let i = 0; i < 18; i++) {
      const x = 16 + rand() * (w - 32);
      const y = pan + 9 * cm + 10 + rand() * (h - pan - 9 * cm - 24);
      body += `<rect x="${r1(x)}" y="${r1(y)}" width="${r1(10 + rand() * 16)}" height="${r1(5 + rand() * 5)}" rx="2" fill="${STRAW}" fill-opacity=".09"/>`;
    }
    body += `<path d="M40 ${surface - 12}H${w - 70}" stroke="${SKY}" stroke-width="3" stroke-linecap="round" stroke-dasharray="14 10"/><path d="M${w - 84} ${surface - 20}l14 8l-14 8" stroke="${SKY}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
    let rootPaths = '';
    for (let i = 0; i < 6; i++) {
      const x = 70 + i * ((w - 140) / 5);
      body += sproutUse(r1(x), surface, 26, MUTED);
      rootPaths += roots(x, surface + 2, 22 * cm, 300 + i, 1.8);
    }
    body += `<path d="${rootPaths}" stroke="${STRAW}" stroke-opacity=".45" stroke-width="1.6" stroke-linecap="round"/>`;
    return body;
  }
  // Straw left on the surface, the cover crop, crumbs, the worm and its burrow, deep roots.
  let straw = '';
  for (let i = 0; i < 40; i++) {
    const x = 6 + rand() * (w - 12);
    const a = (rand() - 0.5) * 50;
    straw += `M${r1(x)} ${r1(surface - 2 - rand() * 4)}l${r1(Math.cos(a * RAD) * 14)} ${r1(Math.sin(a * RAD) * 3)}`;
  }
  // The crumbs, as dots of three sizes in two strengths.
  const crumbs: Record<string, [number, number][]> = {};
  for (let i = 0; i < 160; i++) {
    const x = 6 + rand() * (w - 12);
    const y = surface + 8 + rand() * (h - surface - 20);
    const r = 1.5 + rand() * 2.6;
    const opacity = 0.06 + rand() * 0.1;
    const key = `${r < 2.37 ? 3.8 : r < 3.23 ? 5.6 : 7.4} ${opacity < 0.11 ? 0.08 : 0.13}`;
    (crumbs[key] ??= []).push([x, y]);
  }
  body += Object.entries(crumbs)
    .map(([key, points]) => {
      const [width, opacity] = key.split(' ').map(Number) as [number, number];
      return dots(dotPath(points), width, STRAW, opacity);
    })
    .join('');
  let rootPaths = '';
  for (let i = 0; i < 7; i++) {
    const x = 50 + i * ((w - 100) / 6);
    rootPaths += roots(x, surface + 2, (h - surface) * (0.82 + rand() * 0.14), 400 + i, 1.1);
  }
  body += `<path d="${rootPaths}" stroke="${STRAW}" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round"/>`;
  // Water soaking down.
  let soak = '';
  for (let i = 0; i < 5; i++) {
    const x = 100 + i * ((w - 200) / 4);
    soak += `M${r1(x)} ${surface + 14}v26M${r1(x - 7)} ${surface + 32}l7 9l7 -9`;
  }
  body += `<path d="${soak}" stroke="${SKY}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>`;
  // The worm.
  body += `<path d="M${w * 0.62} ${surface + 60 * cm}c14 -10 26 6 40 -2s22 -12 34 -2" stroke="#c9826b" stroke-width="7" stroke-linecap="round"/>`;
  body += `<path d="M${w * 0.62 + 74} ${surface + 60 * cm - 6}c4 -20 -6 -40 2 -60s-4 -40 0 -${r1(60 * cm - 120)}" stroke="${STRAW}" stroke-opacity=".18" stroke-width="5" stroke-linecap="round"/>`;
  body += `<path d="${straw}" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>`;
  for (let i = 0; i < 7; i++) {
    const x = 50 + i * ((w - 100) / 6);
    body += sproutUse(r1(x), surface, 34 + (i % 2) * 8, LEAF);
  }
  return body;
}

/** A rain gauge: its funnel, the graduated tube and the water standing in it. */
function rainGauge(w: number, h: number, level: number) {
  const tubeX = w / 2 - 26;
  const tubeTop = 96;
  const tubeBottom = h - 44;
  const water = tubeBottom - (tubeBottom - tubeTop) * level;
  let ticks = '';
  for (let y = tubeBottom - 10, i = 0; y > tubeTop + 10; y -= 14, i++) {
    ticks += `M${tubeX + 52} ${y}h${i % 5 ? -12 : -22}`;
  }
  return (
    `<path d="M${w / 2 - 46} 30H${w / 2 + 46}L${w / 2 + 26} ${tubeTop}H${w / 2 - 26}Z" fill="${PAPER}" stroke="${LOAM}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M${w / 2 - 50} 30H${w / 2 + 50}" stroke="${LOAM}" stroke-width="4" stroke-linecap="round"/>` +
    `<rect x="${tubeX}" y="${tubeTop}" width="52" height="${tubeBottom - tubeTop}" fill="${PAPER}"/>` +
    `<rect x="${tubeX}" y="${r1(water)}" width="52" height="${r1(tubeBottom - water)}" fill="${SKY}" fill-opacity=".55"/>` +
    `<path d="M${tubeX} ${r1(water)}h52" stroke="${SKY}" stroke-width="3"/>` +
    `<path d="${ticks}" stroke="${LOAM}" stroke-opacity=".7" stroke-width="2"/>` +
    `<rect x="${tubeX}" y="${tubeTop}" width="52" height="${tubeBottom - tubeTop}" stroke="${LOAM}" stroke-width="2.4"/>` +
    `<path d="M${tubeX + 10} ${tubeTop + 10}V${tubeBottom - 10}" stroke="${PAPER}" stroke-opacity=".9" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${w / 2} 4c-6 9 -9 13 -9 17a9 9 0 0 0 18 0c0 -4 -3 -8 -9 -17z" fill="${SKY}"/>` +
    `<path d="M${w / 2} ${tubeBottom}V${h}" stroke="${AMBER}" stroke-width="10"/>` +
    `<path d="M${w / 2 - 34} ${h - 2}H${w / 2 + 34}" stroke="${LOAM}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>`
  );
}

/**
 * The furrows of a field in perspective, running to a point on the horizon `hz` down the box,
 * with the trees of the field's far edge standing on it.
 */
function furrows(w: number, h: number, vx: number, hz: number) {
  const n = 46;
  let wedges = '';
  for (let i = 0; i < n; i++) {
    const x1 = -w * 1.6 + (i / n) * w * 3.6;
    const x2 = -w * 1.6 + ((i + 0.5) / n) * w * 3.6;
    wedges += `M${vx} ${hz}L${r1(x1)} ${h}L${r1(x2)} ${h}Z`;
  }
  let trees = '';
  const rand = rng(88);
  for (let x = 20; x < w; x += 40 + rand() * 110) {
    if (Math.abs(x - vx) < 240) continue;
    const r = 8 + rand() * 9;
    trees +=
      `<path d="M${r1(x)} ${hz}V${r1(hz - r * 0.9)}" stroke="${AMBER}" stroke-opacity=".6" stroke-width="2"/>` +
      `<ellipse cx="${r1(x)}" cy="${r1(hz - r * 1.2)}" rx="${r1(r * 1.35)}" ry="${r1(r)}" fill="${LEAF}" fill-opacity=".5"/>`;
  }
  const field = h - hz;
  return (
    `<defs><linearGradient id="sade-closing-haze" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${STRAW}" stop-opacity=".8"/><stop offset=".42" stop-color="${STRAW}" stop-opacity="0"/>` +
    `<stop offset=".7" stop-color="${LOAM}" stop-opacity="0"/><stop offset="1" stop-color="${LOAM}" stop-opacity=".22"/></linearGradient></defs>` +
    trees +
    `<rect x="0" y="${hz}" width="${w}" height="${field}" fill="${GOLD}"/>` +
    `<path d="${wedges}" fill="${AMBER}" fill-opacity=".45"/>` +
    `<rect x="0" y="${hz}" width="${w}" height="${field}" fill="url(#sade-closing-haze)"/>` +
    `<path d="M0 ${hz + 0.8}H${w}" stroke="${AMBER}" stroke-opacity=".6" stroke-width="1.6"/>`
  );
}

/** The edge of a card as a bed of soil: a strip of loam, ridged by the drill, along its top. */
function bed(w: number, h: number, seed: number) {
  return soil(w, h, seed, { ridge: 2, horizons: [], grain: 1.6 });
}

/** Heaps of the crops' seed, as samples are poured out on a table: wheat, chickpeas, lentils. */
function heaps(w: number, h: number) {
  const rand = rng(77);
  const kinds = [
    // The wheat takes the fill of its heap.
    (x: number, y: number) => grainUse(px(x), px(y), 20, Math.round(rand() * 180), null),
    (x: number, y: number) =>
      reuse(
        'chickpea',
        () => `<circle r="8.5" fill="#e6c98a" stroke="${AMBER}" stroke-width="1.3"/>`,
        `x="${px(x)}" y="${px(y)}"`,
      ),
    (x: number, y: number) =>
      reuse(
        'heaped-lentil',
        () => `<ellipse rx="7.5" ry="5" fill="${AMBER}" stroke="${LOAM}" stroke-opacity=".25"/>`,
        `transform="translate(${px(x)} ${px(y)}) rotate(${Math.round(rand() * 180)})"`,
      ),
  ];
  let body = `<ellipse cx="${w / 2}" cy="${h - 10}" rx="${w / 2 - 6}" ry="9" fill="${LOAM}" fill-opacity=".1"/>`;
  [0.2, 0.52, 0.82].forEach((at, k) => {
    const cx = w * at;
    const rx = w * 0.13;
    const ry = h * (0.52 - k * 0.06);
    const seeds: [number, number][] = [];
    for (let i = 0; i < 56; i++) {
      const u = rand() * 2 - 1;
      const top = Math.sqrt(1 - u * u) * ry;
      seeds.push([cx + u * rx, h - 14 - rand() * top]);
    }
    seeds.sort((a, b) => a[1] - b[1]);
    const heap = seeds.map(([x, y]) => kinds[k]!(x, y)).join('');
    body += k === 0 ? `<g fill="${GOLD}">${heap}</g>` : heap;
  });
  return body;
}

/** A grain as a quotation mark: a seed pointed at both ends, with its crease. */
function quoteGrain(cx: number, cy: number, s: number) {
  const d =
    `M0 ${-s / 2}C${r1(s * 0.38)} ${r1(-s * 0.28)} ${r1(s * 0.38)} ${r1(s * 0.28)} 0 ${s / 2}` +
    `C${r1(-s * 0.38)} ${r1(s * 0.28)} ${r1(-s * 0.38)} ${r1(-s * 0.28)} 0 ${-s / 2}Z`;
  return (
    `<g transform="translate(${cx} ${cy}) rotate(28)">` +
    `<path d="${d}" fill="${AMBER}"/>` +
    `<path d="M0 ${r1(-s * 0.34)}Q${r1(s * 0.1)} 0 0 ${r1(s * 0.34)}" stroke="${GOLD}" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** Birds far off over the field: a few strokes. */
function birds() {
  return [
    [20, 34, 1],
    [62, 18, 0.8],
    [104, 40, 0.65],
  ]
    .map(
      ([x, y, k]) =>
        `<path d="M${x} ${y}q${r1(8 * k!)} ${r1(-9 * k!)} ${r1(16 * k!)} 0q${r1(8 * k!)} ${r1(-9 * k!)} ${r1(16 * k!)} 0" stroke="${LOAM}" stroke-opacity=".6" stroke-width="2.4" stroke-linecap="round"/>`,
    )
    .join('');
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const W = 1920;
const START = 128;
const END = 128;
const WIDTH = W - START - END;
/** Where the soil the foot stands on begins. */
const SOIL = 1014;

/** The grain before a kicker. */
const kickerGrain = (id: string, top: number, x = START) =>
  art(id, at(x, top + 5, 26, 26), grainGlyph(13, 13, 22, -38));

/** The kicker on its grain, and the title; without a kicker, the title on the grain. */
function head(name: string, width = 1100, lines = 1, kicker = true) {
  const title = at(START, 132, width, Math.round(58 * 1.3 * lines) + 4);
  if (!kicker) {
    return {
      placeholders: [
        place('p_title', 'title', { ...at(START + 42, 108, width - 42, title.h) }, 'title'),
      ],
      decorations: [kickerGrain(`d_sade_${name}_grain`, 124)],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 38, 90, Math.min(900, width - 38), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [kickerGrain(`d_sade_${name}_grain`, 90)],
  };
}

/** The mark of the deck: a seedling in a ring, which the user may replace with a logo. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const c = s / 2;
  return drawing(
    id,
    frame,
    svg(
      s,
      s,
      `<circle cx="${c}" cy="${c}" r="${r1(c - 1.5)}" fill="${PAPER}" stroke="${LOAM}" stroke-width="1.8"/>` +
        `<path d="M${r1(s * 0.24)} ${r1(s * 0.74)}H${r1(s * 0.76)}" stroke="${AMBER}" stroke-width="${r1(s * 0.05)}" stroke-linecap="round"/>` +
        sprout(c, r1(s * 0.74), r1(s * 0.34), LEAF) +
        `<ellipse cx="${c}" cy="${r1(s * 0.8)}" rx="${r1(s * 0.07)}" ry="${r1(s * 0.045)}" fill="${GOLD}"/>`,
    ),
    PAINT,
    { role: 'logo', name: 'logo' },
  );
}

/** The strip of loam every content slide stands on, its grass at the surface. */
const footSoil = (() => {
  const body = soil(W, 66, 3, { ridge: 3, horizons: [0.6], grain: 1.3 });
  return `<g transform="translate(0 8)">${body}</g>${tufts(W, 10, 7)}`;
})();

/**
 * The foot of a content slide: the mark and the deck's name at the start; at the end the
 * slide's number on a plant label pushed into the strip of loam, the seed drilled before it.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 58, 960, 900, 36), 'caption')]
      : [],
    decorations: [
      art(`d_sade_${name}_soil`, { x: 0, y: SOIL - 8, w: W, h: 1080 - SOIL + 8 }, footSoil),
      mark(`d_sade_${name}_mark`, at(START, 955, 42, 42)),
      art(
        `d_sade_${name}_seeds`,
        atEnd(END + 84, 968, 132, 20),
        [0, 1, 2, 3, 4].map((i) => grainUse(10 + i * 27, 10, 15, -30 + i * 6)).join(''),
      ),
      art(
        `d_sade_${name}_label`,
        atEnd(END, 944, 64, 104),
        `<path d="M24 46H40V92L32 104L24 92Z" fill="${AMBER}"/>` +
          `<rect x="0" y="0" width="64" height="48" rx="7" fill="${GOLD}"/>` +
          `<rect x="4" y="4" width="56" height="40" rx="5" stroke="${AMBER}" stroke-opacity=".5" stroke-width="1.5"/>`,
      ),
      pageNumber(`d_sade_${name}_number`, atEnd(END, 950, 64, 36), 'caption', {
        color: token('text'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A card of paper: lifted off the straw a little. */
const card = (id: string, frame: Frame, radius = 10) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.1), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 14, blur: 36, color: { value: '#3b2a14', alpha: 0.1 } } },
  });

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of packets, seasons, plots and people. */
const cards3 = [START, START + 568, START + 1136];
const seasons4 = [START, START + 416, START + 832, START + 1248];
const steps5 = [START, START + 341, START + 682, START + 1023, START + 1364];
const team4 = [START, START + 424, START + 848, START + 1272];
/** Where the three bins of the figures stand, from the end. */
const bins3 = [END + 592, END + 296, END];

function layouts(): Layout[] {
  // The stand of wheat of the opening, rooted in the soil that runs across the slide.
  const stand = atEnd(40, 146, 900, 620);
  const standStalks: Stalk[] = [];
  {
    const rand = rng(2027);
    for (let i = 0; i < 17; i++) {
      const x = 60 + i * 46 + (rand() - 0.5) * 22;
      standStalks.push({
        x,
        base: stand.h - 4,
        h: 360 + rand() * 150 - Math.abs(i - 8) * 6,
        bend: (rand() - 0.35) * 70,
        ear: 70 + rand() * 18,
        leaves: 1 + (i % 2),
      });
    }
  }
  const heroWheat =
    standStalks
      .filter((_, i) => i % 2)
      .map((s, i) => wheat({ ...s, h: s.h + 40, x: s.x + 18 }, 100 + i, { stem: GOLD, ear: '#e2b75a', opacity: 0.55 }))
      .join('') +
    standStalks.map((s, i) => wheat(s, 200 + i)).join('');
  const heroRoots = standStalks
    .map((s, i) => roots(s.x, 0, 120 + (i % 3) * 40, 500 + i, 1.2))
    .join('');

  // The sprouts of the part's opening, beside the sign.
  const seedlings = atEnd(720, 560, 420, 260);

  return [
    {
      id: 'l_sade_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 38, 228, 820, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 274, 900, 250), 'display'),
        place('p_subtitle', 'subtitle', at(START, 540, 860, 104), 'heading'),
        place('p_meta', 'caption', at(START + 38, 880, 820, 36), 'caption', {
          color: token('bg'),
        }),
      ],
      decorations: [
        art('d_sade_hero_sun', atEnd(250, 126, 470, 470), sunGlow(235, 235, 235)),
        art('d_sade_hero_soil', { x: 0, y: 752, w: W, h: 328 }, soil(W, 328, 11)),
        art('d_sade_hero_wheat', stand, heroWheat),
        art(
          'd_sade_hero_roots',
          atEnd(40, 762, 900, 280),
          `<path d="${heroRoots}" stroke="${STRAW}" stroke-opacity=".32" stroke-width="1.5" stroke-linecap="round"/>`,
        ),
        kickerGrain('d_sade_hero_grain', 228),
        art('d_sade_hero_sprout', at(START, 880, 26, 32), sprout(13, 30, 24, GOLD)),
      ],
    },
    {
      id: 'l_sade_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(330, 250, 340, 220), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('text'),
        }),
        place('p_kicker', 'caption', at(START + 38, 338, 760, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 384, 860, 250), 'display'),
        place('p_subtitle', 'subtitle', at(START, 644, 640, 140), 'heading'),
      ],
      decorations: [
        art('d_sade_section_soil', { x: 0, y: 812, w: W, h: 268 }, soil(W, 268, 23)),
        art('d_sade_section_seedlings', seedlings, [
          sprout(60, seedlings.h - 4, 70),
          sprout(170, seedlings.h - 4, 116),
          sprout(300, seedlings.h - 4, 150),
        ].join('')),
        art(
          'd_sade_section_roots',
          atEnd(720, 812, 420, 204),
          `<path d="${roots(60, 4, 60, 71) + roots(170, 4, 110, 72) + roots(300, 4, 160, 73)}" stroke="${STRAW}" stroke-opacity=".32" stroke-width="1.5" stroke-linecap="round"/>`,
        ),
        lifted(art('d_sade_section_sign', atEnd(330, 200, 340, 780), plotSign(340, 320, 460)), 18, 34, 0.2),
        kickerGrain('d_sade_section_grain', 338),
      ],
    },
    {
      id: 'l_sade_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1000).placeholders,
        place('p_number', 'number', at(START, 296, 700, 140), 'display', {
          color: token('secondary'),
        }),
        place('p_label', 'subtitle', at(START, 450, 660, 96), 'heading'),
        place('p_note', 'body', at(START, 566, 620, 130), 'body'),
        ...bins3.flatMap((end, i) => [
          place(`p_number${i + 2}`, 'number', atEnd(end + 18, 412, 220, 72), 'title', {
            align: 'center',
            color: token('text'),
          }),
          place(`p_label${i + 2}`, 'caption', atEnd(end + 18, 488, 220, 110), 'caption', {
            align: 'center',
          }),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1000).decorations,
        art(
          'd_sade_big_number_ground',
          atEnd(END - 50, 872, 1000, 46),
          `<path d="M0 18Q500 8 1000 18V40Q500 34 0 40Z" fill="${LOAM}" fill-opacity=".9"/>` + tufts(1000, 16, 12, 70, 12),
        ),
        ...bins3.map((end, i) =>
          art(`d_sade_big_number_bin${i + 2}`, atEnd(end, 290, 256, 600), grainBin(256, 600, [0.42, 0.5, 0.46][i]!)),
        ),
        art(
          'd_sade_big_number_row',
          at(START, 712, 600, 190),
          (() => {
            const rand = rng(612);
            let row = '';
            for (let i = 0; i < 11; i++) {
              const x = 24 + i * 55 + (rand() - 0.5) * 10;
              row += wheat({ x, base: 174, h: 92 + rand() * 30, bend: (rand() - 0.4) * 24, ear: 40, leaves: 1 }, 620 + i);
            }
            return row + `<g transform="translate(0 172)">${soil(600, 18, 61, { ridge: 2, horizons: [] })}</g>`;
          })(),
        ),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_sade_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(START, 316, 1000, 384), 'title'),
        place('p_attribution', 'attribution', at(START, 752, 900, 50), 'heading'),
        place('p_caption', 'caption', at(START, 806, 900, 72), 'caption'),
        ...foot('quote').placeholders,
      ],
      decorations: [
        art('d_sade_quote_sun', atEnd(END + 90, 118, 460, 460), sunGlow(230, 230, 230)),
        art('d_sade_quote_sheaf', atEnd(END + 40, 118, 560, 804), sheaf(560, 804)),
        art(
          'd_sade_quote_marks',
          at(START, 206, 120, 84),
          quoteGrain(34, 42, 66) + quoteGrain(84, 42, 66),
        ),
        rect('d_sade_quote_rule', at(START, 726, 120, 4), solid(token('accent'))),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_sade_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a card of paper from margin to margin, down to over the foot, from its
      // top; a seedling grows out of the card's corner, beside the title.
      placeholders: [
        ...head('text', WIDTH - 260, 1, false).placeholders,
        place('p_body', 'body', at(START + 72, 284, WIDTH - 144, 600), 'body'),
      ],
      decorations: [
        ...head('text', WIDTH - 260, 1, false).decorations,
        card('d_sade_text_card', at(START, 222, WIDTH, 700)),
        art('d_sade_text_bed', at(START, 222, WIDTH, 14), bed(WIDTH, 14, 91)),
        art(
          'd_sade_text_seedling',
          atEnd(END + 50, 70, 150, 156),
          `<path d="M18 156Q75 136 132 156Z" fill="${LOAM}"/>` + sprout(75, 148, 100),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_sade_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 980).placeholders,
        place('p_image', 'image', atEnd(END + 28, 166, 620, 690)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 84, 306 + i * 196, 860, 50), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 84, 360 + i * 196, 860, 124), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 980).decorations,
        card('d_sade_text_image_mount', atEnd(END, 138, 676, 786), 6),
        // The field photographer's card under the picture: a scale, and the patches of colour
        // the picture is graded against.
        art(
          'd_sade_text_image_record',
          atEnd(END + 28, 870, 620, 34),
          (() => {
            let ticks = '';
            for (let i = 0; i <= 30; i++) ticks += `M${2 + i * 10} 0v${i % 10 ? (i % 5 ? 8 : 13) : 18}`;
            return (
              `<path d="M2 0H302" stroke="${LOAM}" stroke-width="2"/><path d="${ticks}" stroke="${LOAM}" stroke-width="1.6"/>` +
              [GOLD, AMBER, LEAF, SAGE, SKY, LOAM]
                .map((c, i) => `<rect x="${r1(620 - 6 * 44 + i * 44)}" y="2" width="40" height="30" rx="3" fill="${c}"/>`)
                .join('')
            );
          })(),
        ),
        art(
          'd_sade_text_image_drip',
          at(START, 296, 56, 580),
          `<path d="M28 0V580" stroke="${LOAM}" stroke-width="8" stroke-linecap="round"/>` +
            `<path d="M25 4V576" stroke="${PAPER}" stroke-opacity=".3" stroke-width="2"/>` +
            [0, 1, 2]
              .map((i) => {
                const y = 26 + i * 196;
                return (
                  `<rect x="14" y="${y - 14}" width="28" height="28" rx="6" fill="${LOAM}" stroke="${PAPER}" stroke-opacity=".5" stroke-width="2"/>` +
                  `<circle cx="28" cy="${y}" r="5" fill="${SKY}"/>` +
                  `<path d="M28 ${y + 22}c-6 10 -9 15 -9 19a9 9 0 0 0 18 0c0 -4 -3 -9 -9 -19z" fill="${SKY}"/>`
                );
              })
              .join(''),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_sade_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', { x: 0, y: 0, w: W, h: 700 }),
        place('p_place', 'caption', at(START + 38, 756, 860, 36), 'caption', {
          color: token('accent'),
        }),
        place('p_title', 'title', at(START, 802, 860, 156), 'title', { color: token('bg') }),
        place('p_body', 'body', atEnd(END, 790, 640, 168), 'body', {
          vAlign: 'middle',
          color: token('bg'),
        }),
      ],
      decorations: [
        art('d_sade_full_image_soil', { x: 0, y: 700, w: W, h: 380 }, soil(W, 380, 37, { ridge: 0 })),
        art(
          'd_sade_full_image_roots',
          atEnd(END + 654, 700, 140, 324),
          `<path d="${roots(46, 4, 290, 81, 1.2) + roots(98, 4, 210, 82, 1.1)}" stroke="${STRAW}" stroke-opacity=".3" stroke-width="1.6" stroke-linecap="round"/>`,
        ),
        art('d_sade_full_image_sprout', at(START, 758, 26, 32), sprout(13, 30, 24, GOLD)),
      ],
    },
    {
      id: 'l_sade_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 26, 534, 476, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 26, 574, 476, 50), 'heading'),
          place(`p_card${i + 1}_body`, 'body', at(s + 26, 630, 476, 168), 'body'),
        ]),
        place('p_note', 'body', at(START, 862, 1500, 44), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => [
          lifted(art(`d_sade_cards_packet${i + 1}`, at(s, 262, 528, 552), packet(528, 552))),
          art(
            `d_sade_cards_window${i + 1}`,
            at(s + 26, 314, 476, 196),
            [coverCrop, dripRow, seedTray][i]!(476, 196),
          ),
        ]),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_sade_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...seasons4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 540, 400, 66), 'title', {
            color: token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 608, 390, 96), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 712, 390, 128), 'body'),
        ]),
        place('p_note', 'caption', at(START + 38, 870, 1300, 40), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        art('d_sade_timeline_row', { x: 0, y: 484, w: W, h: 40 }, soil(W, 40, 51, { horizons: [0.7], grain: 1.6 })),
        art(
          'd_sade_timeline_rules',
          at(START, 256, WIDTH, 234),
          [416, 832, 1248]
            .map((x) => `<path d="M${WIDTH - x + 8} 12V226" stroke="${LOAM}" stroke-opacity=".22" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/>`)
            .join(''),
        ),
        ...seasons4.flatMap((s, i) => [
          art(`d_sade_timeline_sky${i + 1}`, at(s, 256, 110, 76), weather(i)),
          art(`d_sade_timeline_crop${i + 1}`, at(s, 330, 408, 160), seasonCrop(i, 408, 160)),
        ]),
        kickerGrain('d_sade_timeline_note_grain', 872),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_sade_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1240).placeholders,
        ...steps5.flatMap((s, i) => [
          place(`p_station${i + 1}`, 'number', at(s, 256, 300, 72), 'title', {
            align: 'center',
            vAlign: 'bottom',
            color: i === 4 ? token('secondary') : token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 600, 300, 92), 'heading', {
            align: 'center',
            vAlign: 'bottom',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 696, 300, 100), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 58, 834, WIDTH - 58, 84), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1240).decorations,
        art(
          'd_sade_process_track',
          { x: 0, y: 430, w: W, h: 72 },
          `<rect x="0" y="14" width="${W}" height="48" fill="${AMBER}" fill-opacity=".16"/>` +
            `<path d="M0 30H${W}M0 46H${W}" stroke="${AMBER}" stroke-opacity=".4" stroke-width="3" stroke-dasharray="10 9"/>` +
            tufts(W, 14, 21, 120, 9),
        ),
        ...steps5.map((s, i) =>
          lifted(art(`d_sade_process_plot${i + 1}`, at(s + 24, 340, 252, 252), plot(i, 252)), 8, 18, 0.14),
        ),
        rect('d_sade_process_rule', at(START, 822, WIDTH, 2), solid(token('text', 0.14))),
        kickerGrain('d_sade_process_note_grain', 856),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_sade_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(START, 262, 788, 636)],
            ['after', atEnd(END, 262, 788, 636)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 38, y: 644, w: 712, h: 36 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 38, y: 684, w: 712, h: 50 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 38, y: 740, w: 712, h: 126 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        card('d_sade_comparison_before', at(START, 262, 788, 636)),
        card('d_sade_comparison_after', atEnd(END, 262, 788, 636)),
        art('d_sade_comparison_ploughed', at(START + 20, 282, 748, 342), profile(748, 342, false)),
        art('d_sade_comparison_living', atEnd(END + 20, 282, 748, 342), profile(748, 342, true)),
        upright(
          'd_sade_comparison_depth',
          at(START + 788, 282, 88, 342),
          (() => {
            const cm = (342 - 70 - 14) / 90;
            let body = `<path d="M44 70V${r1(70 + 90 * cm)}" stroke="${LOAM}" stroke-opacity=".5" stroke-width="2"/>`;
            for (let d = 0; d <= 90; d += 10) {
              const y = r1(70 + d * cm);
              body += `<path d="M${d % 30 ? 38 : 32} ${y}H${d % 30 ? 50 : 56}" stroke="${LOAM}" stroke-opacity=".6" stroke-width="2"/>`;
            }
            for (const d of [30, 60, 90]) {
              const y = r1(70 + d * cm);
              body += `<rect x="20" y="${r1(y - 26)}" width="48" height="22" rx="4" fill="${STRAW}"/><text x="44" y="${r1(y - 9)}" text-anchor="middle" font-family="Be Vietnam Pro, Assistant, sans-serif" font-size="17" font-weight="600" fill="${MUTED}">${d}</text>`;
            }
            return body + `<path d="M34 46L44 58L54 46" stroke="${SKY}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`;
          })(),
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_sade_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1040).placeholders,
        place('p_chart', 'chart', at(START + 38, 286, 964, 520)),
        place('p_source', 'caption', at(START + 38, 822, 964, 72), 'caption'),
        place('p_figure1', 'number', atEnd(END + 140, 290, 420, 124), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END + 140, 418, 420, 124), 'body'),
        place('p_figure2', 'number', atEnd(END + 140, 600, 420, 124), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END + 140, 728, 420, 124), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1040).decorations,
        card('d_sade_chart_panel', at(START, 262, 1040, 660)),
        rect('d_sade_chart_rule', atEnd(END + 140, 572, 420, 2), solid(token('text', 0.14))),
        art('d_sade_chart_gauge', atEnd(END, 300, 104, 600), rainGauge(104, 600, 0.38)),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_sade_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1180).placeholders,
        place('p_table', 'table', at(START + 38, 286, WIDTH - 76, 552)),
        place('p_note', 'caption', at(START + 38, 878, WIDTH - 38, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1180).decorations,
        art('d_sade_table_heaps', atEnd(END, 104, 420, 150), heaps(420, 150)),
        card('d_sade_table_panel', at(START, 262, WIDTH, 600)),
        art('d_sade_table_bed', at(START, 262, WIDTH, 12), bed(WIDTH, 12, 93)),
        kickerGrain('d_sade_table_note_grain', 880),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_sade_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s, 262, 340, 340)),
          place(`p_role${i + 1}`, 'caption', at(s, 636, 392, 62), 'caption', {
            color: token('primary'),
            vAlign: 'bottom',
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s, 702, 392, 50), 'heading'),
          place(`p_about${i + 1}`, 'body', at(s, 756, 392, 128), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        ...team4.map((s, i) => {
          const colour = [GOLD, LEAF, SKY, AMBER][i]!;
          let hatch = '';
          for (let x = -340; x < 340; x += 11) hatch += `M${x} 340L${x + 340} 0`;
          return art(
            `d_sade_team_plot${i + 1}`,
            at(s + 22, 284, 340, 340),
            `<rect width="340" height="340" fill="${colour}" fill-opacity=".22"/>` +
              `<path d="${hatch}" stroke="${colour}" stroke-opacity=".7" stroke-width="2.4" clip-path="url(#sade-team-${i})"/>` +
              `<defs><clipPath id="sade-team-${i}"><rect width="340" height="340"/></clipPath></defs>`,
          );
        }),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_sade_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_meta', 'caption', at(START + 60, 98, 900, 36), 'caption'),
        place('p_kicker', 'caption', at(START + 38, 206, 900, 36), 'caption', {
          color: token('primary'),
        }),
        // Deep enough for two lines of Devanagari at its leading (LEADING).
        place('p_title', 'title', at(START, 250, 900, 248), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 52, 506 + i * 58, 880, 48), 'body', {
            vAlign: 'top',
          }),
        ),
      ],
      decorations: [
        art('d_sade_closing_sun', atEnd(300, 470, 440, 232), sunGlow(220, 232, 220)),
        art('d_sade_closing_birds', atEnd(560, 386, 150, 56), birds()),
        art('d_sade_closing_field', { x: 0, y: 664, w: W, h: 416 }, furrows(W, 416, 520, 36)),
        mark('d_sade_closing_mark', at(START, 94, 44, 44)),
        kickerGrain('d_sade_closing_grain', 206),
        ...[0, 1, 2].map((i) =>
          art(
            `d_sade_closing_key${i + 1}`,
            at(START, 510 + i * 58, 34, 34),
            [
              sprout(17, 32, 26, LEAF),
              `<path d="M4 8L8 2L12 8L16 2L20 8L24 2L28 8L30 8V32H4Z" fill="${PAPER}" stroke="${LOAM}" stroke-width="2" stroke-linejoin="round"/><rect x="8" y="13" width="18" height="11" rx="2" fill="${SAGE}"/>`,
              `<rect x="5" y="3" width="24" height="29" rx="3" fill="${PAPER}" stroke="${LOAM}" stroke-width="2"/><path d="M10 11H24M10 17H24M10 23H19" stroke="${LOAM}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round"/>`,
            ][i]!,
          ),
        ),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (those with figures) moved across as they are.
 */
function flipped(drawn: readonly Layout[]): Layout[] {
  return drawn.map((layout) => {
    const mirrored = mirrorLayout(layout);
    return {
      ...mirrored,
      decorations: mirrored.decorations.map((decoration) => {
        if (!UPRIGHT.has(decoration.id) || decoration.type !== 'svg') return decoration;
        const { flipH: _flipH, ...rest } = decoration;
        return rest;
      }),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The sample: the harvest report of a cooperative of 212 family farms

const TABLE_COLS = [420, 250, 250, 300, 368];
const TABLE_ROW = 88;
/** Cubic metres of irrigation water per tonne of grain. */
const OURS = [520, 455, 401, 359];
const REGION = [535, 530, 528, 524];

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
const DISPLAYED = new Set(['l_sade_hero', 'l_sade_section', 'l_sade_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: SadeCopy, lang: ContentLanguage): SampleSlide[] {
  const slides = drawSample(copy);
  const leading = LEADING[lang];
  if (!leading) return slides;
  return slides.map((slide) => {
    const content = { ...slide.content };
    const lineHeight = DISPLAYED.has(slide.layout) ? leading.display : leading.title;
    const roles = { title: lineHeight, quote: lineHeight, subtitle: leading.subtitle };
    for (const [role, value] of Object.entries(roles) as [keyof typeof roles, number][]) {
      // The subtitles of the opening and of a part, which run to two lines in a deep box.
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

function drawSample(copy: SadeCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_sade_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_sade_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_sade_text',
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
      layout: 'l_sade_big_number',
      name: copy.figures.name,
      content: {
        caption: [
          text(copy.figures.kicker),
          ...copy.figures.others.map(([, label]) => text(label)),
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
      layout: 'l_sade_text_image',
      name: copy.project.name,
      content: {
        caption: text(copy.project.kicker),
        title: lines(copy.project.title),
        image: { assetId: pictures.drip.id },
        subtitle: copy.project.items.map(([title]) => text(title)),
        body: copy.project.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_sade_full_image',
      name: copy.fields.name,
      content: {
        image: { assetId: pictures.fields.id },
        caption: text(copy.fields.place),
        title: text(...copy.fields.title),
        body: text(copy.fields.body),
      },
    },
    {
      layout: 'l_sade_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_sade_cards',
      name: copy.programmes.name,
      content: {
        caption: [
          text(copy.programmes.kicker),
          ...copy.programmes.cards.map(([label]) => text(label)),
        ],
        title: lines(copy.programmes.title),
        subtitle: copy.programmes.cards.map(([, title]) => text(title)),
        body: [
          ...copy.programmes.cards.map(([, , body]) => text(body)),
          text(copy.programmes.note),
        ],
        footer,
      },
    },
    {
      layout: 'l_sade_timeline',
      name: copy.season.name,
      content: {
        caption: [text(copy.season.kicker), text(copy.season.note)],
        title: lines(copy.season.title),
        number: copy.season.stops.map(([when]) => text(when)),
        subtitle: copy.season.stops.map(([, title]) => text(title)),
        body: copy.season.stops.map(([, , body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_sade_process',
      name: copy.joining.name,
      content: {
        caption: [
          text(copy.joining.kicker),
          ...copy.joining.steps.map(([, caption]) => text(caption)),
        ],
        title: lines(copy.joining.title),
        number: copy.joining.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.joining.steps.map(([step]) => text(step)),
        body: text(copy.joining.note),
        footer,
      },
    },
    {
      layout: 'l_sade_comparison',
      name: copy.soil.name,
      content: {
        caption: [text(copy.soil.kicker), text(copy.soil.before[0]), text(copy.soil.after[0])],
        title: lines(copy.soil.title),
        subtitle: [text(copy.soil.before[1]), text(copy.soil.after[1])],
        body: [text(copy.soil.before[2]), text(copy.soil.after[2])],
        footer,
      },
    },
    {
      layout: 'l_sade_chart',
      name: copy.water.name,
      content: {
        caption: [text(copy.water.kicker), text(copy.water.source)],
        title: lines(copy.water.title),
        number: copy.water.figures.map(([value]) => text(value)),
        body: copy.water.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.water.series[0], values: OURS },
            { name: copy.water.series[1], values: REGION },
          ],
        },
      },
    },
    {
      layout: 'l_sade_table',
      name: copy.crops.name,
      content: {
        caption: [text(copy.crops.kicker), text(copy.crops.note)],
        title: lines(copy.crops.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.crops.header, ...copy.crops.rows],
      },
    },
    {
      layout: 'l_sade_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([role]) => text(role))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , about]) => text(about)),
        footer,
      },
    },
    {
      layout: 'l_sade_closing',
      name: copy.closing.name,
      content: {
        caption: [text(copy.closing.meta), text(copy.closing.kicker)],
        title: text(...copy.closing.title),
        body: copy.closing.lines.map((line) => text(line)),
      },
    },
  ];
}

/** The sample decks of the template: one in every language its copy is written in. */
export const sadeSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => SADE_COPY[lang]).map((lang) => [
    lang,
    sample(SADE_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Harvest template: the theme, its layouts for both directions, and its sample deck. */
export function sadeTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(sadeTheme),
    description:
      'A field in section: straw paper over a strip of loam, a stand of ripe wheat and its roots, a plot sign, grain bins, seed packets, soil profiles and furrows running to a low sun, for farms, cooperatives and food systems.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.drip, pictures.fields, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, sadeSamples.he);
  return finished;
}

export const entry = { id: 'sade', template: sadeTemplate, samples: sadeSamples };
