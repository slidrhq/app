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
import { DOFEK_COPY, type DofekCopy } from './dofek/copy';
import { picture } from './pictures';

const pictures = {
  responder: picture('dofekResponder'),
  park: picture('dofekPark'),
  team: [1, 2, 3, 4].map((n) => picture(`dofekTeam${n}`)),
};

/**
 * Dofek (Pulse): a hospital and the minutes that keep a heart going. A clinical mint-white
 * ground; on it the instruments and objects of care, each doing a job: the opening is a
 * stethoscope whose chest piece hears the trace that runs under the title, a part's number is on
 * the label of an IV bag, the figures of a year are the channels of a patient monitor, a quote is
 * written on a clipboard, cards are patient wristbands, a plan is an ECG strip whose beats are its
 * milestones, a process the coloured lines of a hospital's floor, a comparison the two halves of a
 * capsule, and the people wear their staff badges. One pulse line runs through the deck and beats
 * into every slide's number. Deep scrub-teal ink, surgical teal, pulse red and iodine amber. For
 * hospitals, clinics, medical teams, health organisations, research and public-health briefings.
 *
 * No drawing holds a word, so one set of layouts reads in every language; the faces are Be Vietnam
 * Pro and Golos Text for Latin, Heebo and Assistant for Hebrew, and their counterparts elsewhere.
 */
export const dofekTheme: Theme = {
  id: 'dofek',
  name: 'Pulse',
  colors: {
    bg: '#eef4f2',
    surface: '#ffffff',
    text: '#0f2a2e',
    muted: '#4b6165',
    primary: '#0b7069',
    secondary: '#c8392e',
    accent: '#e9a23b',
    chart: ['#0b7069', '#c8392e', '#e9a23b', '#3d93b0', '#0f2a2e', '#9fcbc1'],
  },
  // The clear grotesques of public-service signage: Be Vietnam Pro for what is said aloud, Golos
  // Text for what is read, with Heebo and Assistant for Hebrew.
  fonts: {
    heading: { he: 'Heebo', latin: 'Be Vietnam Pro' },
    body: { he: 'Assistant', latin: 'Golos Text' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 94,
      weight: 700,
      lineHeight: 1.06,
      letterSpacing: -2,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 54,
      weight: 700,
      lineHeight: 1.14,
      letterSpacing: -0.8,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 34, weight: 600, lineHeight: 1.25, color: { token: 'text' } },
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
  shadow: { x: 0, y: 16, blur: 40, color: { value: '#0d3b3a', alpha: 0.12 } },
  // The ground: the mint-white of a clinic's walls, lighter where the light falls from above.
  background: {
    fill: {
      kind: 'css',
      value:
        'linear-gradient(180deg, color-mix(in srgb, var(--color-surface) 55%, var(--color-bg)) 0%, var(--color-bg) 62%)',
    },
  },
  backgroundVariants: [
    SURFACE,
    // The mint-white alone, even from top to bottom.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#0f2a2e';
const MUTED = '#4b6165';
const TEAL = '#0b7069';
const RED = '#c8392e';
const AMBER = '#e9a23b';
const MINT = '#eef4f2';
const WHITE = '#ffffff';
/** The oxygen blue of the chart palette, which no token holds. */
const BLUE = '#3d93b0';
/** A monitor's light teal trace, which no token holds. */
const AQUA = '#62c6b8';
/** Steel, in three lights: the metal of the instruments, the same in every theme. */
const STEEL_DARK = '#76878a';
const STEEL = '#b8c5c7';
const STEEL_LIGHT = '#f1f5f5';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [TEAL]: token('primary'),
  [RED]: token('secondary'),
  [AMBER]: token('accent'),
  [MINT]: token('bg'),
  [WHITE]: token('surface'),
};

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings that a left-to-right deck must not see mirrored: those with figures in them, and
 * the quotation marks. Their mirror moves them to the other side and leaves them as they are.
 */
const UPRIGHT = new Set<string>();

const upright = (id: string, frame: Frame, body: string) => {
  UPRIGHT.add(id);
  return art(id, frame, body);
};

/** A soft shadow under a drawing of something that stands on the slide: a strip, a badge. */
const lifted = (element: Element, y = 14, blur = 30, alpha = 0.14): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#0d3b3a', alpha } } },
});

/**
 * What is drawn in time: a trace runs from the start of the slide's reading to its end. The
 * layouts are drawn right to left, so a trace written from the start (x from the right) is turned
 * here; the mirror of a left-to-right deck turns it back, and both read in their own direction.
 */
const fromStart = (w: number, body: string) =>
  `<g transform="matrix(-1 0 0 1 ${r1(w)} 0)">${body}</g>`;

// ---------------------------------------------------------------------------------------------
// The pulse

interface Beat {
  /** Where the R wave peaks along the trace. */
  x: number;
  /** How tall it is. */
  a: number;
  /** How wide the whole beat is, P wave to T wave. */
  w?: number;
}

/** One beat of an electrocardiogram around its peak at `x`: the P wave, the QRS and the T wave. */
function complex(x: number, y: number, a: number, w: number): string {
  const p0 = x - 0.42 * w;
  const p1 = x - 0.24 * w;
  return (
    `L${r1(p0)} ${y}` +
    `C${r1(p0 + 0.04 * w)} ${r1(y - 0.16 * a)} ${r1(p1 - 0.04 * w)} ${r1(y - 0.16 * a)} ${r1(p1)} ${y}` +
    `L${r1(x - 0.07 * w)} ${y}` +
    `L${r1(x - 0.035 * w)} ${r1(y + 0.12 * a)}` +
    `L${r1(x)} ${r1(y - a)}` +
    `L${r1(x + 0.045 * w)} ${r1(y + 0.3 * a)}` +
    `L${r1(x + 0.08 * w)} ${y}` +
    `L${r1(x + 0.2 * w)} ${y}` +
    `C${r1(x + 0.27 * w)} ${r1(y - 0.3 * a)} ${r1(x + 0.41 * w)} ${r1(y - 0.3 * a)} ${r1(x + 0.48 * w)} ${y}`
  );
}

/** A trace from `x0` to `x1` along `y`, beating where it is told, time running with x. */
function ecg(x0: number, x1: number, y: number, beats: readonly Beat[], w = 120): string {
  let d = `M${r1(x0)} ${y}`;
  for (const beat of [...beats].sort((a, b) => a.x - b.x)) d += complex(beat.x, y, beat.a, beat.w ?? w);
  return `${d}L${r1(x1)} ${y}`;
}

/** A stroke of the trace, with the faint glow a monitor gives it. */
const traced = (d: string, colour: string, width: number, glow = 0) =>
  (glow
    ? `<path d="${d}" stroke="${colour}" stroke-opacity="${glow}" stroke-width="${r1(width * 3.2)}" stroke-linecap="round" stroke-linejoin="round"/>`
    : '') +
  `<path d="${d}" stroke="${colour}" stroke-width="${width}" stroke-linecap="round" stroke-linejoin="round"/>`;

/** The paper of an electrocardiogram: a millimetre grid, heavier every five. */
function ecgPaper(w: number, h: number, small = 9, opacity = 1) {
  let fine = '';
  let bold = '';
  for (let x = 0, i = 0; x <= w + 0.5; x += small, i++) {
    (i % 5 === 0 ? (s: string) => (bold += s) : (s: string) => (fine += s))(`M${r1(x)} 0V${h}`);
  }
  for (let y = 0, i = 0; y <= h + 0.5; y += small, i++) {
    (i % 5 === 0 ? (s: string) => (bold += s) : (s: string) => (fine += s))(`M0 ${r1(y)}H${w}`);
  }
  return (
    `<path d="${fine}" stroke="${RED}" stroke-opacity="${r1(0.08 * opacity * 100) / 100}" stroke-width="1"/>` +
    `<path d="${bold}" stroke="${RED}" stroke-opacity="${r1(0.2 * opacity * 100) / 100}" stroke-width="1.3"/>`
  );
}

/** A heart, `s` wide, its middle at `cx`, `cy`. */
function heartPath(cx: number, cy: number, s: number) {
  const k = s / 2;
  const p = (x: number, y: number) => `${r1(cx + x * k)} ${r1(cy + y * k)}`;
  return (
    `M${p(0, -0.42)}` +
    `C${p(-0.12, -0.82)} ${p(-0.58, -0.98)} ${p(-0.86, -0.72)}` +
    `C${p(-1.14, -0.46)} ${p(-1.06, 0.02)} ${p(-0.74, 0.36)}` +
    `C${p(-0.5, 0.62)} ${p(-0.18, 0.84)} ${p(0, 1)}` +
    `C${p(0.18, 0.84)} ${p(0.5, 0.62)} ${p(0.74, 0.36)}` +
    `C${p(1.06, 0.02)} ${p(1.14, -0.46)} ${p(0.86, -0.72)}` +
    `C${p(0.58, -0.98)} ${p(0.12, -0.82)} ${p(0, -0.42)}Z`
  );
}

/** The cross of care, rounded, `s` square. */
function cross(s: number, colour: string) {
  const t = s * 0.3;
  const o = (s - t) / 2;
  return (
    `<rect x="${r1(o)}" y="0" width="${r1(t)}" height="${s}" rx="${r1(t * 0.28)}" fill="${colour}"/>` +
    `<rect x="0" y="${r1(o)}" width="${s}" height="${r1(t)}" rx="${r1(t * 0.28)}" fill="${colour}"/>`
  );
}

/** A steel gradient, named for its drawing. */
const steel = (id: string, x1 = 0, y1 = 0, x2 = 1, y2 = 1) =>
  `<linearGradient id="${id}" x1="${x1}" y1="${y1}" x2="${x2}" y2="${y2}">` +
  `<stop offset="0" stop-color="${STEEL_LIGHT}"/><stop offset=".45" stop-color="${STEEL}"/><stop offset="1" stop-color="${STEEL_DARK}"/></linearGradient>`;

// ---------------------------------------------------------------------------------------------
// The frame of every slide

const START = 128;
const END = 128;
const WIDTH = 1920 - START - END;

/** The red cross before a kicker. */
const kickerCross = (id: string, top: number) => art(id, at(START, top + 6, 24, 24), cross(24, RED));

/** The kicker on its cross, and the title; without a kicker, the title on the cross. */
function head(name: string, width = 1100, lines = 2, kicker = true) {
  // Room for the leading a script may need beyond the theme's (`LEADING`).
  const title = at(START, 128, width, Math.round(54 * 1.3 * lines) + 4);
  if (!kicker) {
    return {
      placeholders: [
        place('p_title', 'title', { ...at(START + 44, 104, width - 44, title.h) }, 'title'),
      ],
      decorations: [kickerCross(`d_dofek_${name}_cross`, 120)],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 40, 84, Math.min(900, width - 40), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', title, 'title'),
    ],
    decorations: [kickerCross(`d_dofek_${name}_cross`, 84)],
  };
}

/** The mark of the deck: a teal disc with a heartbeat, which the user may replace with a logo. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const c = s / 2;
  const q = (x: number, y: number) => `${r1(x * s)} ${r1(y * s)}`;
  return drawing(
    id,
    frame,
    svg(
      s,
      s,
      `<circle cx="${c}" cy="${c}" r="${r1(c - 0.5)}" fill="${TEAL}"/>` +
        `<path d="M${q(0.16, 0.54)}H${q(0.36, 0.54).split(' ')[0]}L${q(0.43, 0.34)}L${q(0.52, 0.74)}L${q(0.6, 0.26)}L${q(0.67, 0.54)}H${r1(0.84 * s)}" stroke="${WHITE}" stroke-width="${r1(s * 0.075)}" stroke-linecap="round" stroke-linejoin="round"/>`,
    ),
    PAINT,
    { role: 'logo', name: 'logo' },
  );
}

/**
 * The foot of a content slide: the mark and the deck's name at the start; at the end a pulse that
 * beats into the slide's number, read off a ring as a monitor reads the rate of a heart.
 */
function foot(name: string, withFooter = true) {
  const pulse = fromStart(
    220,
    traced(ecg(0, 214, 26, [{ x: 156, a: 20, w: 64 }]), RED, 2.2) +
      `<circle cx="4" cy="26" r="3" fill="${RED}"/>`,
  );
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 56, 960, 900, 34), 'caption')]
      : [],
    decorations: [
      mark(`d_dofek_${name}_mark`, at(START, 956, 40, 40)),
      art(`d_dofek_${name}_pulse`, atEnd(END + 86, 954, 220, 40), pulse),
      art(
        `d_dofek_${name}_folio_ring`,
        atEnd(END, 954, 80, 44),
        `<rect x="1" y="1" width="78" height="42" rx="21" stroke="${RED}" stroke-width="2"/>`,
      ),
      pageNumber(`d_dofek_${name}_number`, atEnd(END, 958, 80, 36), 'caption', {
        color: token('text'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A card of the slide: white, with the theme's soft shadow. */
const card = (id: string, frame: Frame, radius = 18) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.08), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 16, blur: 40, color: { value: '#0d3b3a', alpha: 0.1 } } },
  });

/** A numbered beat of a list: a red disc with its figure. */
function numberDisc(id: string, frame: Frame, n: number) {
  const s = frame.w;
  const c = s / 2;
  return upright(
    id,
    frame,
    `<circle cx="${c}" cy="${c}" r="${c - 1}" fill="${RED}"/>` +
      `<text x="${c}" y="${r1(c + s * 0.17)}" text-anchor="middle" font-family="Be Vietnam Pro, Heebo, sans-serif" font-size="${r1(s * 0.46)}" font-weight="700" fill="${WHITE}">${n}</text>`,
  );
}

// ---------------------------------------------------------------------------------------------
// The instruments

/**
 * A stethoscope lying on the slide, `w` by `h`: the headset at the top, the tube in a loose
 * curve, and the chest piece low on the side of the words, where the trace leaves it.
 */
function stethoscope(id: string, w: number, h: number, chest: { x: number; y: number; r: number }) {
  const g = (n: string) => `${id}-${n}`;
  const { x: cx, y: cy, r } = chest;
  // The chest piece turns its stem to the tube, which swings out to the edge and comes back
  // level into it: the trace on one side of the chest piece, the tube on the other.
  const angle = 180;
  const stem = r + 46;
  const sx = cx - stem;
  const junction = { x: 372, y: 318 };
  const tube =
    `M${junction.x} ${junction.y + 14}` +
    `C${junction.x + 8} ${junction.y + 156} 150 ${junction.y + 160} 158 ${junction.y + 302}` +
    `C164 ${cy + 26} ${r1(sx - 130)} ${cy} ${r1(sx)} ${cy}`;
  const earTubes = [
    `M246 54C232 150 300 262 ${junction.x - 4} ${junction.y}`,
    `M478 30C500 140 448 252 ${junction.x + 4} ${junction.y}`,
  ];
  const metal = (d: string, width: number) =>
    `<path d="${d}" stroke="${STEEL_DARK}" stroke-width="${width + 4}" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${STEEL}" stroke-width="${width}" stroke-linecap="round"/>` +
    `<path d="${d}" stroke="${STEEL_LIGHT}" stroke-width="${r1(width * 0.3)}" stroke-linecap="round" transform="translate(-2 -1)"/>`;
  return (
    `<defs>` +
    `<radialGradient id="${g('halo')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${RED}" stop-opacity=".16"/><stop offset=".7" stop-color="${RED}" stop-opacity=".05"/><stop offset="1" stop-color="${RED}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${g('shade')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${INK}" stop-opacity=".28"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>` +
    steel(g('steel')) +
    `<radialGradient id="${g('drum')}" cx="38%" cy="32%" r="80%"><stop offset="0" stop-color="${TEAL}"/><stop offset="1" stop-color="${INK}"/></radialGradient>` +
    `</defs>` +
    // The halo of the beat it hears.
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 2.2)}" fill="url(#${g('halo')})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 1.62)}" stroke="${RED}" stroke-opacity=".18" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 2.05)}" stroke="${RED}" stroke-opacity=".1" stroke-width="2" stroke-dasharray="2 9" stroke-linecap="round"/>` +
    // The headset.
    earTubes.map((d) => metal(d, 10)).join('') +
    `<ellipse cx="246" cy="48" rx="17" ry="12" transform="rotate(-80 246 48)" fill="${INK}"/>` +
    `<ellipse cx="479" cy="24" rx="17" ry="12" transform="rotate(-100 479 24)" fill="${INK}"/>` +
    `<rect x="${junction.x - 13}" y="${junction.y - 12}" width="26" height="34" rx="9" fill="url(#${g('steel')})" stroke="${STEEL_DARK}" stroke-width="2"/>` +
    // The tube, its shadow on the slide under it, and the light along it.
    `<path d="${tube}" stroke="${INK}" stroke-opacity=".12" stroke-width="22" stroke-linecap="round" transform="translate(6 12)"/>` +
    `<path d="${tube}" stroke="${RED}" stroke-width="20" stroke-linecap="round"/>` +
    `<path d="${tube}" stroke="${WHITE}" stroke-opacity=".32" stroke-width="5" stroke-linecap="round" transform="translate(-4 -3)"/>` +
    // The chest piece: its shadow, the steel bell, the drum.
    `<ellipse cx="${cx + 14}" cy="${cy + 26}" rx="${r1(r * 1.08)}" ry="${r1(r * 1.02)}" fill="url(#${g('shade')})"/>` +
    `<g transform="translate(${cx} ${cy}) rotate(${angle + 90})">` +
    `<rect x="-12" y="${-stem}" width="24" height="${stem - r + 8}" rx="6" fill="url(#${g('steel')})" stroke="${STEEL_DARK}" stroke-width="2"/>` +
    `<rect x="-17" y="${r1(-stem + 6)}" width="34" height="12" rx="5" fill="${STEEL_DARK}"/>` +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g('steel')})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r - 1}" stroke="${STEEL_DARK}" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.84)}" fill="url(#${g('drum')})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.84)}" stroke="${STEEL_DARK}" stroke-width="3"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.62)}" stroke="${WHITE}" stroke-opacity=".12" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.4)}" stroke="${WHITE}" stroke-opacity=".08" stroke-width="2"/>` +
    `<path d="M${r1(cx - r * 0.62)} ${r1(cy - r * 0.2)}A${r1(r * 0.66)} ${r1(r * 0.66)} 0 0 1 ${r1(cx - r * 0.12)} ${r1(cy - r * 0.64)}" stroke="${WHITE}" stroke-opacity=".3" stroke-width="7" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="9" fill="url(#${g('steel')})"/>`
  );
}

/** An IV bag, `w` by `h`: the tab it hangs by, the fluid, its scale, and the label of its drug. */
function ivBag(id: string, w: number, h: number) {
  const g = (n: string) => `${id}-${n}`;
  const c = w / 2;
  const body = `M40 92Q40 62 72 62H${w - 72}Q${w - 40} 62 ${w - 40} 92V${h - 104}Q${w - 40} ${h - 62} ${w - 82} ${h - 54}L${c + 40} ${h - 40}H${c - 40}L82 ${h - 54}Q40 ${h - 62} 40 ${h - 104}Z`;
  let ticks = '';
  for (let i = 0, y = 196; y <= h - 120; y += 34, i++) {
    ticks += `M58 ${y}H${i % 2 ? 72 : 86}`;
  }
  return (
    `<defs><clipPath id="${g('in')}"><path d="${body}"/></clipPath>` +
    `<linearGradient id="${g('fluid')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TEAL}" stop-opacity=".1"/><stop offset="1" stop-color="${TEAL}" stop-opacity=".24"/></linearGradient></defs>` +
    // The tab it hangs by, with the hole the hook goes through.
    `<path fill-rule="evenodd" d="M${c - 30} 0H${c + 30}a16 16 0 0 1 16 16V60a16 16 0 0 1 -16 16H${c - 30}a16 16 0 0 1 -16 -16V16a16 16 0 0 1 16 -16ZM${c - 9} 14H${c + 9}a11 11 0 0 1 0 22H${c - 9}a11 11 0 0 1 0 -22Z" fill="${WHITE}" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2"/>` +
    // The bag, the fluid in it, and the light down its side.
    `<path d="${body}" fill="${WHITE}" fill-opacity=".82"/>` +
    `<g clip-path="url(#${g('in')})"><rect x="0" y="176" width="${w}" height="${h}" fill="url(#${g('fluid')})"/>` +
    `<path d="M0 176H${w}" stroke="${TEAL}" stroke-opacity=".45" stroke-width="2"/></g>` +
    `<path d="${body}" stroke="${TEAL}" stroke-opacity=".55" stroke-width="2.4"/>` +
    `<rect x="${w - 70}" y="86" width="12" height="${h - 220}" rx="6" fill="${WHITE}" fill-opacity=".9"/>` +
    `<path d="${ticks}" stroke="${TEAL}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>` +
    // The label the number of the part is printed on.
    `<rect x="100" y="226" width="${w - 196}" height="196" rx="10" fill="${WHITE}" stroke="${INK}" stroke-opacity=".1" stroke-width="1.5"/>` +
    `<path d="M110 226H${w - 106}a10 10 0 0 1 10 10V244H100V236a10 10 0 0 1 10 -10Z" fill="${RED}"/>` +
    `<path d="M124 398H${c}M${c + 20} 398H${w - 120}" stroke="${INK}" stroke-opacity=".14" stroke-width="5" stroke-linecap="round"/>` +
    // The port the line leaves by.
    `<rect x="${c - 13}" y="${h - 44}" width="26" height="44" rx="5" fill="${WHITE}" stroke="${TEAL}" stroke-opacity=".55" stroke-width="2"/>`
  );
}

/** A patient's wristband, `w` by `h`, in its colour: a white insert on the band, the strap's holes. */
function wristband(id: string, w: number, h: number, colour: string) {
  const strap = 300;
  const sh = Math.round(h * 0.5);
  const sy = (h - sh) / 2;
  const holes = [0, 1, 2, 3]
    .map((i) => `<circle cx="${w - strap + 92 + i * 52}" cy="${h / 2}" r="9" fill="${MINT}" stroke="${INK}" stroke-opacity=".18" stroke-width="1.5"/>`)
    .join('');
  return fromStart(
    w,
    `<rect x="${w - strap - 40}" y="${sy}" width="${strap + 40}" height="${sh}" rx="${sh / 2}" fill="${colour}"/>` +
      `<rect x="0" y="0" width="${w - strap + 10}" height="${h}" rx="${h / 2}" fill="${colour}"/>` +
      `<rect x="14" y="14" width="${w - strap - 18}" height="${h - 28}" rx="${(h - 28) / 2}" fill="${WHITE}"/>` +
      `<rect x="${w - strap - 4}" y="${sy - 18}" width="44" height="${sh + 36}" rx="12" fill="${colour}" stroke="${WHITE}" stroke-opacity=".5" stroke-width="2"/>` +
      `<circle cx="${w - strap + 18}" cy="${h / 2}" r="9" fill="${WHITE}" fill-opacity=".8"/>` +
      holes,
  );
}

/** The pictograms of the wristbands, drawn white in a disc of the band's colour. */
const WHITE_LINE = `stroke="${WHITE}" stroke-width="5" stroke-linecap="round" stroke-linejoin="round"`;
const BAND_ICONS = [
  // Compressions: two hands pressing on a heart.
  (c: number) =>
    `<path d="${heartPath(c, c + 12, 46)}" ${WHITE_LINE}/>` +
    `<path d="M${c - 16} ${c - 34}L${c} ${c - 20}L${c + 16} ${c - 34}M${c - 16} ${c - 48}L${c} ${c - 34}L${c + 16} ${c - 48}" ${WHITE_LINE}/>`,
  // The alert: a phone and the waves it sends.
  (c: number) =>
    `<rect x="${c - 18}" y="${c - 28}" width="36" height="58" rx="7" ${WHITE_LINE}/>` +
    `<path d="M${c - 6} ${c + 20}H${c + 6}" ${WHITE_LINE}/>` +
    `<path d="M${c + 28} ${c - 20}a22 22 0 0 1 0 30M${c - 28} ${c - 20}a22 22 0 0 0 0 30" ${WHITE_LINE}/>`,
  // The defibrillator: a heart and its shock.
  (c: number) =>
    `<path d="${heartPath(c, c + 4, 64)}" ${WHITE_LINE}/>` +
    `<path d="M${c + 4} ${c - 18}L${c - 8} ${c + 4}H${c + 6}L${c - 4} ${c + 24}" ${WHITE_LINE} stroke-width="4.5"/>`,
] as const;

/** The waveforms of a monitor's side channels, each `w` by `h`. */
const CHANNELS = [
  // The pulse oximeter's wave.
  (w: number, h: number) => {
    let d = `M0 ${h * 0.7}`;
    for (let x = 0; x < w; x += 36) {
      d += `C${x + 6} ${h * 0.1} ${x + 14} ${h * 0.05} ${x + 18} ${h * 0.4}C${x + 21} ${h * 0.55} ${x + 26} ${h * 0.45} ${x + 28} ${h * 0.55}C${x + 31} ${h * 0.7} ${x + 34} ${h * 0.72} ${x + 36} ${h * 0.7}`;
    }
    return traced(d, AQUA, 3, 0.18);
  },
  // Breathing.
  (w: number, h: number) => {
    let d = `M0 ${h / 2}`;
    for (let x = 0; x < w; x += 4) d += `L${x} ${r1(h / 2 - Math.sin((x / w) * Math.PI * 3) * h * 0.32)}`;
    return traced(d, AMBER, 3, 0.18);
  },
  // A bar of a count rising to its mark.
  (w: number, h: number) =>
    [0.3, 0.45, 0.6, 0.72, 0.86, 1]
      .map((k, i) => {
        const bw = w / 6 - 6;
        const bh = h * k;
        return `<rect x="${r1(i * (w / 6))}" y="${r1(h - bh)}" width="${r1(bw)}" height="${r1(bh)}" rx="2" fill="${BLUE}" fill-opacity="${r1(0.45 + k * 0.55)}"/>`;
      })
      .join(''),
] as const;

/** A line pictogram, in ink and red, for the lines of the closing. */
const INK_LINE = `stroke="${INK}" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"`;
const CLOSING_ICONS = [
  `<path d="${heartPath(19, 20, 30)}" ${INK_LINE}/><path d="M5 21H12L15 15L19 26L22 21H33" stroke="${RED}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  `<rect x="4" y="7" width="30" height="27" rx="4" ${INK_LINE}/><path d="M4 14H34M12 3V10M26 3V10" ${INK_LINE}/><circle cx="25" cy="25" r="3.4" fill="${RED}"/>`,
  `<circle cx="19" cy="19" r="15" ${INK_LINE}/><g transform="translate(11 11)">${cross(16, RED)}</g>`,
] as const;

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the stops, steps and people. */
const stops4 = [START, START + 422, START + 844, START + 1266];
const steps5 = [START, START + 341, START + 682, START + 1023, START + 1364];
const team4 = [START, START + 428, START + 856, START + 1284];
/** The colours of the wristbands and of the badges' bands. */
const BANDS = [TEAL, RED, AMBER] as const;
const BADGES = [TEAL, RED, AMBER, INK] as const;

function layouts(): Layout[] {
  // The opening: the stethoscope on the end side, its chest piece low beside the words.
  const heroArt = atEnd(40, 0, 860, 960);
  const chest = { x: 610, y: 716, r: 112 };
  // Where the trace leaves the chest piece, measured from the start of the slide.
  const traceEnd = 1920 - (heroArt.x + chest.x + chest.r) - START;

  // The monitor of the figures.
  const monitor = at(START, 256, WIDTH, 652);
  const channel = (i: number) => 296 + i * 196;

  // The ECG strip of the timeline: a tall beat at each stop, a small one between.
  const peaks = stops4.map((s) => s + 30);
  const between = peaks.map((p) => p + 211);

  // The wayfinding of the process.
  const lineY = 456;

  return [
    {
      id: 'l_dofek_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 40, 248, 820, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 292, 860, 236), 'display'),
        place('p_subtitle', 'subtitle', at(START, 544, 820, 128), 'heading'),
        place('p_meta', 'caption', at(START, 786, 820, 36), 'caption'),
      ],
      decorations: [
        mark('d_dofek_hero_mark', at(START, 96, 46, 46)),
        kickerCross('d_dofek_hero_cross', 248),
        art(
          'd_dofek_hero_stethoscope',
          heroArt,
          stethoscope('d_dofek_hero_stethoscope', heroArt.w, heroArt.h, chest),
        ),
        art(
          'd_dofek_hero_trace',
          at(START, 636, traceEnd, 120),
          fromStart(
            traceEnd,
            traced(
              ecg(6, traceEnd, chest.y - 636, [
                { x: 560, a: 34, w: 110 },
                { x: traceEnd - 92, a: 104, w: 150 },
              ]),
              RED,
              4,
            ) + `<circle cx="6" cy="${chest.y - 636}" r="7" fill="${RED}"/>`,
          ),
        ),
      ],
    },
    {
      id: 'l_dofek_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(360, 368, 204, 168), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('primary'),
        }),
        place('p_kicker', 'caption', at(START + 40, 372, 780, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 416, 860, 236), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 664, 800, 128), 'heading'),
      ],
      decorations: [
        // The pole's arm and its hook, from the end edge of the slide.
        art(
          'd_dofek_section_pole',
          atEnd(0, 52, 560, 112),
          `<defs>${steel('d_dofek_section_pole-steel', 0, 0, 0, 1)}</defs>` +
            `<path d="M460 28V92a10 10 0 0 1 -20 0V84" stroke="${STEEL_DARK}" stroke-width="5" stroke-linecap="round"/>` +
            `<rect x="-20" y="14" width="${560 - 12}" height="14" rx="7" fill="url(#d_dofek_section_pole-steel)" stroke="${STEEL_DARK}" stroke-width="1.5"/>` +
            `<circle cx="${560 - 22}" cy="21" r="12" fill="url(#d_dofek_section_pole-steel)" stroke="${STEEL_DARK}" stroke-width="1.5"/>`,
        ),
        lifted(art('d_dofek_section_bag', atEnd(270, 120, 380, 600), ivBag('d_dofek_section_bag', 380, 600)), 18, 40, 0.12),
        // The drip chamber under the bag.
        art(
          'd_dofek_section_chamber',
          atEnd(420, 720, 80, 120),
          `<rect x="20" y="0" width="40" height="86" rx="12" fill="${WHITE}" fill-opacity=".85" stroke="${TEAL}" stroke-opacity=".55" stroke-width="2"/>` +
            `<rect x="22" y="56" width="36" height="28" rx="9" fill="${TEAL}" fill-opacity=".22"/>` +
            `<path d="M40 18c-5 8 -7 12 -7 15a7 7 0 0 0 14 0c0 -3 -2 -7 -7 -15z" fill="${TEAL}"/>` +
            `<path d="M40 86V120" stroke="${TEAL}" stroke-width="5"/>`,
        ),
        // The line, down from the chamber and back under the title, with its roller clamp.
        art(
          'd_dofek_section_line',
          atEnd(440, 838, 1920 - 440 - START, 110),
          fromStart(
            1920 - 440 - START,
            (() => {
              const w = 1920 - 440 - START;
              return (
                `<path d="M${w - 20} 0V40Q${w - 20} 76 ${w - 56} 76H34" stroke="${TEAL}" stroke-width="5" stroke-linecap="round"/>` +
                `<rect x="0" y="66" width="40" height="20" rx="6" fill="${WHITE}" stroke="${TEAL}" stroke-width="2.5"/>` +
                `<rect x="${w - 420}" y="60" width="64" height="32" rx="9" fill="${RED}"/>` +
                `<circle cx="${w - 388}" cy="76" r="10" fill="${WHITE}"/>` +
                `<path d="M${w - 394} 70L${w - 382} 82M${w - 382} 70L${w - 394} 82" stroke="${RED}" stroke-width="2" stroke-opacity=".5"/>`
              );
            })(),
          ),
        ),
        kickerCross('d_dofek_section_cross', 372),
      ],
    },
    {
      id: 'l_dofek_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1100, 1).placeholders,
        place('p_number', 'number', at(START + 56, 470, 600, 134), 'display', {
          color: token('accent'),
        }),
        place('p_label', 'subtitle', at(START + 56, 612, 940, 96), 'heading', {
          color: token('surface'),
        }),
        place('p_note', 'body', at(START + 56, 716, 940, 124), 'body', {
          color: token('bg', 0.78),
        }),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_number${i + 2}`, 'number', atEnd(END + 44, channel(i) + 6, 400, 74), 'title', {
            color: token('surface'),
          }),
          place(`p_label${i + 2}`, 'caption', atEnd(END + 44, channel(i) + 82, 400, 70), 'caption', {
            color: token('bg', 0.8),
          }),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1100, 1).decorations,
        rect('d_dofek_big_number_monitor', monitor, solid(token('text')), {
          effects: {
            radius: 32,
            shadow: { x: 0, y: 22, blur: 50, color: { value: '#0d3b3a', alpha: 0.22 } },
          },
        }),
        art(
          'd_dofek_big_number_screen',
          at(START + 16, 272, WIDTH - 32, 620),
          `<rect x="1" y="1" width="${WIDTH - 34}" height="618" rx="20" stroke="${WHITE}" stroke-opacity=".1" stroke-width="2"/>` +
            fromStart(
              WIDTH - 32,
              `<path d="M1058 30V590" stroke="${WHITE}" stroke-opacity=".12" stroke-width="2"/>`,
            ),
        ),
        art(
          'd_dofek_big_number_wave',
          at(START + 56, 290, 1000, 150),
          fromStart(
            1000,
            `<path d="M0 22H1000M0 132H1000" stroke="${WHITE}" stroke-opacity=".07" stroke-width="1.5" stroke-dasharray="3 8"/>` +
              traced(
                ecg(0, 836, 104, [100, 270, 440, 610, 780].map((x) => ({ x, a: 84, w: 140 }))),
                RED,
                3.4,
                0.22,
              ) +
              `<circle cx="836" cy="104" r="6" fill="${WHITE}"/>` +
              traced(ecg(886, 1000, 104, [{ x: 950, a: 84, w: 140 }]), RED, 3.4) +
              `<rect x="842" y="0" width="40" height="150" fill="${INK}"/>`,
          ),
        ),
        art(
          'd_dofek_big_number_heart',
          at(START + 1000, 504, 42, 38),
          `<path d="${heartPath(21, 18, 40)}" fill="${RED}"/>`,
        ),
        ...[0, 1, 2].flatMap((i) => [
          art(
            `d_dofek_big_number_channel${i + 2}`,
            atEnd(END + 474, channel(i) + 12, 110, 60),
            fromStart(110, CHANNELS[i]!(110, 60)),
          ),
          ...(i < 2
            ? [
                rect(
                  `d_dofek_big_number_rule${i + 2}`,
                  atEnd(END + 44, channel(i) + 176, 540, 1.5),
                  solid(token('surface', 0.14)),
                ),
              ]
            : []),
        ]),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_dofek_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(420, 370, 1040, 320), 'title'),
        place('p_attribution', 'attribution', at(420, 712, 700, 50), 'heading'),
        place('p_caption', 'caption', at(420, 766, 1000, 76), 'caption'),
        ...foot('quote').placeholders,
      ],
      decorations: [
        rect('d_dofek_quote_board', at(296, 114, 1328, 814), solid(token('primary')), {
          effects: {
            radius: 36,
            shadow: { x: 0, y: 22, blur: 50, color: { value: '#0d3b3a', alpha: 0.2 } },
          },
        }),
        rect('d_dofek_quote_sheet', at(340, 176, 1240, 712), solid(token('surface')), {
          effects: {
            radius: 8,
            shadow: { x: 0, y: 6, blur: 14, color: { value: '#0d3b3a', alpha: 0.18 } },
          },
        }),
        art(
          'd_dofek_quote_clip',
          at(800, 74, 320, 168),
          `<defs>${steel('d_dofek_quote_clip-steel', 0, 0, 0, 1)}${steel('d_dofek_quote_clip-wire', 0, 0, 1, 0)}</defs>` +
            `<path d="M96 54C96 8 224 8 224 54" stroke="url(#d_dofek_quote_clip-wire)" stroke-width="12" stroke-linecap="round"/>` +
            `<path d="M96 54C96 8 224 8 224 54" stroke="${STEEL_DARK}" stroke-opacity=".5" stroke-width="2" stroke-linecap="round" transform="translate(0 6)"/>` +
            `<path d="M18 70Q18 50 40 50H280Q302 50 302 70V128Q302 150 280 150H40Q18 150 18 128Z" fill="${INK}" fill-opacity=".18" transform="translate(0 10)"/>` +
            `<path d="M18 70Q18 50 40 50H280Q302 50 302 70V128Q302 150 280 150H40Q18 150 18 128Z" fill="url(#d_dofek_quote_clip-steel)" stroke="${STEEL_DARK}" stroke-width="2"/>` +
            `<path d="M40 70H280" stroke="${WHITE}" stroke-opacity=".8" stroke-width="3" stroke-linecap="round"/>` +
            `<circle cx="60" cy="112" r="9" fill="${STEEL_DARK}"/><circle cx="260" cy="112" r="9" fill="${STEEL_DARK}"/>` +
            `<circle cx="58" cy="110" r="4" fill="${STEEL_LIGHT}"/><circle cx="258" cy="110" r="4" fill="${STEEL_LIGHT}"/>`,
        ),
        upright(
          'd_dofek_quote_marks',
          at(420, 262, 104, 80),
          `<path d="M8 80V48C8 20 23 5 46 0L50 11C35 17 29 28 29 43H46V80Z M58 80V48C58 20 73 5 96 0L100 11C85 17 79 28 79 43H96V80Z" fill="${RED}"/>`,
        ),
        // The patient's label on the sheet: a barcode, and lines where the details go.
        art(
          'd_dofek_quote_label',
          atEnd(388, 214, 330, 118),
          `<rect x="1" y="1" width="328" height="116" rx="8" fill="${WHITE}" stroke="${INK}" stroke-opacity=".16" stroke-width="1.5"/>` +
            `<rect x="1" y="1" width="16" height="116" rx="6" fill="${RED}"/>` +
            [3, 1, 2, 1, 3, 2, 1, 1, 3, 1, 2, 3, 1, 2, 1, 3, 1, 1, 2, 1, 3, 2]
              .reduce(
                (acc, wide, i) => {
                  const x = acc.x;
                  return {
                    x: x + wide * 2.4 + 3,
                    s: acc.s + (i % 2 ? '' : `<rect x="${r1(x)}" y="22" width="${r1(wide * 2.4)}" height="74" fill="${INK}"/>`),
                  };
                },
                { x: 36, s: '' },
              ).s +
            `<path d="M218 32H304M218 58H288M218 84H254" stroke="${INK}" stroke-opacity=".2" stroke-width="8" stroke-linecap="round"/>`,
        ),
        rect('d_dofek_quote_rule', at(420, 700, 120, 4), solid(token('secondary'))),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_dofek_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a chart sheet from margin to margin, down to over the foot, from its top;
      // a small monitor tab with a beat stands on the sheet's corner, beside the title.
      placeholders: [
        ...head('text', WIDTH - 220, 1, false).placeholders,
        place('p_body', 'body', at(START + 64, 278, WIDTH - 120, 600), 'body'),
      ],
      decorations: [
        ...head('text', WIDTH - 220, 1, false).decorations,
        card('d_dofek_text_sheet', at(START, 216, WIDTH, 708)),
        art(
          'd_dofek_text_band',
          at(START, 216, WIDTH, 14),
          `<path d="M0 18A18 18 0 0 1 18 0H${WIDTH - 18}A18 18 0 0 1 ${WIDTH} 18V14H0Z" fill="${TEAL}"/>`,
        ),
        rect('d_dofek_text_margin', at(START + 32, 262, 2.5, 620), solid(token('secondary', 0.5))),
        art(
          'd_dofek_text_tab',
          atEnd(END + 32, 180, 210, 70),
          `<rect x="0" y="0" width="210" height="70" rx="16" fill="${INK}"/>` +
            `<rect x="6" y="6" width="198" height="58" rx="11" stroke="${WHITE}" stroke-opacity=".1" stroke-width="1.5"/>` +
            fromStart(
              210,
              traced(
                ecg(18, 192, 42, [
                  { x: 70, a: 26, w: 60 },
                  { x: 140, a: 26, w: 60 },
                ]),
                RED,
                2.6,
                0.2,
              ),
            ),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_dofek_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 920).placeholders,
        place('p_image', 'image', atEnd(END + 22, 142, 656, 640)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 84, 306 + i * 186, 820, 48), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 84, 358 + i * 186, 820, 120), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 920).decorations,
        rect('d_dofek_text_image_panel', atEnd(END, 120, 700, 800), solid(token('primary')), {
          effects: {
            radius: 30,
            shadow: { x: 0, y: 20, blur: 46, color: { value: '#0d3b3a', alpha: 0.18 } },
          },
        }),
        art(
          'd_dofek_text_image_trace',
          atEnd(END + 40, 800, 620, 100),
          fromStart(
            620,
            `<path d="M0 82H620" stroke="${WHITE}" stroke-opacity=".14" stroke-width="1.5" stroke-dasharray="3 8"/>` +
              traced(
                ecg(0, 560, 60, [120, 300, 480].map((x) => ({ x, a: 46, w: 110 }))),
                WHITE,
                3,
                0.18,
              ) +
              `<circle cx="560" cy="60" r="6" fill="${WHITE}"/>` +
              `<path d="${heartPath(600, 58, 30)}" fill="${RED}"/>`,
          ),
        ),
        art(
          'd_dofek_text_image_thread',
          at(START, 362, 56, 368),
          `<path d="M28 4V364" stroke="${TEAL}" stroke-opacity=".5" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          numberDisc(`d_dofek_text_image_disc${i + 1}`, at(START, 302 + i * 186, 56, 56), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_dofek_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', atEnd(0, 0, 1920, 676)),
        place('p_place', 'caption', at(START + 40, 786, 760, 36), 'caption', {
          color: token('primary'),
        }),
        // Two lines, with room for the leading a script may need beyond the theme's (`LEADING`).
        place('p_title', 'title', at(START, 828, 860, Math.round(54 * 1.3 * 2) + 4), 'title'),
        place('p_body', 'body', atEnd(END, 796, 640, 168), 'body', { vAlign: 'middle' }),
      ],
      decorations: [
        art(
          'd_dofek_full_image_trace',
          atEnd(0, 676, 1920, 76),
          fromStart(
            1920,
            traced(
              ecg(0, 1920, 52, [
                { x: 1240, a: 40, w: 120 },
                { x: 1420, a: 40, w: 120 },
                { x: 1600, a: 40, w: 120 },
              ]),
              RED,
              3,
            ),
          ),
        ),
        art(
          'd_dofek_full_image_pin',
          at(START, 788, 26, 34),
          `<path d="M13 33C10 27 1 20 1 12.5A12 12 0 0 1 25 12.5C25 20 16 27 13 33Z" fill="${RED}"/><circle cx="13" cy="12.5" r="4.6" fill="${WHITE}"/>`,
        ),
        rect('d_dofek_full_image_rule', atEnd(END + 690, 802, 2, 160), solid(token('text', 0.14))),
      ],
    },
    {
      id: 'l_dofek_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...[0, 1, 2].flatMap((i) => {
          const y = 250 + i * 202;
          return [
            place(`p_label${i + 1}`, 'caption', at(START + 182, y + 30, 470, 34), 'caption', {
              color: token('primary'),
            }),
            place(`p_card${i + 1}_title`, 'subtitle', at(START + 182, y + 66, 470, 92), 'heading'),
            place(`p_card${i + 1}_body`, 'body', at(START + 690, y + 26, 640, 136), 'body', {
              vAlign: 'middle',
            }),
          ];
        }),
        place('p_note', 'body', at(START, 866, 1400, 44), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...[0, 1, 2].flatMap((i) => {
          const y = 250 + i * 202;
          return [
            lifted(
              art(`d_dofek_cards_band${i + 1}`, at(START, y, WIDTH, 188), wristband(`d_dofek_cards_band${i + 1}`, WIDTH, 188, BANDS[i]!)),
              10,
              24,
              0.12,
            ),
            art(
              `d_dofek_cards_icon${i + 1}`,
              at(START + 40, y + 38, 112, 112),
              `<circle cx="56" cy="56" r="56" fill="${BANDS[i]!}"/>` + BAND_ICONS[i]!(56),
            ),
          ];
        }),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_dofek_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 494, 380, 66), 'title', {
            color: i === 3 ? token('secondary') : token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 562, 380, 86), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 654, 380, 160), 'body'),
        ]),
        place('p_note', 'caption', at(START + 40, 852, 1400, 66), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        lifted(
          art(
            'd_dofek_timeline_strip',
            atEnd(0, 236, 1920, 214),
            `<rect x="0" y="0" width="1920" height="214" fill="${WHITE}"/>` +
              ecgPaper(1920, 214) +
              `<path d="M0 1H1920M0 213H1920" stroke="${RED}" stroke-opacity=".35" stroke-width="2"/>`,
          ),
          10,
          26,
          0.1,
        ),
        art(
          'd_dofek_timeline_trace',
          atEnd(0, 236, 1920, 252),
          fromStart(
            1920,
            traced(
              ecg(0, 1920, 142, [
                ...peaks.map((x) => ({ x, a: 104, w: 170 })),
                ...between.map((x) => ({ x, a: 40, w: 120 })),
              ]),
              INK,
              3,
            ) +
              peaks
                .map(
                  (x, i) =>
                    `<circle cx="${x}" cy="38" r="10" fill="${WHITE}" stroke="${i === 3 ? RED : TEAL}" stroke-width="4"/>` +
                    `<path d="M${x} 222V250" stroke="${INK}" stroke-opacity=".3" stroke-width="2" stroke-dasharray="2 5"/>`,
                )
                .join(''),
          ),
        ),
        kickerCross('d_dofek_timeline_note_cross', 852),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_dofek_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => [
          // The sign's figure: a step's number, or a time, a share, a day.
          place(`p_station${i + 1}`, 'number', at(s + 40, 292, 220, 108), 'title', {
            align: 'center',
            vAlign: 'middle',
            color: token('surface'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 532, 300, 86), 'heading', {
            align: 'center',
            vAlign: 'bottom',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 628, 300, 100), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 120, 766, WIDTH - 170, 100), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        art(
          'd_dofek_process_floor',
          atEnd(0, lineY - 6, 1920, 74),
          fromStart(
            1920,
            `<path d="M0 30H${1920 - END - 40}" stroke="${TEAL}" stroke-width="16"/>` +
              `<path d="M${1920 - END - 64} 6L${1920 - END - 18} 30L${1920 - END - 64} 54Z" fill="${TEAL}"/>` +
              `<path d="M0 50H1920" stroke="${RED}" stroke-width="6"/>` +
              `<path d="M0 64H1920" stroke="${AMBER}" stroke-width="6"/>`,
          ),
        ),
        ...steps5.map((s, i) =>
          art(
            `d_dofek_process_sign${i + 1}`,
            at(s + 40, 286, 220, lineY - 286 + 12),
            `<rect x="104" y="112" width="12" height="${lineY - 286 - 112 + 12}" fill="${STEEL_DARK}"/>` +
              `<rect x="0" y="0" width="220" height="120" rx="20" fill="${i === 4 ? RED : TEAL}"/>` +
              `<rect x="6" y="6" width="208" height="108" rx="15" stroke="${WHITE}" stroke-opacity=".35" stroke-width="2"/>`,
          ),
        ),
        card('d_dofek_process_note', at(START, 756, WIDTH, 120)),
        art(
          'd_dofek_process_clock',
          at(START + 40, 786, 60, 60),
          `<circle cx="30" cy="30" r="26" stroke="${TEAL}" stroke-width="4"/>` +
            `<path d="M30 14V30L41 37" stroke="${RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
            `<path d="M22 2H38" stroke="${TEAL}" stroke-width="4" stroke-linecap="round"/>`,
        ),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_dofek_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', START + 150],
            ['after', 1030],
          ] as const
        ).flatMap(([side, s]) => [
          place(`p_${side}_label`, 'caption', at(s, 452, 600, 36), 'caption', {
            color: side === 'after' ? token('surface') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', at(s, 492, 600, 86), 'heading', {
            ...(side === 'after' ? { color: token('surface') } : {}),
          }),
          place(`p_${side}_body`, 'body', at(s, 584, 600, 196), 'body', {
            ...(side === 'after' ? { color: token('surface') } : {}),
          }),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        lifted(
          art(
            'd_dofek_comparison_before',
            at(START, 326, 832, 476),
            fromStart(
              832,
              `<defs><linearGradient id="d_dofek_comparison_before-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${MINT}"/></linearGradient></defs>` +
                `<path d="M238 0H832V476H238A238 238 0 0 1 238 0Z" fill="url(#d_dofek_comparison_before-g)" stroke="${INK}" stroke-opacity=".1" stroke-width="2"/>`,
            ),
          ),
          16,
          36,
          0.14,
        ),
        lifted(
          art(
            'd_dofek_comparison_after',
            atEnd(END, 326, 832, 476),
            fromStart(
              832,
              `<defs><linearGradient id="d_dofek_comparison_after-g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${TEAL}" stop-opacity=".88"/><stop offset=".5" stop-color="${TEAL}"/><stop offset="1" stop-color="${INK}" stop-opacity=".9"/></linearGradient></defs>` +
                `<path d="M0 0H594A238 238 0 0 1 594 476H0Z" fill="url(#d_dofek_comparison_after-g)"/>` +
                `<path d="M0 0H18V476H0Z" fill="${INK}" fill-opacity=".22"/>` +
                `<path d="M60 18H600Q690 22 744 62" stroke="${WHITE}" stroke-opacity=".18" stroke-width="12" stroke-linecap="round"/>`,
            ),
          ),
          16,
          36,
          0.18,
        ),
        art(
          'd_dofek_comparison_weak',
          at(START + 150, 382, 600, 60),
          fromStart(
            600,
            traced(
              ecg(0, 600, 36, [
                { x: 90, a: 10, w: 100 },
                { x: 260, a: 7, w: 100 },
                { x: 450, a: 9, w: 100 },
              ]),
              MUTED,
              2.6,
            ),
          ),
        ),
        art(
          'd_dofek_comparison_strong',
          at(1030, 382, 600, 60),
          fromStart(
            600,
            traced(
              ecg(0, 600, 50, [90, 260, 430].map((x) => ({ x, a: 46, w: 110 }))),
              WHITE,
              3,
              0.2,
            ) + `<circle cx="600" cy="50" r="5" fill="${WHITE}"/>`,
          ),
        ),
        art(
          'd_dofek_comparison_arrow',
          at(920, 524, 80, 80),
          `<circle cx="40" cy="40" r="38" fill="${WHITE}" stroke="${INK}" stroke-opacity=".14" stroke-width="2"/>` +
            `<path d="M26 40H54M44 29L55 40L44 51" stroke="${RED}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round" transform="matrix(-1 0 0 1 80 0)"/>`,
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_dofek_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1100).placeholders,
        place('p_chart', 'chart', at(START + 48, 290, 1004, 510)),
        place('p_source', 'caption', at(START + 48, 812, 1004, 72), 'caption'),
        place('p_figure1', 'number', atEnd(END + 40, 292, 430, 112), 'display', {
          color: token('surface'),
        }),
        place('p_figure1_body', 'body', atEnd(END + 40, 408, 430, 124), 'body', {
          color: token('surface'),
        }),
        place('p_figure2', 'number', atEnd(END + 40, 634, 430, 112), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END + 40, 750, 430, 124), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1100).decorations,
        card('d_dofek_chart_panel', at(START, 256, 1100, 648)),
        art('d_dofek_chart_paper', at(START + 24, 280, 1052, 600), ecgPaper(1052, 600, 12, 0.45)),
        rect('d_dofek_chart_tile1', atEnd(END, 256, 510, 306), solid(token('primary')), {
          effects: { radius: 24, shadow: { x: 0, y: 16, blur: 40, color: { value: '#0d3b3a', alpha: 0.14 } } },
        }),
        card('d_dofek_chart_tile2', atEnd(END, 598, 510, 306), 24),
        art(
          'd_dofek_chart_wave1',
          atEnd(END + 26, 306, 120, 44),
          fromStart(120, traced(ecg(4, 116, 30, [{ x: 70, a: 24, w: 60 }]), WHITE, 2.6)),
        ),
        art(
          'd_dofek_chart_wave2',
          atEnd(END + 26, 648, 120, 44),
          fromStart(120, traced(ecg(4, 116, 30, [{ x: 70, a: 24, w: 60 }]), RED, 2.6)),
        ),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_dofek_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 32, 268, WIDTH - 64, 584)),
        place('p_note', 'caption', at(START + 40, 888, WIDTH - 40, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1200).decorations,
        card('d_dofek_table_panel', at(START, 248, WIDTH, 620)),
        // The punched margins of a printout's continuous paper, down both sides of the report.
        ...(['start', 'end'] as const).map((side) =>
          art(
            `d_dofek_table_holes_${side}`,
            side === 'start' ? at(START, 268, 32, 584) : atEnd(END, 268, 32, 584),
            Array.from(
              { length: 15 },
              (_, i) =>
                `<circle cx="16" cy="${r1(14 + i * (556 / 14))}" r="6.5" fill="${MINT}" stroke="${INK}" stroke-opacity=".14" stroke-width="1.5"/>`,
            ).join(''),
          ),
        ),
        // A specimen's label in the head of the report: a barcode and a cap of colour.
        art(
          'd_dofek_table_label',
          atEnd(END, 136, 300, 84),
          `<rect x="1" y="1" width="298" height="82" rx="10" fill="${WHITE}" stroke="${INK}" stroke-opacity=".16" stroke-width="1.5"/>` +
            `<rect x="1" y="1" width="44" height="82" rx="10" fill="${AMBER}"/><rect x="30" y="1" width="15" height="82" fill="${AMBER}"/>` +
            [3, 1, 2, 1, 1, 3, 2, 1, 3, 1, 2, 1, 1, 3, 1, 2, 3, 1]
              .reduce(
                (acc, wide, i) => ({
                  x: acc.x + wide * 2.2 + 3,
                  s: acc.s + (i % 2 ? '' : `<rect x="${r1(acc.x)}" y="16" width="${r1(wide * 2.2)}" height="52" fill="${INK}"/>`),
                }),
                { x: 62, s: '' },
              ).s +
            `<path d="M200 26H278M200 46H262M200 64H240" stroke="${INK}" stroke-opacity=".2" stroke-width="7" stroke-linecap="round"/>`,
        ),
        kickerCross('d_dofek_table_note_cross', 888),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_dofek_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100, 1).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s + 30, 382, 320, 290)),
          place(`p_unit${i + 1}`, 'caption', at(s + 30, 688, 326, 34), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s + 30, 724, 326, 50), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s + 30, 778, 326, 118), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100, 1).decorations,
        ...team4.flatMap((s, i) => [
          card(`d_dofek_team_badge${i + 1}`, at(s, 288, 380, 620), 22),
          art(
            `d_dofek_team_band${i + 1}`,
            at(s, 288, 380, 76),
            `<path d="M0 22A22 22 0 0 1 22 0H358A22 22 0 0 1 380 22V76H0Z" fill="${BADGES[i]!}"/>` +
              `<rect x="160" y="18" width="60" height="14" rx="7" fill="${MINT}"/>`,
          ),
          // The ends of the lanyard, its ring, and the clip through the badge's slot.
          art(
            `d_dofek_team_clip${i + 1}`,
            at(s + 130, 226, 120, 100),
            `<defs>${steel(`d_dofek_team_clip${i + 1}-steel`, 0, 0, 1, 0)}</defs>` +
              `<path d="M24 0L54 40M96 0L66 40" stroke="${BADGES[i]!}" stroke-width="16"/>` +
              `<path d="M24 0L54 40M96 0L66 40" stroke="${WHITE}" stroke-opacity=".18" stroke-width="3" transform="translate(-3 0)"/>` +
              `<circle cx="60" cy="47" r="9" stroke="${STEEL_DARK}" stroke-width="5"/>` +
              `<rect x="51" y="54" width="18" height="12" rx="3" fill="url(#d_dofek_team_clip${i + 1}-steel)" stroke="${STEEL_DARK}" stroke-width="1.5"/>` +
              `<rect x="45" y="64" width="30" height="34" rx="6" fill="url(#d_dofek_team_clip${i + 1}-steel)" stroke="${STEEL_DARK}" stroke-width="2"/>` +
              `<path d="M51 86H69" stroke="${STEEL_DARK}" stroke-width="2" stroke-linecap="round"/>`,
          ),
        ]),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_dofek_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 40, 262, 860, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 306, 880, 236), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 60, 572 + i * 86, 840, 76), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START, 870, 880, 36), 'caption'),
      ],
      decorations: [
        mark('d_dofek_closing_mark', at(START, 96, 46, 46)),
        kickerCross('d_dofek_closing_cross', 262),
        art(
          'd_dofek_closing_heart',
          atEnd(100, 150, 780, 720),
          (() => {
            const g = (n: string) => `d_dofek_closing_heart-${n}`;
            const heart = heartPath(390, 352, 540);
            const trace = ecg(0, 780, 392, [{ x: 400, a: 190, w: 250 }]);
            return (
              `<defs><linearGradient id="${g('fill')}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${RED}" stop-opacity=".78"/><stop offset=".55" stop-color="${RED}"/><stop offset="1" stop-color="${RED}"/></linearGradient>` +
              `<radialGradient id="${g('shade')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${INK}" stop-opacity=".22"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient>` +
              `<clipPath id="${g('in')}"><path d="${heart}"/></clipPath></defs>` +
              // Its shadow on the slide, the echoes of the beat, the heart, the light on it.
              `<ellipse cx="390" cy="668" rx="190" ry="22" fill="url(#${g('shade')})"/>` +
              `<path d="${heartPath(390, 352, 640)}" stroke="${RED}" stroke-opacity=".22" stroke-width="2"/>` +
              `<path d="${heartPath(390, 352, 740)}" stroke="${RED}" stroke-opacity=".14" stroke-width="2" stroke-dasharray="2 10" stroke-linecap="round"/>` +
              `<path d="${heart}" fill="url(#${g('fill')})"/>` +
              `<path d="M196 214C220 160 282 132 334 150" stroke="${WHITE}" stroke-opacity=".3" stroke-width="14" stroke-linecap="round"/>` +
              // The trace: red across the slide, white where it crosses the heart.
              fromStart(780, traced(trace, RED, 6)) +
              `<g clip-path="url(#${g('in')})">${fromStart(780, traced(trace, WHITE, 6))}</g>`
            );
          })(),
        ),
        ...[0, 1, 2].map((i) =>
          art(`d_dofek_closing_icon${i + 1}`, at(START, 574 + i * 86, 38, 38), CLOSING_ICONS[i]!),
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
// The sample: Coastal District Health briefs its council on Four Minutes, its programme to
// restart a heart before the ambulance arrives

const TABLE_COLS = [300, 300, 340, 380, 280];
const TABLE_ROW = 94;
const CPR = [36, 48, 59, 67];
const HOME = [8, 10, 13, 16];

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
const DISPLAYED = new Set(['l_dofek_hero', 'l_dofek_section', 'l_dofek_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: DofekCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: DofekCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_dofek_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_dofek_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 44 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('secondary'), gap: 30 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_dofek_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_dofek_big_number',
      name: copy.figures.name,
      content: {
        caption: [text(copy.figures.kicker), ...copy.figures.others.map(([, label]) => text(label))],
        title: lines(copy.figures.title),
        number: [text(copy.figures.hero.value), ...copy.figures.others.map(([value]) => text(value))],
        subtitle: text(copy.figures.hero.label),
        body: text(copy.figures.hero.note),
        footer,
      },
    },
    {
      layout: 'l_dofek_comparison',
      name: copy.change.name,
      content: {
        caption: [text(copy.change.kicker), text(copy.change.before[0]), text(copy.change.after[0])],
        title: lines(copy.change.title),
        subtitle: [text(copy.change.before[1]), text(copy.change.after[1])],
        body: [text(copy.change.before[2]), text(copy.change.after[2])],
        footer,
      },
    },
    {
      layout: 'l_dofek_process',
      name: copy.chain.name,
      content: {
        caption: [text(copy.chain.kicker), ...copy.chain.steps.map(([, , caption]) => text(caption))],
        title: lines(copy.chain.title),
        number: copy.chain.steps.map(([time]) => text(time)),
        subtitle: copy.chain.steps.map(([, step]) => text(step)),
        body: text(copy.chain.note),
        footer,
      },
    },
    {
      layout: 'l_dofek_text_image',
      name: copy.responders.name,
      content: {
        caption: text(copy.responders.kicker),
        title: lines(copy.responders.title),
        image: { assetId: pictures.responder.id },
        subtitle: copy.responders.items.map(([title]) => text(title)),
        body: copy.responders.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_dofek_full_image',
      name: copy.park.name,
      content: {
        image: { assetId: pictures.park.id },
        caption: text(copy.park.place),
        title: text(...copy.park.title),
        body: text(copy.park.body),
      },
    },
    {
      layout: 'l_dofek_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_dofek_cards',
      name: copy.programmes.name,
      content: {
        caption: [text(copy.programmes.kicker), ...copy.programmes.cards.map(([label]) => text(label))],
        title: lines(copy.programmes.title),
        subtitle: copy.programmes.cards.map(([, title]) => text(title)),
        body: [...copy.programmes.cards.map(([, , body]) => text(body)), text(copy.programmes.note)],
        footer,
      },
    },
    {
      layout: 'l_dofek_timeline',
      name: copy.milestones.name,
      content: {
        caption: [text(copy.milestones.kicker), text(copy.milestones.note)],
        title: lines(copy.milestones.title),
        number: copy.milestones.stops.map(([year]) => text(year)),
        subtitle: copy.milestones.stops.map(([, title]) => text(title)),
        body: copy.milestones.stops.map(([, , body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_dofek_chart',
      name: copy.trend.name,
      content: {
        caption: [text(copy.trend.kicker), text(copy.trend.source)],
        title: lines(copy.trend.title),
        number: copy.trend.figures.map(([value]) => text(value)),
        body: copy.trend.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.trend.series[0], values: CPR },
            { name: copy.trend.series[1], values: HOME },
          ],
        },
      },
    },
    {
      layout: 'l_dofek_table',
      name: copy.areas.name,
      content: {
        caption: [text(copy.areas.kicker), text(copy.areas.note)],
        title: lines(copy.areas.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.areas.header, ...copy.areas.rows],
      },
    },
    {
      layout: 'l_dofek_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([unit]) => text(unit))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => text(role)),
        footer,
      },
    },
    {
      layout: 'l_dofek_closing',
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
export const dofekSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => DOFEK_COPY[lang]).map((lang) => [
    lang,
    sample(DOFEK_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Dofek template: the theme, its layouts for both directions, and its sample deck. */
export function dofekTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(dofekTheme),
    description:
      'Pulse: a clinic’s mint-white with surgical teal and pulse red; a stethoscope, an IV bag, a patient monitor, a clipboard, wristbands, an ECG strip, wayfinding lines, a capsule and staff badges, with one pulse line that beats into every slide’s number.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.responder, pictures.park, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, dofekSamples.he);
  return finished;
}

export const entry = { id: 'dofek', template: dofekTemplate, samples: dofekSamples };
