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
import { TAVLIN_COPY, type TavlinCopy } from './tavlin/copy';
import { picture } from './pictures';

const pictures = {
  market: picture('tavlinMarket'),
  kitchen: picture('tavlinClass'),
  team: [1, 2, 3, 4].map((n) => picture(`tavlinTeam${n}`)),
};

/**
 * Tavlin (Spice): the slide is the counter of a spice merchant in a chef's kitchen. A pale
 * saffron ground, clove-brown ink, paprika for what matters, turmeric and curry leaf beside it;
 * on it the things of the trade, each doing a job: the opening is a row of burlap sacks heaped
 * with ground spice, a part's number is on the label of a jar of layered spices, figures hang on
 * kraft price tags, a quote rests on a wooden spoon, a plan is the ticket rail of the pass, a
 * process five measuring spoons, a comparison a brass market balance, a chart stands on a cutting
 * board and a table is a menu card. Headings in the bold serif of a cookbook. For restaurants,
 * chefs, food brands, culinary schools, catering and food festivals.
 *
 * No drawing holds a word, so one set of layouts reads in every language of the app; the faces
 * have counterparts for every script (Lora and Frank Ruhl Libre for what is said
 * aloud, DM Sans and Heebo for what is read).
 */
export const tavlinTheme: Theme = {
  id: 'tavlin',
  name: 'Spice',
  colors: {
    bg: '#f5e9d1',
    surface: '#fffaf1',
    text: '#2a1a12',
    muted: '#6b5444',
    primary: '#b5381c',
    secondary: '#3e5c34',
    accent: '#d9961a',
    // The spice rack: turmeric, paprika, curry leaf, sumac, cinnamon and clove.
    chart: ['#d9961a', '#b5381c', '#3e5c34', '#7b2d44', '#8b5a33', '#2a1a12'],
  },
  // The bold serif of a cookbook's headings, with figures that stand on the line for the big
  // numbers (Lora, and Frank Ruhl Libre for Hebrew), and a plain sans for what is read (DM Sans,
  // and Heebo for Hebrew).
  fonts: {
    heading: { he: 'Frank Ruhl Libre', latin: 'Lora' },
    body: { he: 'Heebo', latin: 'DM Sans' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 104,
      weight: 700,
      lineHeight: 1.1,
      letterSpacing: -2,
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
    heading: { font: 'heading', size: 34, weight: 700, lineHeight: 1.24, color: { token: 'text' } },
    body: { font: 'body', size: 26, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: 0.3,
      color: { token: 'muted' },
    },
  },
  radius: 18,
  shadow: { x: 0, y: 16, blur: 40, color: { value: '#5a3a14', alpha: 0.14 } },
  // The ground: saffron paper, lit a little in its middle as a counter is under a lamp.
  background: {
    fill: {
      kind: 'css',
      value: [
        'radial-gradient(ellipse 85% 75% at 50% 42%, color-mix(in srgb, var(--color-surface) 46%, transparent), transparent 72%)',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The saffron alone, without its light.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings: the theme's, each tied to its token, and the spices' own

const CLOVE = '#2a1a12';
const MUTED = '#6b5444';
const PAPRIKA = '#b5381c';
const LEAF = '#3e5c34';
const TURMERIC = '#d9961a';
const SAFFRON = '#f5e9d1';
const CREAM = '#fffaf1';

const PAINT = {
  [CLOVE]: token('text'),
  [MUTED]: token('muted'),
  [PAPRIKA]: token('primary'),
  [LEAF]: token('secondary'),
  [TURMERIC]: token('accent'),
  [SAFFRON]: token('bg'),
  [CREAM]: token('surface'),
};

/** The colours of things, which stay what they are whatever the theme. */
const WHITE = '#ffffff';
const BLACK = '#000000';
const SUMAC = '#7b2d44';
const CUMIN = '#9a6a35';
const CINNAMON = '#8b5a33';
const CINNAMON_DARK = '#5e3a1f';
const POD = '#93a65c';
const POD_DARK = '#66773a';
const CHILI = '#b3261a';
const STEM = '#5d7633';
const BAY = '#7c8a4b';
const PEPPER = '#3b2b22';
const SEED = '#8a6436';
const BURLAP = '#c49d68';
const BURLAP_LIGHT = '#d9bc8a';
const BURLAP_DARK = '#8a683c';
const OPENING = '#4a3524';
const BRASS = '#c4923f';
const BRASS_DARK = '#8a6224';
const OAK = '#b9844c';
const OAK_DARK = '#8a5a2c';
const MAPLE = '#f0dcba';
const MAPLE_EDGE = '#cfa874';
const KRAFT = '#e6cc9f';
const KRAFT_EDGE = '#bf9c66';
const TWINE = '#a37b4c';
const CORK = '#c49b6a';
const STEEL = '#cfc9be';
const STEEL_DARK = '#8f887c';
const STONE = '#9a9286';
const STONE_DARK = '#6d665c';
const GREEN_SPICE = '#8a9a4a';

const r1 = (v: number) => Math.round(v * 10) / 10;

/**
 * The mark of an id that a drawing defines for itself (a motif in its `<defs>`, placed with
 * `<use>`): `own` makes it the element's, so the ids of two drawings never meet.
 */
const LOCAL = '§';
const own = (id: string, body: string) => body.split(LOCAL).join(`${id}-`);

/**
 * A drawing whose box is `w` by `h`. Its attributes are quoted with apostrophes, which a
 * catalog in JSON keeps as they are, where it would escape every double quote.
 */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`.replace(/"/g, "'");

/** The theme's colours that a drawing's markup uses, each tied to its token: no more. */
const paint = (markup: string) =>
  Object.fromEntries(Object.entries(PAINT).filter(([colour]) => markup.includes(colour)));

const art = (id: string, frame: Frame, body: string) => {
  const markup = svg(frame.w, frame.h, own(id, body));
  return drawing(id, frame, markup, paint(markup));
};

/**
 * The drawings that a left-to-right deck must not see mirrored: those with figures in them, and
 * the quotation marks. Their mirror moves them to the other side and leaves them as they are.
 */
const UPRIGHT = new Set<string>();

const upright = (id: string, frame: Frame, body: string) => {
  UPRIGHT.add(id);
  return art(id, frame, body);
};

/** A soft shadow under a thing on the counter: a card, a jar, a board. */
const lifted = (element: Element, y = 14, blur = 30, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#4a2e10', alpha } } },
});

/** A small seeded generator, so a scatter of grains is the same on every draw. */
function random(seed: number): () => number {
  let state = seed | 0;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

// ---------------------------------------------------------------------------------------------
// Light, grain and texture

/** The light on a round thing: from the start side, falling off to shade at the other. */
const shading = (id: string, light = 0.3, dark = 0.26, vertical = false) =>
  `<linearGradient id="${id}" x1="0" y1="0" x2="${vertical ? 0 : 1}" y2="${vertical ? 1 : 0}">` +
  `<stop offset="0" stop-color="${WHITE}" stop-opacity="${light}"/>` +
  `<stop offset=".42" stop-color="${WHITE}" stop-opacity="0"/>` +
  `<stop offset=".62" stop-color="${BLACK}" stop-opacity="0"/>` +
  `<stop offset="1" stop-color="${BLACK}" stop-opacity="${dark}"/></linearGradient>`;

/** A soft shadow on the counter under a thing that stands on it. */
const floorShadow = (id: string, cx: number, cy: number, rx: number, ry: number, alpha = 0.24) =>
  `<radialGradient id="${id}" cx="50%" cy="50%" r="50%">` +
  `<stop offset="0" stop-color="${CINNAMON_DARK}" stop-opacity="${alpha}"/>` +
  `<stop offset="1" stop-color="${CINNAMON_DARK}" stop-opacity="0"/></radialGradient>` +
  `<ellipse cx="${r1(cx)}" cy="${r1(cy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="url(#${id})"/>`;

/**
 * Grains of ground spice over a shape: light and dark specks scattered where `inside` says, so
 * a heap reads as powder and not as paint.
 */
function grains(
  rand: () => number,
  count: number,
  box: Frame,
  inside: (x: number, y: number) => boolean,
  size: [number, number] = [1.2, 2.6],
  tones: [string, number][] = [
    [WHITE, 0.32],
    [BLACK, 0.22],
    [WHITE, 0.18],
  ],
) {
  const dots = new Dots();
  let placed = 0;
  for (let tries = 0; placed < count && tries < count * 30; tries++) {
    const x = box.x + rand() * box.w;
    const y = box.y + rand() * box.h;
    if (!inside(x, y)) continue;
    const r = size[0] + rand() * (size[1] - size[0]);
    const [colour, alpha] = tones[Math.floor(rand() * tones.length)]!;
    dots.add(x, y, r, colour, alpha);
    placed++;
  }
  return dots.markup();
}

/**
 * Specks drawn light: each a dot of a round-capped stroke, and the dots of one colour, opacity
 * and size (to a third of a pixel) one path, so a heap of a thousand grains is a few paths.
 */
class Dots {
  private readonly paths = new Map<string, string>();

  add(x: number, y: number, r: number, colour: string, alpha: number) {
    const key = `${colour} ${Math.round(alpha * 100) / 100} ${Math.round(r * 2) / 2}`;
    this.paths.set(key, `${this.paths.get(key) ?? ''}M${Math.round(x)} ${Math.round(y)}h.01`);
  }

  markup() {
    return [...this.paths]
      .map(([key, d]) => {
        const [colour, alpha, r] = key.split(' ');
        return `<path d="${d}" stroke="${colour}" stroke-opacity="${alpha}" stroke-width="${Number(r) * 2}" stroke-linecap="round"/>`;
      })
      .join('');
  }
}

/** The outline of a cone of ground spice: slightly hollow sides, a rounded top. */
function heapLine(cx: number, base: number, half: number, h: number): [number, number][] {
  const e = 0.07;
  const norm = (1 - e) ** 1.25;
  const out: [number, number][] = [];
  for (let i = 0; i <= 48; i++) {
    const t = -1 + (2 * i) / 48;
    const a = Math.sqrt(t * t + e * e);
    out.push([cx + t * half, base - (h * Math.max(0, 1 - a) ** 1.25) / norm]);
  }
  return out;
}

const heapTop = (cx: number, base: number, half: number, h: number, x: number) => {
  const t = (x - cx) / half;
  const e = 0.07;
  const a = Math.sqrt(t * t + e * e);
  return base - (h * Math.max(0, 1 - a) ** 1.25) / (1 - e) ** 1.25;
};

interface HeapOptions {
  id: string;
  cx: number;
  /** Where the heap meets what holds it: the middle of the opening, and its depth. */
  base: number;
  half: number;
  h: number;
  ry: number;
  colour: string;
  seed: number;
  /** Whole pods rather than powder. */
  pods?: boolean;
}

/** A heap of spice in a sack, a bowl or a pan: shaded, grained, filled to its brim. */
function heap(o: HeapOptions) {
  const line = heapLine(o.cx, o.base, o.half, o.h);
  const d =
    `M${line.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L')}` +
    `A${r1(o.half)} ${r1(o.ry)} 0 0 1 ${r1(o.cx - o.half)} ${r1(o.base)}Z`;
  const rand = random(o.seed);
  const inside = (x: number, y: number) => {
    const dx = (x - o.cx) / o.half;
    if (Math.abs(dx) >= 0.97) return false;
    if (y < heapTop(o.cx, o.base, o.half, o.h, x) + 3) return false;
    return y <= o.base || dx * dx + ((y - o.base) / o.ry) ** 2 < 0.86;
  };
  const box = { x: o.cx - o.half, y: o.base - o.h, w: o.half * 2, h: o.h + o.ry };
  const texture = o.pods
    ? `<defs>${podMotif(`${o.id}-pod`)}</defs>` +
      Array.from({ length: 70 }, () => {
        const x = box.x + rand() * box.w;
        const y = box.y + rand() * box.h;
        if (!inside(x, y)) return '';
        const s = 6 + rand() * 3;
        const rot = rand() * 180;
        const fill = rand() < 0.5 ? POD : '#a5b770';
        return `<use href="#${o.id}-pod" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)}) scale(${r1(s)})" fill="${fill}" stroke-width="${Math.round(100 / s) / 100}"/>`;
      }).join('')
    : grains(rand, Math.round(o.half * o.h * 0.012), box, inside);
  // The cone once, filled with the spice and then lit.
  return (
    `<defs>${shading(`${o.id}-light`, 0.34, 0.3)}<path id="${o.id}-cone" d="${d}"/></defs>` +
    `<use href="#${o.id}-cone" fill="${o.colour}"/>` +
    texture +
    `<use href="#${o.id}-cone" fill="url(#${o.id}-light)"/>`
  );
}

/**
 * A cardamom pod of unit length about its middle, for `<use>`: it takes its fill and the width
 * of its outline (one pixel, over its scale) from where it is placed.
 */
const podMotif = (id: string) =>
  `<g id="${id}"><path d="M-1 0C-.6 -.66 .6 -.66 1 0C.6 .66 -.6 .66 -1 0Z" stroke="${POD_DARK}"/>` +
  `<path d="M-.7 -.1Q0 -.32 .7 -.1" fill="none" stroke="${WHITE}" stroke-opacity=".4"/></g>`;

// ---------------------------------------------------------------------------------------------
// Whole spices, a cook's scatter

function podGlyph(x: number, y: number, s: number, rot: number, fill = POD) {
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})">` +
    `<path d="M${r1(-s)} 0C${r1(-s * 0.6)} ${r1(-s * 0.66)} ${r1(s * 0.6)} ${r1(-s * 0.66)} ${r1(s)} 0C${r1(s * 0.6)} ${r1(s * 0.66)} ${r1(-s * 0.6)} ${r1(s * 0.66)} ${r1(-s)} 0Z" fill="${fill}" stroke="${POD_DARK}" stroke-width="1"/>` +
    `<path d="M${r1(-s * 0.7)} ${r1(-s * 0.1)}Q0 ${r1(-s * 0.32)} ${r1(s * 0.7)} ${r1(-s * 0.1)}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="1"/>` +
    `</g>`
  );
}

/** A star anise: eight pods around a centre, a seed in each. */
function starAnise(
  cx: number,
  cy: number,
  r: number,
  {
    pod = CINNAMON,
    edge = CINNAMON_DARK,
    seed = '#d8a35c',
    rot = 0,
    width = 1.2,
    /** The name of its pod among the drawing's own ids: one a star anise of the drawing. */
    key = 'anise',
  } = {},
) {
  // One pod, drawn once and turned seven times.
  const id = `${LOCAL}${key}`;
  const one =
    `<g id="${id}">` +
    `<path d="M${r1(cx)} ${r1(cy - r * 0.08)}C${r1(cx + r * 0.24)} ${r1(cy - r * 0.26)} ${r1(cx + r * 0.22)} ${r1(cy - r * 0.8)} ${r1(cx)} ${r1(cy - r)}C${r1(cx - r * 0.22)} ${r1(cy - r * 0.8)} ${r1(cx - r * 0.24)} ${r1(cy - r * 0.26)} ${r1(cx)} ${r1(cy - r * 0.08)}Z" fill="${pod}" stroke="${edge}" stroke-width="${width}" stroke-linejoin="round"/>` +
    `<path d="M${r1(cx)} ${r1(cy - r * 0.3)}V${r1(cy - r * 0.86)}" stroke="${edge}" stroke-width="${r1(width * 0.8)}" stroke-linecap="round"/>` +
    `<ellipse cx="${r1(cx + r * 0.06)}" cy="${r1(cy - r * 0.56)}" rx="${r1(r * 0.075)}" ry="${r1(r * 0.13)}" fill="${seed}"/>` +
    `</g>`;
  let out = `<defs>${one}</defs>`;
  for (let k = 0; k < 8; k++) {
    out += `<use href="#${id}" transform="rotate(${rot + k * 45} ${r1(cx)} ${r1(cy)})"/>`;
  }
  return out + `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.12)}" fill="${edge}"/>`;
}

/** A dried chili, its stem at (x, y). */
function chili(x: number, y: number, len: number, rot: number, fill = CHILI) {
  const w = len * 0.13;
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})">` +
    `<path d="M0 ${r1(-w)}C${r1(len * 0.36)} ${r1(-w * 1.3)} ${r1(len * 0.8)} ${r1(-w * 0.4)} ${r1(len)} ${r1(len * 0.16)}C${r1(len * 0.72)} ${r1(w * 0.95)} ${r1(len * 0.32)} ${r1(w * 1.15)} 0 ${r1(w)}Z" fill="${fill}"/>` +
    `<path d="M${r1(len * 0.1)} ${r1(-w * 0.5)}C${r1(len * 0.42)} ${r1(-w * 0.8)} ${r1(len * 0.72)} ${r1(-w * 0.2)} ${r1(len * 0.9)} ${r1(len * 0.09)}" stroke="${WHITE}" stroke-opacity=".32" stroke-width="${r1(w * 0.28)}" stroke-linecap="round"/>` +
    `<path d="M${r1(len * 0.2)} ${r1(w * 0.55)}C${r1(len * 0.5)} ${r1(w * 0.7)} ${r1(len * 0.75)} ${r1(w * 0.2)} ${r1(len * 0.9)} ${r1(len * 0.12)}" stroke="${BLACK}" stroke-opacity=".18" stroke-width="${r1(w * 0.3)}" stroke-linecap="round"/>` +
    `<path d="M0 ${r1(-w * 1.05)}Q${r1(-len * 0.1)} 0 0 ${r1(w * 1.05)}Q${r1(len * 0.07)} 0 0 ${r1(-w * 1.05)}Z" fill="${STEM}"/>` +
    `<path d="M${r1(-len * 0.04)} 0Q${r1(-len * 0.12)} ${r1(-w * 0.3)} ${r1(-len * 0.17)} ${r1(-w * 1.4)}" stroke="${STEM}" stroke-width="${r1(w * 0.42)}" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** A quill of cinnamon bark, rolled on itself. */
function cinnamon(x: number, y: number, len: number, rot: number, d = 18) {
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})">` +
    `<rect x="0" y="${r1(-d / 2)}" width="${r1(len)}" height="${r1(d)}" rx="${r1(d * 0.32)}" fill="${CINNAMON}"/>` +
    `<rect x="${r1(d * 0.2)}" y="${r1(-d / 2 + 1.5)}" width="${r1(len - d * 0.4)}" height="${r1(d * 0.3)}" rx="${r1(d * 0.15)}" fill="${WHITE}" fill-opacity=".16"/>` +
    `<path d="M${r1(len * 0.1)} ${r1(d * 0.12)}H${r1(len * 0.86)}M${r1(len * 0.3)} ${r1(d * 0.3)}H${r1(len * 0.7)}" stroke="${BLACK}" stroke-opacity=".2" stroke-width="1.3" stroke-linecap="round"/>` +
    `<ellipse cx="${r1(len - d * 0.1)}" cy="0" rx="${r1(d * 0.3)}" ry="${r1(d / 2)}" fill="${CINNAMON_DARK}"/>` +
    `<path d="M${r1(len - d * 0.1)} ${r1(-d * 0.3)}a${r1(d * 0.16)} ${r1(d * 0.28)} 0 1 1 0 ${r1(d * 0.5)}" stroke="${CINNAMON}" stroke-width="1.6"/>` +
    `</g>`
  );
}

/** A peppercorn. */
const peppercorn = (x: number, y: number, r: number) =>
  `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(r)}" fill="${PEPPER}"/>` +
  `<circle cx="${r1(x - r * 0.3)}" cy="${r1(y - r * 0.32)}" r="${r1(r * 0.3)}" fill="${WHITE}" fill-opacity=".3"/>`;

/** A bay leaf, its stalk at (x, y). */
function bayLeaf(x: number, y: number, len: number, rot: number, fill = BAY) {
  const w = len * 0.2;
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})">` +
    `<path d="M0 0C${r1(len * 0.25)} ${r1(-w * 1.4)} ${r1(len * 0.75)} ${r1(-w * 1.2)} ${r1(len)} 0C${r1(len * 0.75)} ${r1(w * 1.2)} ${r1(len * 0.25)} ${r1(w * 1.4)} 0 0Z" fill="${fill}"/>` +
    `<path d="M0 0C${r1(len * 0.25)} ${r1(-w * 1.4)} ${r1(len * 0.75)} ${r1(-w * 1.2)} ${r1(len)} 0" fill="${WHITE}" fill-opacity=".12"/>` +
    `<path d="M${r1(len * 0.02)} 0Q${r1(len * 0.5)} ${r1(-w * 0.12)} ${r1(len * 0.96)} 0" stroke="${BLACK}" stroke-opacity=".22" stroke-width="1.4"/>` +
    `</g>`
  );
}

/** A cumin seed. */
const cuminSeed = (x: number, y: number, s: number, rot: number, fill = SEED) =>
  `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rot)})">` +
  `<ellipse rx="${r1(s)}" ry="${r1(s * 0.34)}" fill="${fill}"/>` +
  `<path d="M${r1(-s * 0.7)} 0H${r1(s * 0.7)}" stroke="${BLACK}" stroke-opacity=".28" stroke-width="1"/>` +
  `</g>`;

/** A cumin seed about the origin, turned by `rot`, for `<use>`: one motif, placed many times. */
const seedMotif = (id: string, s: number, rot: number, fill = SEED) =>
  `<g id="${id}"${rot ? ` transform="rotate(${rot})"` : ''}>` +
  `<ellipse rx="${r1(s)}" ry="${r1(s * 0.34)}" fill="${fill}"/>` +
  `<path d="M${r1(-s * 0.7)} 0H${r1(s * 0.7)}" stroke="${BLACK}" stroke-opacity=".28" stroke-width="1"/></g>`;

/** A line of seeds, as a rule: `w` long, tilted by turns. */
function seedLine(w: number, colour = MUTED, step = 22) {
  // Two seeds, one tilted each way, a tile the line repeats.
  const n = Math.floor(w / step);
  return (
    `<defs>${seedMotif(`${LOCAL}seed0`, 6, -24, colour)}${seedMotif(`${LOCAL}seed1`, 6, 24, colour)}` +
    `<pattern id="${LOCAL}seeds" width="${step * 2}" height="14" patternUnits="userSpaceOnUse">` +
    `<use href="#${LOCAL}seed0" x="${step / 2}" y="7"/><use href="#${LOCAL}seed1" x="${step * 1.5}" y="7"/></pattern></defs>` +
    `<rect width="${n * step}" height="14" fill="url(#${LOCAL}seeds)"/>`
  );
}

/** A pinch of paprika before a kicker: a small heap with a few grains beside it. */
const pinch = (id: string, frame: Frame) =>
  art(
    id,
    frame,
    `<path d="M2 21C8 20 11 4 15 3C19 4 22 20 28 21Z" fill="${PAPRIKA}"/>` +
      `<path d="M15 3C19 4 22 20 28 21H15Z" fill="${BLACK}" fill-opacity=".18"/>` +
      `<circle cx="9" cy="15" r="1.2" fill="${WHITE}" fill-opacity=".5"/><circle cx="17" cy="11" r="1" fill="${WHITE}" fill-opacity=".5"/>`,
  );

// ---------------------------------------------------------------------------------------------
// The things on the counter

/**
 * A burlap sack with its rim rolled down, filled to a cone of spice: the merchant's display.
 * `heapH` is how far the cone rises over the rim.
 */
function sack(id: string, w: number, h: number, colour: string, heapH: number, seed: number, pods = false) {
  const cx = w / 2;
  const rx = w * 0.34;
  const ry = rx * 0.28;
  const oy = heapH + 8;
  const bottom = h - 22;
  const roll = 21;
  const H = bottom - oy;
  const rand = random(seed * 3);
  // The cloth slumps: narrow under the roll, widest low down, its corners pushed out at the foot.
  const body =
    `M${r1(cx - rx - roll * 0.7)} ${r1(oy)}` +
    `C${r1(cx - rx - roll - 8)} ${r1(oy + H * 0.3)} ${r1(cx - w * 0.49)} ${r1(bottom - H * 0.4)} ${r1(cx - w * 0.47)} ${r1(bottom - 24)}` +
    `Q${r1(cx - w * 0.47)} ${r1(bottom + 2)} ${r1(cx - w * 0.34)} ${r1(bottom)}` +
    `Q${r1(cx)} ${r1(bottom + 9)} ${r1(cx + w * 0.34)} ${r1(bottom)}` +
    `Q${r1(cx + w * 0.47)} ${r1(bottom + 2)} ${r1(cx + w * 0.47)} ${r1(bottom - 24)}` +
    `C${r1(cx + w * 0.49)} ${r1(bottom - H * 0.4)} ${r1(cx + rx + roll + 8)} ${r1(oy + H * 0.3)} ${r1(cx + rx + roll * 0.7)} ${r1(oy)}Z`;
  const outerRx = rx + roll;
  const outerRy = ry + roll * 0.62;
  // The front of the roll: its outer edge lumpy, as rolled cloth is.
  let lumps = `M${r1(cx - outerRx)} ${r1(oy)}`;
  for (let i = 1; i <= 24; i++) {
    const a = Math.PI - (Math.PI * i) / 24;
    const k = 1 + (i % 2 ? 0.025 : -0.01) + (rand() - 0.5) * 0.02;
    lumps += `L${r1(cx + Math.cos(a) * outerRx * k)} ${r1(oy + Math.sin(a) * outerRy * k)}`;
  }
  const front = `${lumps}L${r1(cx + rx)} ${r1(oy)}A${r1(rx)} ${r1(ry)} 0 0 1 ${r1(cx - rx)} ${r1(oy)}Z`;
  // The twists of the roll, across its front.
  const twists = Array.from({ length: 13 }, (_, i) => {
    const a = Math.PI * (0.08 + (0.84 * i) / 12);
    const x = cx - Math.cos(a) * (rx + roll * 0.5);
    const y = oy + Math.sin(a) * (ry + roll * 0.34);
    return `M${r1(x - 5)} ${r1(y - 6)}q4 2 9 11`;
  }).join('');
  // Folds down the sack, from under the roll, and the sag at its foot.
  const fold = (x: number, lean: number, reach: number) =>
    `<path d="M${r1(x)} ${r1(oy + outerRy - 2)}q${r1(lean)} ${r1(H * reach * 0.55)} ${r1(lean * 0.35)} ${r1(H * reach)}" stroke="${BLACK}" stroke-opacity=".16" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${r1(x + 6)} ${r1(oy + outerRy + 4)}q${r1(lean)} ${r1(H * reach * 0.5)} ${r1(lean * 0.35)} ${r1(H * reach * 0.86)}" stroke="${WHITE}" stroke-opacity=".16" stroke-width="2.4" stroke-linecap="round"/>`;
  const sag =
    `<path d="M${r1(cx - w * 0.36)} ${r1(bottom - 30)}Q${r1(cx - w * 0.1)} ${r1(bottom - 18)} ${r1(cx + w * 0.1)} ${r1(bottom - 34)}" stroke="${BLACK}" stroke-opacity=".12" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="M${r1(cx + w * 0.02)} ${r1(bottom - 16)}Q${r1(cx + w * 0.22)} ${r1(bottom - 8)} ${r1(cx + w * 0.38)} ${r1(bottom - 26)}" stroke="${BLACK}" stroke-opacity=".1" stroke-width="3" stroke-linecap="round"/>`;
  return (
    `<defs>${shading(`${id}-light`, 0.24, 0.34)}` +
    `<linearGradient id="${id}-foot" x1="0" y1="0" x2="0" y2="1"><stop offset=".55" stop-color="${BLACK}" stop-opacity="0"/><stop offset="1" stop-color="${BLACK}" stop-opacity=".2"/></linearGradient>` +
    `<linearGradient id="${id}-roll" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".22"/><stop offset="1" stop-color="${BLACK}" stop-opacity=".16"/></linearGradient>` +
    `<pattern id="${id}-weave" width="6" height="6" patternUnits="userSpaceOnUse">` +
    `<path d="M0 1.5H6M0 4.5H6" stroke="${BLACK}" stroke-opacity=".11" stroke-width="1.5"/>` +
    `<path d="M1.5 0V6M4.5 0V6" stroke="${WHITE}" stroke-opacity=".12" stroke-width="1.2"/></pattern></defs>` +
    floorShadow(`${id}-floor`, cx, bottom + 2, w * 0.52, 15, 0.3) +
    `<path d="${body}" fill="${BURLAP}"/>` +
    `<path d="${body}" fill="url(#${id}-weave)"/>` +
    `<path d="${body}" fill="url(#${id}-light)"/>` +
    `<path d="${body}" fill="url(#${id}-foot)"/>` +
    fold(cx - rx * 0.62, -16, 0.7) +
    fold(cx - rx * 0.05, 6, 0.86) +
    fold(cx + rx * 0.62, 18, 0.62) +
    sag +
    // The shadow the roll throws on the cloth under it.
    `<path d="M${r1(cx - outerRx + 4)} ${r1(oy + 8)}A${r1(outerRx - 2)} ${r1(outerRy + 4)} 0 0 0 ${r1(cx + outerRx - 4)} ${r1(oy + 8)}" stroke="${BLACK}" stroke-opacity=".2" stroke-width="7"/>` +
    `<ellipse cx="${r1(cx)}" cy="${r1(oy)}" rx="${r1(outerRx)}" ry="${r1(outerRy)}" fill="${BURLAP_LIGHT}" stroke="${BURLAP_DARK}" stroke-width="1.4"/>` +
    `<ellipse cx="${r1(cx)}" cy="${r1(oy)}" rx="${r1(rx)}" ry="${r1(ry)}" fill="${OPENING}"/>` +
    heap({ id: `${id}-heap`, cx, base: oy, half: rx, h: heapH, ry, colour, seed, pods }) +
    `<path d="${front}" fill="${BURLAP_LIGHT}" stroke="${BURLAP_DARK}" stroke-width="1.4" stroke-linejoin="round"/>` +
    `<path d="${front}" fill="url(#${id}-weave)"/>` +
    `<path d="${front}" fill="url(#${id}-roll)"/>` +
    `<path d="${twists}" stroke="${BURLAP_DARK}" stroke-opacity=".75" stroke-width="1.8" stroke-linecap="round"/>`
  );
}

/** A brass scoop, its bowl buried in a heap at the bottom and its handle up and away. */
function scoop(w: number, h: number) {
  return (
    `<defs><linearGradient id="scoop-brass" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#e9c47a"/><stop offset=".5" stop-color="${BRASS}"/><stop offset="1" stop-color="${BRASS_DARK}"/></linearGradient></defs>` +
    `<g transform="translate(${r1(w * 0.74)} ${r1(h * 0.76)}) rotate(-118)">` +
    `<rect x="0" y="-26" width="96" height="52" rx="16" fill="url(#scoop-brass)"/>` +
    `<ellipse cx="2" cy="0" rx="10" ry="26" fill="${BRASS_DARK}"/>` +
    `<rect x="94" y="-9" width="62" height="18" rx="9" fill="url(#scoop-brass)"/>` +
    `<ellipse cx="158" cy="0" rx="10" ry="13" fill="${BRASS}" stroke="${BRASS_DARK}" stroke-width="1.5"/>` +
    `<path d="M10 -18H86" stroke="${WHITE}" stroke-opacity=".45" stroke-width="3" stroke-linecap="round"/>` +
    `</g>` +
    // Where the bowl goes into the heap, the spice falls back over it.
    `<path d="M${r1(w * 0.74 - 40)} ${r1(h * 0.76 + 18)}C${r1(w * 0.74 - 30)} ${r1(h * 0.76 - 8)} ${r1(w * 0.74 - 6)} ${r1(h * 0.76 - 22)} ${r1(w * 0.74 + 10)} ${r1(h * 0.76 - 14)}C${r1(w * 0.74 + 26)} ${r1(h * 0.76 - 4)} ${r1(w * 0.74 + 34)} ${r1(h * 0.76 + 10)} ${r1(w * 0.74 + 40)} ${r1(h * 0.76 + 24)}Z" fill="${PAPRIKA}"/>` +
    grains(random(17), 24, { x: w * 0.74 - 36, y: h * 0.76 - 16, w: 72, h: 38 }, (x, y) => y > h * 0.76 - 8 + Math.abs(x - w * 0.74) * 0.3, [1, 2])
  );
}

/** A label with scooped corners, as an apothecary's jar has: a double rule inside its edge. */
function scooped(x: number, y: number, w: number, h: number, r: number) {
  return (
    `M${r1(x + r)} ${r1(y)}H${r1(x + w - r)}A${r} ${r} 0 0 0 ${r1(x + w)} ${r1(y + r)}` +
    `V${r1(y + h - r)}A${r} ${r} 0 0 0 ${r1(x + w - r)} ${r1(y + h)}` +
    `H${r1(x + r)}A${r} ${r} 0 0 0 ${r1(x)} ${r1(y + h - r)}V${r1(y + r)}A${r} ${r} 0 0 0 ${r1(x + r)} ${r1(y)}Z`
  );
}

function apothecaryLabel(w: number, h: number) {
  return (
    `<path d="${scooped(1, 1, w - 2, h - 2, 26)}" fill="${CREAM}" stroke="${CLOVE}" stroke-opacity=".5" stroke-width="1.5"/>` +
    `<path d="${scooped(12, 12, w - 24, h - 24, 18)}" stroke="${PAPRIKA}" stroke-width="2"/>` +
    `<path d="${scooped(18, 18, w - 36, h - 36, 14)}" stroke="${PAPRIKA}" stroke-opacity=".5" stroke-width="1"/>` +
    starAnise(w / 2, 18, 9, { pod: PAPRIKA, edge: CLOVE, seed: TURMERIC, width: 0.8 }) +
    `<circle cx="${r1(w / 2 - 22)}" cy="${r1(h - 18)}" r="2.6" fill="${PAPRIKA}"/><circle cx="${r1(w / 2)}" cy="${r1(h - 18)}" r="3.4" fill="${PAPRIKA}"/><circle cx="${r1(w / 2 + 22)}" cy="${r1(h - 18)}" r="2.6" fill="${PAPRIKA}"/>`
  );
}

/**
 * A tall glass jar of layered spices with a cork in its neck: the layers sand-poured, each a
 * spice, the glass lit at its edge.
 */
function layeredJar(id: string, w: number, h: number) {
  const neckL = w * 0.28;
  const neckR = w * 0.72;
  const side = 26;
  const base = h - 40;
  const top = 128;
  const body =
    `M${r1(neckL)} ${top}V${top + 26}C${r1(neckL)} ${top + 70} ${side} ${top + 70} ${side} ${top + 140}` +
    `V${r1(base - 50)}Q${side} ${r1(base)} ${side + 50} ${r1(base)}H${r1(w - side - 50)}Q${r1(w - side)} ${r1(base)} ${r1(w - side)} ${r1(base - 50)}` +
    `V${top + 140}C${r1(w - side)} ${top + 70} ${r1(neckR)} ${top + 70} ${r1(neckR)} ${top + 26}V${top}Z`;
  const layers: [number, string][] = [
    [300, SUMAC],
    [372, TURMERIC],
    [446, GREEN_SPICE],
    [506, PAPRIKA],
    [580, CINNAMON],
    [640, TURMERIC],
    [700, CUMIN],
    [756, PAPRIKA],
  ];
  const rand = random(7);
  const wave = (y: number, phase: number) => {
    let d = `M0 ${r1(y)}`;
    for (let x = 0; x <= w; x += 20) {
      d += `L${x} ${r1(y + Math.sin(x / 46 + phase) * 7 + Math.sin(x / 17 + phase * 2) * 2.5)}`;
    }
    return `${d}V${h}H0Z`;
  };
  const fill = layers
    .map(([y, colour], i) => `<path d="${wave(y, i * 1.7)}" fill="${colour}"/>`)
    .join('');
  const grain = grains(rand, 420, { x: 0, y: 290, w, h: h - 290 }, () => true, [1, 2.2]);
  return (
    `<defs><clipPath id="${id}-glass"><path d="${body}"/></clipPath>` +
    `${shading(`${id}-light`, 0.34, 0.3)}` +
    `<linearGradient id="${id}-cork" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#d8b483"/><stop offset=".6" stop-color="${CORK}"/><stop offset="1" stop-color="#9c7448"/></linearGradient></defs>` +
    floorShadow(`${id}-floor`, w / 2, base + 4, w * 0.5, 18, 0.3) +
    `<path d="${body}" fill="${WHITE}" fill-opacity=".38"/>` +
    `<g clip-path="url(#${id}-glass)">${fill}${grain}<rect width="${w}" height="${h}" fill="url(#${id}-light)"/></g>` +
    // The glass: its outline, the light on its edge.
    `<path d="${body}" stroke="${CLOVE}" stroke-opacity=".38" stroke-width="2.5"/>` +
    `<path d="M${side + 16} ${top + 170}V${r1(base - 70)}" stroke="${WHITE}" stroke-opacity=".6" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M${side + 34} ${top + 190}V${top + 320}" stroke="${WHITE}" stroke-opacity=".45" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${r1(w - side - 18)} ${top + 200}V${top + 380}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="5" stroke-linecap="round"/>` +
    // The cork, pressed into the neck.
    `<path d="M${r1(neckL - 10)} ${top - 96}H${r1(neckR + 10)}L${r1(neckR - 2)} ${top + 18}H${r1(neckL + 2)}Z" fill="url(#${id}-cork)"/>` +
    `<ellipse cx="${r1(w / 2)}" cy="${top - 96}" rx="${r1((neckR - neckL) / 2 + 10)}" ry="12" fill="#dcbd8f" stroke="#9c7448" stroke-width="1.2"/>` +
    grains(random(9), 40, { x: neckL, y: top - 90, w: neckR - neckL, h: 100 }, () => true, [1, 2], [
      [CINNAMON_DARK, 0.35],
      [WHITE, 0.3],
    ]) +
    `<path d="M${r1(neckL - 6)} ${top + 16}H${r1(neckR + 6)}" stroke="${CLOVE}" stroke-opacity=".3" stroke-width="2"/>` +
    // A twine tied round the neck.
    `<path d="M${r1(neckL - 4)} ${top + 30}Q${r1(w / 2)} ${top + 44} ${r1(neckR + 4)} ${top + 30}" stroke="${TWINE}" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M${r1(neckR)} ${top + 36}q30 30 18 84M${r1(neckR)} ${top + 36}q12 34 -6 78" stroke="${TWINE}" stroke-width="3.5" stroke-linecap="round"/>`
  );
}

/** A kraft price tag hanging on its string from a rod: the string from the top of the box. */
function hangingTag(id: string, w: number, h: number, top: number) {
  const c = 38;
  const hole = top + 34;
  const d =
    `M${c} ${top}H${w - c}L${w} ${top + c}V${top + h - 12}Q${w} ${top + h} ${w - 12} ${top + h}` +
    `H12Q0 ${top + h} 0 ${top + h - 12}V${top + c}Z`;
  const rand = random(top);
  const fibres = Array.from({ length: 14 }, () => {
    const x = 16 + rand() * (w - 32);
    const y = top + 60 + rand() * (h - 80);
    return `M${r1(x)} ${r1(y)}l${r1(10 + rand() * 18)} ${r1(rand() * 3 - 1.5)}`;
  }).join('');
  return (
    `<defs>${shading(`${id}-light`, 0.22, 0.14)}</defs>` +
    `<path d="M${r1(w / 2 - 3)} 0C${r1(w / 2 - 12)} ${r1(hole * 0.4)} ${r1(w / 2 + 10)} ${r1(hole * 0.7)} ${r1(w / 2)} ${r1(hole - 8)}" stroke="${TWINE}" stroke-width="3" stroke-linecap="round"/>` +
    `<path d="${d}" fill="${KRAFT}" stroke="${KRAFT_EDGE}" stroke-width="1.5"/>` +
    `<path d="${d}" fill="url(#${id}-light)"/>` +
    `<path d="${fibres}" stroke="${CINNAMON_DARK}" stroke-opacity=".12" stroke-width="1.2" stroke-linecap="round"/>` +
    `<circle cx="${r1(w / 2)}" cy="${hole}" r="15" fill="${TURMERIC}"/>` +
    `<circle cx="${r1(w / 2)}" cy="${hole}" r="7" fill="${SAFFRON}" stroke="${BRASS_DARK}" stroke-width="1.2"/>` +
    `<path d="M${r1(w / 2)} ${hole - 8}C${r1(w / 2 + 14)} ${hole - 26} ${r1(w / 2 + 22)} ${hole - 2} ${r1(w / 2 + 6)} ${hole + 4}" stroke="${TWINE}" stroke-width="3" stroke-linecap="round"/>`
  );
}

/** The kraft tag of the foot, on its side, with the hole towards the start. */
function footTag(w: number, h: number) {
  const tip = 22;
  const d = `M8 0H${w - tip}L${w} ${h / 2}L${w - tip} ${h}H8Q0 ${h} 0 ${h - 8}V8Q0 0 8 0Z`;
  return (
    `<path d="${d}" fill="${KRAFT}" stroke="${KRAFT_EDGE}" stroke-width="1.4"/>` +
    `<circle cx="${w - tip + 2}" cy="${h / 2}" r="8.5" fill="${TURMERIC}"/>` +
    `<circle cx="${w - tip + 2}" cy="${h / 2}" r="4" fill="${SAFFRON}" stroke="${BRASS_DARK}" stroke-width="1"/>`
  );
}

/** The string of the foot's tag, out of its hole and loose towards the start. */
const footTwine = (w: number) =>
  `<path d="M2 22C24 4 44 36 70 20S${r1(w - 30)} 10 ${r1(w - 4)} 18" stroke="${TWINE}" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M2 22c8 6 14 10 12 18" stroke="${TWINE}" stroke-width="2.4" stroke-linecap="round"/>`;

/** A long wooden spoon lying on the counter, its bowl at the end with a heap of paprika. */
function woodenSpoon(id: string, w: number, h: number) {
  const cy = h / 2 - 6;
  const bowlR = 116;
  const bowlRy = 50;
  const bx = 24 + bowlR;
  const rand = random(31);
  const handle =
    `M${bx + bowlR - 14} ${cy - 14}C${bx + bowlR + 40} ${cy - 18} ${bx + bowlR + 80} ${cy - 13} ${bx + bowlR + 160} ${cy - 13}` +
    `H${r1(w - 30)}Q${r1(w - 4)} ${cy - 13} ${r1(w - 4)} ${cy}Q${r1(w - 4)} ${cy + 13} ${r1(w - 30)} ${cy + 13}` +
    `H${bx + bowlR + 160}C${bx + bowlR + 80} ${cy + 13} ${bx + bowlR + 40} ${cy + 18} ${bx + bowlR - 14} ${cy + 14}Z`;
  const grainLines = Array.from({ length: 7 }, (_, i) => {
    const y = cy - 9 + i * 3;
    const x0 = bx + bowlR + 40 + rand() * 200;
    const x1 = x0 + 300 + rand() * 600;
    return `M${r1(x0)} ${r1(y)}Q${r1((x0 + x1) / 2)} ${r1(y + (rand() - 0.5) * 3)} ${r1(Math.min(x1, w - 40))} ${r1(y)}`;
  }).join('');
  return (
    `<defs><linearGradient id="${id}-wood" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#d9a86c"/><stop offset=".55" stop-color="${OAK}"/><stop offset="1" stop-color="${OAK_DARK}"/></linearGradient>` +
    `<radialGradient id="${id}-hollow" cx="55%" cy="40%" r="60%"><stop offset="0" stop-color="${OAK_DARK}"/><stop offset="1" stop-color="#6e4520"/></radialGradient></defs>` +
    floorShadow(`${id}-floor`, w * 0.5, cy + 34, w * 0.52, 14, 0.2) +
    `<path d="${handle}" fill="url(#${id}-wood)"/>` +
    `<path d="${grainLines}" stroke="${OAK_DARK}" stroke-opacity=".45" stroke-width="1.2" stroke-linecap="round"/>` +
    `<ellipse cx="${bx}" cy="${cy}" rx="${bowlR}" ry="${bowlRy}" fill="url(#${id}-wood)"/>` +
    `<ellipse cx="${bx + 4}" cy="${cy - 2}" rx="${bowlR - 14}" ry="${bowlRy - 12}" fill="url(#${id}-hollow)"/>` +
    heap({
      id: `${id}-heap`,
      cx: bx + 4,
      base: cy - 2,
      half: bowlR - 18,
      h: 52,
      ry: bowlRy - 15,
      colour: PAPRIKA,
      seed: 5,
    }) +
    `<path d="M${bx - bowlR + 18} ${cy + 18}Q${bx} ${cy + bowlRy + 6} ${bx + bowlR - 18} ${cy + 18}" stroke="${WHITE}" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="${r1(w - 40)}" cy="${cy}" r="5" fill="${OAK_DARK}"/>`
  );
}

/** A wooden serving board with a handle at the end, a hole and a leather loop through it. */
function servingBoard(id: string, w: number, h: number, handle: number) {
  const body = `M${handle + 28} 0H${w - 28}Q${w} 0 ${w} 28V${h - 28}Q${w} ${h} ${w - 28} ${h}H${handle + 28}Q${handle} ${h} ${handle} ${h - 28}V28Q${handle} 0 ${handle + 28} 0Z`;
  const hy = h / 2;
  const tab = `M${handle + 10} ${hy - 70}H${handle - 30}Q2 ${hy - 70} 2 ${hy - 30}V${hy + 30}Q2 ${hy + 70} ${handle - 30} ${hy + 70}H${handle + 10}Z`;
  const rand = random(12);
  const lines = Array.from({ length: 22 }, (_, i) => {
    const y = 18 + (i * (h - 36)) / 21 + (rand() - 0.5) * 6;
    // A gentle wave, a point every 80 pixels and one at its end.
    let d = `M${handle + 8} ${r1(y)}`;
    const xs = [];
    for (let x = handle + 8; x < w - 8; x += 80) xs.push(x);
    for (const x of [...xs.slice(1), w - 8]) d += `L${x} ${r1(y + Math.sin(x / 90 + i) * 2.4)}`;
    return d;
  }).join('');
  return (
    `<defs><linearGradient id="${id}-oak" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#d6a466"/><stop offset=".5" stop-color="${OAK}"/><stop offset="1" stop-color="#a06f3a"/></linearGradient>` +
    `<clipPath id="${id}-clip"><path d="${body}"/></clipPath></defs>` +
    `<path d="${tab}" fill="url(#${id}-oak)"/>` +
    `<path d="${body}" fill="url(#${id}-oak)"/>` +
    `<g clip-path="url(#${id}-clip)"><path d="${lines}" stroke="${OAK_DARK}" stroke-opacity=".28" stroke-width="1.3"/></g>` +
    `<path d="${body}" stroke="${OAK_DARK}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M${handle + 30} 4H${w - 30}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="${r1(handle * 0.42)}" cy="${hy}" r="13" fill="${SAFFRON}" stroke="${OAK_DARK}" stroke-width="2"/>` +
    `<path d="M${r1(handle * 0.42)} ${hy - 13}C${r1(handle * 0.42 - 40)} ${hy - 50} ${r1(handle * 0.42 - 44)} ${hy + 60} ${r1(handle * 0.42)} ${hy + 13}" stroke="${CINNAMON_DARK}" stroke-width="5" stroke-linecap="round"/>`
  );
}

/** A spice jar from the front: a lid, the glass, the spice showing round its label. */
function spiceJar(id: string, w: number, h: number, colour: string, seed: number, label: Frame) {
  const lidL = 80;
  const lidR = w - 80;
  const neckL = 96;
  const neckR = w - 96;
  const side = 12;
  const base = h - 4;
  const body =
    `M${neckL} 52V70C${neckL} 104 ${side} 100 ${side} 136V${base - 44}Q${side} ${base} ${side + 44} ${base}` +
    `H${w - side - 44}Q${w - side} ${base} ${w - side} ${base - 44}V136C${w - side} 100 ${neckR} 104 ${neckR} 70V52Z`;
  const surface = 150;
  let wave = `M0 ${surface}`;
  for (let x = 0; x <= w; x += 25) wave += `L${x} ${r1(surface + Math.sin(x / 38 + seed) * 6)}`;
  wave += `V${h}H0Z`;
  const rand = random(seed);
  return (
    `<defs><clipPath id="${id}-glass"><path d="${body}"/></clipPath>${shading(`${id}-light`, 0.3, 0.3)}` +
    `<linearGradient id="${id}-lid" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#7a5636"/><stop offset="1" stop-color="${CINNAMON_DARK}"/></linearGradient></defs>` +
    `<path d="${body}" fill="${WHITE}" fill-opacity=".45"/>` +
    `<g clip-path="url(#${id}-glass)"><path d="${wave}" fill="${colour}"/>` +
    grains(rand, 260, { x: 0, y: surface - 8, w, h: h - surface }, () => true, [1, 2.4]) +
    `<rect width="${w}" height="${h}" fill="url(#${id}-light)"/></g>` +
    `<path d="${body}" stroke="${CLOVE}" stroke-opacity=".3" stroke-width="2.2"/>` +
    `<path d="M${side + 14} 160V${base - 60}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>` +
    `<path d="M${w - side - 16} 170V${r1(label.y - 12)}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>` +
    // The lid: turned wood with its ridges.
    `<rect x="${lidL}" y="0" width="${lidR - lidL}" height="54" rx="10" fill="url(#${id}-lid)"/>` +
    Array.from({ length: 8 }, (_, i) => {
      const x = lidL + 22 + (i * (lidR - lidL - 44)) / 7;
      return `<path d="M${r1(x)} 10V44" stroke="${BLACK}" stroke-opacity=".18" stroke-width="2.4" stroke-linecap="round"/>`;
    }).join('') +
    `<path d="M${lidL + 12} 8H${lidR - 12}" stroke="${WHITE}" stroke-opacity=".28" stroke-width="3" stroke-linecap="round"/>` +
    // The label's paper, with a rule of the spice's colour.
    `<rect x="${label.x}" y="${label.y}" width="${label.w}" height="${label.h}" rx="6" fill="${CREAM}" stroke="${CLOVE}" stroke-opacity=".14" stroke-width="1.5"/>` +
    `<rect x="${label.x}" y="${label.y}" width="${label.w}" height="8" fill="${colour}"/>` +
    `<path d="M${label.x + 14} ${label.y + label.h - 14}H${label.x + label.w - 14}" stroke="${colour}" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="2 6" stroke-linecap="round"/>`
  );
}

/** An order ticket of the pass: paper torn at its foot, a perforation under the rail. */
function ticket(w: number, h: number, last: boolean) {
  const tooth = 20;
  const n = Math.floor(w / tooth);
  let edge = '';
  for (let i = n; i > 0; i--) {
    const x = (i * w) / n;
    edge += `L${r1(x - w / n / 2)} ${h}L${r1(x - w / n)} ${h - 12}`;
  }
  const d = `M0 0H${w}V${h - 12}${edge}Z`;
  return (
    `<path d="${d}" fill="${CREAM}" stroke="${CLOVE}" stroke-opacity=".1" stroke-width="1.2"/>` +
    `<path d="M16 40H${w - 16}" stroke="${CLOVE}" stroke-opacity=".28" stroke-width="1.6" stroke-dasharray="3 6" stroke-linecap="round"/>` +
    `<circle cx="0" cy="40" r="6" fill="${SAFFRON}"/><circle cx="${w}" cy="40" r="6" fill="${SAFFRON}"/>` +
    (last
      ? `<g transform="rotate(-14 62 92)"><circle cx="62" cy="92" r="34" stroke="${PAPRIKA}" stroke-width="3"/>` +
        `<circle cx="62" cy="92" r="27" stroke="${PAPRIKA}" stroke-opacity=".5" stroke-width="1.4"/>` +
        starAnise(62, 92, 18, { pod: PAPRIKA, edge: PAPRIKA, seed: CREAM, width: 0.6 }) +
        `</g>`
      : '') +
    ''
  );
}

/** The steel rail of the pass the tickets hang from, with its brackets and the way it reads. */
function rail(w: number, h: number, gaps: number[]) {
  const y = 6;
  const bar = h - 16;
  return (
    `<defs><linearGradient id="rail-steel" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#f1ede6"/><stop offset=".45" stop-color="${STEEL}"/><stop offset="1" stop-color="${STEEL_DARK}"/></linearGradient></defs>` +
    `<rect x="0" y="0" width="22" height="${h}" rx="5" fill="${STEEL_DARK}"/>` +
    `<rect x="${w - 22}" y="0" width="22" height="${h}" rx="5" fill="${STEEL_DARK}"/>` +
    `<rect x="10" y="${y}" width="${w - 20}" height="${bar}" rx="${bar / 2}" fill="url(#rail-steel)"/>` +
    `<path d="M20 ${y + 4}H${w - 20}" stroke="${WHITE}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>` +
    // Chevrons between the tickets, from the start to the end: the order the kitchen takes them.
    gaps
      .map(
        (x) =>
          `<path d="M${r1(x + 6)} ${y + bar / 2 - 7}L${r1(x - 2)} ${y + bar / 2}L${r1(x + 6)} ${y + bar / 2 + 7}" stroke="${PAPRIKA}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
      )
      .join('')
  );
}

/** A measuring spoon from above: the handle up, the bowl at the foot holding what the step uses. */
function measuringSpoon(id: string, w: number, h: number, r: number, step: number) {
  const cx = w / 2;
  const cy = h - r - 10;
  const rand = random(40 + step);
  const handle =
    `M${cx - 11} ${r1(cy - r + 8)}L${cx - 14} 34Q${cx - 15} 6 ${cx} 6Q${cx + 15} 6 ${cx + 14} 34L${cx + 11} ${r1(cy - r + 8)}Z`;
  const inner = r - 7;
  const insideBowl = (x: number, y: number) => (x - cx) ** 2 + (y - cy) ** 2 < (inner - 4) ** 2;
  const box = { x: cx - inner, y: cy - inner, w: inner * 2, h: inner * 2 };
  let contents = '';
  if (step < 2) {
    // Whole seeds, raw and then toasted.
    const tone = step === 0 ? SEED : '#5e3c1c';
    contents =
      `<defs>${seedMotif(`${id}-seed`, 5.5, 0, tone)}</defs>` +
      `<circle cx="${cx}" cy="${r1(cy)}" r="${inner - 2}" fill="${step === 0 ? '#b08a55' : '#6e4a26'}"/>` +
      Array.from({ length: Math.round(inner * 1.3) }, () => {
        const x = box.x + rand() * box.w;
        const y = box.y + rand() * box.h;
        return insideBowl(x, y)
          ? `<use href="#${id}-seed" transform="translate(${r1(x)} ${r1(y)}) rotate(${Math.round(rand() * 180)})"/>`
          : '';
      }).join('');
  } else {
    const colour = [CINNAMON, PAPRIKA, PAPRIKA][step - 2]!;
    contents =
      `<circle cx="${cx}" cy="${r1(cy)}" r="${inner - 2}" fill="${colour}"/>` +
      grains(rand, Math.round(inner * 2.2), box, insideBowl, [1, 2.2]) +
      (step === 3
        ? grains(rand, 14, box, insideBowl, [1.6, 2.6], [
            [TURMERIC, 0.9],
            [WHITE, 0.4],
          ])
        : '') +
      (step === 4
        ? // Beads of olive oil on the blend, each catching the light, and a leaf of thyme.
          (
            [
              [-0.42, -0.2, 0.17],
              [0.12, -0.4, 0.12],
              [0.36, 0.08, 0.15],
              [-0.12, 0.3, 0.11],
              [-0.05, -0.02, 0.08],
            ] as const
          )
            .map(
              ([dx, dy, k]) =>
                `<ellipse cx="${r1(cx + inner * dx)}" cy="${r1(cy + inner * dy)}" rx="${r1(inner * k)}" ry="${r1(inner * k * 0.8)}" fill="#e3b23c" fill-opacity=".72" stroke="#a8761c" stroke-opacity=".5" stroke-width="1"/>` +
                `<circle cx="${r1(cx + inner * (dx - k * 0.35))}" cy="${r1(cy + inner * (dy - k * 0.3))}" r="${r1(Math.max(1.4, inner * k * 0.28))}" fill="${WHITE}" fill-opacity=".85"/>`,
            )
            .join('') + bayLeaf(cx + inner * 0.1, cy + inner * 0.55, inner * 0.55, -70, '#6f8a3c')
        : '');
  }
  return (
    `<defs><linearGradient id="${id}-steel" x1="0" y1="0" x2="1" y2="1">` +
    `<stop offset="0" stop-color="#f4f1ec"/><stop offset=".5" stop-color="${STEEL}"/><stop offset="1" stop-color="${STEEL_DARK}"/></linearGradient>` +
    `<radialGradient id="${id}-shade" cx="60%" cy="62%" r="60%"><stop offset=".6" stop-color="${BLACK}" stop-opacity="0"/><stop offset="1" stop-color="${BLACK}" stop-opacity=".35"/></radialGradient></defs>` +
    floorShadow(`${id}-floor`, cx + 6, cy + r - 2, r * 1.05, 10, 0.2) +
    `<path d="${handle}" fill="url(#${id}-steel)" stroke="${STEEL_DARK}" stroke-width="1.2"/>` +
    `<circle cx="${cx}" cy="22" r="6" fill="${SAFFRON}" stroke="${STEEL_DARK}" stroke-width="1.2"/>` +
    `<circle cx="${cx}" cy="${r1(cy)}" r="${r}" fill="url(#${id}-steel)" stroke="${STEEL_DARK}" stroke-width="1.4"/>` +
    contents +
    `<circle cx="${cx}" cy="${r1(cy)}" r="${inner - 2}" fill="url(#${id}-shade)"/>` +
    `<path d="M${r1(cx - r * 0.7)} ${r1(cy - r * 0.55)}A${r} ${r} 0 0 1 ${r1(cx + r * 0.1)} ${r1(cy - r * 0.98)}" stroke="${WHITE}" stroke-opacity=".8" stroke-width="2.4" stroke-linecap="round"/>`
  );
}

/** A trail of spilt grains from one spoon to the next, under them, in the way the steps go. */
function grainTrail(w: number, h: number, centres: number[]) {
  const rand = random(77);
  const dots = new Dots();
  for (let i = 0; i < centres.length - 1; i++) {
    const a = centres[i]!;
    const b = centres[i + 1]!;
    for (let k = 0; k < 26; k++) {
      const t = 0.18 + (0.64 * k) / 25;
      const x = a + (b - a) * t + (rand() - 0.5) * 8;
      const y = h / 2 + Math.sin(t * Math.PI) * -10 + (rand() - 0.5) * 9;
      const r = 1.4 + rand() * 1.8;
      // The specks of the trail at two strengths: deep and faint.
      dots.add(x, y, r, [CINNAMON, PAPRIKA, SEED][k % 3]!, 0.55 + rand() * 0.4 < 0.75 ? 0.65 : 0.85);
    }
  }
  return dots.markup();
}

/** A kraft sachet of spice blend, folded at the top and tied. */
const sachet = (w: number, h: number) =>
  `<path d="M8 ${h * 0.22}H${w - 8}L${w - 4} ${h - 6}Q${w - 4} ${h} ${w - 10} ${h}H10Q4 ${h} 4 ${h - 6}Z" fill="${KRAFT}" stroke="${KRAFT_EDGE}" stroke-width="1.4"/>` +
  `<path d="M10 ${h * 0.22}L16 4H${w - 16}L${w - 10} ${h * 0.22}" fill="${KRAFT}" stroke="${KRAFT_EDGE}" stroke-width="1.4"/>` +
  `<path d="M8 ${r1(h * 0.3)}H${w - 8}" stroke="${TWINE}" stroke-width="3"/>` +
  `<circle cx="${w / 2}" cy="${r1(h * 0.62)}" r="${r1(w * 0.18)}" fill="${PAPRIKA}"/>` +
  `<circle cx="${w / 2}" cy="${r1(h * 0.62)}" r="${r1(w * 0.12)}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.4" stroke-dasharray="1 3"/>`;

/** The beam of a market balance, tilted towards the heavier pan, on the head of its post. */
function beam(w: number, h: number, tilt: number) {
  const cx = w / 2;
  const cy = h / 2;
  const half = w / 2 - 40;
  return (
    `<defs><linearGradient id="beam-brass" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#ecca85"/><stop offset=".5" stop-color="${BRASS}"/><stop offset="1" stop-color="${BRASS_DARK}"/></linearGradient></defs>` +
    `<g transform="rotate(${tilt} ${cx} ${cy})">` +
    `<path d="M${cx - half} ${cy - 5}Q${cx} ${cy - 16} ${cx + half} ${cy - 5}V${cy + 5}Q${cx} ${cy + 12} ${cx - half} ${cy + 5}Z" fill="url(#beam-brass)" stroke="${BRASS_DARK}" stroke-width="1.2"/>` +
    `<circle cx="${cx - half}" cy="${cy}" r="11" fill="url(#beam-brass)" stroke="${BRASS_DARK}" stroke-width="1.4"/>` +
    `<circle cx="${cx + half}" cy="${cy}" r="11" fill="url(#beam-brass)" stroke="${BRASS_DARK}" stroke-width="1.4"/>` +
    `<circle cx="${cx - half}" cy="${cy}" r="4" fill="${BRASS_DARK}"/><circle cx="${cx + half}" cy="${cy}" r="4" fill="${BRASS_DARK}"/>` +
    `<path d="M${cx} ${cy - 48}L${cx - 7} ${cy - 6}H${cx + 7}Z" fill="${PAPRIKA}"/>` +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="16" fill="url(#beam-brass)" stroke="${BRASS_DARK}" stroke-width="1.6"/>` +
    `<circle cx="${cx}" cy="${cy}" r="5" fill="${BRASS_DARK}"/>`
  );
}

/** The post of the balance and its stepped foot. */
function post(w: number, h: number) {
  const cx = w / 2;
  return (
    `<defs><linearGradient id="post-brass" x1="0" y1="0" x2="1" y2="0">` +
    `<stop offset="0" stop-color="#ecca85"/><stop offset=".45" stop-color="${BRASS}"/><stop offset="1" stop-color="${BRASS_DARK}"/></linearGradient></defs>` +
    floorShadow('post-floor', cx, h - 6, w * 0.5, 10, 0.26) +
    `<path d="M${cx - 9} 0H${cx + 9}L${cx + 13} ${h - 70}H${cx - 13}Z" fill="url(#post-brass)"/>` +
    `<rect x="${cx - 34}" y="${h - 76}" width="68" height="16" rx="5" fill="url(#post-brass)"/>` +
    `<path d="M${cx - 60} ${h - 60}H${cx + 60}L${cx + 76} ${h - 26}H${cx - 76}Z" fill="url(#post-brass)"/>` +
    `<rect x="${cx - 90}" y="${h - 28}" width="180" height="18" rx="6" fill="url(#post-brass)" stroke="${BRASS_DARK}" stroke-width="1"/>` +
    `<path d="M${cx - 6} 10V${h - 90}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="2.4" stroke-linecap="round"/>`
  );
}

/** A pan of the balance on its three strings, holding a heap: full on the side that wins. */
function pan(id: string, w: number, h: number, colour: string, heapH: number, seed: number) {
  const cx = w / 2;
  const rim = h - 60;
  const rx = w / 2 - 20;
  const ry = 16;
  return (
    `<defs><linearGradient id="${id}-brass" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="#ecca85"/><stop offset=".5" stop-color="${BRASS}"/><stop offset="1" stop-color="${BRASS_DARK}"/></linearGradient></defs>` +
    `<path d="M${cx} 10L${cx - rx + 6} ${rim}M${cx} 10L${cx + rx - 6} ${rim}M${cx} 10L${cx + 18} ${rim - 4}" stroke="${CLOVE}" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<circle cx="${cx}" cy="10" r="7" stroke="${BRASS_DARK}" stroke-width="3"/>` +
    `<path d="M${cx - rx} ${rim}Q${cx - rx + 20} ${rim + 54} ${cx} ${rim + 54}Q${cx + rx - 20} ${rim + 54} ${cx + rx} ${rim}Z" fill="url(#${id}-brass)"/>` +
    `<ellipse cx="${cx}" cy="${rim}" rx="${rx}" ry="${ry}" fill="${BRASS_DARK}"/>` +
    (heapH > 0
      ? heap({ id: `${id}-heap`, cx, base: rim, half: rx - 8, h: heapH, ry: ry - 3, colour, seed })
      : '') +
    `<path d="M${cx - rx} ${rim}A${rx} ${ry} 0 0 0 ${cx + rx} ${rim}" stroke="#ecca85" stroke-width="3"/>`
  );
}

/** A cutting board of maple, its handle at the end with a hole and a loop of leather. */
function cuttingBoard(id: string, w: number, h: number, handle: number) {
  const body = `M${handle + 30} 0H${w - 30}Q${w} 0 ${w} 30V${h - 30}Q${w} ${h} ${w - 30} ${h}H${handle + 30}Q${handle} ${h} ${handle} ${h - 30}V30Q${handle} 0 ${handle + 30} 0Z`;
  const hy = h / 2;
  const tab = `M${handle + 20} ${hy - 80}H${handle - 40}Q4 ${hy - 80} 4 ${hy - 40}V${hy + 40}Q4 ${hy + 80} ${handle - 40} ${hy + 80}H${handle + 20}Z`;
  const rand = random(3);
  const lines = Array.from({ length: 16 }, (_, i) => {
    const y = 20 + (i * (h - 40)) / 15 + (rand() - 0.5) * 10;
    // A gentle wave, a point every 100 pixels and one at its end.
    let d = `M${handle + 10} ${r1(y)}`;
    const xs = [];
    for (let x = handle + 10; x < w - 10; x += 100) xs.push(x);
    for (const x of [...xs, w - 10]) d += `L${x} ${r1(y + Math.sin(x / 120 + i * 0.8) * 3)}`;
    return d;
  }).join('');
  return (
    `<defs><clipPath id="${id}-clip"><path d="${body}"/></clipPath></defs>` +
    `<path d="${tab}" fill="${MAPLE}" stroke="${MAPLE_EDGE}" stroke-width="2"/>` +
    `<path d="${body}" fill="${MAPLE}"/>` +
    `<g clip-path="url(#${id}-clip)"><path d="${lines}" stroke="${MAPLE_EDGE}" stroke-opacity=".35" stroke-width="1.4"/></g>` +
    `<path d="${body}" stroke="${MAPLE_EDGE}" stroke-width="2.5"/>` +
    `<circle cx="${r1(handle * 0.45)}" cy="${hy}" r="15" fill="${SAFFRON}" stroke="${MAPLE_EDGE}" stroke-width="2"/>` +
    `<path d="M${r1(handle * 0.45)} ${hy - 15}C${r1(handle * 0.45 - 46)} ${hy - 56} ${r1(handle * 0.45 - 50)} ${hy + 64} ${r1(handle * 0.45)} ${hy + 15}" stroke="${CINNAMON_DARK}" stroke-width="5" stroke-linecap="round"/>`
  );
}

/** Three quills of cinnamon tied with twine: an accent on a corner. */
const cinnamonBundle = (w: number, h: number) =>
  `<g transform="rotate(-16 ${w / 2} ${h / 2})">` +
  cinnamon(14, h / 2 - 16, w - 30, 0, 18) +
  cinnamon(4, h / 2 + 2, w - 24, 0, 20) +
  cinnamon(20, h / 2 + 20, w - 36, 0, 17) +
  `<path d="M${r1(w * 0.42)} ${h / 2 - 30}V${h / 2 + 34}M${r1(w * 0.46)} ${h / 2 - 30}V${h / 2 + 34}" stroke="${TWINE}" stroke-width="4" stroke-linecap="round"/>` +
  `<path d="M${r1(w * 0.44)} ${h / 2 + 30}q-10 18 -26 22M${r1(w * 0.44)} ${h / 2 + 30}q8 18 22 20" stroke="${TWINE}" stroke-width="3" stroke-linecap="round"/>` +
  `</g>`;

/** A stone mortar from the side: its back rim and the spice ground in it. */
function mortarBack(id: string, w: number, h: number) {
  const cx = w / 2;
  const rim = 80;
  const rx = w / 2 - 16;
  const ry = 58;
  return (
    `<defs><radialGradient id="${id}-hollow" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="${STONE}"/><stop offset="1" stop-color="${STONE_DARK}"/></radialGradient></defs>` +
    `<ellipse cx="${cx}" cy="${rim}" rx="${rx}" ry="${ry}" fill="${STONE}"/>` +
    `<ellipse cx="${cx}" cy="${rim + 4}" rx="${rx - 22}" ry="${ry - 16}" fill="url(#${id}-hollow)"/>` +
    heap({
      id: `${id}-heap`,
      cx,
      base: rim + 18,
      half: rx - 40,
      h: 78,
      ry: ry - 26,
      colour: PAPRIKA,
      seed: 61,
    })
  );
}

/** The bowl of the mortar in front of what is in it: the stone, speckled, on its foot. */
function mortarFront(id: string, w: number, h: number) {
  const cx = w / 2;
  const rim = 80;
  const rx = w / 2 - 16;
  const ry = 58;
  const foot = h - 30;
  const bowl =
    `M${cx - rx} ${rim}A${rx} ${ry} 0 0 0 ${cx + rx} ${rim}` +
    `C${cx + rx} ${rim + 150} ${cx + rx * 0.6} ${foot - 50} ${cx + rx * 0.42} ${foot - 30}` +
    `L${cx + rx * 0.48} ${foot}H${cx - rx * 0.48}L${cx - rx * 0.42} ${foot - 30}` +
    `C${cx - rx * 0.6} ${foot - 50} ${cx - rx} ${rim + 150} ${cx - rx} ${rim}Z`;
  const rand = random(19);
  return (
    `<defs>${shading(`${id}-light`, 0.3, 0.36)}<clipPath id="${id}-clip"><path d="${bowl}"/></clipPath></defs>` +
    floorShadow(`${id}-floor`, cx + 20, foot + 4, rx * 0.95, 20, 0.3) +
    `<path d="${bowl}" fill="${STONE}"/>` +
    `<g clip-path="url(#${id}-clip)">` +
    grains(rand, 520, { x: cx - rx, y: rim, w: rx * 2, h: foot - rim }, () => true, [0.8, 2], [
      [WHITE, 0.3],
      [BLACK, 0.25],
      [STONE_DARK, 0.6],
    ]) +
    `<rect x="0" y="0" width="${w}" height="${h}" fill="url(#${id}-light)"/></g>` +
    `<path d="M${cx - rx} ${rim}A${rx} ${ry} 0 0 0 ${cx + rx} ${rim}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="3"/>` +
    `<path d="M${cx - rx * 0.46} ${foot - 30}H${cx + rx * 0.44}" stroke="${BLACK}" stroke-opacity=".2" stroke-width="2"/>`
  );
}

/** The pestle, leaning in the mortar. */
function pestle(id: string, w: number, h: number) {
  return (
    `<defs>${shading(`${id}-light`, 0.34, 0.34)}</defs>` +
    `<g transform="rotate(24 ${w / 2} ${h / 2})">` +
    `<path d="M${w / 2 - 20} 10Q${w / 2} 0 ${w / 2 + 20} 10L${w / 2 + 40} ${h - 90}Q${w / 2 + 46} ${h - 10} ${w / 2} ${h - 8}Q${w / 2 - 46} ${h - 10} ${w / 2 - 40} ${h - 90}Z" fill="${STONE}"/>` +
    `<path d="M${w / 2 - 20} 10Q${w / 2} 0 ${w / 2 + 20} 10L${w / 2 + 40} ${h - 90}Q${w / 2 + 46} ${h - 10} ${w / 2} ${h - 8}Q${w / 2 - 46} ${h - 10} ${w / 2 - 40} ${h - 90}Z" fill="url(#${id}-light)"/>` +
    grains(random(23), 120, { x: w / 2 - 40, y: 10, w: 80, h: h - 20 }, (x, y) => Math.abs(x - w / 2) < 14 + (y / h) * 26, [0.8, 1.8], [
      [WHITE, 0.3],
      [BLACK, 0.22],
    ]) +
    grains(random(29), 70, { x: w / 2 - 44, y: h - 80, w: 88, h: 70 }, (x, y) => Math.abs(x - w / 2) < 40 && y > h - 78, [1, 2.2], [[PAPRIKA, 0.85], [PAPRIKA, 0.55]]) +
    `</g>`
  );
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const START = 128;
const END = 128;
const WIDTH = 1920 - START - END;

/** The kicker on its pinch of paprika, and the title under it. */
function head(name: string, width = 1400, lines = 1) {
  const title = at(START, 124, width, Math.round(58 * 1.3 * lines) + 4);
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 42, 82, Math.min(1000, width - 42), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [pinch(`d_tavlin_${name}_pinch`, at(START, 89, 30, 22))],
  };
}

/** The mark of the deck: a star anise, which the user may replace with a logo. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const markup = svg(
    s,
    s,
    own(id, starAnise(s / 2, s / 2, s / 2 - 1, { pod: PAPRIKA, edge: CLOVE, seed: TURMERIC, width: s / 36 })),
  );
  return drawing(id, frame, markup, paint(markup), { role: 'logo', name: 'logo' });
}

/**
 * The foot of a content slide: the mark and the deck's footer at the start; at the end the
 * slide's number on a kraft price tag, its string loose towards the words.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 62, 961, 860, 36), 'caption')]
      : [],
    decorations: [
      mark(`d_tavlin_${name}_mark`, at(START, 954, 46, 46)),
      art(`d_tavlin_${name}_tag`, atEnd(END, 952, 96, 50), footTag(96, 50)),
      art(`d_tavlin_${name}_twine`, atEnd(END + 80, 954, 150, 44), footTwine(150)),
      pageNumber(`d_tavlin_${name}_number`, atEnd(END + 2, 959, 70, 36), 'caption', {
        color: token('text'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A sheet of paper on the counter: a card. */
const card = (id: string, frame: Frame, radius = 18) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.09), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 14, blur: 36, color: { value: '#5a3a14', alpha: 0.12 } } },
  });

/** A figure of a list in the cookbook's serif, upright in both directions. */
const figure = (id: string, frame: Frame, n: number) =>
  upright(
    id,
    frame,
    `<text x="${frame.w / 2}" y="${r1(frame.h * 0.82)}" text-anchor="middle" font-family="Lora, Frank Ruhl Libre, serif" font-style="italic" font-size="${r1(frame.h * 0.92)}" font-weight="700" fill="${PAPRIKA}">${n}</text>`,
  );

/** Small line drawings of the closing's lines: a place, a day, a sign-up. */
const LINE = `stroke="${CLOVE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"`;
const CLOSING_ICONS = [
  `<path d="M20 36C12 27 7 21 7 15A13 13 0 0 1 33 15C33 21 28 27 20 36Z" ${LINE}/><circle cx="20" cy="15" r="4.5" fill="${PAPRIKA}"/>`,
  `<rect x="5" y="9" width="30" height="26" rx="4" ${LINE}/><path d="M5 16H35M13 5V12M27 5V12" ${LINE}/><circle cx="26" cy="26" r="3.5" fill="${PAPRIKA}"/>`,
  `<path d="M9 30L27 12L31 16L13 34L7 36Z" ${LINE}/><path d="M24 15L28 19" ${LINE}/><circle cx="31" cy="33" r="3.5" fill="${PAPRIKA}"/>`,
];

/** The signature spice of each person of the team, drawn small. */
const SIGNATURES = [
  (s: number) => podGlyph(s / 2, s / 2, s * 0.4, -30, POD) + podGlyph(s / 2 + 6, s / 2 + 8, s * 0.3, 20, '#a5b770'),
  // A pinch of ground cumin, as the sacks of the opening hold it.
  (s: number) =>
    `<path d="M${r1(s * 0.06)} ${r1(s * 0.86)}C${r1(s * 0.22)} ${r1(s * 0.84)} ${r1(s * 0.38)} ${r1(s * 0.2)} ${r1(s * 0.5)} ${r1(s * 0.16)}C${r1(s * 0.62)} ${r1(s * 0.2)} ${r1(s * 0.78)} ${r1(s * 0.84)} ${r1(s * 0.94)} ${r1(s * 0.86)}Z" fill="${CUMIN}"/>` +
    `<path d="M${r1(s * 0.5)} ${r1(s * 0.16)}C${r1(s * 0.62)} ${r1(s * 0.2)} ${r1(s * 0.78)} ${r1(s * 0.84)} ${r1(s * 0.94)} ${r1(s * 0.86)}H${r1(s * 0.5)}Z" fill="${BLACK}" fill-opacity=".2"/>` +
    grains(random(91), 18, { x: s * 0.2, y: s * 0.3, w: s * 0.6, h: s * 0.52 }, (x, y) => y > s * 0.2 + Math.abs(x - s * 0.5) * 1.4, [0.8, 1.6]),
  (s: number) => chili(s * 0.16, s * 0.4, s * 0.78, 18),
  (s: number) => starAnise(s / 2, s / 2, s / 2 - 2),
];

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of jars, tickets, spoons and people. */
const cards3 = [START, START + 582, START + 1164];
const stops4 = [START, START + 422, START + 844, START + 1266];
const steps5 = [START, START + 341, START + 682, START + 1023, START + 1364];
const team4 = [START, START + 428, START + 856, START + 1284];

function layouts(): Layout[] {
  // The opening's sacks: three behind, two in front, at the end of the slide.
  const sacks: [string, Frame, string, number, number, boolean][] = [
    ['sumac', atEnd(56, 318, 250, 380), SUMAC, 150, 11, false],
    ['turmeric', atEnd(298, 286, 262, 412), TURMERIC, 178, 12, false],
    ['cumin', atEnd(552, 336, 244, 362), CUMIN, 142, 13, false],
    ['paprika', atEnd(150, 520, 312, 440), PAPRIKA, 168, 14, false],
    ['cardamom', atEnd(452, 560, 292, 400), POD, 128, 15, true],
  ];

  // The jar of the cards, and its label, in the jar's own box.
  const jarW = 500;
  const jarH = 632;
  const jarLabel = { x: 30, y: 176, w: jarW - 60, h: 336 };
  const jarTop = 244;

  // The tags of the big number hang at three heights from one rod.
  const tagTops = [404, 486, 436];
  const tagX = (i: number) => START + 834 + i * 282;

  // The balance of the comparison: the beam's ends over the middle of each card.
  const tilt = 2.6;
  const reach = 482;
  const drop = Math.tan((tilt * Math.PI) / 180) * reach;

  // The spoons of the process grow from the first step to the last.
  const spoonR = [44, 52, 60, 68, 76];

  return [
    {
      id: 'l_tavlin_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 42, 286, 820, 36), 'caption', {
          color: token('primary'),
        }),
        // Deep enough for two lines at the leading Devanagari needs (`LEADING`).
        place('p_title', 'title', at(START, 330, 880, 252), 'display'),
        place('p_subtitle', 'subtitle', at(START, 588, 800, 130), 'heading'),
        place('p_meta', 'caption', at(START, 796, 820, 36), 'caption'),
      ],
      decorations: [
        pinch('d_tavlin_hero_pinch', at(START, 293, 30, 22)),
        art('d_tavlin_hero_seeds', at(START, 764, 520, 14), seedLine(520, PAPRIKA)),
        ...sacks.map(([name, frame, colour, heapH, seed, pods]) =>
          art(`d_tavlin_hero_${name}`, frame, sack(`d_tavlin_hero_${name}`, frame.w, frame.h, colour, heapH, seed, pods)),
        ),
        art('d_tavlin_hero_scoop', atEnd(118, 500, 200, 184), scoop(200, 184)),
        art(
          'd_tavlin_hero_scatter',
          atEnd(56, 944, 700, 90),
          starAnise(54, 46, 34, { rot: 12 }) +
            chili(170, 40, 120, -8) +
            chili(250, 66, 104, 14, '#9e2214') +
            peppercorn(400, 58, 7) +
            peppercorn(418, 70, 6) +
            peppercorn(386, 74, 6.5) +
            cinnamon(470, 52, 170, -6, 20) +
            podGlyph(670, 60, 11, 30) +
            podGlyph(646, 74, 10, -20),
        ),
      ],
    },
    {
      id: 'l_tavlin_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(296, 520, 268, 150), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('primary'),
        }),
        place('p_kicker', 'caption', at(START + 42, 380, 780, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 424, 900, 236), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 680, 820, 130), 'heading'),
      ],
      decorations: [
        art('d_tavlin_section_jar', atEnd(200, 110, 460, 880), layeredJar('d_tavlin_section_jar', 460, 880)),
        lifted(art('d_tavlin_section_label', atEnd(270, 494, 320, 202), apothecaryLabel(320, 202)), 6, 14, 0.18),
        pinch('d_tavlin_section_pinch', at(START, 387, 30, 22)),
        art('d_tavlin_section_seeds', at(START, 830, 420, 14), seedLine(420, PAPRIKA)),
        art(
          'd_tavlin_section_scatter',
          atEnd(612, 906, 250, 84),
          starAnise(44, 44, 32, { rot: 8 }) + cinnamon(96, 52, 130, -10, 18) + peppercorn(236, 66, 6.5),
        ),
      ],
    },
    {
      id: 'l_tavlin_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1100).placeholders,
        place('p_number', 'number', at(START, 336, 760, 134), 'display', {
          color: token('primary'),
        }),
        place('p_label', 'subtitle', at(START, 536, 700, 90), 'heading'),
        place('p_note', 'body', at(START, 640, 680, 160), 'body'),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_number${i + 2}`, 'number', at(tagX(i) + 20, tagTops[i]! + 66, 216, 76), 'title', {
            align: 'center',
            color: token('primary'),
          }),
          place(`p_label${i + 2}`, 'caption', at(tagX(i) + 20, tagTops[i]! + 148, 216, 136), 'caption', {
            align: 'center',
            color: token('text'),
          }),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1100).decorations,
        // The figure's swoosh: ground paprika drawn across a plate with the back of a spoon.
        art(
          'd_tavlin_big_number_swoosh',
          at(START, 480, 540, 40),
          (() => {
            const d = 'M6 22C80 10 220 6 360 12C430 15 500 20 536 28C470 30 400 34 320 33C200 32 90 34 6 22Z';
            const rand = random(4);
            return (
              `<path d="${d}" fill="${PAPRIKA}"/>` +
              grains(rand, 90, { x: 0, y: 4, w: 540, h: 34 }, (x, y) => y > 10 + x * 0.004 && y < 33 - Math.abs(x - 300) * 0.01, [0.8, 1.8]) +
              grains(rand, 26, { x: 440, y: 18, w: 100, h: 20 }, () => true, [1, 2], [[PAPRIKA, 0.8]])
            );
          })(),
        ),
        art(
          'd_tavlin_big_number_rod',
          at(START + 800, 250, 864, 24),
          `<defs><linearGradient id="rod-oak" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#d9a86c"/><stop offset="1" stop-color="${OAK_DARK}"/></linearGradient></defs>` +
            `<rect x="10" y="4" width="844" height="16" rx="8" fill="url(#rod-oak)"/>` +
            `<circle cx="12" cy="12" r="11" fill="${OAK_DARK}"/><circle cx="852" cy="12" r="11" fill="${OAK_DARK}"/>` +
            `<path d="M24 7H840" stroke="${WHITE}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          lifted(
            art(
              `d_tavlin_big_number_tag${i + 2}`,
              at(tagX(i), 262, 256, tagTops[i]! + 300 - 262),
              hangingTag(`d_tavlin_big_number_tag${i + 2}`, 256, 300, tagTops[i]! - 262),
            ),
            8,
            18,
            0.14,
          ),
        ),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_tavlin_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(START, 288, 1240, 284), 'title', { vAlign: 'middle' }),
        place('p_attribution', 'attribution', at(START, 756, 900, 48), 'heading'),
        place('p_caption', 'caption', at(START, 808, 900, 40), 'caption'),
        ...foot('quote').placeholders,
      ],
      decorations: [
        upright(
          'd_tavlin_quote_marks',
          at(START, 176, 124, 96),
          [0, 66]
            .map(
              (x) =>
                `<path d="M${x + 44} 2C${x + 18} 14 ${x + 2} 40 ${x + 2} 64C${x + 2} 82 ${x + 14} 94 ${x + 29} 94C${x + 45} 94 ${x + 56} 83 ${x + 56} 69C${x + 56} 55 ${x + 45} 45 ${x + 31} 45C${x + 27} 45 ${x + 24} 46 ${x + 21} 47C${x + 24} 31 ${x + 33} 18 ${x + 48} 10Z" fill="${PAPRIKA}"/>`,
            )
            .join(''),
        ),
        lifted(art('d_tavlin_quote_spoon', at(START, 592, WIDTH, 136), woodenSpoon('d_tavlin_quote_spoon', WIDTH, 136)), 10, 18, 0.18),
        art(
          'd_tavlin_quote_scatter',
          atEnd(END + 40, 744, 520, 110),
          starAnise(66, 54, 40, { rot: 18 }) +
            peppercorn(150, 70, 7.5) +
            peppercorn(170, 86, 6.5) +
            peppercorn(136, 92, 6) +
            grains(random(8), 40, { x: 200, y: 50, w: 260, h: 40 }, () => true, [1.2, 2.6], [[PAPRIKA, 0.85]]) +
            bayLeaf(330, 80, 120, -12),
        ),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_tavlin_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a recipe card from margin to margin, down to over the foot, from its
      // top; a star anise lies on the card's far corner, beside the title.
      placeholders: [
        place('p_title', 'title', at(START, 100, WIDTH - 260, 84), 'title'),
        place('p_body', 'body', at(START + 72, 300, WIDTH - 144, 590), 'body'),
      ],
      decorations: [
        card('d_tavlin_text_card', at(START, 222, WIDTH, 706)),
        art(
          'd_tavlin_text_rules',
          at(START + 40, 250, WIDTH - 80, 10),
          `<path d="M0 2H${WIDTH - 80}M0 8H${WIDTH - 80}" stroke="${PAPRIKA}" stroke-width="1.6"/>`,
        ),
        art(
          'd_tavlin_text_anise',
          atEnd(END - 34, 152, 140, 132),
          `<g transform="rotate(-8 70 66)">${starAnise(62, 70, 56, { rot: 10 })}</g>` + peppercorn(124, 32, 6.5) + peppercorn(132, 50, 5.5),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_tavlin_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 900).placeholders,
        place('p_image', 'image', atEnd(END + 112, 188, 584, 686)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 92, 296 + i * 200, 780, 48), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 92, 350 + i * 200, 780, 120), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 900).decorations,
        lifted(art('d_tavlin_text_image_board', atEnd(END, 150, 732, 762), servingBoard('d_tavlin_text_image_board', 732, 762, 76)), 18, 40, 0.2),
        ...[0, 1, 2].map((i) => figure(`d_tavlin_text_image_figure${i + 1}`, at(START, 290 + i * 200, 64, 66), i + 1)),
        ...[1, 2].map((i) =>
          art(`d_tavlin_text_image_seeds${i}`, at(START + 92, 270 + i * 200, 780, 14), seedLine(780, MUTED, 26)),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_tavlin_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', at(0, 0, 1920, 740)),
        place('p_place', 'caption', at(START + 42, 792, 760, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 836, 880, 142), 'title'),
        place('p_body', 'body', atEnd(END, 804, 680, 172), 'body', { vAlign: 'middle' }),
      ],
      decorations: [
        // The spice rack's six colours, a ribbon under the photograph.
        art(
          'd_tavlin_full_image_ribbon',
          at(0, 740, 1920, 16),
          [TURMERIC, PAPRIKA, LEAF, SUMAC, CINNAMON, CLOVE]
            .map((c, i) => `<rect x="${r1((i * 1920) / 6)}" y="0" width="${r1(1920 / 6 + 1)}" height="16" fill="${c}"/>`)
            .join(''),
        ),
        pinch('d_tavlin_full_image_pinch', at(START, 799, 30, 22)),
        rect('d_tavlin_full_image_rule', atEnd(END + 724, 812, 1.5, 156), solid(token('text', 0.18))),
      ],
    },
    {
      id: 'l_tavlin_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards').placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 58, jarTop + jarLabel.y + 26, 384, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 58, jarTop + jarLabel.y + 62, 384, 88), 'heading', {
            vAlign: 'bottom',
          }),
          place(`p_card${i + 1}_body`, 'body', at(s + 58, jarTop + jarLabel.y + 156, 384, 156), 'body'),
        ]),
        place('p_note', 'body', at(START + 42, 888, 1500, 42), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards').decorations,
        ...cards3.map((s, i) =>
          lifted(
            art(
              `d_tavlin_cards_jar${i + 1}`,
              at(s, jarTop, jarW, jarH),
              spiceJar(`d_tavlin_cards_jar${i + 1}`, jarW, jarH, [TURMERIC, PAPRIKA, GREEN_SPICE][i]!, i + 2, jarLabel),
            ),
            14,
            30,
            0.16,
          ),
        ),
        pinch('d_tavlin_cards_note_pinch', at(START, 896, 30, 22)),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_tavlin_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline').placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s + 22, 350, 354, 70), 'title', {
            color: token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s + 22, 424, 354, 92), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s + 22, 524, 354, 166), 'body'),
        ]),
        place('p_note', 'caption', at(START + 42, 774, 1300, 72), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline').decorations,
        ...stops4.map((s, i) =>
          lifted(
            art(`d_tavlin_timeline_ticket${i + 1}`, at(s, 296, 398, 424), ticket(398, 424, i === 3)),
            10,
            22,
            0.14,
          ),
        ),
        art(
          'd_tavlin_timeline_rail',
          at(START - 48, 276, WIDTH + 96, 40),
          // In the rail's own box the start is on the right: the gaps between tickets from there.
          rail(
            WIDTH + 96,
            40,
            [1, 2, 3].map((i) => WIDTH + 96 - 48 - i * 422 + 12),
          ),
        ),
        pinch('d_tavlin_timeline_note_pinch', at(START, 781, 30, 22)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_tavlin_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process').placeholders,
        ...steps5.flatMap((s, i) => [
          // The station's figure over its spoon: a step's number, or a time, a weight.
          place(`p_station${i + 1}`, 'number', at(s, 258, 300, 74), 'title', {
            align: 'center',
            vAlign: 'bottom',
            color: i === 4 ? token('secondary') : token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 604, 300, 88), 'heading', {
            align: 'center',
            vAlign: 'bottom',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 698, 300, 104), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 96, 834, 1400, 80), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process').decorations,
        art(
          'd_tavlin_process_trail',
          at(START, 514, WIDTH, 40),
          grainTrail(
            WIDTH,
            40,
            steps5.map((s) => WIDTH - (s - START) - 150),
          ),
        ),
        ...steps5.map((s, i) =>
          art(
            `d_tavlin_process_spoon${i + 1}`,
            at(s, 344, 300, 254),
            measuringSpoon(`d_tavlin_process_spoon${i + 1}`, 300, 254, spoonR[i]!, i),
          ),
        ),
        art('d_tavlin_process_rule', at(START, 814, WIDTH, 14), seedLine(WIDTH, MUTED, 26)),
        art('d_tavlin_process_sachet', at(START, 836, 64, 80), sachet(64, 80)),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_tavlin_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison').placeholders,
        ...(
          [
            ['before', at(START, 492, 700, 330)],
            ['after', atEnd(END, 492, 700, 330)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 40, y: f.y + 36, w: 620, h: 36 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 40, y: f.y + 78, w: 620, h: 50 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 40, y: f.y + 136, w: 620, h: 170 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison').decorations,
        art('d_tavlin_comparison_post', at(START + WIDTH / 2 - 100, 300, 200, 616), post(200, 616)),
        card('d_tavlin_comparison_before', at(START, 492, 700, 330)),
        card('d_tavlin_comparison_after', atEnd(END, 492, 700, 330)),
        rect('d_tavlin_comparison_before_band', at(START, 492, 700, 8), solid(token('muted', 0.5)), {
          effects: { radius: 4 },
        }),
        rect('d_tavlin_comparison_after_band', atEnd(END, 492, 700, 8), solid(token('primary')), {
          effects: { radius: 4 },
        }),
        // The pans hang from the beam's ends: the start one lighter and higher.
        art(
          'd_tavlin_comparison_pan_before',
          at(START + 350 - 170, r1(286 - drop + 4), 340, 170),
          pan('d_tavlin_comparison_pan_before', 340, 170, CUMIN, 22, 51),
        ),
        art(
          'd_tavlin_comparison_pan_after',
          atEnd(END + 350 - 170, r1(286 + drop + 4), 340, 170),
          pan('d_tavlin_comparison_pan_after', 340, 170, PAPRIKA, 74, 52),
        ),
        art('d_tavlin_comparison_beam', at(START + WIDTH / 2 - reach - 40, 236, reach * 2 + 80, 100), beam(reach * 2 + 80, 100, -tilt)),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_tavlin_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart').placeholders,
        place('p_chart', 'chart', at(START + 44, 294, 972, 470)),
        place('p_source', 'caption', at(START + 44, 780, 972, 72), 'caption'),
        place('p_figure1', 'number', atEnd(END, 300, 440, 124), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 428, 440, 112), 'body'),
        place('p_figure2', 'number', atEnd(END, 576, 440, 124), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 704, 440, 112), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart').decorations,
        lifted(art('d_tavlin_chart_board', at(START, 262, 1160, 612), cuttingBoard('d_tavlin_chart_board', 1160, 612, 100)), 16, 36, 0.16),
        art(
          'd_tavlin_chart_leaves',
          at(START + 1010, 206, 140, 96),
          bayLeaf(20, 60, 112, -24) + bayLeaf(30, 66, 100, 8, '#8d9a5a') + peppercorn(130, 74, 6.5),
        ),
        art('d_tavlin_chart_rule', atEnd(END, 548, 440, 14), seedLine(440, MUTED, 24)),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_tavlin_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table').placeholders,
        place('p_table', 'table', at(START + 52, 300, WIDTH - 104, 486)),
        place('p_note', 'caption', at(START + 42, 860, WIDTH - 42, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table').decorations,
        card('d_tavlin_table_menu', at(START, 252, WIDTH, 584)),
        ...[268, 812].map((y, i) =>
          art(
            `d_tavlin_table_rules${i + 1}`,
            at(START + 42, y, WIDTH - 84, 10),
            `<path d="M0 2H${WIDTH - 84}M0 8H${WIDTH - 84}" stroke="${PAPRIKA}" stroke-width="1.6"/>`,
          ),
        ),
        art('d_tavlin_table_cinnamon', atEnd(END - 44, 186, 200, 100), cinnamonBundle(200, 100)),
        pinch('d_tavlin_table_note_pinch', at(START, 867, 30, 22)),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_tavlin_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team').placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s, 262, 340, 340)),
          place(`p_city${i + 1}`, 'caption', at(s + 60, 626, 324, 68), 'caption', {
            color: token('primary'),
            vAlign: 'bottom',
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s, 702, 384, 48), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s, 754, 384, 132), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team').decorations,
        ...team4.flatMap((s, i) => [
          rect(`d_tavlin_team_block${i + 1}`, at(s + 24, 286, 340, 340), solid({ value: [GREEN_SPICE, CUMIN, PAPRIKA, TURMERIC][i]! }), {
            effects: { radius: 4 },
          }),
          art(`d_tavlin_team_spice${i + 1}`, at(s, 652, 46, 46), SIGNATURES[i]!(46)),
        ]),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_tavlin_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 42, 260, 860, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 304, 900, 252), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 62, 576 + i * 86, 820, 80), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START, 884, 860, 36), 'caption'),
      ],
      decorations: [
        mark('d_tavlin_closing_mark', at(START, 112, 58, 58)),
        pinch('d_tavlin_closing_pinch', at(START, 267, 30, 22)),
        ...[0, 1, 2].map((i) => art(`d_tavlin_closing_icon${i + 1}`, at(START, 576 + i * 86, 40, 40), CLOSING_ICONS[i]!)),
        art('d_tavlin_closing_seeds', at(START, 852, 520, 14), seedLine(520, PAPRIKA)),
        art('d_tavlin_closing_mortar_back', atEnd(160, 520, 620, 440), mortarBack('d_tavlin_closing_mortar_back', 620, 440)),
        art('d_tavlin_closing_pestle', atEnd(420, 214, 240, 470), pestle('d_tavlin_closing_pestle', 240, 470)),
        art('d_tavlin_closing_mortar', atEnd(160, 520, 620, 440), mortarFront('d_tavlin_closing_mortar', 620, 440)),
        art(
          'd_tavlin_closing_scatter',
          atEnd(70, 930, 800, 100),
          starAnise(56, 50, 36, { rot: 6 }) +
            chili(150, 44, 116, 10) +
            peppercorn(330, 62, 7) +
            peppercorn(350, 74, 6) +
            cinnamon(560, 50, 170, 8, 20) +
            podGlyph(760, 56, 11, -20),
        ),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the figures, the quotation marks) moved across as they are.
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
// The sample: Seven Spices, a food festival in Lisbon, briefs its partners on its third edition

const TABLE_COLS = [300, 340, 440, 260, 220];
const TABLE_ROW = 80;
/** Guests by day, in thousands: the first edition and the second. */
const FIRST = [6, 9, 8];
const SECOND = [11, 16, 14];

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
  hi: { display: 1.2, title: 1.32, subtitle: 1.44 },
};
const DISPLAYED = new Set(['l_tavlin_hero', 'l_tavlin_section', 'l_tavlin_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: TavlinCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: TavlinCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_tavlin_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: lines(copy.hero.subtitle),
      },
    },
    {
      layout: 'l_tavlin_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_tavlin_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 40 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('primary'), gap: 28 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_tavlin_big_number',
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
      layout: 'l_tavlin_text_image',
      name: copy.masterclass.name,
      content: {
        caption: text(copy.masterclass.kicker),
        title: lines(copy.masterclass.title),
        image: { assetId: pictures.kitchen.id },
        subtitle: copy.masterclass.items.map(([title]) => text(title)),
        body: copy.masterclass.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_tavlin_full_image',
      name: copy.market.name,
      content: {
        image: { assetId: pictures.market.id },
        caption: text(copy.market.place),
        title: text(...copy.market.title),
        body: text(copy.market.body),
      },
    },
    {
      layout: 'l_tavlin_quote',
      name: copy.quote.name,
      content: {
        quote: text(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_tavlin_cards',
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
      layout: 'l_tavlin_timeline',
      name: copy.countdown.name,
      content: {
        caption: [text(copy.countdown.kicker), text(copy.countdown.note)],
        title: lines(copy.countdown.title),
        number: copy.countdown.stops.map(([when]) => text(when)),
        subtitle: copy.countdown.stops.map(([, title]) => text(title)),
        body: copy.countdown.stops.map(([, , body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_tavlin_process',
      name: copy.blend.name,
      content: {
        caption: [text(copy.blend.kicker), ...copy.blend.steps.map(([, caption]) => text(caption))],
        title: lines(copy.blend.title),
        number: copy.blend.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.blend.steps.map(([step]) => text(step)),
        body: text(copy.blend.note),
        footer,
      },
    },
    {
      layout: 'l_tavlin_comparison',
      name: copy.longTable.name,
      content: {
        caption: [
          text(copy.longTable.kicker),
          text(copy.longTable.before[0]),
          text(copy.longTable.after[0]),
        ],
        title: lines(copy.longTable.title),
        subtitle: [text(copy.longTable.before[1]), text(copy.longTable.after[1])],
        body: [text(copy.longTable.before[2]), text(copy.longTable.after[2])],
        footer,
      },
    },
    {
      layout: 'l_tavlin_chart',
      name: copy.guests.name,
      content: {
        caption: [text(copy.guests.kicker), text(copy.guests.source)],
        title: lines(copy.guests.title),
        number: copy.guests.figures.map(([value]) => text(value)),
        body: copy.guests.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: [...copy.guests.days],
          series: [
            { name: copy.guests.series[0], values: FIRST },
            { name: copy.guests.series[1], values: SECOND },
          ],
        },
      },
    },
    {
      layout: 'l_tavlin_table',
      name: copy.spices.name,
      content: {
        caption: [text(copy.spices.kicker), text(copy.spices.note)],
        title: lines(copy.spices.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.spices.header, ...copy.spices.rows],
      },
    },
    {
      layout: 'l_tavlin_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([city]) => text(city))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => text(role)),
        footer,
      },
    },
    {
      layout: 'l_tavlin_closing',
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
export const tavlinSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => TAVLIN_COPY[lang]).map((lang) => [
    lang,
    sample(TAVLIN_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Tavlin template: the theme, its layouts for both directions, and its sample deck. */
export function tavlinTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(tavlinTheme),
    description:
      'A spice merchant’s counter in a chef’s kitchen: burlap sacks heaped with ground spice, a jar of layered spices, kraft price tags, a wooden spoon, the ticket rail of the pass, measuring spoons and a brass market balance on saffron paper, in a cookbook’s bold serif.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.kitchen, pictures.market, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, tavlinSamples.he);
  return finished;
}

export const entry = { id: 'tavlin', template: tavlinTemplate, samples: tavlinSamples };
