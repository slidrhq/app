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
import { GIR_COPY, type GirCopy } from './gir/copy';
import { picture } from './pictures';

const pictures = {
  labs: picture('girLabs'),
  garden: picture('girGarden'),
  team: [1, 2, 3, 4].map((n) => picture(`girTeam${n}`)),
};

/**
 * Gir (Chalk): the slide is the classroom's chalkboard. A dusty grey-green slate with the haze of
 * the eraser on it, in an oak frame whose ledge carries two sticks of chalk and a felt eraser.
 * What a teacher draws on it in chalk, grainy and drawn by hand, and what is pinned to it make
 * every slide: the opening is Euclid's first construction with the board compass still on the
 * arc, a part is the wall clock at ten past ten, figures are circled and counted in tallies and
 * written on index cards, the quote is a speech bubble, a picture is a print taped to the board,
 * courses are exercise books, a plan is a number line of jumps, a process a staircase, a
 * comparison the board divided down its middle, the table is ruled under a wooden ruler, the
 * people are prints held by magnets, and the end is the hand bell. Chalk white for the words,
 * chalk yellow, coral and blue beside them. For schools, teachers, lessons, courses and lectures.
 *
 * No drawing holds a word, so one set of layouts reads in every language; the figures the chalk
 * writes stand upright in both directions. The Latin headings are written in Playpen Sans, a hand
 * made for learning to read, whose counterparts carry the other scripts (Playpen Sans Arabic and
 * Deva among them); the Hebrew ones in Fredoka's rounded print, as the Hebrew of Playpen is the
 * cursive hand, which a title on a screen reads less easily.
 */
export const girTheme: Theme = {
  id: 'gir',
  name: 'Chalk',
  colors: {
    bg: '#2f3f38',
    surface: '#3b4c44',
    text: '#f3f0e6',
    muted: '#c1cbc3',
    primary: '#f4d36b',
    secondary: '#f2a08e',
    accent: '#8ecae6',
    chart: ['#f4d36b', '#8ecae6', '#f2a08e', '#a8dba8', '#f3f0e6', '#c9b4e0'],
  },
  // The teacher's hand on the board for what is said aloud (in Hebrew a rounded print), and a
  // plain, open face for what is read: Heebo in Hebrew, Golos Text in Latin and Cyrillic.
  fonts: {
    heading: { he: 'Fredoka', latin: 'Playpen Sans Hebrew' },
    body: { he: 'Heebo', latin: 'Golos Text' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 104,
      weight: 700,
      lineHeight: 1.12,
      letterSpacing: -1,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 56,
      weight: 700,
      lineHeight: 1.2,
      letterSpacing: -0.4,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 34, weight: 600, lineHeight: 1.3, color: { token: 'text' } },
    body: { font: 'body', size: 27, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 500,
      lineHeight: 1.4,
      letterSpacing: 0.2,
      color: { token: 'muted' },
    },
  },
  radius: 10,
  shadow: { x: 0, y: 14, blur: 34, color: { value: '#0d1411', alpha: 0.35 } },
  // The board: the slate, lighter where the eraser has passed, darker towards its frame.
  background: {
    fill: {
      kind: 'css',
      value: [
        'radial-gradient(58% 52% at 26% 24%, color-mix(in srgb, var(--color-text) 7%, transparent), transparent 72%)',
        'radial-gradient(46% 40% at 76% 72%, color-mix(in srgb, var(--color-text) 5%, transparent), transparent 70%)',
        'radial-gradient(34% 28% at 62% 22%, color-mix(in srgb, var(--color-text) 3.5%, transparent), transparent 70%)',
        'radial-gradient(125% 105% at 50% 46%, transparent 58%, color-mix(in srgb, #050806 26%, transparent) 100%)',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The slate alone, without the haze.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings: the chalk and the board follow the theme, the wood and the brass
// stay what they are

const BOARD = '#2f3f38';
const WASH = '#3b4c44';
const CHALK = '#f3f0e6';
const GREY = '#c1cbc3';
const YELLOW = '#f4d36b';
const CORAL = '#f2a08e';
const BLUE = '#8ecae6';
/** The mint of the chart palette, which no token holds. */
const MINT = '#a8dba8';

const OAK = '#a8743f';
const OAK_LIGHT = '#d3a46a';
const OAK_DARK = '#68411f';
const BRASS = '#c99d45';
const BRASS_LIGHT = '#f6e0a0';
const BRASS_DARK = '#6e5119';
const STEEL = '#a9b1b0';
const STEEL_LIGHT = '#e8ecea';
const STEEL_DARK = '#555e5b';
const SOOT = '#18201c';
const FELT = '#7f857f';
const TAPE = '#e6d9b8';
const WHITE = '#fff';
const SHADE = '#0b100d';

const PAINT = {
  [BOARD]: token('bg'),
  [WASH]: token('surface'),
  [CHALK]: token('text'),
  [GREY]: token('muted'),
  [YELLOW]: token('primary'),
  [CORAL]: token('secondary'),
  [BLUE]: token('accent'),
};

const RAD = Math.PI / 180;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/** A soft shadow under a thing that lies on the board: a print, a card, a magnet. */
const lifted = (element: Element, y = 12, blur = 26, alpha = 0.4): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: SHADE, alpha } } },
});

/** A number from a name, so each drawing's chalk has a grain of its own. */
function seedOf(name: string): number {
  let h = 2166136261;
  for (const c of name) h = Math.imul(h ^ c.charCodeAt(0), 16777619);
  return h >>> 0;
}

/**
 * The grain of chalk: the strokes eaten by a fine noise, so the board shows through them, and
 * their edges roughened.
 */
function chalkFilter(id: string, w: number, h: number) {
  return (
    `<filter id="${id}-chalk" filterUnits="userSpaceOnUse" x="0" y="0" width="${r1(w)}" height="${r1(h)}" color-interpolation-filters="sRGB">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".9" numOctaves="2" seed="${seedOf(id) % 97}" result="n"/>` +
    `<feColorMatrix in="n" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 3.6 0 0 0 -1.12" result="m"/>` +
    `<feComposite in="SourceGraphic" in2="m" operator="in" result="g"/>` +
    `<feDisplacementMap in="g" in2="n" scale="3" xChannelSelector="G" yChannelSelector="B"/>` +
    `</filter>`
  );
}

const chalkBody = (id: string, w: number, h: number, body: string, defs = '') =>
  `<defs>${chalkFilter(id, w, h)}${defs}</defs><g filter="url(#${id}-chalk)">${body}</g>`;

/** A drawing in chalk. */
const chalk = (id: string, frame: Frame, body: string, defs = '') =>
  drawing(id, frame, svg(frame.w, frame.h, chalkBody(id, frame.w, frame.h, body, defs)), PAINT);

/**
 * The drawings that a left-to-right deck must not see mirrored: those with figures in them, the
 * clock and the ruler. Their mirror moves them to the other side and leaves them as they are, or
 * takes the drawing given for that direction.
 */
const UPRIGHT = new Map<string, string | undefined>();

const upright = (id: string, frame: Frame, body: string, ltr?: string) => {
  UPRIGHT.set(id, ltr === undefined ? undefined : svg(frame.w, frame.h, ltr));
  return art(id, frame, body);
};

/**
 * A chalk drawing with figures written in it: in a left-to-right deck its strokes are mirrored
 * and its figures stand where the mirror puts them, the right way round.
 */
function chalkFigures(
  id: string,
  frame: Frame,
  shapes: string,
  figures: (flip: boolean) => string,
): Element {
  const { w, h } = frame;
  const rtl = chalkBody(id, w, h, shapes + figures(false));
  const ltr = chalkBody(
    id,
    w,
    h,
    `<g transform="matrix(-1 0 0 1 ${r1(w)} 0)">${shapes}</g>${figures(true)}`,
  );
  return upright(id, frame, rtl, ltr);
}

/** A figure written in chalk, in the hand of the headings. */
const figure = (x: number, y: number, value: string, size: number, colour = CHALK) =>
  `<text x="${r1(x)}" y="${r1(y)}" text-anchor="middle" font-family="Playpen Sans Hebrew, sans-serif" font-size="${size}" font-weight="600" fill="${colour}">${value}</text>`;

// ---------------------------------------------------------------------------------------------
// A hand with chalk

type Pt = readonly [number, number];

function prng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** A smooth open path through points (Catmull-Rom as cubic Béziers). */
function through(p: readonly Pt[]): string {
  // Whole pixels: chalk is rougher than a tenth of one, and the catalog holds every drawing thrice.
  const n = (v: number) => Math.round(v);
  let d = `M${n(p[0]![0])} ${n(p[0]![1])}`;
  for (let i = 0; i < p.length - 1; i++) {
    const p0 = p[Math.max(0, i - 1)]!;
    const p1 = p[i]!;
    const p2 = p[i + 1]!;
    const p3 = p[Math.min(p.length - 1, i + 2)]!;
    d +=
      `C${n(p1[0] + (p2[0] - p0[0]) / 6)} ${n(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${n(p2[0] - (p3[0] - p1[0]) / 6)} ${n(p2[1] - (p3[1] - p1[1]) / 6)} ${n(p2[0])} ${n(p2[1])}`;
  }
  return d;
}

/** A line drawn by hand from `a` to `b`: a slight bow, and the waver of a hand. */
function hand(a: Pt, b: Pt, seed: number, bow = 0, waver = 1): string {
  const random = prng(seed);
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const length = Math.hypot(dx, dy) || 1;
  const n = Math.max(2, Math.round(length / 60));
  const nx = -dy / length;
  const ny = dx / length;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const off =
      bow * Math.sin(Math.PI * t) + (i === 0 || i === n ? 0 : (random() - 0.5) * 2 * waver);
    pts.push([a[0] + dx * t + nx * off, a[1] + dy * t + ny * off]);
  }
  return through(pts);
}

/**
 * An arc of an ellipse drawn by hand, from `from` degrees (clockwise from three o'clock) through
 * `sweep`: its radius wavers, and grows by `grow` so that a loop does not close on itself.
 */
function loop(
  cx: number,
  cy: number,
  rx: number,
  ry: number,
  from: number,
  sweep: number,
  seed: number,
  waver = 0.012,
  grow = 0,
): string {
  const random = prng(seed);
  // A point every 50 pixels of the arc, and never fewer than a point every 8 degrees of a small one.
  const arc = Math.abs(sweep) * RAD * Math.max(rx, ry);
  const n = Math.max(
    4,
    Math.min(Math.round(Math.abs(sweep) / 8), Math.max(12, Math.round(arc / 50))),
  );
  const phase = random() * Math.PI * 2;
  const pts: Pt[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    const a = (from + sweep * t) * RAD;
    const k = 1 + grow * (t - 0.5) + waver * Math.sin(phase + t * 9) + (random() - 0.5) * waver;
    pts.push([cx + Math.cos(a) * rx * k, cy + Math.sin(a) * ry * k]);
  }
  return through(pts);
}

/** Straight strokes by hand through corners, each a stroke of its own. */
function strokes(corners: readonly Pt[], seed: number, waver = 1, closed = false): string {
  const pts = closed ? [...corners, corners[0]!] : corners;
  return pts
    .slice(1)
    .map((b, i) => hand(pts[i]!, b, seed + i * 17, 0, waver))
    .join('');
}

/** A path drawn in chalk. */
const pen = (d: string, colour: string, width: number, opacity = 0.94) =>
  `<path d="${d}" stroke="${colour}" stroke-width="${r1(width)}"${opacity < 1 ? ` stroke-opacity="${opacity}"` : ''} stroke-linecap="round" stroke-linejoin="round"/>`;

/** The same stroke twice, as chalk goes over a line again: once firm, once light beside it. */
const twice = (make: (seed: number) => string, seed: number, colour: string, width: number) =>
  pen(make(seed), colour, width) + pen(make(seed + 101), colour, width * 0.55, 0.5);

/** A box ruled by hand: four strokes that run a little past the corners. */
function ruled(x: number, y: number, w: number, h: number, seed: number, over = 10): string {
  return [
    hand([x - over, y], [x + w + over * 0.4, y + 1.5], seed, 0, 1.2),
    hand([x + w, y - over * 0.6], [x + w - 1.5, y + h + over], seed + 1, 0, 1.2),
    hand([x + w + over * 0.5, y + h], [x - over * 0.3, y + h - 1.5], seed + 2, 0, 1.2),
    hand([x, y + h + over * 0.7], [x + 1.5, y - over * 0.4], seed + 3, 0, 1.2),
  ].join('');
}

/** A star drawn in one stroke, as a child draws it. */
function star(cx: number, cy: number, r: number, seed: number): string {
  const corners: Pt[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 144) * RAD;
    corners.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return strokes(corners, seed, 0.3, true);
}

/** The two strokes of an arrow's head at `tip`, the arrow travelling at `angle` (radians). */
function arrowHead(tip: Pt, angle: number, size: number, seed: number): string {
  const side = (turn: number): Pt => [
    tip[0] + Math.cos(angle + Math.PI + turn) * size,
    tip[1] + Math.sin(angle + Math.PI + turn) * size,
  ];
  return hand(side(-0.5), tip, seed, 0, 0.4) + hand(tip, side(0.5), seed + 1, 0, 0.4);
}

/** A small cross that marks a point. */
const cross = (x: number, y: number, s: number, seed: number) =>
  hand([x - s, y - s], [x + s, y + s], seed, 0, 0.3) +
  hand([x + s, y - s], [x - s, y + s], seed + 1, 0, 0.3);

// ---------------------------------------------------------------------------------------------
// The board: an oak frame, and the ledge that holds the chalk

const W = 1920;
const H = 1080;
/** The oak around the board, on its top and its sides. */
const FRAME = 18;
/** The top of the ledge along the foot of the board. */
const LEDGE = 1034;

/** Wood grain over a band: a noise drawn out along it, in the brown of the oak's late wood. */
const grain = (id: string, along: 'x' | 'y', seed: number) =>
  `<filter id="${id}">` +
  `<feTurbulence type="fractalNoise" baseFrequency="${along === 'x' ? '.004 .32' : '.32 .004'}" numOctaves="3" seed="${seed}"/>` +
  `<feColorMatrix type="matrix" values="0 0 0 0 .27 0 0 0 0 .15 0 0 0 0 .06 -2.6 0 0 0 1.5"/>` +
  `<feComposite in2="SourceGraphic" operator="in"/></filter>`;

/** A stick of chalk lying on the ledge, its worn end towards `x + w`. */
function stick(x: number, w: number, colour: string) {
  const y = LEDGE - 4;
  return (
    `<ellipse cx="${r1(x + w / 2)}" cy="${LEDGE + 9}" rx="${r1(w / 2 + 4)}" ry="4" fill="${SHADE}" fill-opacity=".35"/>` +
    `<rect x="${x}" y="${y}" width="${w}" height="12" rx="5" fill="${colour}"/>` +
    `<rect x="${x + 2}" y="${y + 2}" width="${w - 6}" height="3" rx="1.5" fill="${WHITE}" fill-opacity=".45"/>` +
    `<rect x="${x}" y="${y + 8}" width="${w}" height="4" rx="2" fill="${SHADE}" fill-opacity=".14"/>`
  );
}

/**
 * The frame of every slide: the oak around the board and along its foot, the shadow it casts on
 * the slate, the chalk dust gathered over the ledge, and on the ledge two sticks of chalk, a
 * stub and the felt eraser. A layout whose picture rests on the ledge has it bare.
 */
function board(id: string, tray = true): Element {
  const g = (n: string) => `${id}-${n}`;
  const innerW = W - FRAME * 2;
  const innerH = LEDGE - FRAME;
  // Gradients run down unless they say otherwise; the filters take the box of what they draw.
  const down = (name: string, stops: string) =>
    `<linearGradient id="${g(name)}" x2="0" y2="1">${stops}</linearGradient>`;
  const across = (name: string, stops: string) =>
    `<linearGradient id="${g(name)}">${stops}</linearGradient>`;
  const stop = (at: string, colour: string, opacity?: string) =>
    `<stop offset="${at}" stop-color="${colour}"${opacity ? ` stop-opacity="${opacity}"` : ''}/>`;
  const defs =
    down('h', stop('0', OAK_LIGHT) + stop('.5', OAK) + stop('1', OAK_DARK)) +
    across('v', stop('0', OAK_DARK) + stop('.4', OAK) + stop('1', OAK_LIGHT)) +
    across('v2', stop('0', OAK_LIGHT) + stop('.6', OAK) + stop('1', OAK_DARK)) +
    down('lip', stop('0', OAK_LIGHT) + stop('1', OAK)) +
    down('front', stop('0', OAK) + stop('.55', OAK_DARK) + stop('1', SOOT)) +
    down('dust', stop('0', CHALK, '0') + stop('1', CHALK, '.09')) +
    down('settle', stop('0', WHITE, '0') + stop('1', WHITE)) +
    grain(g('gx'), 'x', 11) +
    grain(g('gy'), 'y', 23) +
    `<filter id="${g('soft')}"><feGaussianBlur stdDeviation="8"/></filter>` +
    `<filter id="${g('haze')}" y="-.25" height="1.5"><feGaussianBlur stdDeviation="28"/></filter>` +
    `<filter id="${g('specks')}">` +
    `<feTurbulence type="fractalNoise" baseFrequency=".8" seed="5"/>` +
    `<feColorMatrix type="matrix" values="0 0 0 0 .95 0 0 0 0 .94 0 0 0 0 .9 7 0 0 0 -4.1"/>` +
    `<feComposite in2="SourceGraphic" operator="in"/></filter>` +
    `<mask id="${g('fall')}"><rect y="${LEDGE - 40}" width="${W}" height="40" fill="url(#${g('settle')})"/></mask>` +
    `<clipPath id="${g('in')}"><rect x="${FRAME}" y="${FRAME}" width="${innerW}" height="${innerH}"/></clipPath>`;
  // The haze the eraser leaves: broad sweeps of chalk, too faint to read as strokes.
  const wear =
    `<g clip-path="url(#${g('in')})">` +
    `<g filter="url(#${g('haze')})" stroke="${CHALK}" stroke-linecap="round">` +
    `<path d="M140 300C480 170 820 250 1160 180" stroke-opacity=".05" stroke-width="150"/>` +
    `<path d="M760 760C1080 650 1420 720 1780 600" stroke-opacity=".04" stroke-width="170"/>` +
    `<path d="M260 900C520 840 700 880 980 830" stroke-opacity=".03" stroke-width="120"/>` +
    `</g>` +
    `<rect x="${FRAME}" y="${LEDGE - 70}" width="${innerW}" height="70" fill="url(#${g('dust')})"/>` +
    `<g mask="url(#${g('fall')})"><rect x="${FRAME}" y="${LEDGE - 40}" width="${innerW}" height="40" fill="${WHITE}" filter="url(#${g('specks')})" opacity=".45"/></g>` +
    `<rect x="${FRAME - 8}" y="${FRAME - 8}" width="${innerW + 16}" height="${innerH + 16}" stroke="${SHADE}" stroke-opacity=".6" stroke-width="18" filter="url(#${g('soft')})"/>` +
    `</g>`;
  const top = `<path d="M0 0H${W}L${W - FRAME} ${FRAME}H${FRAME}Z"/>`;
  const left = `<path d="M0 0L${FRAME} ${FRAME}V${LEDGE}H0Z"/>`;
  const right = `<path d="M${W} 0V${LEDGE}H${W - FRAME}V${FRAME}Z"/>`;
  const oak =
    `<g fill="url(#${g('h')})">${top}</g>` +
    `<g fill="url(#${g('v')})">${left}</g>` +
    `<g fill="url(#${g('v2')})">${right}</g>` +
    `<g fill="${OAK}" filter="url(#${g('gx')})" opacity=".85">${top}</g>` +
    `<g fill="${OAK}" filter="url(#${g('gy')})" opacity=".85">${left}${right}</g>` +
    // The mitres of the corners, and the edge of the frame against the slate.
    `<path d="M0 0L${FRAME} ${FRAME}M${W} 0L${W - FRAME} ${FRAME}" stroke="${SHADE}" stroke-opacity=".35" stroke-width="1.2"/>` +
    `<path d="M${FRAME - 0.5} ${LEDGE}V${FRAME - 0.5}H${W - FRAME + 0.5}V${LEDGE}" stroke="${SHADE}" stroke-opacity=".55" stroke-width="1.5"/>`;
  const ledge =
    `<rect x="0" y="${LEDGE}" width="${W}" height="12" fill="url(#${g('lip')})"/>` +
    `<rect x="0" y="${LEDGE + 12}" width="${W}" height="${H - LEDGE - 12}" fill="url(#${g('front')})"/>` +
    `<rect x="0" y="${LEDGE}" width="${W}" height="${H - LEDGE}" fill="${OAK}" filter="url(#${g('gx')})" opacity=".7"/>` +
    `<path d="M0 ${LEDGE + 0.8}H${W}" stroke="${SHADE}" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="M0 ${LEDGE + 12.5}H${W}" stroke="${OAK_LIGHT}" stroke-opacity=".75" stroke-width="1.2"/>` +
    `<rect x="${FRAME}" y="${LEDGE + 1}" width="${innerW}" height="10" fill="${WHITE}" filter="url(#${g('specks')})" opacity=".5"/>`;
  const tray_ = tray
    ? // The felt eraser: its wooden back, the felt under it, and its shadow on the ledge.
      `<ellipse cx="410" cy="${LEDGE + 10}" rx="92" ry="6" fill="${SHADE}" fill-opacity=".45"/>` +
      `<rect x="330" y="${LEDGE - 8}" width="160" height="15" rx="3" fill="${FELT}"/>` +
      `<rect x="330" y="${LEDGE - 8}" width="160" height="15" rx="3" fill="${WHITE}" filter="url(#${g('specks')})" opacity=".5"/>` +
      `<path d="M334 ${LEDGE - 8}C334 ${LEDGE - 28} 338 ${LEDGE - 30} 350 ${LEDGE - 30}H470C482 ${LEDGE - 30} 486 ${LEDGE - 28} 486 ${LEDGE - 8}Z" fill="url(#${g('h')})"/>` +
      `<path d="M352 ${LEDGE - 21}H468" stroke="${OAK_DARK}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>` +
      `<path d="M350 ${LEDGE - 28}H470" stroke="${OAK_LIGHT}" stroke-opacity=".8" stroke-width="1.4" stroke-linecap="round"/>` +
      stick(770, 84, CHALK) +
      stick(874, 52, YELLOW) +
      stick(1236, 30, CORAL)
    : '';
  return art(id, { x: 0, y: 0, w: W, h: H }, `<defs>${defs}</defs>${wear}${oak}${ledge}${tray_}`);
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const START = 120;
const END = 120;
const WIDTH = W - START - END;

/** The chalk star before a kicker. */
const kickerStar = (id: string, start: number, top: number) =>
  chalk(id, at(start, top, 32, 32), pen(star(16, 17, 13, seedOf(id)), YELLOW, 3));

/** The kicker on its star, and the title; without a kicker, the title on the star. */
function head(name: string, width = 1100, lines = 2, kicker = true) {
  // Room for the leading a script may need beyond the theme's (`LEADING`).
  const title = at(START, 128, width, Math.round(56 * 1.3 * lines) + 4);
  if (!kicker) {
    return {
      placeholders: [place('p_title', 'title', at(START + 50, 104, width - 50, title.h), 'title')],
      decorations: [kickerStar(`d_gir_${name}_star`, START, 124)],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 44, 84, Math.min(900, width - 44), 34), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [kickerStar(`d_gir_${name}_star`, START, 85)],
  };
}

/**
 * The mark of the deck: a pupil's slate in its wooden frame, a star in yellow chalk on it, which a
 * logo may replace.
 */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const k = (v: number) => r1(s * v);
  const pts: string[] = [];
  for (let i = 0; i < 5; i++) {
    const a = (-90 + i * 144) * RAD;
    pts.push(`${r1(s * 0.5 + Math.cos(a) * s * 0.17)} ${r1(s * 0.52 + Math.sin(a) * s * 0.17)}`);
  }
  return drawing(
    id,
    frame,
    svg(
      s,
      s,
      `<rect x="1" y="${k(0.14)}" width="${s - 2}" height="${k(0.74)}" rx="${k(0.09)}" fill="${OAK}"/>` +
        `<rect x="1" y="${k(0.14)}" width="${s - 2}" height="${k(0.74)}" rx="${k(0.09)}" stroke="${OAK_DARK}" stroke-width="1.2"/>` +
        `<rect x="${k(0.13)}" y="${k(0.25)}" width="${k(0.74)}" height="${k(0.52)}" rx="${k(0.03)}" fill="${BOARD}"/>` +
        `<path d="M${pts.join('L')}Z" stroke="${YELLOW}" stroke-width="${k(0.055)}" stroke-linejoin="round"/>`,
    ),
    PAINT,
    { role: 'logo', name: 'logo' },
  );
}

/** The foot of a slide: the mark and the deck's name at the start, the slide's number circled. */
function foot(name: string, withFooter = true) {
  const loopId = `d_gir_${name}_loop`;
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 62, 962, 900, 34), 'caption')]
      : [],
    decorations: [
      mark(`d_gir_${name}_mark`, at(START, 956, 46, 46)),
      chalk(
        loopId,
        atEnd(END - 18, 944, 108, 72),
        pen(loop(54, 37, 45, 26, -160, 390, seedOf(loopId), 0.03, 0.12), CHALK, 3, 0.8),
      ),
      pageNumber(`d_gir_${name}_number`, atEnd(END, 958, 72, 44), 'heading', {
        color: token('text'),
        align: 'center',
      }),
    ],
  };
}

/** A sheet of paper on the board, under a shadow: a print's border, a card. */
const paper = (id: string, frame: Frame, body = '') =>
  lifted(
    art(
      id,
      frame,
      `<rect x="0" y="0" width="${frame.w}" height="${frame.h}" rx="2" fill="${CHALK}"/>` + body,
    ),
  );

/** A round magnet in a colour of the chalk. */
function magnet(id: string, frame: Frame, colour: string): Element {
  const s = frame.w;
  const c = s / 2;
  const r = c - 3;
  return lifted(
    art(
      id,
      frame,
      `<defs><radialGradient id="${id}-shine" cx="36%" cy="30%" r="72%"><stop offset="0" stop-color="${WHITE}" stop-opacity=".85"/><stop offset=".3" stop-color="${WHITE}" stop-opacity="0"/><stop offset="1" stop-color="${SHADE}" stop-opacity=".35"/></radialGradient></defs>` +
        `<circle cx="${c}" cy="${c}" r="${r}" fill="${colour}"/>` +
        `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#${id}-shine)"/>` +
        `<circle cx="${c}" cy="${c}" r="${r - 0.6}" stroke="${SHADE}" stroke-opacity=".3" stroke-width="1.2"/>`,
    ),
    5,
    9,
    0.5,
  );
}

/** A strip of masking tape, its ends torn. */
function tape(id: string, frame: Frame): Element {
  const { w, h } = frame;
  const start: string[] = [];
  const end: string[] = [];
  for (let i = 0; i <= 6; i++) {
    const y = r1((h * i) / 6);
    start.push(`${i % 2 ? 8 : 3} ${y}`);
    end.push(`${w - (i % 2 ? 8 : 3)} ${y}`);
  }
  return lifted(
    art(
      id,
      frame,
      `<path d="M${start[0]}L${end.join('L')}L${start.slice().reverse().join('L')}Z" fill="${TAPE}" fill-opacity=".9"/>` +
        `<path d="M8 ${r1(h * 0.3)}H${w - 8}M8 ${r1(h * 0.7)}H${w - 8}" stroke="${WHITE}" stroke-opacity=".25" stroke-width="2"/>`,
    ),
    3,
    6,
    0.25,
  );
}

// ---------------------------------------------------------------------------------------------
// The instruments of the classroom, drawn as they are

/**
 * The board compass standing on the board: the leg on its rubber foot at the centre `b`, the
 * chalk in the other at `p`, both hinged at `h` under a turned knob. Points in the box's own
 * coordinates.
 */
function compass(id: string, b: Pt, p: Pt, hinge: Pt, knob: Pt): string {
  const g = (n: string) => `${id}-${n}`;
  const leg = (from: Pt, to: Pt, w0: number, w1: number, stop: number) => {
    const dx = to[0] - from[0];
    const dy = to[1] - from[1];
    const l = Math.hypot(dx, dy);
    const ux = dx / l;
    const uy = dy / l;
    const end: Pt = [from[0] + ux * (l - stop), from[1] + uy * (l - stop)];
    const n = (w: number, q: Pt, s: number): Pt => [q[0] - uy * w * s, q[1] + ux * w * s];
    const a = n(w0 / 2, from, 1);
    const b2 = n(w1 / 2, end, 1);
    const c = n(w1 / 2, end, -1);
    const d = n(w0 / 2, from, -1);
    return { d: `M${r1(a[0])} ${r1(a[1])}L${r1(b2[0])} ${r1(b2[1])}L${r1(c[0])} ${r1(c[1])}L${r1(d[0])} ${r1(d[1])}Z`, end, ux, uy };
  };
  const one = leg(hinge, b, 24, 15, 34);
  const two = leg(hinge, p, 24, 15, 66);
  // The chalk in its holder, from the clamp to the board.
  const chalkFrom: Pt = [two.end[0] + two.ux * 6, two.end[1] + two.uy * 6];
  return (
    `<defs>` +
    `<linearGradient id="${g('wood')}" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${OAK_DARK}"/><stop offset=".35" stop-color="${OAK_LIGHT}"/><stop offset=".7" stop-color="${OAK}"/><stop offset="1" stop-color="${OAK_DARK}"/></linearGradient>` +
    `<radialGradient id="${g('knob')}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${OAK_LIGHT}"/><stop offset=".6" stop-color="${OAK}"/><stop offset="1" stop-color="${OAK_DARK}"/></radialGradient>` +
    `<radialGradient id="${g('steel')}" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${STEEL_LIGHT}"/><stop offset=".6" stop-color="${STEEL}"/><stop offset="1" stop-color="${STEEL_DARK}"/></radialGradient>` +
    `</defs>` +
    // The legs.
    `<path d="${one.d}" fill="url(#${g('wood')})" stroke="${OAK_DARK}" stroke-width="1.2"/>` +
    `<path d="${two.d}" fill="url(#${g('wood')})" stroke="${OAK_DARK}" stroke-width="1.2"/>` +
    // The foot at the centre: a steel ferrule and the rubber cup on the board.
    `<path d="M${r1(one.end[0])} ${r1(one.end[1])}L${r1(b[0])} ${r1(b[1] - 8)}" stroke="${STEEL}" stroke-width="12" stroke-linecap="round"/>` +
    `<ellipse cx="${r1(b[0])}" cy="${r1(b[1] - 3)}" rx="15" ry="7" fill="${SOOT}"/>` +
    `<ellipse cx="${r1(b[0] - 3)}" cy="${r1(b[1] - 6)}" rx="7" ry="2.4" fill="${WHITE}" fill-opacity=".25"/>` +
    // The holder, a steel ring with its screw, and the stick of chalk to the arc.
    `<path d="M${r1(chalkFrom[0])} ${r1(chalkFrom[1])}L${r1(p[0])} ${r1(p[1])}" stroke="${CHALK}" stroke-width="11" stroke-linecap="round"/>` +
    `<path d="M${r1(chalkFrom[0])} ${r1(chalkFrom[1])}L${r1(p[0] - two.ux * 14)} ${r1(p[1] - two.uy * 14)}" stroke="${WHITE}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round" transform="translate(-2 -2)"/>` +
    `<path d="M${r1(two.end[0] - two.ux * 4)} ${r1(two.end[1] - two.uy * 4)}L${r1(two.end[0] + two.ux * 14)} ${r1(two.end[1] + two.uy * 14)}" stroke="url(#${g('steel')})" stroke-width="24" stroke-linecap="round"/>` +
    `<circle cx="${r1(two.end[0] - two.uy * 14 + two.ux * 5)}" cy="${r1(two.end[1] + two.ux * 14 + two.uy * 5)}" r="5" fill="${STEEL_DARK}"/>` +
    // The hinge and the knob over it.
    `<path d="M${r1(hinge[0])} ${r1(hinge[1])}L${r1(knob[0])} ${r1(knob[1])}" stroke="${OAK_DARK}" stroke-width="12" stroke-linecap="round"/>` +
    `<circle cx="${r1(knob[0])}" cy="${r1(knob[1])}" r="18" fill="url(#${g('knob')})" stroke="${OAK_DARK}" stroke-width="1.2"/>` +
    `<circle cx="${r1(hinge[0])}" cy="${r1(hinge[1])}" r="20" fill="url(#${g('steel')})" stroke="${STEEL_DARK}" stroke-width="1.2"/>` +
    `<circle cx="${r1(hinge[0])}" cy="${r1(hinge[1])}" r="6" fill="${STEEL_DARK}"/>` +
    `<path d="M${r1(hinge[0] - 4)} ${r1(hinge[1])}H${r1(hinge[0] + 4)}" stroke="${STEEL_LIGHT}" stroke-width="1.6"/>`
  );
}

/** The wall clock of the classroom at ten past ten, its face clear under the hands. */
function clock(size: number): string {
  const c = size / 2;
  const R = c - 4;
  const face = R - 40;
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const a = (i * 6 - 90) * RAD;
    const hour = i % 5 === 0;
    const r0 = face - 12;
    const r1_ = face - (hour ? 52 : 26);
    ticks += `<path d="M${r1(c + Math.cos(a) * r0)} ${r1(c + Math.sin(a) * r0)}L${r1(c + Math.cos(a) * r1_)} ${r1(c + Math.sin(a) * r1_)}" stroke="${SOOT}" stroke-width="${hour ? 10 : 3}"/>`;
  }
  // A hand from the hub: its tail behind the hub, tapering to its tip.
  const handPath = (deg: number, length: number, tail: number, w0: number, w1: number) => {
    const a = (deg - 90) * RAD;
    const ux = Math.cos(a);
    const uy = Math.sin(a);
    const pt = (along: number, across: number) =>
      `${r1(c + ux * along - uy * across)} ${r1(c + uy * along + ux * across)}`;
    return `M${pt(-tail, -w0 / 2)}L${pt(length, -w1 / 2)}L${pt(length + w1, 0)}L${pt(length, w1 / 2)}L${pt(-tail, w0 / 2)}Z`;
  };
  const second = (deg: number) => {
    const a = (deg - 90) * RAD;
    return (
      `<path d="M${r1(c - Math.cos(a) * 60)} ${r1(c - Math.sin(a) * 60)}L${r1(c + Math.cos(a) * (face - 18))} ${r1(c + Math.sin(a) * (face - 18))}" stroke="${CORAL}" stroke-width="4" stroke-linecap="round"/>` +
      `<circle cx="${r1(c - Math.cos(a) * 44)}" cy="${r1(c - Math.sin(a) * 44)}" r="11" fill="${CORAL}"/>`
    );
  };
  return (
    `<defs>` +
    `<radialGradient id="clock-case" cx="40%" cy="34%" r="75%"><stop offset="0" stop-color="#46514c"/><stop offset=".55" stop-color="${SOOT}"/><stop offset="1" stop-color="#0c110f"/></radialGradient>` +
    `<radialGradient id="clock-face" cx="50%" cy="50%" r="50%"><stop offset=".8" stop-color="${SHADE}" stop-opacity="0"/><stop offset="1" stop-color="${SHADE}" stop-opacity=".22"/></radialGradient>` +
    `<linearGradient id="clock-glass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".5"/><stop offset=".5" stop-color="${WHITE}" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<circle cx="${c}" cy="${c}" r="${R}" fill="url(#clock-case)"/>` +
    `<circle cx="${c}" cy="${c}" r="${R - 6}" stroke="${WHITE}" stroke-opacity=".12" stroke-width="2"/>` +
    `<circle cx="${c}" cy="${c}" r="${face + 8}" fill="${STEEL}"/>` +
    `<circle cx="${c}" cy="${c}" r="${face + 8}" stroke="${STEEL_DARK}" stroke-width="1.5"/>` +
    `<circle cx="${c}" cy="${c}" r="${face}" fill="${CHALK}"/>` +
    `<circle cx="${c}" cy="${c}" r="${face}" fill="url(#clock-face)"/>` +
    ticks +
    `<path d="${handPath(305, face * 0.52, 34, 20, 12)}" fill="${SOOT}"/>` +
    `<path d="${handPath(60, face * 0.8, 40, 16, 8)}" fill="${SOOT}"/>` +
    second(282) +
    `<circle cx="${c}" cy="${c}" r="17" fill="${SOOT}"/>` +
    `<circle cx="${c}" cy="${c}" r="7" fill="${CORAL}"/>` +
    // The glass: a sheen over the upper half of the face.
    `<path d="M${r1(c - face * 0.86)} ${r1(c - face * 0.2)}A${face * 0.9} ${face * 0.9} 0 0 1 ${r1(c + face * 0.36)} ${r1(c - face * 0.82)}A${face * 1.1} ${face * 1.1} 0 0 0 ${r1(c - face * 0.86)} ${r1(c - face * 0.2)}Z" fill="url(#clock-glass)" opacity=".55"/>`
  );
}

/** A brass hand bell, swung to one side, its wooden handle up. */
function bell(w: number, h: number): string {
  const cx = w / 2;
  return (
    `<defs>` +
    `<linearGradient id="bell-brass" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${BRASS_DARK}"/><stop offset=".3" stop-color="${BRASS_LIGHT}"/><stop offset=".55" stop-color="${BRASS}"/><stop offset="1" stop-color="${BRASS_DARK}"/></linearGradient>` +
    `<linearGradient id="bell-wood" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${SOOT}"/><stop offset=".35" stop-color="${OAK}"/><stop offset=".6" stop-color="${OAK_DARK}"/><stop offset="1" stop-color="${SOOT}"/></linearGradient>` +
    `<radialGradient id="bell-mouth" cx="50%" cy="30%" r="70%"><stop offset="0" stop-color="${BRASS_DARK}"/><stop offset="1" stop-color="${SOOT}"/></radialGradient>` +
    `</defs>` +
    `<g transform="rotate(-18 ${cx} ${r1(h * 0.55)})">` +
    // The handle: a knob, a neck and a swelling, turned in dark oak.
    `<path d="M${cx - 34} 64C${cx - 34} 22 ${cx + 34} 22 ${cx + 34} 64C${cx + 34} 92 ${cx + 16} 100 ${cx + 14} 118C${cx + 12} 136 ${cx + 40} 160 ${cx + 40} 196C${cx + 40} 222 ${cx + 26} 236 ${cx + 26} 250H${cx - 26}C${cx - 26} 236 ${cx - 40} 222 ${cx - 40} 196C${cx - 40} 160 ${cx - 12} 136 ${cx - 14} 118C${cx - 16} 100 ${cx - 34} 92 ${cx - 34} 64Z" fill="url(#bell-wood)"/>` +
    `<path d="M${cx - 18} 48C${cx - 12} 38 ${cx - 2} 36 ${cx + 4} 38" stroke="${WHITE}" stroke-opacity=".35" stroke-width="4" stroke-linecap="round"/>` +
    // The brass collar and the bell.
    `<rect x="${cx - 50}" y="246" width="100" height="22" rx="8" fill="url(#bell-brass)"/>` +
    `<path d="M${cx - 46} 266C${cx - 60} 340 ${cx - 70} 392 ${cx - 112} 446C${cx - 140} 482 ${cx - 168} 496 ${cx - 182} 520H${cx + 182}C${cx + 168} 496 ${cx + 140} 482 ${cx + 112} 446C${cx + 70} 392 ${cx + 60} 340 ${cx + 46} 266Z" fill="url(#bell-brass)"/>` +
    `<ellipse cx="${cx}" cy="522" rx="184" ry="28" fill="url(#bell-mouth)"/>` +
    `<ellipse cx="${cx}" cy="520" rx="184" ry="28" stroke="${BRASS_LIGHT}" stroke-opacity=".8" stroke-width="5"/>` +
    `<circle cx="${cx + 26}" cy="538" r="22" fill="${BRASS_DARK}"/>` +
    `<circle cx="${cx + 20}" cy="532" r="7" fill="${BRASS_LIGHT}" fill-opacity=".7"/>` +
    `<path d="M${cx - 30} 290C${cx - 40} 360 ${cx - 56} 410 ${cx - 96} 462" stroke="${WHITE}" stroke-opacity=".45" stroke-width="7" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** A wooden board ruler, a metre long, its centimetres ticked and every tenth numbered. */
function ruler(w: number, h: number): string {
  const unit = (w - 40) / 100;
  let ticks = '';
  let numbers = '';
  for (let i = 0; i <= 100; i++) {
    const x = r1(20 + i * unit);
    const long = i % 10 === 0;
    const mid = i % 5 === 0;
    ticks += `M${x} 3V${long ? 22 : mid ? 16 : 10}`;
    if (long && i > 0 && i < 100)
      numbers += `<text x="${x}" y="${h - 9}" text-anchor="middle" font-family="Playpen Sans Hebrew, sans-serif" font-size="13" font-weight="600" fill="${SOOT}">${i}</text>`;
  }
  return (
    `<defs><linearGradient id="ruler-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${OAK_LIGHT}"/><stop offset=".7" stop-color="${OAK}"/><stop offset="1" stop-color="${OAK_DARK}"/></linearGradient></defs>` +
    `<rect x="0" y="0" width="${w}" height="${h}" rx="5" fill="url(#ruler-wood)"/>` +
    `<path d="M4 1.5H${w - 4}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="1.5"/>` +
    `<path d="${ticks}" stroke="${SOOT}" stroke-width="1.6" stroke-opacity=".85"/>` +
    numbers +
    `<circle cx="${w - 14}" cy="${h / 2 + 4}" r="5" fill="${OAK_DARK}"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// Chalk pictures of the classroom

/**
 * The plan of a classroom from above: desks in rows facing the board, or tables of four. A desk
 * and its chair, or a table and its four, are drawn once in three hands and placed by `<use>`:
 * what the chalk draws, and the body and the definitions of the drawing apart.
 */
function classroomPlan(
  id: string,
  w: number,
  tables: boolean,
  seed: number,
): { body: string; defs: string } {
  const board = twice((k) => hand([60, 22], [w - 60, 22], k, 0, 0.6), seed, CHALK, 7);
  const teacher = (x: number, y: number) =>
    pen(
      strokes(
        [
          [x - 54, y - 13],
          [x + 54, y - 13],
          [x + 54, y + 13],
          [x - 54, y + 13],
        ],
        seed + 3,
        0.5,
        true,
      ),
      CHALK,
      3.2,
    );
  const box = (x: number, y: number, hw: number, hh: number, k: number) =>
    strokes(
      [
        [x - hw, y - hh],
        [x + hw, y - hh],
        [x + hw, y + hh],
        [x - hw, y + hh],
      ],
      k,
      0.5,
      true,
    );
  const hands = [0, 1, 2];
  const place_ = (name: string, i: number, x: number, y: number) =>
    `<use href="#${id}-${name}${i % 3}" x="${Math.round(x)}" y="${Math.round(y)}"/>`;
  if (!tables) {
    // Twenty-eight desks in rows, every chair facing the board.
    const defs = hands
      .map(
        (i) =>
          `<g id="${id}-desk${i}">` +
          pen(box(0, 0, 32, 12, seed + 10 + i * 7), GREY, 3) +
          pen(loop(0, 26, 7, 6, 0, 370, seed + 50 + i, 0.04), GREY, 2.8) +
          `</g>`,
      )
      .join('');
    let desks = '';
    for (let row = 0; row < 4; row++) {
      for (let col = 0; col < 7; col++) {
        desks += place_('desk', row * 7 + col + row, 58 + col * ((w - 116) / 6), 112 + row * 56);
      }
    }
    return { body: board + teacher(w / 2, 60) + desks, defs };
  }
  // Seven tables of four, and the teacher's way between them.
  const spots: Pt[] = [
    [w * 0.14, 118],
    [w * 0.39, 118],
    [w * 0.64, 118],
    [w * 0.88, 118],
    [w * 0.26, 246],
    [w * 0.52, 246],
    [w * 0.77, 246],
  ];
  const defs = hands
    .map((i) => {
      const chairs = [
        [0, -40],
        [46, 0],
        [0, 40],
        [-46, 0],
      ] as const;
      return (
        `<g id="${id}-table${i}">` +
        pen(box(0, 0, 27, 24, seed + 40 + i * 7), YELLOW, 3.4) +
        pen(
          chairs.map(([cx, cy], j) => loop(cx, cy, 7, 7, 0, 370, seed + 70 + i * 5 + j, 0.05)).join(''),
          CHALK,
          2.8,
        ) +
        `</g>`
      );
    })
    .join('');
  const tablesDrawn = spots.map(([x, y], i) => place_('table', i, x, y)).join('');
  const path = through([
    [w * 0.05, 176],
    [w * 0.2, 186],
    [w * 0.32, 174],
    [w * 0.45, 186],
    [w * 0.58, 172],
    [w * 0.7, 186],
    [w * 0.83, 176],
    [w * 0.96, 186],
  ]);
  return {
    body:
      board +
      teacher(w / 2, 60) +
      tablesDrawn +
      `<path d="${path}" stroke="${CORAL}" stroke-width="3.4" stroke-dasharray="3 10" stroke-linecap="round"/>` +
      `<circle cx="${Math.round(w * 0.58)}" cy="172" r="9" fill="${CORAL}"/>`,
    defs,
  };
}

/** The pictures on the stickers of the exercise books: a robot, a debate, a seedling. */
const STICKERS = [
  (cx: number, cy: number) =>
    `<rect x="${cx - 24}" y="${cy - 16}" width="48" height="38" rx="8" stroke="${BOARD}" stroke-width="3.2"/>` +
    `<circle cx="${cx - 10}" cy="${cy + 1}" r="5" fill="${BOARD}"/><circle cx="${cx + 10}" cy="${cy + 1}" r="5" fill="${BOARD}"/>` +
    `<path d="M${cx - 9} ${cy + 13}H${cx + 9}M${cx} ${cy - 16}V${cy - 26}M${cx - 24} ${cy + 3}H${cx - 30}M${cx + 24} ${cy + 3}H${cx + 30}" stroke="${BOARD}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy - 29}" r="4.5" fill="${CORAL}"/>`,
  (cx: number, cy: number) =>
    `<path d="M${cx - 30} ${cy - 22}H${cx + 6}a6 6 0 0 1 6 6V${cy + 2}a6 6 0 0 1 -6 6H${cx - 18}L${cx - 28} ${cy + 18}V${cy + 8}H${cx - 30}a6 6 0 0 1 -6 -6V${cy - 16}a6 6 0 0 1 6 -6Z" stroke="${BOARD}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M${cx + 18} ${cy - 6}H${cx + 30}a6 6 0 0 1 6 6V${cy + 18}a6 6 0 0 1 -6 6H${cx + 28}V${cy + 32}L${cx + 18} ${cy + 24}H${cx - 2}a6 6 0 0 1 -6 -6V${cy + 14}" fill="${BLUE}" fill-opacity=".55" stroke="${BOARD}" stroke-width="3.2" stroke-linejoin="round"/>`,
  (cx: number, cy: number) =>
    `<path d="M${cx - 20} ${cy + 8}H${cx + 20}L${cx + 15} ${cy + 32}H${cx - 15}Z" fill="${CORAL}" fill-opacity=".6" stroke="${BOARD}" stroke-width="3.2" stroke-linejoin="round"/>` +
    `<path d="M${cx} ${cy + 8}V${cy - 14}" stroke="${BOARD}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M${cx} ${cy - 8}C${cx - 6} ${cy - 24} ${cx - 22} ${cy - 26} ${cx - 26} ${cy - 18}C${cx - 18} ${cy - 8} ${cx - 6} ${cy - 6} ${cx} ${cy - 8}Z" fill="${MINT}" stroke="${BOARD}" stroke-width="3" stroke-linejoin="round"/>` +
    `<path d="M${cx} ${cy - 14}C${cx + 6} ${cy - 30} ${cx + 22} ${cy - 32} ${cx + 26} ${cy - 24}C${cx + 18} ${cy - 14} ${cx + 6} ${cy - 12} ${cx} ${cy - 14}Z" fill="${MINT}" stroke="${BOARD}" stroke-width="3" stroke-linejoin="round"/>`,
] as const;

/**
 * An exercise book lying on the board: a cover in a colour of the chalk, its spine taped at the
 * start, the pages showing at its edges, a sticker and a name label on it. Drawn right to left;
 * the mirror moves the spine.
 */
function book(id: string, w: number, h: number, colour: string, sticker: number): string {
  const spine = 34;
  const cover = w - spine;
  return (
    `<defs><pattern id="${id}-linen" width="6" height="6" patternUnits="userSpaceOnUse"><path d="M0 6L6 0" stroke="${SHADE}" stroke-opacity=".07" stroke-width="1"/></pattern></defs>` +
    // The pages, just showing along the fore edge and the foot.
    `<rect x="0" y="6" width="${w - 6}" height="${h - 6}" rx="8" fill="${CHALK}"/>` +
    `<path d="M3 ${h - 3}H${w - 8}M2 ${h - 7}H${w - 8}" stroke="${GREY}" stroke-opacity=".7" stroke-width="1"/>` +
    `<rect x="4" y="0" width="${w - 4}" height="${h - 8}" rx="8" fill="${colour}"/>` +
    `<rect x="4" y="0" width="${w - 4}" height="${h - 8}" rx="8" fill="url(#${id}-linen)"/>` +
    // The spine: cloth tape, darker, stitched.
    `<path d="M${cover} 0H${w - 8}a8 8 0 0 1 8 8V${h - 16}a8 8 0 0 1 -8 8H${cover}Z" fill="${SHADE}" fill-opacity=".2"/>` +
    `<path d="M${cover + 0.75} 0V${h - 8}" stroke="${SHADE}" stroke-opacity=".25" stroke-width="1.5"/>` +
    `<path d="M${cover + spine / 2} 14V${h - 22}" stroke="${CHALK}" stroke-opacity=".7" stroke-width="2" stroke-dasharray="7 9"/>` +
    // The sticker, by the spine.
    `<circle cx="${cover - 78}" cy="84" r="52" fill="${CHALK}"/>` +
    `<circle cx="${cover - 78}" cy="84" r="52" stroke="${SHADE}" stroke-opacity=".12" stroke-width="2"/>` +
    STICKERS[sticker]!(cover - 78, 84) +
    // The name label, ruled for the subject's name.
    `<rect x="36" y="154" width="${cover - 72}" height="146" rx="10" fill="${CHALK}"/>` +
    `<path d="M56 236H${cover - 56}M56 280H${cover - 56}" stroke="${BLUE}" stroke-opacity=".5" stroke-width="1.4"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of books, stops, steps and people. */
const cards3 = [START, START + 580, START + 1160];
const stops4 = [START, START + 422, START + 844, START + 1266];
const steps5 = [START, START + 337, START + 674, START + 1011, START + 1348];
const team4 = [START, START + 428, START + 856, START + 1284];

/** How far each index card of the figures stands in from the margin, as pinned by hand. */
const CARD_OFFSETS = [0, 44, 20];
/** How far down each portrait is pinned. */
const PINNED = [0, 16, 0, 16];

/** The treads of the staircase of the process, from the first step up. */
const treads = [744, 680, 616, 552, 488];

function layouts(): Layout[] {
  // The opening: Euclid's first construction. Two circles on a line, each through the other's
  // centre, the triangle on their meeting, and the compass still drawing the second circle.
  const hero = atEnd(30, 70, 860, 900);
  const A: Pt = [250, 600];
  const B: Pt = [490, 600];
  const R = 240;
  const C: Pt = [370, 600 - R * Math.sin(60 * RAD)];
  // The chalk is at the end of the arc it has drawn, a little above the line.
  const drawnTo = -15;
  const P: Pt = [B[0] + R * Math.cos(drawnTo * RAD), B[1] + R * Math.sin(drawnTo * RAD)];
  const mid: Pt = [(B[0] + P[0]) / 2, (B[1] + P[1]) / 2];
  const half = R / 2;
  const legLength = 360;
  const rise = Math.sqrt(legLength * legLength - half * half);
  const up: Pt = [(P[1] - B[1]) / R, -(P[0] - B[0]) / R];
  const hingeAt: Pt = [mid[0] + up[0] * rise, mid[1] + up[1] * rise];
  const knobAt: Pt = [hingeAt[0] + up[0] * 40, hingeAt[1] + up[1] * 40];
  const compassBox = (() => {
    const xs = [B, P, hingeAt, knobAt].map((p) => p[0]);
    const ys = [B, P, hingeAt, knobAt].map((p) => p[1]);
    const x = Math.floor(Math.min(...xs) - 34);
    const y = Math.floor(Math.min(...ys) - 30);
    return { x, y, w: Math.ceil(Math.max(...xs) + 34 - x), h: Math.ceil(Math.max(...ys) + 22 - y) };
  })();
  const local = (p: Pt): Pt => [p[0] - compassBox.x, p[1] - compassBox.y];
  const s = seedOf('hero');
  const tick = (a: Pt, b: Pt, k: number) => {
    const m: Pt = [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
    const l = Math.hypot(b[0] - a[0], b[1] - a[1]);
    const nx = -(b[1] - a[1]) / l;
    const ny = (b[0] - a[0]) / l;
    return hand([m[0] - nx * 13, m[1] - ny * 13], [m[0] + nx * 13, m[1] + ny * 13], k, 0, 0.3);
  };
  const construction =
    pen(hand([10, 600], [826, 600], s, 0, 1.4), GREY, 2.2, 0.6) +
    twice((k) => loop(A[0], A[1], R, R, -200, 372, k, 0.006, 0.012), s + 1, CHALK, 3.6) +
    twice((k) => loop(B[0], B[1], R, R, drawnTo - 300, 300, k, 0.005, 0.008), s + 2, CHALK, 3.6) +
    pen(loop(B[0], B[1], R, R, drawnTo - 50, 50, s + 3, 0.003), CHALK, 4.6) +
    twice((k) => strokes([A, B, C], k, 0.8, true), s + 4, YELLOW, 6) +
    pen(tick(A, B, s + 5) + tick(B, C, s + 6) + tick(C, A, s + 7), YELLOW, 3) +
    pen(
      loop(A[0], A[1], 52, 52, -60, 60, s + 8, 0.01) +
        loop(B[0], B[1], 52, 52, 180, 60, s + 9, 0.01) +
        loop(C[0], C[1], 52, 52, 60, 60, s + 10, 0.01),
      CHALK,
      2.4,
      0.85,
    ) +
    pen(
      cross(A[0], A[1], 8, s + 11) +
        cross(B[0], B[1], 8, s + 12) +
        cross(C[0], C[1], 8, s + 13) +
        cross(C[0], 600 + R * Math.sin(60 * RAD), 8, s + 14),
      CHALK,
      2.6,
    );

  // The part: the clock, and around it in chalk the forty-five minutes of a lesson.
  const clockSize = 640;
  const period = (() => {
    const c = 360;
    const r = 348;
    const end = 172;
    const tip: Pt = [c + Math.cos(end * RAD) * r, c + Math.sin(end * RAD) * r];
    return (
      pen(loop(c, c, r, r, -90, end + 90, seedOf('period'), 0.004), YELLOW, 5) +
      pen(arrowHead(tip, (end + 90) * RAD, 26, seedOf('period') + 1), YELLOW, 5) +
      pen(hand([c, c - r - 16], [c, c - r + 16], seedOf('period') + 2, 0, 0.3), YELLOW, 5)
    );
  })();

  // The flight of the number line: where each stop stands on it, in the box's own coordinates.
  const lineBox = at(START - 40, 262, WIDTH + 80, 200);
  const lineX = (d: number) => START - 40 + lineBox.w - d;
  const stopX = stops4.map((d) => lineX(d + 16));
  const numberLine = (() => {
    const y = 150;
    const k = seedOf('timeline');
    let ticks = '';
    for (let x = lineBox.w - 60; x > 60; x -= 42) {
      if (stopX.some((sx) => Math.abs(sx - x) < 22)) continue;
      // A short stroke, leaning a pixel one way or the other as a hand leans it.
      ticks += `M${Math.round(x)} ${y - 8}l${(Math.round(x) % 3) - 1} 16`;
    }
    const jumps = stopX.slice(0, 3).map((x0, i) => {
      const x1 = stopX[i + 1]!;
      const peak = y - 92;
      const path = through([
        [x0 - 4, y - 16],
        [x0 + (x1 - x0) * 0.25, peak + 16],
        [(x0 + x1) / 2, peak],
        [x0 + (x1 - x0) * 0.75, peak + 16],
        [x1 + 6, y - 18],
      ]);
      const angle = Math.atan2(y - 18 - (peak + 16), x1 + 6 - (x0 + (x1 - x0) * 0.75));
      return pen(path, YELLOW, 3.6) + pen(arrowHead([x1 + 6, y - 18], angle, 18, k + 50 + i), YELLOW, 3.6);
    });
    return (
      twice((s2) => hand([lineBox.w - 24, y], [24, y + 2], s2, 0, 1.2), k, CHALK, 4) +
      pen(arrowHead([22, y + 2], Math.PI, 22, k + 3), CHALK, 4) +
      pen(ticks, CHALK, 2.4, 0.7) +
      stopX
        .map(
          (x, i) =>
            pen(hand([x, y - 20], [x, y + 20], k + 70 + i, 0, 0.3), CHALK, 4) +
            pen(loop(x, y, 13, 13, 0, 380, k + 80 + i, 0.06, 0.1), YELLOW, 3.2),
        )
        .join('') +
      jumps.join('')
    );
  })();

  // The staircase of the process: its profile, hatched below, rising towards the end.
  const stairBox = at(START - 20, 230, WIDTH + 40, 600);
  const sx = (d: number) => START - 20 + stairBox.w - d;
  const sy = (y: number) => y - stairBox.y;
  const base = sy(800);
  const profile: Pt[] = [[sx(START - 10), base]];
  steps5.forEach((d, i) => {
    const from = i === 0 ? START - 10 : d - 18;
    const to = i === 4 ? d + 310 : d + 337 - 18;
    profile.push([sx(from), sy(treads[i]!)], [sx(to), sy(treads[i]!)]);
  });
  profile.push([sx(START + 1348 + 310), base]);
  const stairs = (() => {
    const k = seedOf('stairs');
    // The hatching under the steps: a pattern of lines rising at 45 degrees, filling the profile.
    const hatch = `<pattern id="d_gir_process_stairs-hatch" width="12.7" height="10" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><path d="M0 0V10" stroke="${CHALK}" stroke-opacity=".3" stroke-width="2"/></pattern>`;
    return {
      clip: hatch,
      body:
        `<path d="M${profile.map(([x, y]) => `${Math.round(x)} ${Math.round(y)}`).join('L')}Z" fill="url(#d_gir_process_stairs-hatch)"/>` +
        twice((k2) => strokes(profile, k2, 0.8), k, CHALK, 4.2) +
        pen(hand([sx(START - 10), base], [sx(START + 1348 + 310), base], k + 7, 0, 1), CHALK, 3.4, 0.8),
    };
  })();

  return [
    {
      id: 'l_gir_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 44, 288, 860, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 332, 940, 264), 'display'),
        place('p_subtitle', 'subtitle', at(START, 612, 880, 140), 'heading'),
        place('p_meta', 'caption', at(START + 44, 818, 860, 34), 'caption'),
      ],
      decorations: [
        board('d_gir_hero_board'),
        kickerStar('d_gir_hero_star', START, 289),
        chalk(
          'd_gir_hero_underline',
          at(START, 768, 340, 28),
          pen(hand([334, 9], [8, 14], 5, 3, 0.7), YELLOW, 5.5) +
            pen(hand([300, 21], [60, 22], 9, 1.5, 0.6), YELLOW, 3.6, 0.75),
        ),
        chalk(
          'd_gir_hero_when',
          at(START, 819, 32, 32),
          pen(
            strokes(
              [
                [4, 7],
                [30, 7],
                [30, 31],
                [4, 31],
              ],
              4,
              0.3,
              true,
            ) + hand([4, 14], [30, 14], 7, 0, 0.2),
            CHALK,
            2.4,
          ) + `<circle cx="22" cy="23" r="3.2" fill="${YELLOW}"/>`,
        ),
        chalkFigures('d_gir_hero_construction', hero, construction, (flip) =>
          figure(flip ? hero.w - C[0] : C[0], C[1] + 104, '60°', 30, CHALK),
        ),
        lifted(
          art(
            'd_gir_hero_compass',
            atEnd(30 + compassBox.x, 70 + compassBox.y, compassBox.w, compassBox.h),
            compass('d_gir_hero_compass', local(B), local(P), local(hingeAt), local(knobAt)),
          ),
          16,
          22,
          0.45,
        ),
      ],
    },
    {
      id: 'l_gir_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(150 + clockSize / 2 - 150, 566, 300, 128), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('bg'),
        }),
        place('p_kicker', 'caption', at(START + 44, 360, 800, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 404, 880, 252), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 672, 840, 136), 'heading'),
      ],
      decorations: [
        board('d_gir_section_board'),
        upright(
          'd_gir_section_period',
          atEnd(110, 150, 720, 720),
          chalkBody('d_gir_section_period', 720, 720, period),
        ),
        lifted(
          upright('d_gir_section_clock', atEnd(150, 190, clockSize, clockSize), clock(clockSize)),
          20,
          34,
          0.5,
        ),
        kickerStar('d_gir_section_star', START, 361),
      ],
    },
    {
      id: 'l_gir_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1000, 1).placeholders,
        place('p_number', 'number', at(START + 20, 330, 400, 150), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('primary'),
        }),
        place('p_label', 'subtitle', at(START, 544, 720, 92), 'heading'),
        place('p_note', 'body', at(START, 646, 700, 130), 'body'),
        ...[0, 1, 2].flatMap((i) => {
          const off = CARD_OFFSETS[i]!;
          const y = 252 + i * 212;
          return [
            place(`p_number${i + 2}`, 'number', atEnd(END + off + 34, y + 18, 492, 72), 'title', {
              color: token('bg'),
            }),
            place(`p_label${i + 2}`, 'caption', atEnd(END + off + 34, y + 104, 492, 68), 'caption', {
              color: token('bg', 0.84),
            }),
          ];
        }),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        board('d_gir_big_number_board'),
        ...head('big_number', 1000, 1).decorations,
        chalk(
          'd_gir_big_number_circle',
          at(START + 10, 300, 420, 210),
          twice((k) => loop(210, 105, 196, 88, -165, 384, k, 0.022, 0.09), 31, CHALK, 3.6),
        ),
        chalk(
          'd_gir_big_number_tally',
          at(START + 480, 346, 330, 120),
          pen(
            [0, 1, 2, 3]
              .map((g) => {
                const x0 = 300 - g * 78;
                return (
                  [0, 1, 2, 3]
                    .map((i) =>
                      hand([x0 - i * 14, 16 + (i % 2) * 3], [x0 - i * 14 + 2, 100], 40 + g * 9 + i, 0, 0.8),
                    )
                    .join('') + hand([x0 + 10, 30], [x0 - 54, 86], 80 + g, 2, 0.6)
                );
              })
              .join(''),
            CHALK,
            3.4,
            0.85,
          ),
        ),
        ...[0, 1, 2].flatMap((i) => {
          const off = CARD_OFFSETS[i]!;
          const y = 252 + i * 212;
          return [
            paper(
              `d_gir_big_number_card${i + 2}`,
              atEnd(END + off, y, 560, 184),
              `<path d="M0 96H560" stroke="${CORAL}" stroke-opacity=".75" stroke-width="2"/>` +
                `<path d="M0 134H560M0 166H560" stroke="${BLUE}" stroke-opacity=".5" stroke-width="1.4"/>`,
            ),
            magnet(
              `d_gir_big_number_magnet${i + 2}`,
              atEnd(END + off + 260, y - 18, 40, 40),
              [YELLOW, BLUE, CORAL][i]!,
            ),
          ];
        }),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_gir_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(START + 336, 274, 1090, 270), 'title', { vAlign: 'middle' }),
        place('p_attribution', 'attribution', at(START + 390, 686, 900, 48), 'heading'),
        place('p_caption', 'caption', at(START + 390, 738, 900, 68), 'caption'),
        ...foot('quote').placeholders,
      ],
      decorations: [
        board('d_gir_quote_board'),
        (() => {
          // The bubble, drawn right to left: its tail at the start, over the speaker's name.
          const w = 1380;
          const h = 470;
          const x0 = 18;
          const y0 = 18;
          const x1 = w - 18;
          const y1 = 400;
          const r = 70;
          const k = seedOf('bubble');
          const corner = (cx: number, cy: number, from: number) =>
            loop(cx, cy, r, r, from, 90, k + from, 0.01);
          const outline =
            hand([x0 + r, y0], [x1 - r, y0 + 2], k, 3, 1.4) +
            corner(x1 - r, y0 + r, -90) +
            hand([x1, y0 + r], [x1 - 1, y1 - r], k + 1, -2, 1.2) +
            corner(x1 - r, y1 - r, 0) +
            hand([x1 - r, y1], [w - 210, y1 + 1], k + 2, 0, 0.8) +
            hand([w - 210, y1 + 1], [w - 238, h - 12], k + 3, 0, 0.6) +
            hand([w - 238, h - 12], [w - 300, y1], k + 4, 0, 0.6) +
            hand([w - 300, y1], [x0 + r, y1 - 2], k + 5, -3, 1.4) +
            corner(x0 + r, y1 - r, 90) +
            hand([x0, y1 - r], [x0 + 1, y0 + r], k + 6, 2, 1.2) +
            corner(x0 + r, y0 + r, 180);
          return chalk(
            'd_gir_quote_bubble',
            at(START + 150, 200, w, h),
            pen(outline, CHALK, 4.8, 1),
          );
        })(),
        upright(
          'd_gir_quote_marks',
          at(START + 210, 240, 104, 84),
          chalkBody(
            'd_gir_quote_marks',
            104,
            84,
            `<path d="M22 4C8 16 2 30 2 46C2 62 12 72 26 72C38 72 46 64 46 52C46 40 38 33 27 33C25 33 23 33 22 34C23 24 28 16 36 9Z" fill="${YELLOW}"/>` +
              `<path d="M78 4C64 16 58 30 58 46C58 62 68 72 82 72C94 72 102 64 102 52C102 40 94 33 83 33C81 33 79 33 78 34C79 24 84 16 92 9Z" fill="${YELLOW}"/>`,
          ),
        ),
        chalk(
          'd_gir_quote_spark',
          atEnd(200, 130, 110, 100),
          pen(
            hand([68, 70], [46, 40], 3, 0, 0.4) +
              hand([60, 82], [20, 70], 4, 0, 0.4) +
              hand([82, 64], [84, 22], 5, 0, 0.4),
            YELLOW,
            4,
          ),
        ),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_gir_text',
      name: 'Text',
      archetype: 'text',
      // The text on a patch of the board, ruled by hand from margin to margin down to over the
      // foot, and set from its top; an hourglass beside the title.
      placeholders: [
        ...head('text', 1480, 1, false).placeholders,
        place('p_body', 'body', at(START + 64, 270, WIDTH - 128, 610), 'body'),
      ],
      decorations: [
        board('d_gir_text_board'),
        ...head('text', 1480, 1, false).decorations,
        rect('d_gir_text_patch', at(START, 216, WIDTH, 712), solid(token('surface', 0.5)), {
          effects: { radius: 4 },
        }),
        chalk(
          'd_gir_text_rule',
          at(START - 12, 204, WIDTH + 24, 736),
          twice((k) => ruled(12, 12, WIDTH, 712, k, 9), 61, CHALK, 3.2),
        ),
        chalk(
          'd_gir_text_hourglass',
          atEnd(END + 20, 62, 92, 128),
          twice(
            (k) =>
              hand([10, 10], [82, 10], k, 0, 0.4) + hand([10, 118], [82, 118], k + 1, 0, 0.4),
            1,
            CHALK,
            4.4,
          ) +
            pen(
              through([
                [18, 12],
                [22, 44],
                [46, 64],
                [70, 84],
                [74, 116],
              ]) +
                through([
                  [74, 12],
                  [70, 44],
                  [46, 64],
                  [22, 84],
                  [18, 116],
                ]),
              CHALK,
              3.8,
            ) +
            pen(hand([30, 34], [62, 34], 3, 0, 0.3) + hand([28, 108], [64, 108], 4, 0, 0.3), YELLOW, 7, 0.85) +
            pen(hand([46, 66], [46, 100], 5, 0, 0.2), YELLOW, 3, 0.85),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_gir_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 980).placeholders,
        place('p_image', 'image', atEnd(END + 30, 172, 604, 724)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 92, 320 + i * 196, 880, 46), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 92, 370 + i * 196, 880, 124), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        board('d_gir_text_image_board'),
        ...head('text_image', 980).decorations,
        paper('d_gir_text_image_print', atEnd(END + 6, 148, 652, 772)),
        tape('d_gir_text_image_tape', atEnd(END + 6 + 326 - 76, 126, 152, 40)),
        chalk(
          'd_gir_text_image_thread',
          at(START + 27, 388, 14, 324),
          pen(hand([7, 4], [7, 120], 3, 0, 0.8) + hand([7, 200], [7, 320], 4, 0, 0.8), CHALK, 2.6, 0.5),
        ),
        ...[0, 1, 2].map((i) => {
          const id = `d_gir_text_image_n${i + 1}`;
          return chalkFigures(
            id,
            at(START, 312 + i * 196, 68, 68),
            pen(loop(34, 34, 28, 27, -120, 375, seedOf(id), 0.03, 0.1), YELLOW, 3.4),
            () => figure(34, 47, String(i + 1), 34, CHALK),
          );
        }),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_gir_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_place', 'caption', at(START + 44, 84, 900, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 126, 980, 150), 'title'),
        place('p_body', 'body', atEnd(END, 90, 600, 176), 'body'),
        place('p_image', 'image', atEnd(64, 306, W - 128, 712)),
      ],
      decorations: [
        board('d_gir_full_image_board', false),
        kickerStar('d_gir_full_image_star', START, 85),
        chalk(
          'd_gir_full_image_rule',
          atEnd(END + 630, 96, 12, 160),
          pen(hand([6, 4], [6, 156], 6, 0, 0.8), CHALK, 3, 0.6),
        ),
        // The print rests on the ledge, held to the board by two magnets.
        paper('d_gir_full_image_print', atEnd(48, 290, W - 96, 750)),
        magnet('d_gir_full_image_magnet1', atEnd(300, 277, 30, 30), YELLOW),
        magnet('d_gir_full_image_magnet2', at(300, 277, 30, 30), BLUE),
      ],
    },
    {
      id: 'l_gir_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 90, 280 + 166, 374, 34), 'caption', {
            color: token('bg', 0.84),
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 90, 280 + 198, 374, 92), 'heading', {
            color: token('bg'),
          }),
          place(`p_card${i + 1}_body`, 'body', at(s + 70, 280 + 320, 414, 150), 'body', {
            color: token('bg'),
          }),
        ]),
        place('p_note', 'body', at(START + 44, 818, 1500, 44), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        board('d_gir_cards_board'),
        ...head('cards', 1100).decorations,
        ...cards3.map((s, i) =>
          lifted(
            art(
              `d_gir_cards_book${i + 1}`,
              at(s, 280, 520, 500),
              book(`d_gir_cards_book${i + 1}`, 520, 500, [YELLOW, BLUE, CORAL][i]!, i),
            ),
            14,
            26,
            0.45,
          ),
        ),
        kickerStar('d_gir_cards_note_star', START, 824),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_gir_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 440, 390, 70), 'title', {
            color: token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 516, 390, 92), 'heading'),
          place(`p_stop${i + 1}_body`, 'body', at(s, 612, 390, 166), 'body'),
        ]),
        place('p_note', 'caption', at(START + 44, 836, 1400, 60), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        board('d_gir_timeline_board'),
        ...head('timeline', 1100).decorations,
        chalk('d_gir_timeline_line', lineBox, numberLine),
        kickerStar('d_gir_timeline_note_star', START, 837),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_gir_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100, 1).placeholders,
        ...steps5.flatMap((s, i) => [
          place(`p_station${i + 1}`, 'number', at(s, treads[i]! - 236, 290, 68), 'title', {
            vAlign: 'bottom',
            color: i === 4 ? token('secondary') : token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, treads[i]! - 168, 290, 92), 'heading', {
            vAlign: 'bottom',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, treads[i]! - 76, 290, 70), 'caption', {
            vAlign: 'top',
          }),
        ]),
        place('p_note', 'body', at(START + 44, 836, 1500, 84), 'body'),
        ...foot('process').placeholders,
      ],
      decorations: [
        board('d_gir_process_board'),
        ...head('process', 1100, 1).decorations,
        chalk('d_gir_process_stairs', stairBox, stairs.body, stairs.clip),
        chalk(
          'd_gir_process_flag',
          at(1744, treads[4]! - 132, 64, 136),
          pen(hand([56, 132], [54, 6], 3, 0, 0.6), CHALK, 3.4) +
            pen(strokes([[54, 8], [6, 26], [54, 46]], 5, 0.4), CORAL, 3.4) +
            `<path d="M52 10L10 26L52 44Z" fill="${CORAL}" fill-opacity=".35"/>`,
        ),
        kickerStar('d_gir_process_note_star', START, 841),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_gir_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(START, 270, 790, 600)],
            ['after', atEnd(END, 270, 790, 600)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 10, y: 624, w: 770, h: 34 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 10, y: 662, w: 770, h: 50 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 10, y: 718, w: 770, h: 170 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        board('d_gir_comparison_board'),
        ...head('comparison', 1100).decorations,
        ...(
          [
            ['before', at(START + 10, 270, 770, 320), false, 300],
            ['after', atEnd(END + 10, 270, 770, 320), true, 500],
          ] as const
        ).map(([side, frame, tables, seed]) => {
          const id = `d_gir_comparison_${side}_plan`;
          const plan = classroomPlan(id, 770, tables, seed);
          return chalk(id, frame, plan.body, plan.defs);
        }),
        chalk(
          'd_gir_comparison_divider',
          atEnd(W / 2 - 8, 262, 16, 650),
          twice((k) => hand([8, 4], [8, 646], k, 2, 1.4), 9, CHALK, 3.4),
        ),
        // The arrow from before to after, in a ring that clears the dividing line under it.
        art(
          'd_gir_comparison_arrow',
          atEnd(W / 2 - 48, 382, 96, 96),
          `<circle cx="48" cy="48" r="41" fill="${BOARD}"/>` +
            chalkBody(
              'd_gir_comparison_arrow',
              96,
              96,
              pen(loop(48, 48, 40, 40, 0, 372, 7, 0.03, 0.06), YELLOW, 4) +
                pen(hand([70, 48], [24, 48], 8, 0, 0.4) + arrowHead([24, 48], Math.PI, 17, 9), YELLOW, 4.6),
            ),
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_gir_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(START + 44, 300, 996, 500)),
        place('p_source', 'caption', at(START + 44, 816, 996, 68), 'caption'),
        place('p_figure1', 'number', atEnd(END, 286, 480, 130), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 442, 480, 120), 'body'),
        place('p_figure2', 'number', atEnd(END, 594, 480, 130), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 750, 480, 120), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        board('d_gir_chart_board'),
        ...head('chart', 1080).decorations,
        (() => {
          // The squared part of the board, its grid painted on and worn.
          const w = 1080;
          const h = 640;
          let grid = '';
          for (let x = 40; x < w; x += 40) grid += `M${x} 6V${h - 6}`;
          for (let y = 40; y < h; y += 40) grid += `M6 ${y}H${w - 6}`;
          return chalk(
            'd_gir_chart_grid',
            at(START, 268, w, h),
            `<path d="${grid}" stroke="${CHALK}" stroke-opacity=".1" stroke-width="1.4"/>` +
              twice((k) => ruled(6, 6, w - 12, h - 12, k, 0), 71, CHALK, 3),
          );
        })(),
        chalk(
          'd_gir_chart_swoosh1',
          atEnd(END + 250, 412, 230, 22),
          pen(hand([226, 8], [6, 13], 3, 2, 0.6), YELLOW, 5.5),
        ),
        chalk(
          'd_gir_chart_swoosh2',
          atEnd(END + 250, 724, 230, 22),
          pen(hand([226, 8], [6, 13], 4, 2, 0.6), CORAL, 5.5),
        ),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_gir_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 20, 340, WIDTH - 40, 480)),
        place('p_note', 'caption', at(START + 44, 866, 1400, 40), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        board('d_gir_table_board'),
        ...head('table', 1200).decorations,
        {
          ...lifted(upright('d_gir_table_ruler', at(START, 264, WIDTH, 46), ruler(WIDTH, 46)), 8, 14, 0.45),
          rotation: -0.8,
        },
        chalk(
          'd_gir_table_frame',
          at(START, 326, WIDTH, 510),
          twice((k) => ruled(6, 6, WIDTH - 12, 498, k, 0), 81, CHALK, 3),
        ),
        kickerStar('d_gir_table_note_star', START, 868),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_gir_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => {
          const dy = PINNED[i]!;
          return [
            place(`p_photo${i + 1}`, 'image', at(s + 28, 286 + dy, 328, 328)),
            place(`p_class${i + 1}`, 'caption', at(s + 12, 690, 380, 34), 'caption', {
              color: token('primary'),
            }),
            place(`p_name${i + 1}`, 'subtitle', at(s + 12, 728, 380, 48), 'heading'),
            place(`p_role${i + 1}`, 'body', at(s + 12, 780, 380, 124), 'body'),
          ];
        }),
        ...foot('team').placeholders,
      ],
      decorations: [
        board('d_gir_team_board'),
        ...head('team', 1100).decorations,
        ...team4.flatMap((s, i) => {
          const dy = PINNED[i]!;
          return [
            paper(`d_gir_team_print${i + 1}`, at(s + 12, 270 + dy, 360, 360)),
            magnet(
              `d_gir_team_magnet${i + 1}`,
              at(s + 12 + 160, 270 + dy - 24, 40, 40),
              [CORAL, YELLOW, BLUE, MINT][i]!,
            ),
          ];
        }),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_gir_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 44, 252, 900, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 296, 980, 264), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 64, 596 + i * 86, 900, 80), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START + 44, 872, 900, 34), 'caption'),
      ],
      decorations: [
        board('d_gir_closing_board'),
        mark('d_gir_closing_mark', at(START, 84, 56, 56)),
        kickerStar('d_gir_closing_star', START, 253),
        ...[0, 1, 2].map((i) => {
          const id = `d_gir_closing_box${i + 1}`;
          return upright(
            id,
            at(START, 596 + i * 86, 40, 40),
            chalkBody(
              id,
              40,
              40,
              pen(strokes([[5, 8], [32, 8], [32, 35], [5, 35]], seedOf(id), 0.4, true), CHALK, 3) +
                pen(through([[10, 21], [17, 29], [36, 4]]), YELLOW, 4.2),
            ),
          );
        }),
        chalk(
          'd_gir_closing_ring',
          atEnd(110, 190, 680, 660),
          pen(
            [0, 1, 2]
              .map(
                (i) =>
                  loop(340, 470, 250 + i * 46, 210 + i * 40, 195, 50, 11 + i, 0.01) +
                  loop(340, 470, 250 + i * 46, 210 + i * 40, 295, 50, 21 + i, 0.01),
              )
              .join(''),
            YELLOW,
            4,
            0.85,
          ),
        ),
        lifted(art('d_gir_closing_bell', atEnd(230, 236, 440, 600), bell(440, 600)), 24, 30, 0.45),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the figures, the clock, the ruler) moved across as they are.
 */
function flipped(drawn: readonly Layout[]): Layout[] {
  return drawn.map((layout) => {
    const mirrored = mirrorLayout(layout);
    return {
      ...mirrored,
      decorations: mirrored.decorations.map((decoration) => {
        if (!UPRIGHT.has(decoration.id) || decoration.type !== 'svg') return decoration;
        const { flipH: _flipH, ...rest } = decoration;
        const ltr = UPRIGHT.get(decoration.id);
        return ltr ? { ...rest, markup: ltr } : rest;
      }),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The sample: the parents' evening of a middle school, a week before its Grade 7 begins

const TABLE_COLS = [330, 300, 340, 400, 270];
const TABLE_ROW = 80;
const GRADE = [45, 62, 78, 94, 110];
const TOWN = [40, 43, 46, 49, 52];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari meet across lines set as tight as Latin display type.
 * `books` is the leading of the exercise books' titles, set right under their labels, where the
 * vowel signs above a Devanagari line would touch the label's figures.
 */
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number; books?: number }>
> = {
  hi: { display: 1.24, title: 1.34, subtitle: 1.46, books: 1.6 },
};
const DISPLAYED = new Set(['l_gir_hero', 'l_gir_section', 'l_gir_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: GirCopy, lang: ContentLanguage): SampleSlide[] {
  const leading = LEADING[lang];
  const slides = drawSample(copy, leading?.books);
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

/** The sample's slides; `books`, the leading of the exercise books' titles where a script needs it. */
function drawSample(copy: GirCopy, books?: number): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_gir_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_gir_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 34 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('primary'), gap: 20 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_gir_big_number',
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
      layout: 'l_gir_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_gir_comparison',
      name: copy.classroom.name,
      content: {
        caption: [
          text(copy.classroom.kicker),
          text(copy.classroom.before[0]),
          text(copy.classroom.after[0]),
        ],
        title: lines(copy.classroom.title),
        subtitle: [text(copy.classroom.before[1]), text(copy.classroom.after[1])],
        body: [text(copy.classroom.before[2]), text(copy.classroom.after[2])],
        footer,
      },
    },
    {
      layout: 'l_gir_text_image',
      name: copy.labs.name,
      content: {
        caption: text(copy.labs.kicker),
        title: lines(copy.labs.title),
        image: { assetId: pictures.labs.id },
        subtitle: copy.labs.items.map(([title]) => text(title)),
        body: copy.labs.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_gir_full_image',
      name: copy.garden.name,
      content: {
        image: { assetId: pictures.garden.id },
        caption: text(copy.garden.place),
        title: lines(copy.garden.title),
        body: text(copy.garden.body),
      },
    },
    {
      layout: 'l_gir_cards',
      name: copy.courses.name,
      content: {
        caption: [text(copy.courses.kicker), ...copy.courses.cards.map(([label]) => text(label))],
        title: lines(copy.courses.title),
        subtitle: copy.courses.cards.map(([, title]) => {
          const fill = text(title);
          if (!books) return fill;
          return { paragraphs: fill.paragraphs.map((p) => ({ ...p, lineHeight: books })) };
        }),
        body: [...copy.courses.cards.map(([, , body]) => text(body)), text(copy.courses.note)],
        footer,
      },
    },
    {
      layout: 'l_gir_chart',
      name: copy.reading.name,
      content: {
        caption: [text(copy.reading.kicker), text(copy.reading.source)],
        title: lines(copy.reading.title),
        number: copy.reading.figures.map(([value]) => text(value)),
        body: copy.reading.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'line',
        data: {
          categories: copy.reading.months,
          series: [
            { name: copy.reading.series[0], values: GRADE },
            { name: copy.reading.series[1], values: TOWN },
          ],
        },
      },
    },
    {
      layout: 'l_gir_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_gir_timeline',
      name: copy.year.name,
      content: {
        caption: [text(copy.year.kicker), text(copy.year.note)],
        title: lines(copy.year.title),
        number: copy.year.stops.map(([when]) => text(when)),
        subtitle: copy.year.stops.map(([, title]) => text(title)),
        body: copy.year.stops.map(([, , body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_gir_process',
      name: copy.help.name,
      content: {
        caption: [text(copy.help.kicker), ...copy.help.steps.map(([, caption]) => text(caption))],
        title: lines(copy.help.title),
        number: copy.help.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.help.steps.map(([step]) => text(step)),
        body: text(copy.help.note),
        footer,
      },
    },
    {
      layout: 'l_gir_table',
      name: copy.clubs.name,
      content: {
        caption: [text(copy.clubs.kicker), text(copy.clubs.note)],
        title: lines(copy.clubs.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.clubs.header, ...copy.clubs.rows],
      },
    },
    {
      layout: 'l_gir_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([subject]) => text(subject))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => text(role)),
        footer,
      },
    },
    {
      layout: 'l_gir_closing',
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
export const girSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => GIR_COPY[lang]).map((lang) => [
    lang,
    sample(GIR_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Gir template: the theme, its layouts for both directions, and its sample deck. */
export function girTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(girTheme),
    description:
      'A classroom chalkboard in an oak frame: chalk drawn by hand on a dusty slate, a board compass, the wall clock, prints taped to the board, exercise books, a number line, a staircase and a hand bell, for schools, lessons and courses.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.labs, pictures.garden, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, girSamples.he);
  return finished;
}

export const entry = { id: 'gir', template: girTemplate, samples: girSamples };
