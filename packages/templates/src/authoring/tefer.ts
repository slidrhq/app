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
import { TEFER_COPY, type TeferCopy } from './tefer/copy';
import { picture } from './pictures';

const pictures = {
  cutting: picture('teferCutting'),
  workroom: picture('teferWorkroom'),
  team: [1, 2, 3, 4].map((n) => picture(`teferTeam${n}`)),
};

/**
 * Tefer (Atelier): the slide is the cutting table of a tailoring atelier. Warm calico under the
 * dots of pattern-drafting paper, and on it the tools and marks of making, each doing a job: the
 * opening is a graded pattern piece of a coat with a tape measure across it, a part is numbered
 * on a woven label sewn into the edge of the slide, a figure stands beside a dress form, the
 * quote hangs on a swing tag, the cards are swatches with pinked edges, a plan is a tape measure
 * with pins at its stops, a process the buttons of a placket, the people portraits clipped to
 * hangers on a rail. A seam runs along the foot of every slide, from a sewn-on button to the
 * woven size label that holds the slide's number. Ink for the words, garnet for the thread and
 * the pins, loden for the lining, the yellow of the tape measure. For fashion labels and
 * collections, textiles, tailoring, design studios, makers and crafts.
 *
 * No drawing holds a word, so one set of layouts reads in every language: the faces are the
 * high-contrast serif of a fashion masthead (Bellefair, in Hebrew and Latin) and Be Vietnam Pro
 * with Assistant for what is read; other scripts take their counterparts.
 */
export const teferTheme: Theme = {
  id: 'tefer',
  name: 'Atelier',
  colors: {
    bg: '#f3eae3',
    surface: '#fffaf6',
    text: '#221b1f',
    muted: '#6c5f64',
    primary: '#8b2236',
    secondary: '#3c5a4b',
    accent: '#e2b13c',
    chart: ['#8b2236', '#3c5a4b', '#e2b13c', '#d38c7c', '#221b1f', '#a7b5a3'],
  },
  // The high-contrast serif of a fashion masthead for what is said aloud, one family for Hebrew
  // and Latin (Bellefair; Playfair Display for Cyrillic and Vietnamese, Amiri for Arabic), and a
  // clean grotesque for what is read (Be Vietnam Pro, with Assistant for Hebrew).
  fonts: {
    heading: { he: 'Bellefair', latin: 'Bellefair' },
    body: { he: 'Assistant', latin: 'Be Vietnam Pro' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 120,
      weight: 400,
      lineHeight: 1.04,
      letterSpacing: -1,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 62,
      weight: 400,
      lineHeight: 1.1,
      letterSpacing: -0.3,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 38, weight: 400, lineHeight: 1.2, color: { token: 'text' } },
    body: { font: 'body', size: 26, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 600,
      lineHeight: 1.36,
      letterSpacing: 0.8,
      color: { token: 'muted' },
    },
  },
  radius: 6,
  shadow: { x: 0, y: 14, blur: 36, color: { value: '#3b1d24', alpha: 0.12 } },
  // The ground: calico under the dots of pattern-drafting paper, a dot every 48 pixels and a
  // stronger one every 192.
  background: {
    fill: {
      kind: 'css',
      value: [
        'radial-gradient(circle at center, color-mix(in srgb, var(--color-text) 20%, transparent) 0 1.7px, transparent 2.3px) -72px -72px / 192px 192px',
        'radial-gradient(circle at center, color-mix(in srgb, var(--color-text) 11%, transparent) 0 1.1px, transparent 1.7px) 0 0 / 48px 48px',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The calico alone, without the dots.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#221b1f';
const MUTED = '#6c5f64';
const GARNET = '#8b2236';
const LODEN = '#3c5a4b';
const TAPE = '#e2b13c';
const CALICO = '#f3eae3';
const IVORY = '#fffaf6';
/** What no token holds: the steel of pins and shears, the wood of a spool, the rose of bouclé. */
const STEEL = '#a49ea2';
const WOOD = '#c99a62';
const ROSE = '#d38c7c';
const BLUSH = '#ecd0c4';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [GARNET]: token('primary'),
  [LODEN]: token('secondary'),
  [TAPE]: token('accent'),
  [CALICO]: token('bg'),
  [IVORY]: token('surface'),
};

/** The faces of the figures drawn on a tape or a ring. */
const SANS = 'Be Vietnam Pro, Assistant, sans-serif';
const SERIF = 'Bellefair, serif';

const RAD = Math.PI / 180;
const r1 = (v: number) => Math.round(v * 10) / 10;
type Pt = [number, number];
const xy = (p: Pt) => `${r1(p[0])} ${r1(p[1])}`;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings that a left-to-right deck must not see mirrored: those with figures in them.
 * Their mirror moves them to the other side and leaves them as they are, or takes the drawing
 * given for that direction: a tape measure that runs the other way, its figures upright.
 */
const UPRIGHT = new Map<string, string | undefined>();

const upright = (id: string, frame: Frame, body: string, ltr?: string) => {
  UPRIGHT.set(id, ltr === undefined ? undefined : svg(frame.w, frame.h, ltr));
  return art(id, frame, body);
};

/** A soft shadow under a drawing of paper or cloth lying on the table. */
const lifted = (element: Element, y = 12, blur = 26, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#3b1d24', alpha } } },
});

// ---------------------------------------------------------------------------------------------
// Curves

/** Points along a chain of cubic Béziers: a start, then `[c1, c2, end]` a segment. */
function bezier(start: Pt, segments: [Pt, Pt, Pt][], steps = 40): Pt[] {
  const out: Pt[] = [start];
  let p0 = start;
  for (const [c1, c2, p3] of segments) {
    for (let i = 1; i <= steps; i++) {
      const t = i / steps;
      const u = 1 - t;
      const k = [u * u * u, 3 * u * u * t, 3 * u * t * t, t * t * t] as const;
      out.push([
        k[0] * p0[0] + k[1] * c1[0] + k[2] * c2[0] + k[3] * p3[0],
        k[0] * p0[1] + k[1] * c1[1] + k[2] * c2[1] + k[3] * p3[1],
      ]);
    }
    p0 = p3;
  }
  return out;
}

/** Where a polyline is, and which way it runs, at a distance along it. */
function walker(line: readonly Pt[]) {
  const lengths = [0];
  for (let i = 1; i < line.length; i++) {
    lengths.push(
      lengths[i - 1]! + Math.hypot(line[i]![0] - line[i - 1]![0], line[i]![1] - line[i - 1]![1]),
    );
  }
  const total = lengths[lengths.length - 1]!;
  const along = (d: number) => {
    let i = 1;
    while (i < line.length - 1 && lengths[i]! < d) i++;
    const a = line[i - 1]!;
    const b = line[i]!;
    const span = lengths[i]! - lengths[i - 1]! || 1;
    const t = Math.min(1, Math.max(0, (d - lengths[i - 1]!) / span));
    return {
      x: a[0] + (b[0] - a[0]) * t,
      y: a[1] + (b[1] - a[1]) * t,
      angle: Math.atan2(b[1] - a[1], b[0] - a[0]),
    };
  };
  return { total, along };
}

const mirrored = (line: readonly Pt[], w: number): Pt[] => line.map(([x, y]) => [w - x, y]);

// ---------------------------------------------------------------------------------------------
// The tools of the atelier

/**
 * A tailor's tape measure laid along a line: a yellow band with a tick every half centimetre
 * on both edges, every centimetre numbered and every tenth in garnet, and its brass tip at the
 * start when it has one. The figures stay upright whichever way the tape runs.
 */
function tape(
  line: readonly Pt[],
  o: { width?: number; unit?: number; from?: number; tip?: boolean } = {},
) {
  const width = o.width ?? 46;
  const unit = o.unit ?? 26;
  const from = o.from ?? 0;
  const half = width / 2;
  const { total, along } = walker(line);
  const left: Pt[] = [];
  const right: Pt[] = [];
  for (let d = 0; d <= total + 5; d += 5) {
    const p = along(Math.min(d, total));
    const nx = -Math.sin(p.angle);
    const ny = Math.cos(p.angle);
    left.push([p.x + nx * half, p.y + ny * half]);
    right.push([p.x - nx * half, p.y - ny * half]);
  }
  let ticks = '';
  let figures = '';
  const start = o.tip ? 16 : 0;
  for (let k = 0; start + (k * unit) / 2 <= total; k++) {
    const p = along(start + (k * unit) / 2);
    const nx = -Math.sin(p.angle);
    const ny = Math.cos(p.angle);
    const len = k % 2 === 0 ? 11 : 6;
    for (const side of [1, -1]) {
      const e: Pt = [p.x + nx * half * side, p.y + ny * half * side];
      const i: Pt = [e[0] - nx * len * side, e[1] - ny * len * side];
      ticks += `M${xy(e)}L${xy(i)}`;
    }
    if (k % 2 === 0 && k > 0) {
      const n = from + k / 2;
      let deg = p.angle / RAD;
      if (deg > 90) deg -= 180;
      if (deg < -90) deg += 180;
      figures += `<text transform="translate(${r1(p.x)} ${r1(p.y)}) rotate(${r1(deg)})" text-anchor="middle" dy=".36em" font-family="${SANS}" font-size="13" font-weight="${n % 10 ? 500 : 700}" fill="${n % 10 ? INK : GARNET}">${n}</text>`;
    }
  }
  let tip = '';
  if (o.tip) {
    const a = along(0);
    const b = along(16);
    const nx = -Math.sin(a.angle);
    const ny = Math.cos(a.angle);
    const h = half + 2;
    tip = `<path d="M${xy([a.x + nx * h, a.y + ny * h])}L${xy([b.x + nx * h, b.y + ny * h])}L${xy([b.x - nx * h, b.y - ny * h])}L${xy([a.x - nx * h, a.y - ny * h])}Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.2"/>`;
  }
  return (
    `<path d="M${left.map(xy).join('L')}L${[...right].reverse().map(xy).join('L')}Z" fill="${TAPE}" stroke="${INK}" stroke-opacity=".22" stroke-width="1.2"/>` +
    `<path d="${ticks}" stroke="${INK}" stroke-opacity=".75" stroke-width="1.3"/>` +
    figures +
    tip
  );
}

/** A dressmaker's pin: its glass head at (x, y), its shaft running `len` at `angle` degrees. */
function pin(x: number, y: number, angle: number, len: number, head = GARNET) {
  const a = angle * RAD;
  const tip: Pt = [x + Math.cos(a) * len, y + Math.sin(a) * len];
  return (
    `<path d="M${r1(x + 3)} ${r1(y + 4)}L${xy([tip[0] + 3, tip[1] + 4])}" stroke="${INK}" stroke-opacity=".14" stroke-width="2.4" stroke-linecap="round"/>` +
    `<path d="M${x} ${y}L${xy(tip)}" stroke="${STEEL}" stroke-width="2.2" stroke-linecap="round"/>` +
    `<circle cx="${r1(x + 2)}" cy="${r1(y + 4)}" r="9" fill="${INK}" fill-opacity=".14"/>` +
    `<circle cx="${x}" cy="${y}" r="8.5" fill="${head}"/>` +
    `<circle cx="${r1(x - 2.6)}" cy="${r1(y - 2.8)}" r="2.6" fill="${IVORY}" fill-opacity=".7"/>`
  );
}

/** A four-hole button sewn on with a cross of thread. */
function button(cx: number, cy: number, r: number, fill: string, thread: string, holes = CALICO) {
  const o = r * 0.26;
  return (
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r)}" fill="${fill}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.4"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.76)}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.2"/>` +
    [
      [-1, -1],
      [1, -1],
      [-1, 1],
      [1, 1],
    ]
      .map(
        ([dx, dy]) =>
          `<circle cx="${r1(cx + dx! * o)}" cy="${r1(cy + dy! * o)}" r="${r1(r * 0.11)}" fill="${holes}"/>`,
      )
      .join('') +
    `<path d="M${r1(cx - o)} ${r1(cy - o)}L${r1(cx + o)} ${r1(cy + o)}M${r1(cx + o)} ${r1(cy - o)}L${r1(cx - o)} ${r1(cy + o)}" stroke="${thread}" stroke-width="${r1(Math.max(1.6, r * 0.09))}" stroke-linecap="round"/>`
  );
}

/** A sewing needle from its eye at `a` to its point at `b`. */
function needle(a: Pt, b: Pt, width = 3.4) {
  const len = Math.hypot(b[0] - a[0], b[1] - a[1]);
  const deg = Math.atan2(b[1] - a[1], b[0] - a[0]) / RAD;
  const w = width;
  return (
    `<g transform="translate(${xy(a)}) rotate(${r1(deg)})">` +
    `<path d="M0 ${-w}C${-w * 1.3} ${-w} ${-w * 1.3} ${w} 0 ${w}L${r1(len)} 0.4V-0.4Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".5" stroke-width=".9"/>` +
    `<rect x="1.5" y="${r1(-w * 0.34)}" width="${r1(w * 3)}" height="${r1(w * 0.68)}" rx="${r1(w * 0.34)}" fill="${CALICO}"/>` +
    `<path d="M${r1(w * 4)} ${r1(-w * 0.45)}H${r1(len * 0.6)}" stroke="${IVORY}" stroke-opacity=".7" stroke-width=".9"/>` +
    `</g>`
  );
}

/** A running stitch along a line. */
const stitch = (d: string, color = GARNET, width = 2.2, dash = '12 9') =>
  `<path d="${d}" stroke="${color}" stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round"/>`;

/** The cross-stitch that opens a kicker. */
const crossStitch = (id: string, frame: Frame) =>
  art(
    id,
    frame,
    `<path d="M4 4L${frame.w - 4} ${frame.h - 4}M${frame.w - 4} 4L4 ${frame.h - 4}" stroke="${GARNET}" stroke-width="2.6" stroke-linecap="round"/>`,
  );

/** A path with pinked edges, as pinking shears cut cloth: a zigzag along each side. */
function pinked(x: number, y: number, w: number, h: number, t = 10, sides = 'trbl') {
  const depth = t * 0.55;
  const nx = Math.max(2, Math.round(w / t / 2) * 2);
  const ny = Math.max(2, Math.round(h / t / 2) * 2);
  const sx = w / nx;
  const sy = h / ny;
  const pts: Pt[] = [];
  const z = (side: string, i: number) => (sides.includes(side) && i % 2 ? depth : 0);
  for (let i = 0; i <= nx; i++) pts.push([x + i * sx, y + z('t', i)]);
  for (let j = 1; j <= ny; j++) pts.push([x + w - z('r', j), y + j * sy]);
  for (let i = nx - 1; i >= 0; i--) pts.push([x + i * sx, y + h - z('b', i)]);
  for (let j = ny - 1; j >= 1; j--) pts.push([x + z('l', j), y + j * sy]);
  return `M${pts.map(xy).join('L')}Z`;
}

/** The weaves of the swatches: a herringbone, a bouclé, a melton twill. */
function herringbone(id: string, base: string, s = 14) {
  const d = s / 2;
  const line = `stroke="${INK}" stroke-opacity=".36" stroke-width="${r1(s * 0.17)}"`;
  return (
    `<pattern id="${id}" width="${s * 2}" height="${s}" patternUnits="userSpaceOnUse">` +
    `<rect width="${s * 2}" height="${s}" fill="${base}"/>` +
    `<path d="M0 ${s}L${s} 0M0 ${d}L${d} 0M${d} ${s}L${s} ${d}" ${line}/>` +
    `<path d="M${s} 0L${s * 2} ${s}M${s} ${d}L${s + d} ${s}M${s + d} 0L${s * 2} ${d}" ${line}/>` +
    `<path d="M${r1(s * 0.25)} ${s}L${r1(s * 0.75)} ${r1(s * 0.5)}M${r1(s * 1.25)} ${r1(s * 0.5)}L${r1(s * 1.75)} ${s}" stroke="${IVORY}" stroke-opacity=".1" stroke-width="1"/>` +
    `</pattern>`
  );
}

function boucle(id: string) {
  return (
    `<pattern id="${id}" width="44" height="40" patternUnits="userSpaceOnUse">` +
    `<rect width="44" height="40" fill="${BLUSH}"/>` +
    (
      [
        [5, 6, 3.6, IVORY],
        [17, 3, 2.4, ROSE],
        [28, 9, 4.2, IVORY],
        [39, 4, 2.8, ROSE],
        [11, 17, 2.6, ROSE],
        [21, 20, 3.8, IVORY],
        [35, 21, 3, IVORY],
        [4, 28, 4, IVORY],
        [15, 33, 2.4, ROSE],
        [27, 31, 3.2, ROSE],
        [40, 35, 3.6, IVORY],
        [33, 39, 1.8, ROSE],
      ] as const
    )
      .map(
        ([x, y, r, c]) =>
          `<circle cx="${x}" cy="${y}" r="${r}" stroke="${c}" stroke-width="${c === IVORY ? 1.8 : 1.4}"/>`,
      )
      .join('') +
    `<circle cx="10" cy="11" r="1.4" fill="${GARNET}" fill-opacity=".6"/>` +
    `<circle cx="33" cy="14" r="1.2" fill="${MUTED}" fill-opacity=".45"/>` +
    `<circle cx="19" cy="27" r="1.3" fill="${GARNET}" fill-opacity=".5"/>` +
    `<circle cx="38" cy="28" r="1.1" fill="${MUTED}" fill-opacity=".4"/>` +
    `</pattern>`
  );
}

function twill(id: string, base: string) {
  return (
    `<pattern id="${id}" width="10" height="10" patternUnits="userSpaceOnUse">` +
    `<rect width="10" height="10" fill="${base}"/>` +
    `<path d="M0 10L10 0M-5 5L5 -5M5 15L15 5" stroke="${INK}" stroke-opacity=".24" stroke-width="2.4"/>` +
    `<path d="M0 7L7 0M3 10L10 3" stroke="${IVORY}" stroke-opacity=".07" stroke-width="1"/>` +
    `</pattern>`
  );
}

/** A swatch of cloth with pinked edges, held by a staple at the top. */
function swatch(id: string, w: number, h: number, weave: 'herringbone' | 'boucle' | 'twill') {
  const fill =
    weave === 'herringbone'
      ? herringbone(`${id}-weave`, GARNET)
      : weave === 'boucle'
        ? boucle(`${id}-weave`)
        : twill(`${id}-weave`, LODEN);
  return (
    `<defs>${fill}</defs>` +
    `<path d="${pinked(0, 0, w, h, 12)}" fill="url(#${id}-weave)"/>` +
    `<path d="${pinked(0, 0, w, h, 12)}" stroke="${INK}" stroke-opacity=".12" stroke-width="1"/>` +
    `<path d="M${r1(w / 2 - 24)} 22H${r1(w / 2 + 24)}" stroke="${STEEL}" stroke-width="4" stroke-linecap="round"/>` +
    `<path d="M${r1(w / 2 - 24)} 22V30M${r1(w / 2 + 24)} 22V30" stroke="${STEEL}" stroke-width="3" stroke-linecap="round"/>`
  );
}

/** The woven size label of the foot, folded under at both ends; the slide's number sits on it. */
function wovenLabel(w: number, h: number) {
  const f = 9;
  let weave = '';
  for (let y = 4; y < h - 2; y += 4) weave += `M${f} ${y}H${w - f}`;
  return (
    `<path d="M${f} 0H${w - f}V${h}H${f}Z" fill="${GARNET}"/>` +
    `<path d="M${f} 0L0 3V${h - 3}L${f} ${h}ZM${w - f} 0L${w} 3V${h - 3}L${w - f} ${h}Z" fill="${GARNET}"/>` +
    `<path d="M${f} 0L0 3V${h - 3}L${f} ${h}ZM${w - f} 0L${w} 3V${h - 3}L${w - f} ${h}Z" fill="${INK}" fill-opacity=".32"/>` +
    `<path d="${weave}" stroke="${IVORY}" stroke-opacity=".07" stroke-width="1"/>` +
    `<rect x="${f + 5}" y="5" width="${w - 2 * f - 10}" height="${h - 10}" stroke="${IVORY}" stroke-opacity=".45" stroke-width="1" stroke-dasharray="3 3"/>`
  );
}

/** A tailor's chalk: a triangle of loden with its edges worn round, and a line it drew. */
function chalk(w: number, h: number) {
  return (
    `<path d="M14 ${h - 18}L${w - 26} ${h - 30}" stroke="${LODEN}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="16 7" stroke-linecap="round"/>` +
    `<g transform="translate(${r1(w * 0.62)} ${r1(h * 0.42)}) rotate(-14)">` +
    `<path d="M-40 18Q-44 22 -38 24H38Q44 22 40 18L4 -26Q0 -30 -4 -26Z" fill="${LODEN}"/>` +
    `<path d="M-30 12L0 -22" stroke="${IVORY}" stroke-opacity=".25" stroke-width="3" stroke-linecap="round"/>` +
    `</g>`
  );
}

/** Open tailor's shears, the blades toward the start of the box (x = 0). */
function shears(w: number, h: number) {
  const cy = h / 2;
  const px = w * 0.52;
  return (
    `<path d="M${r1(px)} ${r1(cy - 4)}L4 ${r1(cy - 20)}L6 ${r1(cy - 13)}L${r1(px)} ${r1(cy + 3)}Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<path d="M${r1(px)} ${r1(cy + 4)}L4 ${r1(cy + 20)}L6 ${r1(cy + 13)}L${r1(px)} ${r1(cy - 3)}Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".6" stroke-width="1.2" stroke-linejoin="round"/>` +
    `<path d="M${r1(px + 2)} ${r1(cy - 3)}C${r1(px + 14)} ${r1(cy - 10)} ${r1(w * 0.7)} ${r1(cy - 22)} ${r1(w * 0.76)} ${r1(cy - 28)}M${r1(px + 2)} ${r1(cy + 3)}C${r1(px + 14)} ${r1(cy + 10)} ${r1(w * 0.7)} ${r1(cy + 22)} ${r1(w * 0.76)} ${r1(cy + 28)}" stroke="${INK}" stroke-width="6" stroke-linecap="round"/>` +
    `<ellipse cx="${r1(w * 0.85)}" cy="${r1(cy - 32)}" rx="${r1(w * 0.12)}" ry="${r1(w * 0.09)}" stroke="${INK}" stroke-width="5.5"/>` +
    `<ellipse cx="${r1(w * 0.85)}" cy="${r1(cy + 32)}" rx="${r1(w * 0.12)}" ry="${r1(w * 0.09)}" stroke="${INK}" stroke-width="5.5"/>` +
    `<circle cx="${r1(px)}" cy="${r1(cy)}" r="3.6" fill="${TAPE}" stroke="${INK}" stroke-width="1.2"/>`
  );
}

/** A spool of thread standing up: two wooden flanges, the thread wound between them. */
function spool(w: number, h: number, thread = GARNET) {
  const fl = 24;
  const inset = w * 0.12;
  let wound = '';
  for (let y = fl + 3; y < h - fl - 2; y += 5) wound += `M${r1(inset)} ${y}L${r1(w - inset)} ${y + 3}`;
  return (
    `<defs><linearGradient id="tefer-spool-shade" x1="0" x2="1" y1="0" y2="0">` +
    `<stop offset="0" stop-color="${INK}" stop-opacity=".32"/><stop offset=".35" stop-color="${INK}" stop-opacity="0"/>` +
    `<stop offset=".7" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".36"/></linearGradient></defs>` +
    `<rect x="${r1(inset)}" y="${fl}" width="${r1(w - inset * 2)}" height="${h - fl * 2}" fill="${thread}"/>` +
    `<path d="${wound}" stroke="${IVORY}" stroke-opacity=".16" stroke-width="1.4"/>` +
    `<rect x="${r1(inset)}" y="${fl}" width="${r1(w - inset * 2)}" height="${h - fl * 2}" fill="url(#tefer-spool-shade)"/>` +
    [0, h - fl]
      .map(
        (y) =>
          `<rect x="0" y="${y}" width="${w}" height="${fl}" rx="${fl / 2}" fill="${WOOD}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>` +
          `<path d="M${fl / 2} ${y + 6}H${w - fl / 2}" stroke="${IVORY}" stroke-opacity=".35" stroke-width="2" stroke-linecap="round"/>`,
      )
      .join('')
  );
}

/** A thimble, its dome dimpled. */
function thimble(w: number, h: number) {
  let dimples = '';
  for (let row = 0; row < 4; row++) {
    for (let col = 0; col < 4; col++) {
      const x = w * 0.3 + col * w * 0.13 + (row % 2) * w * 0.065;
      const y = h * 0.3 + row * h * 0.12;
      if (x < w * 0.78) dimples += `<circle cx="${r1(x)}" cy="${r1(y)}" r="1.6" fill="${INK}" fill-opacity=".35"/>`;
    }
  }
  return (
    `<path d="M${r1(w * 0.14)} ${r1(h * 0.92)}L${r1(w * 0.2)} ${r1(h * 0.28)}Q${r1(w * 0.5)} ${r1(h * 0.02)} ${r1(w * 0.8)} ${r1(h * 0.28)}L${r1(w * 0.86)} ${r1(h * 0.92)}Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4"/>` +
    dimples +
    `<path d="M${r1(w * 0.13)} ${r1(h * 0.84)}H${r1(w * 0.87)}" stroke="${INK}" stroke-opacity=".4" stroke-width="2"/>` +
    `<path d="M${r1(w * 0.3)} ${r1(h * 0.3)}Q${r1(w * 0.26)} ${r1(h * 0.6)} ${r1(w * 0.27)} ${r1(h * 0.8)}" stroke="${IVORY}" stroke-opacity=".6" stroke-width="2" stroke-linecap="round"/>`
  );
}

/** A card of thread: ivory card, the thread wound round its waist. */
function threadCard(w: number, h: number, thread: string) {
  let wound = '';
  for (let y = h * 0.24; y < h * 0.76; y += 3.2) wound += `M2 ${r1(y)}L${w - 2} ${r1(y + 1.5)}`;
  return (
    `<path d="M0 0H${w}V${r1(h * 0.18)}L${r1(w * 0.82)} ${r1(h * 0.22)}V${r1(h * 0.78)}L${w} ${r1(h * 0.82)}V${h}H0V${r1(h * 0.82)}L${r1(w * 0.18)} ${r1(h * 0.78)}V${r1(h * 0.22)}L0 ${r1(h * 0.18)}Z" fill="${IVORY}" stroke="${INK}" stroke-opacity=".25" stroke-width="1.2"/>` +
    `<rect x="${r1(w * 0.14)}" y="${r1(h * 0.24)}" width="${r1(w * 0.72)}" height="${r1(h * 0.52)}" fill="${thread}"/>` +
    `<path d="${wound}" stroke="${IVORY}" stroke-opacity=".14" stroke-width="1"/>`
  );
}

/** A small swing tag on its string, for a line of the closing. */
const tagGlyph =
  `<path d="M8 14L18 4H38V40H8Z" fill="${IVORY}" stroke="${INK}" stroke-width="2.2" stroke-linejoin="round"/>` +
  `<circle cx="17" cy="14" r="3.2" fill="${TAPE}" stroke="${INK}" stroke-width="1.4"/>` +
  `<path d="M17 14C10 8 6 4 2 2" stroke="${GARNET}" stroke-width="2" stroke-linecap="round"/>` +
  `<path d="M14 26H32M14 32H26" stroke="${INK}" stroke-opacity=".35" stroke-width="1.8" stroke-linecap="round"/>`;

/** A coat hanger, for a line of the closing. */
const hangerGlyph =
  `<path d="M22 16V11C22 6 28 5 28 10" stroke="${INK}" stroke-width="2.4" stroke-linecap="round"/>` +
  `<path d="M22 16L4 32H40Z" stroke="${INK}" stroke-width="2.6" stroke-linejoin="round"/>` +
  `<circle cx="22" cy="16" r="2.4" fill="${GARNET}"/>`;

// ---------------------------------------------------------------------------------------------
// The pieces of a scene

/** The front of a coat as a pattern piece, in a box of 530 by 840, its middle at (264, 436). */
const COAT: [string, ...number[]][] = [
  ['M', 250, 40],
  ['L', 470, 95],
  ['C', 445, 170, 440, 260, 500, 330],
  ['C', 482, 410, 470, 470, 470, 520],
  ['C', 478, 610, 505, 700, 520, 800],
  ['Q', 280, 832, 40, 820],
  ['L', 40, 330],
  ['L', 8, 150],
  ['L', 92, 138],
  ['L', 120, 106],
  ['C', 170, 88, 215, 68, 250, 40],
];

/** The outline of the coat's front at one size: scaled about its middle. */
function coatLine(s: number) {
  const [ax, ay] = [270, 470];
  return (
    COAT.map(([cmd, ...v]) => {
      const out: string[] = [];
      for (let i = 0; i < v.length; i += 2) {
        out.push(`${r1(ax + (v[i]! - ax) * s)} ${r1(ay + (v[i + 1]! - ay) * s)}`);
      }
      return `${cmd}${out.join(' ')}`;
    }).join('') + 'Z'
  );
}

/**
 * A graded pattern piece of a coat's front: the cut line of the largest size, the nested lines
 * of the smaller ones, the seam line in garnet, a dart with its drill hole, the lapel's roll
 * line, buttonholes, notches, a welt pocket and the grainline; pinned where it lies.
 */
function coatPiece(w: number, h: number, turn: number) {
  const ink = `stroke="${INK}"`;
  return (
    `<g transform="translate(${r1(w / 2)} ${r1(h / 2)}) rotate(${turn}) translate(-270 -440)">` +
    `<path d="${coatLine(1.035)}" fill="${IVORY}" stroke="${INK}" stroke-opacity=".12" stroke-width="1"/>` +
    `<path d="${coatLine(1)}" ${ink} stroke-width="2.6" stroke-linejoin="round"/>` +
    `<path d="${coatLine(0.972)}" stroke="${GARNET}" stroke-width="1.8" stroke-dasharray="9 7"/>` +
    `<path d="${coatLine(0.944)}" ${ink} stroke-opacity=".38" stroke-width="1.3" stroke-dasharray="14 5 3 5"/>` +
    `<path d="${coatLine(0.918)}" ${ink} stroke-opacity=".32" stroke-width="1.3" stroke-dasharray="3 6"/>` +
    `<path d="${coatLine(0.892)}" ${ink} stroke-opacity=".28" stroke-width="1.3" stroke-dasharray="20 6"/>` +
    // The lapel's roll line, the dart and its drill hole, the welt pocket.
    `<path d="M48 336L150 92" ${ink} stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="6 6"/>` +
    `<path d="M318 590L332 360L346 590" ${ink} stroke-width="1.8" stroke-linejoin="round"/>` +
    `<circle cx="332" cy="374" r="5" ${ink} stroke-width="1.6"/>` +
    `<path d="M210 690L370 680L371 696L211 706Z" ${ink} stroke-width="1.6" fill="${CALICO}"/>` +
    // The grainline, an arrow at each end.
    `<path d="M196 230V600M184 248L196 230L208 248M184 582L196 600L208 582" ${ink} stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>` +
    // Buttonholes on the front edge, and the notches of the side seam, the armhole and the shoulder.
    [430, 520, 610]
      .map((y) => `<path d="M58 ${y}H94M94 ${y - 6}V${y + 6}" ${ink} stroke-width="2" stroke-linecap="round"/>`)
      .join('') +
    `<path d="M470 520H450M447 232L428 236M450 250L431 254M360 68L356 87M296 828L298 808" ${ink} stroke-width="2" stroke-linecap="round"/>` +
    pin(372, 60, 128, 64) +
    pin(486, 610, 200, 60, IVORY) +
    pin(110, 790, -58, 58) +
    `</g>`
  );
}

/**
 * A dress form on its stand: a torso in calico linen with its princess seams and the centre
 * front in garnet, a tape measure round its waist with the end hanging, two pins at the bust.
 */
function dressForm(w: number, h: number) {
  const cx = w / 2;
  const torso =
    'M200 112C165 124 108 132 86 156C68 176 64 196 66 216C60 256 56 296 70 336C88 376 110 401 110 426C108 461 68 506 56 551C52 576 58 596 68 610Q235 634 402 610C412 596 418 576 414 551C402 506 362 461 360 426C360 401 382 376 400 336C414 296 410 256 404 216C406 196 402 176 384 156C362 132 305 124 270 112Z';
  // The tape round the waist: two curves, and its ticks.
  const waist = (t: number, dy: number): Pt => {
    const u = 1 - t;
    return [u * u * 104 + 2 * u * t * 235 + t * t * 366, u * u * 414 + 2 * u * t * 446 + t * t * 414 + dy];
  };
  let ticks = '';
  for (let i = 1; i < 36; i++) {
    const p = waist(i / 36, 0);
    ticks += `M${xy(p)}L${xy([p[0], p[1] + (i % 2 ? 6 : 10)])}`;
  }
  let tail = '';
  for (let y = 452; y < 586; y += 9) tail += `M${r1(358 + (y - 430) * 0.19)} ${y}L${r1(366 + (y - 430) * 0.19)} ${y + 0.6}`;
  return (
    `<defs><linearGradient id="tefer-form-shade" x1="0" x2="1" y1="0" y2="0">` +
    `<stop offset="0" stop-color="${INK}" stop-opacity=".2"/><stop offset=".28" stop-color="${INK}" stop-opacity="0"/>` +
    `<stop offset=".66" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".24"/></linearGradient></defs>` +
    `<ellipse cx="${cx}" cy="${h - 14}" rx="130" ry="11" fill="${INK}" fill-opacity=".1"/>` +
    // The stand: a pole of ink on three legs with their castors.
    `<rect x="${cx - 7}" y="618" width="14" height="${h - 618 - 70}" fill="${INK}"/>` +
    `<path d="M${cx} ${h - 72}L${cx - 92} ${h - 26}M${cx} ${h - 72}L${cx + 92} ${h - 26}M${cx} ${h - 72}V${h - 22}" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
    [cx - 92, cx + 92, cx]
      .map((x, i) => `<circle cx="${x}" cy="${h - (i === 2 ? 16 : 20)}" r="8" fill="${INK}"/>`)
      .join('') +
    // The neck and its cap.
    `<rect x="200" y="62" width="70" height="56" fill="${IVORY}" stroke="${INK}" stroke-opacity=".4" stroke-width="1.4"/>` +
    `<rect x="200" y="62" width="70" height="56" fill="url(#tefer-form-shade)"/>` +
    `<path d="M196 64Q235 30 274 64Z" fill="${INK}"/>` +
    `<circle cx="235" cy="34" r="9" fill="${INK}"/>` +
    // The torso.
    `<path d="${torso}" fill="${IVORY}"/>` +
    `<path d="${torso}" fill="url(#tefer-form-shade)"/>` +
    `<path d="${torso}" stroke="${INK}" stroke-opacity=".55" stroke-width="1.8"/>` +
    `<path d="M160 128C142 220 160 300 176 380C190 450 172 540 160 618M310 128C328 220 310 300 294 380C280 450 298 540 310 618" stroke="${INK}" stroke-opacity=".28" stroke-width="1.4"/>` +
    `<path d="M235 118V622" stroke="${GARNET}" stroke-opacity=".7" stroke-width="1.6" stroke-dasharray="8 6"/>` +
    `<path d="M70 610Q235 634 400 610" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
    // The tape round the waist, its end hanging down the hip.
    `<path d="M352 420L382 424L392 590L362 592Z" fill="${TAPE}" stroke="${INK}" stroke-opacity=".25" stroke-width="1"/>` +
    `<path d="${tail}" stroke="${INK}" stroke-opacity=".7" stroke-width="1.2"/>` +
    `<path d="M361 588L392 586L393 600L362 602Z" fill="${STEEL}" stroke="${INK}" stroke-opacity=".45" stroke-width="1"/>` +
    `<path d="M${xy(waist(0, 0))}Q235 446 366 414L366 444Q235 476 ${xy(waist(0, 30))}Z" fill="${TAPE}" stroke="${INK}" stroke-opacity=".25" stroke-width="1"/>` +
    `<path d="${ticks}" stroke="${INK}" stroke-opacity=".7" stroke-width="1.2"/>` +
    pin(156, 296, 150, 46) +
    pin(318, 292, 30, 46, IVORY) +
    pin(214, 520, 160, 40)
  );
}

/** A woven label sewn into the edge of the slide: its free end folded under and stitched. */
function sewnLabel(w: number, h: number) {
  const body = w - 46;
  let weave = '';
  for (let y = 5; y < h; y += 5) weave += `M0 ${y}H${body}`;
  let border = '';
  for (let x = 6; x < body - 40; x += 12) border += `M${x} 24L${x + 8} 32M${x} ${h - 32}L${x + 8} ${h - 24}`;
  return (
    `<rect x="0" y="0" width="${body}" height="${h}" fill="${GARNET}"/>` +
    `<path d="${weave}" stroke="${IVORY}" stroke-opacity=".06" stroke-width="1.2"/>` +
    `<path d="M0 18H${body - 30}M0 38H${body - 30}M0 ${h - 18}H${body - 30}M0 ${h - 38}H${body - 30}" stroke="${IVORY}" stroke-opacity=".5" stroke-width="1.2"/>` +
    `<path d="${border}" stroke="${IVORY}" stroke-opacity=".35" stroke-width="1.4"/>` +
    // The fold: the end turned under, a shade darker, and the stitches through it.
    `<path d="M${body} 0H${w - 8}L${w} 10V${h - 10}L${w - 8} ${h}H${body}Z" fill="${GARNET}"/>` +
    `<path d="M${body} 0H${w - 8}L${w} 10V${h - 10}L${w - 8} ${h}H${body}Z" fill="${INK}" fill-opacity=".3"/>` +
    `<path d="M${body} 0V${h}" stroke="${INK}" stroke-opacity=".35" stroke-width="2"/>` +
    `<path d="M${body + 22} 14V${h - 14}" stroke="${IVORY}" stroke-width="2.4" stroke-dasharray="10 8" stroke-linecap="round"/>`
  );
}

/**
 * A swing tag, long side across: its start end cut at the corners, an eyelet with a brass
 * grommet in a paper ring, and the perforation of the stub.
 */
function swingTag(w: number, h: number) {
  const c = 74;
  const e = w - 64;
  return (
    `<path d="M0 10Q0 0 10 0H${w - c}L${w} ${c}V${h - c}L${w - c} ${h}H10Q0 ${h} 0 ${h - 10}Z" fill="${IVORY}" stroke="${INK}" stroke-opacity=".1" stroke-width="1.5"/>` +
    `<path d="M20 28Q20 20 28 20H${w - c - 8}L${w - 20} ${c + 8}V${h - c - 8}L${w - c - 8} ${h - 20}H28Q20 ${h - 20} 20 ${h - 28}Z" stroke="${INK}" stroke-opacity=".12" stroke-width="1.2"/>` +
    `<path d="M${w - 132} 34V${h - 34}" stroke="${INK}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 8" stroke-linecap="round"/>` +
    `<circle cx="${e}" cy="${h / 2}" r="30" fill="${CALICO}" stroke="${INK}" stroke-opacity=".12" stroke-width="1.2"/>` +
    `<circle cx="${e}" cy="${h / 2}" r="17" fill="${TAPE}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.4"/>` +
    `<circle cx="${e}" cy="${h / 2}" r="9" fill="${CALICO}" stroke="${INK}" stroke-opacity=".4" stroke-width="1.2"/>`
  );
}

/** The selvedge of a cloth: its woven edge, the line of its mill, and the tenter holes. */
function selvedge(w: number, h: number) {
  let holes = '';
  for (let x = 12; x < w; x += 24) holes += `<circle cx="${x}" cy="${h - 9}" r="2.4" fill="${INK}" fill-opacity=".35"/>`;
  return (
    `<rect x="0" y="0" width="${w}" height="${h}" fill="${IVORY}"/>` +
    `<path d="M0 .75H${w}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.5"/>` +
    `<rect x="0" y="7" width="${w}" height="4" fill="${GARNET}"/>` +
    `<rect x="0" y="14" width="${w}" height="1.6" fill="${LODEN}"/>` +
    holes
  );
}

/** A placket of garnet wool, topstitched, with the five buttons of the steps sewn on it. */
function placket(w: number, h: number, centres: number[]) {
  return (
    `<defs>${twill('tefer-placket-weave', GARNET)}</defs>` +
    `<rect x="0" y="0" width="${w}" height="${h}" rx="4" fill="url(#tefer-placket-weave)"/>` +
    stitch(`M18 14H${w - 18}M18 ${h - 14}H${w - 18}`, IVORY, 1.8, '9 7') +
    centres
      .map((x, i) =>
        i === centres.length - 1
          ? button(x, h / 2, 40, TAPE, INK, GARNET)
          : button(x, h / 2, 40, IVORY, GARNET, GARNET),
      )
      .join('')
  );
}

/** A sheet of cloth cut with pinking shears along its top and its bottom. */
function cutCloth(w: number, h: number) {
  return (
    `<path d="${pinked(0, 0, w, h, 14, 'tb')}" fill="${IVORY}" stroke="${INK}" stroke-opacity=".1" stroke-width="1.2"/>` +
    `<path d="M14 22H${w - 14}M14 ${h - 22}H${w - 14}" stroke="${GARNET}" stroke-opacity=".5" stroke-width="1.4" stroke-dasharray="9 7"/>`
  );
}

/**
 * The pieces of a coat laid on a length of cloth: the usual way, each on its own with the cloth
 * between them hatched as waste; or interlocked, the cloth showing only along the cuts.
 */
function layPlan(w: number, h: number, nested: boolean) {
  const x0 = 20;
  const y0 = 24;
  const cw = w - 40;
  const ch = h - 48;
  const id = nested ? 'tefer-lay-ours' : 'tefer-lay-usual';
  const defs = nested
    ? herringbone(`${id}-weave`, GARNET, 10)
    : `<pattern id="${id}-weave" width="10" height="10" patternUnits="userSpaceOnUse"><rect width="10" height="10" fill="${CALICO}"/><path d="M0 10L10 0M-5 5L5 -5M5 15L15 5" stroke="${MUTED}" stroke-opacity=".45" stroke-width="1.3"/></pattern>`;
  // The cuts of the nested plan, slanting by turns: trapezoids that fill the length.
  const tops = [0, 0.19, 0.4, 0.58, 0.8, 1];
  const bottoms = [0, 0.24, 0.36, 0.63, 0.76, 1];
  const pieces: Pt[][] = [];
  for (let i = 0; i < 5; i++) {
    const g = nested ? 3 : 0;
    pieces.push([
      [x0 + tops[i]! * cw + g, y0 + g],
      [x0 + tops[i + 1]! * cw - g, y0 + g],
      [x0 + bottoms[i + 1]! * cw - g, y0 + ch - g],
      [x0 + bottoms[i]! * cw + g, y0 + ch - g],
    ]);
  }
  // The usual plan: the same pieces, shrunk where they lie and set apart.
  const shown = nested
    ? pieces
    : pieces.map((piece, i) => {
        const cx = piece.reduce((s, p) => s + p[0], 0) / 4;
        const cy = y0 + ch / 2 + (i % 2 ? 6 : -6);
        return piece.map(([x, y]) => [cx + (x - cx) * 0.7, cy + (y - y0 - ch / 2) * 0.74] as Pt);
      });
  return (
    `<defs>${defs}</defs>` +
    `<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" fill="url(#${id}-weave)"/>` +
    `<rect x="${x0}" y="${y0}" width="${cw}" height="${ch}" stroke="${INK}" stroke-opacity=".18" stroke-width="1.2"/>` +
    shown
      .map((piece) => {
        const cx = piece.reduce((s, p) => s + p[0], 0) / 4;
        const cy = piece.reduce((s, p) => s + p[1], 0) / 4;
        const top = Math.min(...piece.map((p) => p[1]));
        const bottom = Math.max(...piece.map((p) => p[1]));
        // The seam line, inside the cut line; a notch at the middle of the top edge.
        const seam = piece.map(([x, y]) => [cx + (x - cx) * 0.86, cy + (y - cy) * 0.9] as Pt);
        const notch: Pt = [(piece[0]![0] + piece[1]![0]) / 2, (piece[0]![1] + piece[1]![1]) / 2];
        return (
          `<path d="M${piece.map(xy).join('L')}Z" fill="${IVORY}" stroke="${INK}" stroke-width="1.6" stroke-linejoin="round"/>` +
          `<path d="M${seam.map(xy).join('L')}Z" stroke="${nested ? GARNET : MUTED}" stroke-opacity=".7" stroke-width="1.3" stroke-dasharray="6 5"/>` +
          `<path d="M${r1(notch[0] - 5)} ${r1(notch[1])}L${r1(notch[0])} ${r1(notch[1] + 8)}L${r1(notch[0] + 5)} ${r1(notch[1])}" stroke="${INK}" stroke-width="1.4" stroke-linejoin="round"/>` +
          `<path d="M${r1(cx)} ${r1(top + 34)}V${r1(bottom - 30)}M${r1(cx - 6)} ${r1(top + 44)}L${r1(cx)} ${r1(top + 34)}L${r1(cx + 6)} ${r1(top + 44)}M${r1(cx - 6)} ${r1(bottom - 40)}L${r1(cx)} ${r1(bottom - 30)}L${r1(cx + 6)} ${r1(bottom - 40)}" stroke="${INK}" stroke-opacity=".55" stroke-width="1.4" stroke-linecap="round" stroke-linejoin="round"/>`
        );
      })
      .join('') +
    // The selvedges of the length of cloth, along its top and its bottom.
    `<path d="M${x0} ${y0 - 7}H${x0 + cw}M${x0} ${y0 + ch + 7}H${x0 + cw}" stroke="${nested ? GARNET : MUTED}" stroke-opacity=".6" stroke-width="2" stroke-dasharray="2 5" stroke-linecap="round"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const START = 120;
const END = 120;
const WIDTH = 1920 - START - END;

/** The kicker on its cross-stitch, and the title; without a kicker, the title on the stitch. */
function head(name: string, width = 1100, lines = 1, kicker = true) {
  // Room for the leading a script may need beyond the theme's (`LEADING`).
  const title = at(START, 124, width, Math.round(62 * 1.3 * lines) + 4);
  if (!kicker) {
    return {
      placeholders: [
        place('p_title', 'title', at(START + 48, 112, width - 48, title.h), 'title'),
      ],
      decorations: [crossStitch(`d_tefer_${name}_stitch`, at(START, 142, 26, 26))],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 40, 80, Math.min(900, width - 40), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [crossStitch(`d_tefer_${name}_stitch`, at(START, 87, 22, 22))],
  };
}

/** The mark of the deck: a garnet button sewn on with ivory thread, which a logo may replace. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  return drawing(id, frame, svg(s, s, button(s / 2, s / 2, s / 2 - 1.5, GARNET, IVORY)), PAINT, {
    role: 'logo',
    name: 'logo',
  });
}

/**
 * The foot of a content slide: the button and the deck's name at the start; a running stitch
 * from them to the woven size label at the end, which holds the slide's number.
 */
function foot(name: string, withFooter = true) {
  const from = withFooter ? START + 64 + 760 + 28 : START + 72;
  const to = 1920 - END - 100 - 24;
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 64, 964, 760, 34), 'caption')]
      : [],
    decorations: [
      mark(`d_tefer_${name}_mark`, at(START, 958, 44, 44)),
      art(`d_tefer_${name}_seam`, at(from, 978, to - from, 6), stitch(`M2 3H${to - from - 2}`)),
      art(`d_tefer_${name}_label`, atEnd(END, 952, 100, 54), wovenLabel(100, 54)),
      pageNumber(`d_tefer_${name}_number`, atEnd(END, 961, 100, 36), 'caption', {
        color: token('surface'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A sheet of ivory on the table: a card. */
const card = (id: string, frame: Frame, radius = 4) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.1), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 14, blur: 34, color: { value: '#3b1d24', alpha: 0.1 } } },
  });

/** A numbered ring of a list: garnet, stitched inside, its figure upright. */
function numberRing(id: string, frame: Frame, n: number) {
  const s = frame.w;
  const c = s / 2;
  return upright(
    id,
    frame,
    `<circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="${IVORY}" stroke="${GARNET}" stroke-width="2"/>` +
      `<circle cx="${c}" cy="${c}" r="${c - 7}" stroke="${GARNET}" stroke-opacity=".5" stroke-width="1.2" stroke-dasharray="3 4"/>` +
      `<text x="${c}" y="${r1(c + s * 0.16)}" text-anchor="middle" font-family="${SERIF}" font-size="${r1(s * 0.46)}" fill="${GARNET}">${n}</text>`,
  );
}

// ---------------------------------------------------------------------------------------------
// The layouts

const cards3 = [START, START + 580, START + 1160];
const stops4 = [START, START + 430, START + 860, START + 1290];
const steps5 = [START, START + 345, START + 690, START + 1035, START + 1380];
const team4 = [START, START + 430, START + 860, START + 1290];

function layouts(): Layout[] {
  // The opening's tape measure, from its brass tip near the top of the end side down across
  // the pattern piece and off the foot of the slide.
  const heroTapeBox = atEnd(0, 0, 900, 1080);
  const heroTape = bezier([64, 96], [
    [
      [250, 40],
      [430, 200],
      [470, 400],
    ],
    [
      [510, 600],
      [690, 640],
      [780, 790],
    ],
    [
      [860, 920],
      [820, 1020],
      [720, 1110],
    ],
  ]);
  // The timeline's tape: across the slide from the start edge, as the slide reads.
  const lineBox = atEnd(0, 312, 1920, 150);
  const wave = (x: number) => 74 + 14 * Math.sin((x / 1920) * Math.PI * 2.2 + 0.6);
  const lineTape: Pt[] = [];
  for (let x = 1934; x >= -14; x -= 12) lineTape.push([x, wave(x)]);
  // The buttons of the process, in the placket's box.
  const buttons = steps5.map((s) => WIDTH - (s - START) - 150);

  return [
    {
      id: 'l_tefer_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 40, 286, 800, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 330, 900, 290), 'display'),
        place('p_subtitle', 'subtitle', at(START, 636, 820, 112), 'heading'),
        place('p_meta', 'caption', at(START + 40, 816, 800, 36), 'caption'),
      ],
      decorations: [
        mark('d_tefer_hero_mark', at(START, 112, 52, 52)),
        lifted(
          art('d_tefer_hero_swatch', atEnd(60, 600, 420, 340), (() => {
            const body = swatch('d_tefer_hero_swatch', 330, 250, 'herringbone');
            return `<g transform="translate(210 170) rotate(-11) translate(-165 -125)">${body}</g>`;
          })()),
          8,
          18,
          0.18,
        ),
        lifted(art('d_tefer_hero_pattern', atEnd(150, 70, 700, 930), coatPiece(700, 930, 6)), 16, 34, 0.14),
        art('d_tefer_hero_chalk', atEnd(520, 900, 170, 100), chalk(170, 100)),
        lifted(
          upright(
            'd_tefer_hero_tape',
            heroTapeBox,
            tape(heroTape, { tip: true }),
            tape(mirrored(heroTape, heroTapeBox.w), { tip: true }),
          ),
          6,
          12,
          0.18,
        ),
        crossStitch('d_tefer_hero_stitch', at(START, 293, 22, 22)),
        art(
          'd_tefer_hero_seam',
          at(START, 762, 840, 26),
          stitch('M836 13H96') + needle([84, 13], [4, 13], 3),
        ),
        art('d_tefer_hero_button', at(START, 819, 30, 30), button(15, 15, 13.5, IVORY, GARNET)),
      ],
    },
    {
      id: 'l_tefer_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(110, 420, 560, 200), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('surface'),
        }),
        place('p_kicker', 'caption', at(START + 40, 356, 760, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 400, 840, 290), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 698, 760, 112), 'heading'),
      ],
      decorations: [
        lifted(art('d_tefer_section_label', atEnd(0, 330, 860, 380), sewnLabel(860, 380)), 14, 30, 0.2),
        art(
          'd_tefer_section_seam',
          atEnd(0, 0, 48, 1080),
          `<path d="M12 0V1080" stroke="${INK}" stroke-opacity=".2" stroke-width="1.5"/>` +
            stitch('M32 6V1074'),
        ),
        art(
          'd_tefer_section_needle',
          atEnd(640, 700, 300, 250),
          `<path d="M196 4C214 70 150 92 120 128C96 158 120 196 160 196" stroke="${INK}" stroke-width="1.8" stroke-linecap="round"/>` +
            needle([164, 196], [292, 120], 3.4),
        ),
        crossStitch('d_tefer_section_stitch', at(START, 363, 22, 22)),
      ],
    },
    {
      id: 'l_tefer_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1100).placeholders,
        place('p_number', 'number', at(START, 284, 680, 134), 'display', {
          color: token('primary'),
        }),
        place('p_label', 'subtitle', at(START, 428, 680, 96), 'heading'),
        place('p_note', 'body', at(START, 530, 680, 84), 'body'),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_number${i + 2}`, 'number', at(START + i * 380, 694, 340, 72), 'title'),
          place(`p_label${i + 2}`, 'caption', at(START + i * 380, 772, 340, 72), 'caption'),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1100).decorations,
        art('d_tefer_big_number_hem', at(START, 660, 1100, 6), stitch('M2 3H1098')),
        ...[0, 1].map((i) =>
          art(
            `d_tefer_big_number_rule${i + 2}`,
            at(START + 352 + i * 380, 700, 6, 140),
            stitch('M3 2V138', MUTED, 1.6, '6 6'),
          ),
        ),
        art('d_tefer_big_number_form', atEnd(250, 150, 470, 776), dressForm(470, 776)),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_tefer_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(450, 300, 860, 330), 'title'),
        place('p_attribution', 'attribution', at(450, 672, 860, 50), 'heading'),
        place('p_caption', 'caption', at(450, 726, 860, 70), 'caption', { vAlign: 'top' }),
        ...foot('quote').placeholders,
      ],
      decorations: [
        lifted(art('d_tefer_quote_tag', at(230, 160, 1460, 690), swingTag(1460, 690)), 18, 40, 0.14),
        art(
          'd_tefer_quote_string',
          at(130, 0, 260, 520),
          `<path d="M96 505C110 420 40 360 50 250C58 160 110 80 90 -4" stroke="${GARNET}" stroke-width="3" stroke-linecap="round"/>` +
            `<path d="M96 505C78 430 140 380 136 260C132 180 104 90 112 -4" stroke="${GARNET}" stroke-width="3" stroke-linecap="round"/>`,
        ),
        lifted(
          art('d_tefer_quote_swatch', atEnd(300, 226, 280, 340), (() => {
            const body = swatch('d_tefer_quote_swatch', 230, 290, 'herringbone');
            return `<g transform="translate(140 170) rotate(5) translate(-115 -145)">${body}</g>`;
          })()),
          6,
          14,
          0.2,
        ),
        upright(
          'd_tefer_quote_marks',
          at(450, 214, 92, 72),
          `<path d="M8 72V44C8 18 22 4 44 0L48 10C34 16 28 26 28 40H44V72Z M56 72V44C56 18 70 4 92 0L96 10C82 16 76 26 76 40H92V72Z" fill="${GARNET}"/>`,
        ),
        art('d_tefer_quote_rule', at(450, 648, 140, 6), stitch('M2 3H138')),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_tefer_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a sheet of pattern paper from margin to margin, down to over the foot,
      // from its top; two pins hold its corner, beside the title.
      placeholders: [
        ...head('text', WIDTH - 220, 1, false).placeholders,
        place('p_body', 'body', at(START + 56, 232 + 54, WIDTH - 112, 600), 'body'),
      ],
      decorations: [
        ...head('text', WIDTH - 220, 1, false).decorations,
        lifted(
          art(
            'd_tefer_text_sheet',
            at(START, 232, WIDTH, 694),
            (() => {
              const w = WIDTH;
              const h = 694;
              const v = (x: number) => `L${x - 9} 0L${x} 14L${x + 9} 0`;
              const vb = (x: number) => `L${x + 9} ${h}L${x} ${h - 14}L${x - 9} ${h}`;
              return (
                `<path d="M0 0${v(420)}${v(1260)}L${w} 0V${h}${vb(860)}${vb(840)}L0 ${h}Z" fill="${IVORY}" stroke="${INK}" stroke-opacity=".1" stroke-width="1.2"/>` +
                `<rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="2" stroke="${GARNET}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="10 8"/>` +
                `<path d="M0 ${h / 2 - 10}H14M${w} ${h / 2 - 10}H${w - 14}M0 ${h / 2 + 10}H14M${w} ${h / 2 + 10}H${w - 14}" stroke="${INK}" stroke-opacity=".45" stroke-width="2"/>`
              );
            })(),
          ),
          14,
          34,
          0.1,
        ),
        art(
          'd_tefer_text_pins',
          atEnd(END - 56, 166, 180, 112),
          pin(40, 22, 32, 96) + pin(150, 30, 148, 92, IVORY),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_tefer_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 960).placeholders,
        place('p_image', 'image', atEnd(END + 32, 236, 560, 620)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 88, 300 + i * 186, 880, 48), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 88, 354 + i * 186, 880, 120), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 960).decorations,
        lifted(
          art(
            'd_tefer_text_image_card',
            atEnd(END, 168, 624, 756),
            `<path d="M0 6Q0 0 6 0H618Q624 0 624 6V750Q624 756 618 756H6Q0 756 0 750Z" fill="${IVORY}"/>` +
              `<circle cx="312" cy="34" r="17" fill="${CALICO}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.2"/>` +
              `<circle cx="312" cy="34" r="25" stroke="${INK}" stroke-opacity=".1" stroke-width="5"/>` +
              `<path d="M40 722H584M52 714L40 722L52 730M572 714L584 722L572 730" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
              `<path d="M300 700L312 712L324 700" stroke="${GARNET}" stroke-width="2" stroke-linejoin="round"/>`,
          ),
          16,
          36,
          0.14,
        ),
        art(
          'd_tefer_text_image_hook',
          atEnd(END + 262, 0, 100, 212),
          // A pattern hook, its wire through the card's hole, hung on a brass peg.
          `<circle cx="70" cy="40" r="11" fill="${INK}" fill-opacity=".14"/>` +
          `<circle cx="68" cy="36" r="10" fill="${TAPE}" stroke="${INK}" stroke-opacity=".45" stroke-width="1.4"/>` +
            `<circle cx="65" cy="33" r="3" fill="${IVORY}" fill-opacity=".6"/>` +
            `<path d="M50 206V58C50 34 64 24 78 30C90 36 90 52 82 58" stroke="${STEEL}" stroke-width="5" stroke-linecap="round"/>` +
            `<path d="M47 200V60C47 44 56 34 66 32" stroke="${IVORY}" stroke-opacity=".6" stroke-width="1.4" stroke-linecap="round"/>`,
        ),
        art(
          'd_tefer_text_image_thread',
          at(START + 27, 362, 4, 306),
          `<path d="M2 2V304" stroke="${GARNET}" stroke-width="2" stroke-dasharray="8 7" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          numberRing(`d_tefer_text_image_ring${i + 1}`, at(START, 296 + i * 186, 58, 58), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_tefer_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', atEnd(0, 348, 1920, 732)),
        place('p_place', 'caption', at(START + 40, 100, 800, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 144, 900, 164), 'title'),
        place('p_body', 'body', atEnd(END, 146, 640, 150), 'body'),
      ],
      decorations: [
        crossStitch('d_tefer_full_image_stitch', at(START, 107, 22, 22)),
        art(
          'd_tefer_full_image_rule',
          atEnd(END + 700, 140, 6, 156),
          stitch('M3 2V154', MUTED, 1.6, '6 6'),
        ),
        art('d_tefer_full_image_selvedge', atEnd(0, 320, 1920, 28), selvedge(1920, 28)),
      ],
    },
    {
      id: 'l_tefer_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          // The label sits on the card's title, whatever their lengths: a header over the text.
          place(`p_label${i + 1}`, 'caption', at(s + 40, 494, 440, 70), 'caption', {
            color: token('primary'),
            vAlign: 'bottom',
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 40, 568, 440, 50), 'heading'),
          place(`p_card${i + 1}_body`, 'body', at(s + 40, 626, 440, 150), 'body'),
        ]),
        place('p_note', 'body', at(START + 40, 834, 1400, 42), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => [
          lifted(
            art(
              `d_tefer_cards_card${i + 1}`,
              at(s, 256, 520, 524),
              `<rect x="0" y="0" width="520" height="524" rx="4" fill="${IVORY}"/>` +
                `<rect x="12" y="12" width="496" height="500" rx="2" stroke="${INK}" stroke-opacity=".08" stroke-width="1.2"/>`,
            ),
            12,
            30,
            0.12,
          ),
          lifted(
            art(
              `d_tefer_cards_swatch${i + 1}`,
              at(s + 40, 290, 440, 196),
              swatch(`d_tefer_cards_swatch${i + 1}`, 440, 196, (['herringbone', 'boucle', 'twill'] as const)[i]!),
            ),
            4,
            8,
            0.18,
          ),
        ]),
        crossStitch('d_tefer_cards_note_stitch', at(START, 844, 22, 22)),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_tefer_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 494, 380, 72), 'title', {
            color: token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 548, 380, 96), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 652, 380, 160), 'body'),
        ]),
        place('p_note', 'caption', at(START + 40, 856, 1400, 70), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        lifted(
          upright(
            'd_tefer_timeline_tape',
            lineBox,
            tape(lineTape, { unit: 26 }),
            tape(mirrored(lineTape, lineBox.w), { unit: 26 }),
          ),
          6,
          12,
          0.16,
        ),
        ...stops4.map((s, i) =>
          art(
            `d_tefer_timeline_pin${i + 1}`,
            at(s, 278, 90, 214),
            pin(64, 26, 104, 92, i === 3 ? IVORY : GARNET) +
              stitch('M64 150V212', MUTED, 1.6, '5 6'),
          ),
        ),
        crossStitch('d_tefer_timeline_note_stitch', at(START, 863, 22, 22)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_tefer_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => [
          // The step's figure over its button: hours, a share, a day.
          place(`p_station${i + 1}`, 'number', at(s, 296, 300, 82), 'title', {
            align: 'center',
            vAlign: 'bottom',
            color: i === 4 ? token('secondary') : token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 532, 300, 50), 'heading', { align: 'center' }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 588, 300, 100), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 116, 748, WIDTH - 170, 108), 'body', {
          vAlign: 'middle',
        }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        lifted(art('d_tefer_process_placket', at(START, 392, WIDTH, 118), placket(WIDTH, 118, buttons)), 10, 24, 0.16),
        card('d_tefer_process_note', at(START, 740, WIDTH, 124)),
        art('d_tefer_process_thimble', at(START + 40, 771, 54, 62), thimble(54, 62)),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_tefer_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(START, 266, 780, 580)],
            ['after', atEnd(END, 266, 780, 580)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 40, y: f.y + 350, w: 700, h: 36 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 40, y: f.y + 388, w: 700, h: 50 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 40, y: f.y + 446, w: 700, h: 120 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        card('d_tefer_comparison_before', at(START, 266, 780, 580)),
        card('d_tefer_comparison_after', atEnd(END, 266, 780, 580)),
        art('d_tefer_comparison_usual', at(START + 30, 290, 720, 300), layPlan(720, 300, false)),
        art('d_tefer_comparison_ours', atEnd(END + 30, 290, 720, 300), layPlan(720, 300, true)),
        art('d_tefer_comparison_shears', at(START + 790, 390, 100, 100), shears(100, 100)),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_tefer_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(START + 40, 292, 1000, 500)),
        place('p_source', 'caption', at(START + 40, 806, 1000, 70), 'caption'),
        place('p_figure1', 'number', atEnd(END, 282, 440, 134), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 420, 440, 124), 'body'),
        place('p_figure2', 'number', atEnd(END, 588, 440, 134), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 726, 440, 124), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1080).decorations,
        card('d_tefer_chart_panel', at(START, 256, 1080, 640)),
        art('d_tefer_chart_pins', at(START, 226, 1080, 64), pin(1046, 22, 118, 46) + pin(34, 22, 62, 46, IVORY)),
        art('d_tefer_chart_card1', atEnd(END + 470, 292, 44, 112), threadCard(44, 112, GARNET)),
        art('d_tefer_chart_card2', atEnd(END + 470, 604, 44, 112), threadCard(44, 112, LODEN)),
        art('d_tefer_chart_rule', atEnd(END, 566, 514, 6), stitch('M2 3H512', MUTED, 1.6, '6 6')),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_tefer_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 40, 286, WIDTH - 80, 552)),
        place('p_note', 'caption', at(START + 64, 890, WIDTH - 64, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1200).decorations,
        lifted(art('d_tefer_table_cloth', at(START, 254, WIDTH, 616), cutCloth(WIDTH, 616)), 12, 30, 0.12),
        art('d_tefer_table_shears', at(START, 886, 52, 44), shears(52, 44)),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_tefer_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s + 40, 352, 300, 300)),
          place(`p_team${i + 1}`, 'caption', at(s + 15, 704, 385, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s + 15, 744, 385, 50), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s + 15, 798, 385, 120), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        art(
          'd_tefer_team_rail',
          at(START - 50, 250, WIDTH + 100, 36),
          `<path d="M18 18H${WIDTH + 100 - 18}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>` +
            `<path d="M24 15H${WIDTH + 100 - 24}" stroke="${IVORY}" stroke-opacity=".28" stroke-width="2" stroke-linecap="round"/>` +
            [18, WIDTH + 100 - 18]
              .map((x) => `<circle cx="${x}" cy="18" r="15" fill="${INK}"/><circle cx="${x}" cy="18" r="5" fill="${STEEL}"/>`)
              .join(''),
        ),
        ...team4.flatMap((s, i) => [
          lifted(
            art(
              `d_tefer_team_card${i + 1}`,
              at(s + 15, 330, 350, 356),
              `<rect x="0" y="0" width="350" height="356" rx="3" fill="${IVORY}"/>`,
            ),
            12,
            26,
            0.16,
          ),
          art(
            `d_tefer_team_hanger${i + 1}`,
            at(s + 15, 240, 350, 112),
            `<path d="M175 76V40C175 14 211 8 213 30C214 40 209 46 203 48" stroke="${STEEL}" stroke-width="4.5" stroke-linecap="round"/>` +
              `<rect x="169" y="66" width="12" height="12" rx="2" fill="${STEEL}"/>` +
              `<rect x="27" y="70" width="296" height="14" rx="7" fill="${[INK, WOOD, INK, WOOD][i]}"/>` +
              [53, 297]
                .map(
                  (x) =>
                    `<rect x="${x - 13}" y="78" width="26" height="30" rx="3" fill="${STEEL}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.2"/>` +
                    `<circle cx="${x}" cy="88" r="4" fill="${INK}"/>`,
                )
                .join(''),
          ),
        ]),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_tefer_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(360, 312, 1200, 36), 'caption', {
          align: 'center',
          color: token('primary'),
        }),
        place('p_title', 'title', at(260, 354, 1400, 290), 'display', { align: 'center' }),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 20 + i * 560, 726, 520, 84), 'body', {
            align: 'center',
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(360, 914, 1200, 36), 'caption', { align: 'center' }),
      ],
      decorations: [
        lifted(art('d_tefer_closing_spool', at(84, 56, 180, 236), spool(180, 236)), 12, 24, 0.2),
        art(
          'd_tefer_closing_thread',
          at(250, 80, 1350, 170),
          `<path d="M1352 94C1250 30 1150 140 1010 110C860 78 790 20 640 60C500 98 420 150 290 118C200 96 130 70 55 96" stroke="${GARNET}" stroke-width="2.4" stroke-linecap="round"/>`,
        ),
        lifted(
          art(
            'd_tefer_closing_swatch',
            atEnd(70, 56, 320, 250),
            `<g transform="translate(150 130) rotate(-8) translate(-120 -100)">${swatch('d_tefer_closing_swatch', 240, 200, 'herringbone')}</g>` +
              // A seam begun on the swatch, and the needle that sews it, its eye threaded.
              `<path d="M118 202L148 195M168 191L198 184M218 180L248 173" stroke="${IVORY}" stroke-width="3" stroke-linecap="round"/>` +
              needle([305, 120], [96, 166], 3.8),
          ),
          8,
          18,
          0.18,
        ),
        ...[0, 1, 2].map((i) =>
          art(
            `d_tefer_closing_key${i + 1}`,
            at(START + 20 + i * 560 + 232, 650, 56, 56),
            `<g transform="scale(${r1(56 / 44 * 100) / 100})">${[tagGlyph, button(22, 22, 19, IVORY, GARNET), hangerGlyph][i]!}</g>`,
          ),
        ),
        mark('d_tefer_closing_mark', at(936, 836, 48, 48)),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the figures of the tapes and rings, the quote's marks) moved across as they are.
 */
function flipped(drawn: readonly Layout[]): Layout[] {
  return drawn.map((layout) => {
    const mirroredLayout = mirrorLayout(layout);
    return {
      ...mirroredLayout,
      decorations: mirroredLayout.decorations.map((decoration) => {
        if (!UPRIGHT.has(decoration.id) || decoration.type !== 'svg') return decoration;
        const { flipH: _flipH, ...rest } = decoration;
        const ltr = UPRIGHT.get(decoration.id);
        return ltr ? { ...rest, markup: ltr } : rest;
      }),
    };
  });
}

// ---------------------------------------------------------------------------------------------
// The sample: Ourela presents its Autumn–Winter 2027 coats to buyers in Paris

const TABLE_COLS = [420, 360, 260, 300, 260];
const TABLE_ROW = 92;
const USUAL = [16, 15, 15, 15];
const OURS = [12, 8, 5, 3];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari meet across lines set as tight as Latin display type,
 * and so do the stacked tone marks of Vietnamese.
 * The display titles of the opening, a part and the closing, and every other title.
 */
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number }>
> = {
  hi: { display: 1.18, title: 1.3, subtitle: 1.42 },
  vi: { display: 1.16, title: 1.22, subtitle: 1.32 },
};
const DISPLAYED = new Set(['l_tefer_hero', 'l_tefer_section', 'l_tefer_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: TeferCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: TeferCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_tefer_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_tefer_text',
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
      layout: 'l_tefer_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_tefer_big_number',
      name: copy.cloth.name,
      content: {
        caption: [text(copy.cloth.kicker), ...copy.cloth.others.map(([, label]) => text(label))],
        title: lines(copy.cloth.title),
        number: [text(copy.cloth.hero.value), ...copy.cloth.others.map(([value]) => text(value))],
        subtitle: text(copy.cloth.hero.label),
        body: text(copy.cloth.hero.note),
        footer,
      },
    },
    {
      layout: 'l_tefer_cards',
      name: copy.cloths.name,
      content: {
        caption: [text(copy.cloths.kicker), ...copy.cloths.cards.map(([label]) => text(label))],
        title: lines(copy.cloths.title),
        subtitle: copy.cloths.cards.map(([, title]) => text(title)),
        body: [...copy.cloths.cards.map(([, , body]) => lines(body)), text(copy.cloths.note)],
        footer,
      },
    },
    {
      layout: 'l_tefer_table',
      name: copy.mills.name,
      content: {
        caption: [text(copy.mills.kicker), text(copy.mills.note)],
        title: lines(copy.mills.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.mills.header, ...copy.mills.rows],
      },
    },
    {
      layout: 'l_tefer_text_image',
      name: copy.cutting.name,
      content: {
        caption: text(copy.cutting.kicker),
        title: lines(copy.cutting.title),
        image: { assetId: pictures.cutting.id },
        subtitle: copy.cutting.items.map(([title]) => text(title)),
        body: copy.cutting.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_tefer_comparison',
      name: copy.cut.name,
      content: {
        caption: [text(copy.cut.kicker), text(copy.cut.before[0]), text(copy.cut.after[0])],
        title: lines(copy.cut.title),
        subtitle: [text(copy.cut.before[1]), text(copy.cut.after[1])],
        body: [text(copy.cut.before[2]), text(copy.cut.after[2])],
        footer,
      },
    },
    {
      layout: 'l_tefer_chart',
      name: copy.waste.name,
      content: {
        caption: [text(copy.waste.kicker), text(copy.waste.source)],
        title: lines(copy.waste.title),
        number: copy.waste.figures.map(([value]) => text(value)),
        body: copy.waste.figures.map(([, body]) => lines(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.waste.series[1], values: OURS },
            { name: copy.waste.series[0], values: USUAL },
          ],
        },
      },
    },
    {
      layout: 'l_tefer_full_image',
      name: copy.workroom.name,
      content: {
        image: { assetId: pictures.workroom.id },
        caption: text(copy.workroom.place),
        title: text(...copy.workroom.title),
        body: lines(copy.workroom.body),
      },
    },
    {
      layout: 'l_tefer_process',
      name: copy.making.name,
      content: {
        caption: [text(copy.making.kicker), ...copy.making.steps.map(([, , caption]) => text(caption))],
        title: lines(copy.making.title),
        number: copy.making.steps.map(([hours]) => text(hours)),
        subtitle: copy.making.steps.map(([, step]) => text(step)),
        body: text(copy.making.note),
        footer,
      },
    },
    {
      layout: 'l_tefer_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_tefer_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([team]) => text(team))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => lines(role)),
        footer,
      },
    },
    {
      layout: 'l_tefer_timeline',
      name: copy.season.name,
      content: {
        caption: [text(copy.season.kicker), text(copy.season.note)],
        title: lines(copy.season.title),
        number: copy.season.stops.map(([when]) => text(when)),
        subtitle: copy.season.stops.map(([, title]) => text(title)),
        body: copy.season.stops.map(([, , body]) => lines(body)),
        footer,
      },
    },
    {
      layout: 'l_tefer_closing',
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
export const teferSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => TEFER_COPY[lang]).map((lang) => [
    lang,
    sample(TEFER_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Tefer template: the theme, its layouts for both directions, and its sample deck. */
export function teferTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(teferTheme),
    description:
      'A tailoring atelier: calico under the dots of pattern paper, a graded pattern piece and a tape measure, a woven label, a dress form, swatches with pinked edges, a swing tag, buttons on a placket and portraits on a clothes rail.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.cutting, pictures.workroom, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, teferSamples.he);
  return finished;
}

export const entry = { id: 'tefer', template: teferTemplate, samples: teferSamples };
