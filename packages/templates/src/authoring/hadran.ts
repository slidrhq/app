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
import { HADRAN_COPY, type HadranCopy } from './hadran/copy';
import { picture } from './pictures';

const pictures = {
  studio: picture('hadranStudio'),
  concert: picture('hadranConcert'),
  team: [1, 2, 3, 4].map((n) => picture(`hadranTeam${n}`)),
};

/**
 * Hadran (Encore): the night of a record label. Blush record-sleeve paper under a soft stage
 * light, and on it the things a season of music is made of, each doing a job: the opening is a
 * turntable with its arm dropped on the first groove, the number of a part is printed on the
 * front head of a kick drum on the dark stage, a figure swings a VU meter into the red, the
 * quote is a concert ticket, the agenda a setlist taped to the stage, the cards three cassettes,
 * a plan a staff of music rising to a held note, a process the faders of a desk pushed up one by
 * one, a comparison an orchestra seen from above, the people backstage laminates, and the last
 * slide a microphone left in the spotlight for one more song. Oxblood ink, record-label crimson,
 * cobalt, and the amber of the lights. For concerts, festivals, bands and orchestras, record
 * labels and music schools.
 *
 * Written for every language of the app: no drawing holds a word (figures only, set in the
 * theme's faces), so one set of layouts reads in all of them. A condensed face of a gig poster
 * for what is said aloud (Oswald, Karantina for Hebrew) and Manrope with Assistant for what is
 * read; the other scripts take their counterparts.
 */
export const hadranTheme: Theme = {
  id: 'hadran',
  name: 'Encore',
  colors: {
    bg: '#f6e7df',
    surface: '#fffaf7',
    text: '#26101a',
    muted: '#6e5560',
    primary: '#c3203f',
    secondary: '#2440b8',
    accent: '#e9a03a',
    chart: ['#c3203f', '#2440b8', '#e9a03a', '#26101a', '#e58aa0', '#8fa0e6'],
  },
  // The condensed capitals of a gig poster for what is said aloud (Oswald, with Karantina for
  // Hebrew), and Manrope for what is read, with Assistant for Hebrew. The small headings are set
  // in the reading face, bold: a condensed face is for size.
  fonts: {
    heading: { he: 'Karantina', latin: 'Oswald' },
    body: { he: 'Assistant', latin: 'Manrope' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 120,
      weight: 700,
      lineHeight: 1.02,
      letterSpacing: -1,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 64,
      weight: 600,
      lineHeight: 1.1,
      letterSpacing: -0.4,
      color: { token: 'text' },
    },
    heading: { font: 'body', size: 31, weight: 700, lineHeight: 1.28, color: { token: 'text' } },
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
  radius: 12,
  shadow: { x: 0, y: 18, blur: 44, color: { value: '#3a0f1c', alpha: 0.12 } },
  // The ground: blush paper under a soft light from above, as a stage light falls on a sleeve.
  background: {
    fill: {
      kind: 'css',
      value: [
        'radial-gradient(1500px 760px at 50% -14%, color-mix(in srgb, var(--color-surface) 88%, transparent), transparent 74%)',
        'radial-gradient(1200px 520px at 50% 118%, color-mix(in srgb, var(--color-primary) 7%, transparent), transparent 70%)',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The paper alone, without its light.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#26101a';
const MUTED = '#6e5560';
const CRIMSON = '#c3203f';
const COBALT = '#2440b8';
const AMBER = '#e9a03a';
const BLUSH = '#f6e7df';
const WHITE = '#fffaf7';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [CRIMSON]: token('primary'),
  [COBALT]: token('secondary'),
  [AMBER]: token('accent'),
  [BLUSH]: token('bg'),
  [WHITE]: token('surface'),
};

/** The faces of the figures drawn in the drawings: the theme's own. */
const FIGURES = 'font-family="Oswald, Karantina, sans-serif" font-weight="600"';

const n1 = (v: number) => Math.round(v * 10) / 10;
const RAD = Math.PI / 180;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${n1(w)} ${n1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings a left-to-right deck must not see mirrored: those with figures in them, and the
 * meter whose red is always on its right. Their mirror moves them to the other side as they
 * are, or takes the drawing given for that direction.
 */
const UPRIGHT = new Map<string, string | undefined>();

const upright = (id: string, frame: Frame, body: string, ltr?: string) => {
  UPRIGHT.set(id, ltr === undefined ? undefined : svg(frame.w, frame.h, ltr));
  return art(id, frame, body);
};

/** A soft shadow under a drawing of something that stands on the page: a ticket, a pass. */
const lifted = (element: Element, y = 14, blur = 30, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#3a0f1c', alpha } } },
});

// ---------------------------------------------------------------------------------------------
// Geometry

const pt = (cx: number, cy: number, r: number, deg: number) =>
  [n1(cx + r * Math.cos(deg * RAD)), n1(cy + r * Math.sin(deg * RAD))] as const;

/** A whole circle as a path, to gather many into one. */
const ring = (cx: number, cy: number, r: number) =>
  `M${n1(cx - r)} ${n1(cy)}a${n1(r)} ${n1(r)} 0 1 0 ${n1(2 * r)} 0a${n1(r)} ${n1(r)} 0 1 0 ${n1(-2 * r)} 0`;

/** An arc of a circle, clockwise from `a0` to `a1` degrees (0 is the right, 90 is down). */
function arc(cx: number, cy: number, r: number, a0: number, a1: number) {
  const [x0, y0] = pt(cx, cy, r, a0);
  const [x1, y1] = pt(cx, cy, r, a1);
  return `M${x0} ${y0}A${n1(r)} ${n1(r)} 0 ${a1 - a0 > 180 ? 1 : 0} 1 ${x1} ${y1}`;
}

/** A slice of a ring between two radii and two angles. */
function sector(cx: number, cy: number, inner: number, outer: number, a0: number, a1: number) {
  const [x0, y0] = pt(cx, cy, outer, a0);
  const [x1, y1] = pt(cx, cy, outer, a1);
  const [x2, y2] = pt(cx, cy, inner, a1);
  const [x3, y3] = pt(cx, cy, inner, a0);
  const large = a1 - a0 > 180 ? 1 : 0;
  return `M${x0} ${y0}A${n1(outer)} ${n1(outer)} 0 ${large} 1 ${x1} ${y1}L${x2} ${y2}A${n1(inner)} ${n1(inner)} 0 ${large} 0 ${x3} ${y3}Z`;
}

/** A smooth line through points (Catmull-Rom as cubic Béziers). */
function curve(points: [number, number][]): string {
  let d = `M${n1(points[0]![0])} ${n1(points[0]![1])}`;
  for (let i = 0; i < points.length - 1; i++) {
    const p0 = points[Math.max(0, i - 1)]!;
    const p1 = points[i]!;
    const p2 = points[i + 1]!;
    const p3 = points[Math.min(points.length - 1, i + 2)]!;
    d +=
      `C${n1(p1[0] + (p2[0] - p0[0]) / 6)} ${n1(p1[1] + (p2[1] - p0[1]) / 6)} ` +
      `${n1(p2[0] - (p3[0] - p1[0]) / 6)} ${n1(p2[1] - (p3[1] - p1[1]) / 6)} ${n1(p2[0])} ${n1(p2[1])}`;
  }
  return d;
}

// ---------------------------------------------------------------------------------------------
// The things of the world, drawn

/**
 * A record seen from above: black vinyl, its grooves in fine rings with the gaps between the
 * tracks, the light catching two opposite slices, and a label of its colour with the spindle
 * hole through it.
 */
function record(cx: number, cy: number, r: number, label: string, hole = BLUSH) {
  const inner = r * 0.33;
  const step = Math.max(2.4, r * 0.016);
  let grooves = '';
  for (let k = inner + r * 0.05; k < r * 0.965; k += step) grooves += ring(cx, cy, k);
  const fine = r > 120 ? 1 : 0.7;
  return (
    `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r)}" fill="${INK}"/>` +
    `<path d="${grooves}" stroke="${WHITE}" stroke-opacity=".06" stroke-width="${fine}"/>` +
    [0.55, 0.69, 0.83]
      .map(
        (t) =>
          `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r * t)}" stroke="${WHITE}" stroke-opacity=".13" stroke-width="${n1(Math.max(1, r * 0.01))}"/>`,
      )
      .join('') +
    `<path d="${sector(cx, cy, inner + 2, r - 2, 196, 232)}" fill="${WHITE}" fill-opacity=".07"/>` +
    `<path d="${sector(cx, cy, inner + 2, r - 2, 204, 222)}" fill="${WHITE}" fill-opacity=".06"/>` +
    `<path d="${sector(cx, cy, inner + 2, r - 2, 16, 52)}" fill="${WHITE}" fill-opacity=".05"/>` +
    `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(r - 1)}" stroke="${WHITE}" stroke-opacity=".16" stroke-width="1.5"/>` +
    `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(inner)}" fill="${label}"/>` +
    `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(inner * 0.86)}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="${n1(Math.max(0.8, r * 0.004))}"/>` +
    (r > 120
      ? `<path d="${arc(cx, cy, inner * 0.62, 205, 335)}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="${n1(r * 0.012)}" stroke-linecap="round"/>` +
        `<path d="${arc(cx, cy, inner * 0.62, 25, 155)}" stroke="${WHITE}" stroke-opacity=".3" stroke-width="${n1(r * 0.008)}" stroke-linecap="round"/>`
      : '') +
    `<circle cx="${n1(cx)}" cy="${n1(cy)}" r="${n1(Math.max(2, r * 0.024))}" fill="${hole}"/>`
  );
}

/** The outline of a guitar pick, point down, in a box `w` by `h`. */
function pickPath(w: number, h: number) {
  const x = (v: number) => n1((v * w) / 100);
  const y = (v: number) => n1((v * h) / 110);
  return (
    `M${x(50)} ${y(108)}C${x(38)} ${y(96)} ${x(5)} ${y(64)} ${x(3)} ${y(35)}` +
    `C${x(1)} ${y(12)} ${x(22)} ${y(2)} ${x(50)} ${y(2)}C${x(78)} ${y(2)} ${x(99)} ${y(12)} ${x(97)} ${y(35)}` +
    `C${x(95)} ${y(64)} ${x(62)} ${y(96)} ${x(50)} ${y(108)}Z`
  );
}

/** A guitar pick of crimson, with the light on its shoulder. */
const pick = (w: number, h: number) =>
  `<path d="${pickPath(w, h)}" fill="${CRIMSON}"/>` +
  `<path d="M${n1(w * 0.2)} ${n1(h * 0.2)}C${n1(w * 0.3)} ${n1(h * 0.1)} ${n1(w * 0.48)} ${n1(h * 0.08)} ${n1(w * 0.62)} ${n1(h * 0.1)}" stroke="${WHITE}" stroke-opacity=".38" stroke-width="${n1(Math.max(1.6, w * 0.035))}" stroke-linecap="round"/>`;

/** A strip of gaffer tape with torn ends, turned a little, in a box of 200 by 76. */
const gaffer = (turn: number) =>
  `<g transform="rotate(${turn} 100 38)"><path d="M10 20L16 24L10 28L16 32L10 36L16 40L10 44L16 48L10 52H190L184 48L190 44L184 40L190 36L184 32L190 28L184 24L190 20Z" fill="${INK}" fill-opacity=".82"/>` +
  `<path d="M16 26H184" stroke="${WHITE}" stroke-opacity=".12" stroke-width="3"/></g>`;

/** The bars of a level meter, the size of an icon. */
const levelBars = (heights: number[], h: number, colour = CRIMSON) =>
  heights
    .map(
      (b, i) =>
        `<rect x="${i * 8}" y="${h - b}" width="5" height="${b}" rx="1.5" fill="${colour}" fill-opacity="${i === 3 ? 1 : 0.75}"/>`,
    )
    .join('');

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const W = 1920;
const H = 1080;
const START = 128;
const END = 128;
const WIDTH = W - START - END;
/** Where the text after a mark (the kicker, a note, the meta) starts. */
const KICK = START + 36;

/** The play mark before a kicker, pointing the way the slide reads. */
const play = (id: string, top: number, colour = CRIMSON) =>
  art(id, at(START, top + 5, 26, 24), `<path d="M24 2L7 12L24 22Z" fill="${colour}"/>`);

/** The kicker on its play mark, and the title. */
function head(name: string, width = 1100) {
  return {
    placeholders: [
      place('p_kicker', 'caption', at(KICK, 84, Math.min(900, width - 36), 34), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', at(START, 126, width, 90), 'title'),
    ],
    decorations: [play(`d_hadran_${name}_play`, 84)],
  };
}

/** The mark of the deck: a small record, which the user may replace with a logo. */
function mark(id: string, frame: Frame, dark = false): Element {
  const s = frame.w;
  const c = s / 2;
  return drawing(
    id,
    frame,
    svg(
      s,
      s,
      `<circle cx="${c}" cy="${c}" r="${n1(c - 1)}" fill="${INK}"/>` +
        `<path d="${ring(c, c, c * 0.62)}${ring(c, c, c * 0.78)}" stroke="${WHITE}" stroke-opacity=".22" stroke-width="1"/>` +
        `<path d="${sector(c, c, c * 0.42, c - 3, 200, 236)}" fill="${WHITE}" fill-opacity=".16"/>` +
        `<circle cx="${c}" cy="${c}" r="${n1(c * 0.36)}" fill="${CRIMSON}"/>` +
        `<circle cx="${c}" cy="${c}" r="${n1(c * 0.08)}" fill="${BLUSH}"/>` +
        (dark
          ? `<circle cx="${c}" cy="${c}" r="${n1(c - 1)}" stroke="${BLUSH}" stroke-opacity=".5" stroke-width="1.5"/>`
          : ''),
    ),
    PAINT,
    { role: 'logo', name: 'logo' },
  );
}

/**
 * The foot of a content slide: the mark and the deck's name at the start; at the end a level
 * meter and the slide's number on a guitar pick.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 62, 958, 900, 36), 'caption')]
      : [],
    decorations: [
      mark(`d_hadran_${name}_mark`, at(START, 953, 44, 44)),
      art(`d_hadran_${name}_level`, atEnd(END + 92, 958, 37, 32), levelBars([14, 24, 18, 30, 10], 32)),
      art(`d_hadran_${name}_pick`, atEnd(END, 942, 60, 66), pick(60, 66)),
      pageNumber(`d_hadran_${name}_number`, atEnd(END, 950, 60, 34), 'caption', {
        color: token('surface'),
        weight: 700,
        align: 'center',
      }),
    ],
  };
}

/** A sheet of paper on the slide: a card. */
const card = (id: string, frame: Frame, radius = 12) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.1), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 16, blur: 40, color: { value: '#3a0f1c', alpha: 0.1 } } },
  });

/** A small record with a figure on its label: the number of a point. */
function numberRecord(id: string, frame: Frame, n: number) {
  const s = frame.w;
  const c = s / 2;
  return upright(
    id,
    frame,
    `<circle cx="${c}" cy="${c}" r="${n1(c - 1)}" fill="${INK}"/>` +
      `<path d="${ring(c, c, c * 0.84)}${ring(c, c, c * 0.74)}" stroke="${WHITE}" stroke-opacity=".2" stroke-width="1"/>` +
      `<circle cx="${c}" cy="${c}" r="${n1(c * 0.62)}" fill="${CRIMSON}"/>` +
      `<text x="${c}" y="${n1(c + s * 0.15)}" text-anchor="middle" ${FIGURES} font-size="${n1(s * 0.42)}" fill="${WHITE}">${n}</text>`,
  );
}

// ---------------------------------------------------------------------------------------------
// The stage: the ground of a part and of the closing

/** The dark stage under a light: a glow, or a beam onto the floor, at `x`. */
function stage(id: string, x: number, beam: boolean) {
  const g = (name: string) => `${id}-${name}`;
  const floor = 958;
  return (
    `<defs>` +
    `<radialGradient id="${g('glow')}" cx="${x}" cy="${beam ? 640 : 470}" r="${beam ? 640 : 760}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${AMBER}" stop-opacity="${beam ? 0.16 : 0.24}"/><stop offset=".5" stop-color="${CRIMSON}" stop-opacity=".09"/><stop offset="1" stop-color="${CRIMSON}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${g('beam')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${AMBER}" stop-opacity=".24"/><stop offset="1" stop-color="${AMBER}" stop-opacity=".05"/></linearGradient>` +
    `<radialGradient id="${g('pool')}" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${AMBER}" stop-opacity=".34"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="${g('floor')}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".06"/><stop offset="1" stop-color="${WHITE}" stop-opacity="0"/></linearGradient>` +
    `</defs>` +
    `<rect width="${W}" height="${H}" fill="${INK}"/>` +
    `<rect width="${W}" height="${H}" fill="url(#${g('glow')})"/>` +
    (beam
      ? `<path d="M${x - 46} 0H${x + 46}L${x + 340} ${floor}H${x - 340}Z" fill="url(#${g('beam')})"/>` +
        `<ellipse cx="${x}" cy="${floor + 6}" rx="420" ry="54" fill="url(#${g('pool')})"/>`
      : '') +
    `<rect y="${floor}" width="${W}" height="${H - floor}" fill="url(#${g('floor')})"/>` +
    `<path d="M0 ${floor}H${W}" stroke="${WHITE}" stroke-opacity=".1" stroke-width="1.5"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of cards, stops, steps and people. */
const cards3 = [START, START + 572, START + 1144];
const stops4 = [START, START + 428, START + 856, START + 1284];
const steps5 = [START, START + 341, START + 682, START + 1023, START + 1364];
const team4 = [START, START + 427, START + 854, START + 1281];

/** The heights of the caps of the five faders, rising. */
const FADERS = [226, 186, 146, 106, 66];

/** The speed knob of the turntable, in a box of 92: chrome cap, knurled ring, two marks. */
function knob() {
  const knurl = Array.from({ length: 40 }, (_, i) => {
    const [x0, y0] = pt(46, 46, 30, i * 9);
    const [x1, y1] = pt(46, 46, 35, i * 9);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join('');
  const marks = [-150, -30]
    .map((a, i) => {
      const [x, y] = pt(46, 46, 43, a);
      return `<circle cx="${x}" cy="${y}" r="3.2" fill="${i === 0 ? AMBER : WHITE}" fill-opacity="${i === 0 ? 1 : 0.4}"/>`;
    })
    .join('');
  const [px, py] = pt(46, 46, 21, -150);
  return (
    `<defs><radialGradient id="d_hadran_hero_knob-cap" cx="38%" cy="32%" r="70%"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${MUTED}"/></radialGradient></defs>` +
    marks +
    `<circle cx="46" cy="46" r="36" fill="${INK}" stroke="${WHITE}" stroke-opacity=".3" stroke-width="2"/>` +
    `<path d="${knurl}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="1.5"/>` +
    `<circle cx="46" cy="46" r="26" fill="url(#d_hadran_hero_knob-cap)"/>` +
    `<path d="M46 46L${px} ${py}" stroke="${AMBER}" stroke-width="4" stroke-linecap="round"/>`
  );
}

/** The opening: a turntable seen from above, cropped by the edge of the slide. */
function turntable() {
  // The centre of the platter on the slide, and its radius.
  const cx = 404;
  const cy = 520;
  const plinth = atEnd(0, 92, 884, 896);
  const platter = atEnd(cx - 364, cy - 364, 728, 728);
  const strobe = Array.from({ length: 96 }, (_, i) => {
    const a = i * 3.75;
    const [x, y] = pt(364, 364, 351, a);
    return `<rect x="${n1(x - 1.6)}" y="${n1(y - 3)}" width="3.2" height="6" rx="1" transform="rotate(${n1(a + 90)} ${x} ${y})"/>`;
  }).join('');
  const arm = atEnd(630, 120, 254, 662);
  // The arm in its box: the pivot, the bend, and the end of the tube where the headshell sits.
  const pivot = [182, 116] as const;
  const bend = [192, 428] as const;
  const end = [64, 568] as const;
  const angle = n1(Math.atan2(end[1] - bend[1], end[0] - bend[0]) / RAD);
  return [
    lifted(
      art(
        'd_hadran_hero_plinth',
        plinth,
        `<defs><linearGradient id="d_hadran_hero_plinth-sheen" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".09"/><stop offset=".45" stop-color="${WHITE}" stop-opacity="0"/></linearGradient></defs>` +
          `<rect x="-80" y="0" width="964" height="896" rx="34" fill="${INK}"/>` +
          `<rect x="-80" y="0" width="964" height="896" rx="34" fill="url(#d_hadran_hero_plinth-sheen)"/>` +
          `<rect x="-80" y="12" width="952" height="872" rx="26" stroke="${WHITE}" stroke-opacity=".08" stroke-width="2"/>`,
      ),
      24,
      60,
      0.3,
    ),
    art(
      'd_hadran_hero_platter',
      platter,
      `<circle cx="364" cy="364" r="362" fill="${INK}" stroke="${WHITE}" stroke-opacity=".2" stroke-width="2"/>` +
        `<g fill="${WHITE}" fill-opacity=".5">${strobe}</g>` +
        `<circle cx="364" cy="364" r="343" fill="${INK}" stroke="${WHITE}" stroke-opacity=".12" stroke-width="1.5"/>` +
        record(364, 364, 334, CRIMSON, WHITE),
    ),
    // The speed knob: chrome, knurled, its pointer at the slower speed, lit in amber.
    art('d_hadran_hero_knob', atEnd(30, 112, 92, 92), knob()),
    art(
      'd_hadran_hero_arm',
      arm,
      // The base, the counterweight, the cue lever, the rest, the tube and the headshell.
      `<circle cx="${pivot[0]}" cy="${pivot[1]}" r="54" fill="${INK}" stroke="${WHITE}" stroke-opacity=".28" stroke-width="2"/>` +
        `<circle cx="${pivot[0]}" cy="${pivot[1]}" r="38" fill="${WHITE}" fill-opacity=".1"/>` +
        `<circle cx="${pivot[0]}" cy="${pivot[1]}" r="22" stroke="${WHITE}" stroke-opacity=".45" stroke-width="2"/>` +
        `<rect x="158" y="10" width="48" height="74" rx="10" fill="${WHITE}" fill-opacity=".86"/>` +
        `<path d="M158 30H206M158 44H206M158 58H206" stroke="${INK}" stroke-opacity=".25" stroke-width="2"/>` +
        `<rect x="226" y="188" width="18" height="46" rx="5" fill="${WHITE}" fill-opacity=".4"/>` +
        `<circle cx="226" cy="420" r="15" fill="${INK}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="2"/>` +
        `<path d="M${pivot[0]} ${pivot[1]}L${bend[0]} ${bend[1]}L${end[0]} ${end[1]}" stroke="${WHITE}" stroke-opacity=".9" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/>` +
        `<path d="M${pivot[0] - 3} ${pivot[1]}L${bend[0] - 3} ${bend[1]}L${end[0] - 2} ${end[1] - 3}" stroke="${INK}" stroke-opacity=".18" stroke-width="3" stroke-linejoin="round"/>` +
        `<g transform="translate(${end[0]} ${end[1]}) rotate(${angle})">` +
        `<rect x="-4" y="-17" width="64" height="34" rx="5" fill="${WHITE}" fill-opacity=".9"/>` +
        `<rect x="14" y="-12" width="36" height="24" rx="3" fill="${CRIMSON}"/>` +
        `<path d="M44 -17L56 -36" stroke="${WHITE}" stroke-opacity=".9" stroke-width="5" stroke-linecap="round"/></g>`,
    ),
    art(
      'd_hadran_hero_pitch',
      atEnd(800, 640, 56, 300),
      `<rect x="23" y="10" width="10" height="280" rx="5" fill="${WHITE}" fill-opacity=".1" stroke="${WHITE}" stroke-opacity=".22" stroke-width="1.5"/>` +
        Array.from(
          { length: 13 },
          (_, i) =>
            `<path d="M${i === 6 ? 2 : 8} ${n1(22 + i * 21.3)}H16M40 ${n1(22 + i * 21.3)}H${i === 6 ? 54 : 48}" stroke="${WHITE}" stroke-opacity="${i === 6 ? 0.6 : 0.3}" stroke-width="1.5"/>`,
        ).join('') +
        `<rect x="6" y="132" width="44" height="34" rx="5" fill="${WHITE}" fill-opacity=".86"/>` +
        `<path d="M10 149H46" stroke="${CRIMSON}" stroke-width="2.5"/>`,
    ),
    art(
      'd_hadran_hero_buttons',
      atEnd(56, 912, 290, 48),
      `<rect x="1" y="1" width="136" height="46" rx="7" fill="${WHITE}" fill-opacity=".16" stroke="${WHITE}" stroke-opacity=".3" stroke-width="1.5"/>` +
        `<circle cx="24" cy="24" r="5" fill="${CRIMSON}"/>` +
        `<rect x="160" y="7" width="56" height="34" rx="5" fill="${WHITE}" fill-opacity=".16" stroke="${WHITE}" stroke-opacity=".3" stroke-width="1.5"/>` +
        `<rect x="228" y="7" width="56" height="34" rx="5" fill="${WHITE}" fill-opacity=".08" stroke="${WHITE}" stroke-opacity=".22" stroke-width="1.5"/>` +
        `<circle cx="188" cy="24" r="4" fill="${AMBER}"/>`,
    ),
  ];
}

/** A part: a kick drum on the dark stage, the part's number on its front head. */
function drumKit() {
  // The centre of the drum on the slide, the radius of its hoop and of its head.
  const cx = 510;
  const cy = 530;
  const hoop = 340;
  const skin = 300;
  const box = atEnd(cx - 380, cy - 380, 760, 760);
  const c = 380;
  const lugs = Array.from({ length: 10 }, (_, i) => {
    const a = 18 + i * 36;
    const [x, y] = pt(c, c, hoop + 10, a);
    const [bx, by] = pt(c, c, hoop + 30, a);
    return (
      `<g transform="translate(${x} ${y}) rotate(${a + 90})"><rect x="-13" y="-27" width="26" height="54" rx="7" fill="${WHITE}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>` +
      `<rect x="-4" y="-22" width="8" height="44" rx="4" fill="${INK}" fill-opacity=".16"/></g>` +
      `<circle cx="${bx}" cy="${by}" r="8" fill="${WHITE}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>`
    );
  }).join('');
  const ticks = Array.from({ length: 36 }, (_, i) => {
    const [x0, y0] = pt(c, c, 216, i * 10);
    const [x1, y1] = pt(c, c, i % 3 === 0 ? 236 : 228, i * 10);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join('');
  const port = pt(c, c, 246, 135);
  // The legs: from the hoop's lower sides out to the floor.
  const legs = atEnd(cx - 400, 640, 800, 330);
  const legAt = (a: number) => {
    const [x, y] = pt(cx, cy, hoop - 6, a);
    return [n1(x - legs.x), n1(y - legs.y)] as const;
  };
  const [l0x, l0y] = legAt(148);
  const [r0x, r0y] = legAt(32);
  const floor = 958 - legs.y;
  // The cymbal over the drum's outer shoulder, on its stand.
  const stand = atEnd(16, 140, 420, 830);
  const sx = 214;
  const sy = 98;
  const base = 958 - stand.y;
  return {
    decorations: [
      art(
        'd_hadran_section_cymbal',
        stand,
        `<path d="M${sx} ${sy + 14}V${base - 150}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="7" stroke-linecap="round"/>` +
          `<path d="M${sx} ${base - 150}L${sx - 70} ${base - 4}M${sx} ${base - 150}L${sx + 70} ${base - 4}M${sx} ${base - 150}V${base - 4}" stroke="${WHITE}" stroke-opacity=".45" stroke-width="5" stroke-linecap="round"/>` +
          `<g transform="rotate(-9 ${sx} ${sy})">` +
          `<ellipse cx="${sx}" cy="${sy}" rx="176" ry="36" fill="${AMBER}"/>` +
          `<ellipse cx="${sx}" cy="${sy}" rx="176" ry="36" stroke="${INK}" stroke-opacity=".3" stroke-width="2"/>` +
          [140, 104, 70]
            .map(
              (rx) =>
                `<ellipse cx="${sx}" cy="${sy - 2}" rx="${rx}" ry="${n1(rx * 0.2)}" stroke="${INK}" stroke-opacity=".18" stroke-width="1.5"/>`,
            )
            .join('') +
          `<ellipse cx="${sx}" cy="${sy - 6}" rx="34" ry="12" fill="${AMBER}" stroke="${INK}" stroke-opacity=".3" stroke-width="1.5"/>` +
          `<path d="M${sx - 150} ${sy - 10}C${sx - 90} ${sy - 30} ${sx - 30} ${sy - 32} ${sx + 20} ${sy - 28}" stroke="${WHITE}" stroke-opacity=".6" stroke-width="4" stroke-linecap="round"/>` +
          `<circle cx="${sx}" cy="${sy - 8}" r="5" fill="${INK}"/></g>`,
      ),
      art(
        'd_hadran_section_legs',
        legs,
        `<ellipse cx="400" cy="${floor - 2}" rx="380" ry="16" fill="#000000" fill-opacity=".35"/>` +
          `<path d="M${l0x} ${l0y}L${l0x - 70} ${floor - 8}M${r0x} ${r0y}L${r0x + 70} ${floor - 8}" stroke="${WHITE}" stroke-opacity=".7" stroke-width="10" stroke-linecap="round"/>` +
          `<circle cx="${l0x - 70}" cy="${floor - 8}" r="9" fill="${INK}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="2"/>` +
          `<circle cx="${r0x + 70}" cy="${floor - 8}" r="9" fill="${INK}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="2"/>`,
      ),
      art(
        'd_hadran_section_drum',
        box,
        `<defs>` +
          `<radialGradient id="d_hadran_section_drum-hoop" cx="50%" cy="50%" r="50%"><stop offset=".86" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".45"/></radialGradient>` +
          `<radialGradient id="d_hadran_section_drum-skin" cx="42%" cy="36%" r="70%"><stop offset="0" stop-color="${WHITE}"/><stop offset=".7" stop-color="${BLUSH}"/><stop offset="1" stop-color="${MUTED}" stop-opacity=".55"/></radialGradient>` +
          `</defs>` +
          `<circle cx="${c}" cy="${c}" r="${hoop}" fill="${CRIMSON}"/>` +
          `<circle cx="${c}" cy="${c}" r="${hoop}" fill="url(#d_hadran_section_drum-hoop)"/>` +
          `<path d="${arc(c, c, hoop - 14, 196, 292)}" stroke="${WHITE}" stroke-opacity=".38" stroke-width="7" stroke-linecap="round"/>` +
          `<circle cx="${c}" cy="${c}" r="${skin + 8}" fill="${INK}" fill-opacity=".35"/>` +
          `<circle cx="${c}" cy="${c}" r="${skin}" fill="url(#d_hadran_section_drum-skin)"/>` +
          `<circle cx="${c}" cy="${c}" r="206" stroke="${CRIMSON}" stroke-width="10"/>` +
          `<circle cx="${c}" cy="${c}" r="188" stroke="${CRIMSON}" stroke-opacity=".35" stroke-width="2"/>` +
          `<path d="${ticks}" stroke="${CRIMSON}" stroke-width="3" stroke-linecap="round"/>` +
          `<circle cx="${port[0]}" cy="${port[1]}" r="38" fill="${INK}"/>` +
          `<circle cx="${port[0]}" cy="${port[1]}" r="38" stroke="${WHITE}" stroke-opacity=".8" stroke-width="6"/>` +
          lugs,
      ),
    ],
    number: atEnd(cx - 180, cy - 84, 360, 168),
  };
}

/**
 * The VU meter of the big number: a backlit face, the scale with its red, and the needle swung
 * into it. A meter is the same in both directions: its red is on its right.
 */
function vuMeter(id: string, w: number, h: number) {
  const px = w / 2;
  const py = h + 52;
  const R = 268;
  const at2 = (deg: number, r: number) =>
    [n1(px + r * Math.sin(deg * RAD)), n1(py - r * Math.cos(deg * RAD))] as const;
  const marks: [string, number, boolean][] = [
    ['20', -50, false],
    ['10', -31, false],
    ['7', -22, false],
    ['5', -14, false],
    ['3', -5, false],
    ['2', 1, false],
    ['1', 7, false],
    ['0', 14, true],
    ['1', 24, true],
    ['2', 35, true],
    ['3', 50, true],
  ];
  const scale = (a0: number, a1: number, r: number) => {
    const [x0, y0] = at2(a0, r);
    const [x1, y1] = at2(a1, r);
    return `M${x0} ${y0}A${r} ${r} 0 0 1 ${x1} ${y1}`;
  };
  const ticks = marks
    .map(([, a, red]) => {
      const [x0, y0] = at2(a, R);
      const [x1, y1] = at2(a, R + 22);
      return `<path d="M${x0} ${y0}L${x1} ${y1}" stroke="${red ? CRIMSON : INK}" stroke-width="2.6"/>`;
    })
    .join('');
  const minor = Array.from({ length: 21 }, (_, i) => {
    const a = -50 + i * 5;
    const [x0, y0] = at2(a, 226);
    const [x1, y1] = at2(a, i % 2 ? 234 : 240);
    return `M${x0} ${y0}L${x1} ${y1}`;
  }).join('');
  const labels = marks
    .map(([label, a, red]) => {
      const [x, y] = at2(a, R + 46);
      return `<text x="${x}" y="${n1(y + 8)}" text-anchor="middle" ${FIGURES} font-size="23" fill="${red ? CRIMSON : INK}">${label}</text>`;
    })
    .join('');
  const [nx, ny] = at2(31, 300);
  return (
    `<defs><clipPath id="${id}-face"><rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="12"/></clipPath></defs>` +
    `<rect width="${w}" height="${h}" rx="22" fill="${INK}"/>` +
    `<rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="12" fill="${WHITE}"/>` +
    `<rect x="18" y="18" width="${w - 36}" height="${h - 36}" rx="12" fill="${AMBER}" fill-opacity=".2"/>` +
    `<g clip-path="url(#${id}-face)">` +
    `<path d="${scale(-50, 14, R)}" stroke="${INK}" stroke-width="2.4"/>` +
    `<path d="${scale(14, 50, R + 5)}" stroke="${CRIMSON}" stroke-width="12"/>` +
    `<path d="${scale(-50, 50, 226)}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>` +
    `<path d="${minor}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>` +
    ticks +
    labels +
    `<text x="58" y="${h - 76}" text-anchor="middle" ${FIGURES} font-size="40" fill="${INK}">−</text>` +
    `<text x="${w - 58}" y="${h - 76}" text-anchor="middle" ${FIGURES} font-size="40" fill="${CRIMSON}">+</text>` +
    `<path d="M${px + 5} ${py + 3}L${nx + 5} ${ny + 3}" stroke="${INK}" stroke-opacity=".14" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M${px} ${py}L${nx} ${ny}" stroke="${INK}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<path d="M18 ${h - 18}V${h - 54}Q${px} ${h - 104} ${w - 18} ${h - 54}V${h - 18}Z" fill="${INK}" fill-opacity=".92"/>` +
    `</g>` +
    `<circle cx="${w - 66}" cy="62" r="18" fill="${CRIMSON}" fill-opacity=".22"/>` +
    `<circle cx="${w - 66}" cy="62" r="9" fill="${CRIMSON}"/>` +
    `<rect x="18.75" y="18.75" width="${w - 37.5}" height="${h - 37.5}" rx="12" stroke="${INK}" stroke-opacity=".3" stroke-width="1.5"/>`
  );
}

/**
 * A rack unit of the big number's other figures: its ears and screws at both ends, and a
 * ladder of lights lit to its level, from the start.
 */
function rackUnit(w: number, h: number, lit: number) {
  const segments = 20;
  const sw = 13;
  const gap = 4;
  const ladder = Array.from({ length: segments }, (_, i) => {
    // The first light at the ladder's start (its right, in a right-to-left slide).
    const x = 70 + (segments - 1 - i) * (sw + gap);
    const colour = i < 13 ? COBALT : i < 17 ? AMBER : CRIMSON;
    return `<rect x="${x}" y="${h / 2 - 20}" width="${sw}" height="40" rx="2.5" fill="${i < lit ? colour : INK}" fill-opacity="${i < lit ? 1 : 0.07}"/>`;
  }).join('');
  const ear = (x: number) =>
    `<rect x="${x}" width="46" height="${h}" rx="6" fill="${INK}"/>` +
    `<rect x="${x + 12}" y="28" width="22" height="11" rx="5.5" fill="${BLUSH}" fill-opacity=".9"/>` +
    `<rect x="${x + 12}" y="${h - 39}" width="22" height="11" rx="5.5" fill="${BLUSH}" fill-opacity=".9"/>`;
  return (
    `<rect x="40" y="0.75" width="${w - 80}" height="${h - 1.5}" fill="${WHITE}" stroke="${INK}" stroke-opacity=".12" stroke-width="1.5"/>` +
    ear(0) +
    ear(w - 46) +
    ladder
  );
}

/** A cassette: its shell, its label of colour with a strip to write on, the window and reels. */
function cassette(id: string, colour: string, packs: [number, number]) {
  const w = 464;
  const h = 280;
  const reels = [176, 288] as const;
  const hub = (x: number) =>
    `<circle cx="${x}" cy="140" r="17" fill="${WHITE}"/>` +
    Array.from({ length: 6 }, (_, i) => {
      const [tx, ty] = pt(x, 140, 12, i * 60);
      return `<rect x="${n1(tx - 2.5)}" y="${n1(ty - 2.5)}" width="5" height="5" fill="${INK}" transform="rotate(${i * 60} ${tx} ${ty})"/>`;
    }).join('') +
    `<circle cx="${x}" cy="140" r="5" fill="${INK}"/>`;
  return (
    `<defs><clipPath id="${id}-window"><rect x="112" y="102" width="240" height="76" rx="12"/></clipPath></defs>` +
    `<rect width="${w}" height="${h}" rx="18" fill="${INK}"/>` +
    `<rect x="6" y="6" width="${w - 12}" height="${h - 12}" rx="14" stroke="${WHITE}" stroke-opacity=".1" stroke-width="1.5"/>` +
    `<rect x="22" y="18" width="420" height="174" rx="10" fill="${colour}"/>` +
    `<rect x="38" y="30" width="388" height="48" rx="5" fill="${WHITE}"/>` +
    `<path d="M38 88H426M38 94H426" stroke="${WHITE}" stroke-opacity=".45" stroke-width="2"/>` +
    `<rect x="112" y="102" width="240" height="76" rx="12" fill="${INK}"/>` +
    `<g clip-path="url(#${id}-window)">` +
    `<rect x="112" y="102" width="240" height="76" fill="${WHITE}" fill-opacity=".16"/>` +
    `<path d="M${reels[0]} ${140 + packs[0]}L${reels[1]} ${140 + packs[1]}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="${reels[0]}" cy="140" r="${packs[0]}" fill="${INK}" stroke="${WHITE}" stroke-opacity=".12" stroke-width="1"/>` +
    `<circle cx="${reels[1]}" cy="140" r="${packs[1]}" fill="${INK}" stroke="${WHITE}" stroke-opacity=".12" stroke-width="1"/>` +
    `</g>` +
    hub(reels[0]) +
    hub(reels[1]) +
    `<rect x="112" y="102" width="240" height="76" rx="12" stroke="${WHITE}" stroke-opacity=".35" stroke-width="2"/>` +
    `<path d="M98 ${h}L122 220H342L366 ${h}" fill="${INK}" stroke="${WHITE}" stroke-opacity=".2" stroke-width="2"/>` +
    `<circle cx="156" cy="252" r="8" fill="${BLUSH}" fill-opacity=".85"/><circle cx="308" cy="252" r="8" fill="${BLUSH}" fill-opacity=".85"/>` +
    `<rect x="198" y="242" width="18" height="18" rx="2" fill="${WHITE}" fill-opacity=".25"/><rect x="248" y="242" width="18" height="18" rx="2" fill="${WHITE}" fill-opacity=".25"/>` +
    [
      [16, 16],
      [w - 16, 16],
      [16, h - 16],
      [w - 16, h - 16],
      [232, 206],
    ]
      .map(
        ([x, y]) =>
          `<circle cx="${x}" cy="${y}" r="6" fill="${WHITE}" fill-opacity=".3"/><path d="M${x! - 3.5} ${y}H${x! + 3.5}" stroke="${INK}" stroke-width="1.5"/>`,
      )
      .join('')
  );
}

/**
 * The staff of the season: five lines in 4/4, a note over each stop rising to a note held under
 * a fermata, bar lines between the stops and a repeat sign at the end. Music reads one way, so
 * each direction has its own drawing: the notes stand over the stops in the order they are
 * read, and the stems, the figures and the repeat are drawn as music draws them.
 */
function staff(w: number, rtl: boolean) {
  const lines = [84, 108, 132, 156, 180];
  const X = (x: number) => (rtl ? w - x : x);
  // Each stop's note, at a distance from the start of the staff, and its height.
  const notes = [
    [150, 180],
    [428 + 90, 144],
    [856 + 90, 120],
    [1284 + 90, 60],
  ] as const;
  const bars = [404, 832, 1260].map(
    (x) => `<path d="M${X(x)} 84V180" stroke="${INK}" stroke-opacity=".7" stroke-width="2"/>`,
  );
  const repeat = rtl
    ? `<rect x="4" y="84" width="8" height="96" fill="${INK}"/><path d="M22 84V180" stroke="${INK}" stroke-width="2.4"/><circle cx="36" cy="120" r="5" fill="${INK}"/><circle cx="36" cy="144" r="5" fill="${INK}"/>`
    : `<rect x="${w - 12}" y="84" width="8" height="96" fill="${INK}"/><path d="M${w - 22} 84V180" stroke="${INK}" stroke-width="2.4"/><circle cx="${w - 36}" cy="120" r="5" fill="${INK}"/><circle cx="${w - 36}" cy="144" r="5" fill="${INK}"/>`;
  const time = [128, 176]
    .map(
      (y) =>
        `<text x="${X(46)}" y="${y}" text-anchor="middle" ${FIGURES} font-weight="700" font-size="54" fill="${INK}">4</text>`,
    )
    .join('');
  const drawn = notes
    .map(([d, y], i) => {
      const x = X(d);
      const last = i === notes.length - 1;
      const colour = last ? CRIMSON : INK;
      const up = y > 132;
      const stem = up
        ? `<path d="M${x + 16} ${y - 3}V${y - 86}" stroke="${colour}" stroke-width="3"/>`
        : `<path d="M${x - 16} ${y + 3}V${y + 88}" stroke="${colour}" stroke-width="3"/>`;
      const head = last
        ? `<ellipse cx="${x}" cy="${y}" rx="16" ry="11" transform="rotate(-22 ${x} ${y})" stroke="${colour}" stroke-width="5"/>`
        : `<ellipse cx="${x}" cy="${y}" rx="18" ry="13" transform="rotate(-22 ${x} ${y})" fill="${colour}"/>`;
      const extra = last
        ? `<path d="M${x - 30} ${y}H${x + 30}" stroke="${INK}" stroke-opacity=".7" stroke-width="2"/>` +
          `<path d="M${x - 26} 32A26 22 0 0 1 ${x + 26} 32" stroke="${CRIMSON}" stroke-width="4" stroke-linecap="round"/><circle cx="${x}" cy="27" r="4.5" fill="${CRIMSON}"/>`
        : '';
      return extra + stem + head;
    })
    .join('');
  return (
    `<path d="${lines.map((y) => `M0 ${y}H${w}`).join('')}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.6"/>` +
    bars.join('') +
    repeat +
    time +
    drawn
  );
}

/** A fader of the desk: the slot, its scale, and the cap at its level. */
function fader(level: number, last: boolean) {
  const w = 140;
  const h = 280;
  const ticks = Array.from({ length: 13 }, (_, i) => {
    const y = 20 + i * 20;
    const long = i % 2 === 0;
    return `M${long ? 22 : 32} ${y}H52M88 ${y}H${long ? 118 : 108}`;
  }).join('');
  return (
    `<path d="${ticks}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>` +
    `<rect x="${w / 2 - 6}" y="12" width="12" height="${h - 24}" rx="6" fill="${INK}" fill-opacity=".85"/>` +
    `<rect x="${w / 2 - 44}" y="${level - 19 + 4}" width="88" height="38" rx="7" fill="${INK}" fill-opacity=".18"/>` +
    `<rect x="${w / 2 - 44}" y="${level - 19}" width="88" height="38" rx="7" fill="${last ? CRIMSON : INK}"/>` +
    `<rect x="${w / 2 - 44}" y="${level - 19}" width="88" height="14" rx="7" fill="${WHITE}" fill-opacity=".14"/>` +
    `<path d="M${w / 2 - 36} ${level}H${w / 2 + 36}" stroke="${WHITE}" stroke-opacity=".9" stroke-width="3"/>`
  );
}

/**
 * An orchestra seen from above: rows of chairs in arcs around the podium. `rows` are the radii
 * and the number of chairs in each; `colours` colour each row, or the chairs are empty.
 */
function orchestra(
  w: number,
  h: number,
  rows: [radius: number, chairs: number][],
  colours: (string | [string, number])[] | undefined,
  ghost: [number, number][] = [],
) {
  const cx = w / 2;
  const cy = h - 14;
  const chairs = rows
    .map(([r, n], row) => {
      const paint = colours?.[row];
      const [colour, alpha] = Array.isArray(paint) ? paint : [paint ?? MUTED, 1];
      return Array.from({ length: n }, (_, i) => {
        const a = 192 + (i * 156) / (n - 1);
        const [x, y] = pt(cx, cy, r, a);
        return `<rect x="-9" y="-7" width="18" height="14" rx="4" fill="${colour}" fill-opacity="${alpha}" transform="translate(${x} ${y}) rotate(${n1(a + 90)})"/>`;
      }).join('');
    })
    .join('');
  const empty = ghost
    .map(([r, n]) =>
      Array.from({ length: n }, (_, i) => {
        const a = 192 + (i * 156) / (n - 1);
        const [x, y] = pt(cx, cy, r, a);
        return `<rect x="-9" y="-7" width="18" height="14" rx="4" stroke="${INK}" stroke-opacity=".18" stroke-width="1.5" stroke-dasharray="3 3" transform="translate(${x} ${y}) rotate(${n1(a + 90)})"/>`;
      }).join(''),
    )
    .join('');
  const lead = colours ? CRIMSON : MUTED;
  return (
    `<rect width="${w}" height="${h}" rx="10" fill="${colours ? COBALT : INK}" fill-opacity="${colours ? 0.06 : 0.04}"/>` +
    empty +
    chairs +
    `<path d="M${cx - 30} ${cy + 14}A30 30 0 0 1 ${cx + 30} ${cy + 14}Z" fill="${lead}" fill-opacity=".2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="10" fill="${lead}"/>`
  );
}

/** A waveform across the width, played from the start up to `played`, with its playhead. */
function waveform(w: number, h: number, played: number) {
  const n = 168;
  const step = w / n;
  let done = '';
  let ahead = '';
  for (let i = 0; i < n; i++) {
    const t = i / (n - 1);
    const swell = 0.4 + 0.6 * Math.sin(Math.PI * Math.min(1, t * 1.08)) ** 0.7;
    const v =
      0.55 * Math.abs(Math.sin(i * 0.83 + 0.4)) +
      0.3 * Math.abs(Math.sin(i * 0.31 + 1.2)) +
      0.15 * Math.abs(Math.sin(i * 2.17));
    const bar = Math.max(6, (h - 8) * swell * (0.25 + 0.75 * v));
    // The song begins at the start: the right of a right-to-left slide.
    const x = n1(w - (i + 0.5) * step);
    const d = `M${x} ${n1((h - bar) / 2)}V${n1((h + bar) / 2)}`;
    if (t <= played) done += d;
    else ahead += d;
  }
  const head = n1(w - played * w);
  return (
    `<path d="${ahead}" stroke="${INK}" stroke-opacity=".22" stroke-width="${n1(step * 0.5)}" stroke-linecap="round"/>` +
    `<path d="${done}" stroke="${CRIMSON}" stroke-width="${n1(step * 0.5)}" stroke-linecap="round"/>` +
    `<path d="M${head} 0V${h}" stroke="${INK}" stroke-width="2"/>` +
    `<circle cx="${head}" cy="${h / 2}" r="9" fill="${INK}"/>`
  );
}

/** Small line pictograms of the slides' notes and closing lines, without a word. */
const ICONS = {
  ticket: (s: number, colour = INK) =>
    `<path d="M3 ${n1(s * 0.24)}H${s - 3}V${n1(s * 0.4)}A${n1(s * 0.1)} ${n1(s * 0.1)} 0 0 0 ${s - 3} ${n1(s * 0.6)}V${n1(s * 0.76)}H3V${n1(s * 0.6)}A${n1(s * 0.1)} ${n1(s * 0.1)} 0 0 0 3 ${n1(s * 0.4)}Z" stroke="${colour}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M${n1(s * 0.66)} ${n1(s * 0.3)}V${n1(s * 0.7)}" stroke="${colour}" stroke-width="2" stroke-dasharray="2 3"/>`,
  note: (s: number, colour = CRIMSON) =>
    `<ellipse cx="${n1(s * 0.32)}" cy="${n1(s * 0.8)}" rx="${n1(s * 0.24)}" ry="${n1(s * 0.17)}" transform="rotate(-24 ${n1(s * 0.32)} ${n1(s * 0.8)})" fill="${colour}"/>` +
    `<path d="M${n1(s * 0.53)} ${n1(s * 0.76)}V${n1(s * 0.06)}" stroke="${colour}" stroke-width="2.6"/>` +
    `<path d="M${n1(s * 0.53)} ${n1(s * 0.06)}C${n1(s * 0.58)} ${n1(s * 0.26)} ${n1(s * 0.92)} ${n1(s * 0.3)} ${n1(s * 0.82)} ${n1(s * 0.58)}" stroke="${colour}" stroke-width="3" stroke-linecap="round"/>`,
  headphones: (s: number, colour = INK) =>
    `<path d="M${n1(s * 0.14)} ${n1(s * 0.62)}V${n1(s * 0.5)}A${n1(s * 0.36)} ${n1(s * 0.36)} 0 0 1 ${n1(s * 0.86)} ${n1(s * 0.5)}V${n1(s * 0.62)}" stroke="${colour}" stroke-width="2.6" stroke-linecap="round"/>` +
    `<rect x="${n1(s * 0.08)}" y="${n1(s * 0.56)}" width="${n1(s * 0.2)}" height="${n1(s * 0.34)}" rx="${n1(s * 0.06)}" fill="${CRIMSON}"/>` +
    `<rect x="${n1(s * 0.72)}" y="${n1(s * 0.56)}" width="${n1(s * 0.2)}" height="${n1(s * 0.34)}" rx="${n1(s * 0.06)}" fill="${CRIMSON}"/>`,
  disc: (s: number, colour = BLUSH) =>
    `<circle cx="${s / 2}" cy="${s / 2}" r="${n1(s / 2 - 2)}" stroke="${colour}" stroke-width="2.4"/>` +
    `<circle cx="${s / 2}" cy="${s / 2}" r="${n1(s * 0.16)}" fill="${AMBER}"/>` +
    `<path d="${arc(s / 2, s / 2, s * 0.32, 200, 250)}" stroke="${colour}" stroke-width="2" stroke-linecap="round"/>`,
  pencil: (s: number, colour = BLUSH) =>
    `<path d="M${n1(s * 0.18)} ${n1(s * 0.82)}L${n1(s * 0.24)} ${n1(s * 0.6)}L${n1(s * 0.68)} ${n1(s * 0.16)}L${n1(s * 0.84)} ${n1(s * 0.32)}L${n1(s * 0.4)} ${n1(s * 0.76)}Z" stroke="${colour}" stroke-width="2.4" stroke-linejoin="round"/>` +
    `<path d="M${n1(s * 0.58)} ${n1(s * 0.26)}L${n1(s * 0.74)} ${n1(s * 0.42)}" stroke="${AMBER}" stroke-width="2.4"/>`,
  dot: (s: number) =>
    `<circle cx="${s / 2}" cy="${s / 2}" r="${n1(s * 0.22)}" fill="${CRIMSON}"/><circle cx="${s / 2}" cy="${s / 2}" r="${n1(s / 2 - 2)}" stroke="${CRIMSON}" stroke-opacity=".4" stroke-width="2"/>`,
};

function layouts(): Layout[] {
  const kit = drumKit();
  const sheet = at(START, 236, WIDTH, 680);
  const tableCase = at(START, 252, WIDTH, 608);
  const ticket = at(176, 190, 1568, 640);
  const stub = 440;

  return [
    {
      id: 'l_hadran_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(KICK, 300, 760, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 346, 820, 252), 'display'),
        place('p_subtitle', 'subtitle', at(START, 618, 760, 126), 'heading'),
        place('p_meta', 'caption', at(KICK, 812, 780, 34), 'caption'),
      ],
      decorations: [
        ...turntable(),
        play('d_hadran_hero_play', 300),
        rect('d_hadran_hero_rule', at(START, 780, 760, 2), solid(token('text', 0.14))),
        art('d_hadran_hero_live', at(START, 816, 26, 26), ICONS.dot(26)),
      ],
    },
    {
      id: 'l_hadran_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', kit.number, 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('text'),
        }),
        place('p_kicker', 'caption', at(KICK, 372, 700, 34), 'caption', {
          color: token('accent'),
        }),
        place('p_title', 'title', at(START, 418, 800, 252), 'display', {
          vAlign: 'middle',
          color: token('bg'),
        }),
        place('p_subtitle', 'subtitle', at(START, 704, 760, 90), 'heading', {
          color: token('bg', 0.8),
        }),
      ],
      decorations: [
        art('d_hadran_section_stage', { x: 0, y: 0, w: W, h: H }, stage('d_hadran_section_stage', 510, false)),
        ...kit.decorations,
        play('d_hadran_section_play', 372, AMBER),
      ],
    },
    {
      id: 'l_hadran_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1000).placeholders,
        place('p_number', 'number', at(START, 576, 620, 130), 'display', {
          color: token('primary'),
        }),
        place('p_label', 'subtitle', at(START, 712, 620, 84), 'heading'),
        place('p_note', 'body', at(START, 800, 620, 84), 'body'),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_number${i + 2}`, 'number', atEnd(END + 418, 278 + i * 206, 400, 80), 'title', {
            color: token('secondary'),
          }),
          place(`p_label${i + 2}`, 'caption', atEnd(END + 418, 360 + i * 206, 400, 70), 'caption'),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1000).decorations,
        upright('d_hadran_big_number_meter', at(START, 258, 620, 300), vuMeter('d_hadran_big_number_meter', 620, 300)),
        ...[0, 1, 2].map((i) =>
          lifted(
            art(`d_hadran_big_number_rack${i + 1}`, atEnd(END, 258 + i * 206, 900, 190), rackUnit(900, 190, [12, 15, 18][i]!)),
            8,
            20,
            0.1,
          ),
        ),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_hadran_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(300, 326, 900, 380), 'title'),
        place('p_attribution', 'attribution', atEnd(ticket.x + 52, 330, 336, 100), 'heading', {
          vAlign: 'bottom',
        }),
        place('p_caption', 'caption', atEnd(ticket.x + 52, 450, 336, 140), 'caption', {
          vAlign: 'top',
        }),
        ...foot('quote').placeholders,
      ],
      decorations: [
        lifted(
          art(
            'd_hadran_quote_ticket',
            ticket,
            (() => {
              const w = ticket.w;
              const h = ticket.h;
              const notch = 26;
              const r = 18;
              const shape =
                `M${r} 0H${stub - notch}A${notch} ${notch} 0 0 0 ${stub + notch} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}` +
                `V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${stub + notch}A${notch} ${notch} 0 0 0 ${stub - notch} ${h}H${r}A${r} ${r} 0 0 1 0 ${h - r}V${r}A${r} ${r} 0 0 1 ${r} 0Z`;
              const band = `M${w - 70} 0H${w - r}A${r} ${r} 0 0 1 ${w} ${r}V${h - r}A${r} ${r} 0 0 1 ${w - r} ${h}H${w - 70}Z`;
              const waves = Array.from({ length: 7 }, (_, i) => {
                let d = `M${w - 70 + 10 * i + 5} 0`;
                for (let y = 0; y <= h; y += 8) d += `L${n1(w - 70 + 10 * i + 5 + Math.sin(y / 14 + i) * 3)} ${y}`;
                return d;
              }).join('');
              const guilloche = Array.from({ length: 8 }, (_, i) => {
                let d = '';
                for (let x = stub + 60; x <= w - 110; x += 5) {
                  const y =
                    h - 112 + (i % 4) * 8 + Math.sin(x / (i < 4 ? 26 : 19) + i * 0.9) * (i < 4 ? 14 : 10);
                  d += `${x === stub + 60 ? 'M' : 'L'}${x} ${n1(y)}`;
                }
                return d;
              }).join('');
              const barcode = Array.from({ length: 40 }, (_, i) => {
                const bw = [2, 4, 2, 6, 3, 2, 5, 2][i % 8]!;
                return `<rect x="${52 + i * 8.4}" y="${h - 152}" width="${bw}" height="78" fill="${INK}"/>`;
              }).join('');
              return (
                `<path d="${shape}" fill="${WHITE}"/>` +
                `<path d="${band}" fill="${CRIMSON}"/>` +
                `<path d="${waves}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="1.5"/>` +
                `<rect x="${stub + 44}" y="${h - 146}" width="${w - stub - 138}" height="96" rx="8" fill="${CRIMSON}" fill-opacity=".05"/>` +
                `<path d="${guilloche}" stroke="${CRIMSON}" stroke-opacity=".3" stroke-width="1.4"/>` +
                `<path d="M${stub} 40V${h - 40}" stroke="${INK}" stroke-opacity=".3" stroke-width="2.4" stroke-dasharray="2 9" stroke-linecap="round"/>` +
                `<circle cx="${stub - 64}" cy="66" r="17" fill="${BLUSH}" stroke="${INK}" stroke-opacity=".15" stroke-width="1.5"/>` +
                `<path d="M52 424H${stub - 52}" stroke="${INK}" stroke-opacity=".2" stroke-width="2"/>` +
                barcode
              );
            })(),
          ),
          22,
          50,
          0.16,
        ),
        upright(
          'd_hadran_quote_marks',
          at(300, 236, 96, 74),
          `<path d="M8 74V44C8 18 22 4 44 0L48 10C34 16 28 26 28 40H44V74Z M56 74V44C56 18 70 4 92 0L96 10C82 16 76 26 76 40H92V74Z" fill="${CRIMSON}"/>`,
        ),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_hadran_text',
      name: 'Text',
      archetype: 'text',
      // The setlist: a sheet taped to the stage from margin to margin, down to over the foot,
      // the text from its top; a pick dropped on its corner.
      placeholders: [
        place('p_title', 'title', at(KICK, 114, WIDTH - 220, 90), 'title'),
        place('p_body', 'body', at(START + 72, sheet.y + 66, WIDTH - 144, 500), 'body'),
      ],
      decorations: [
        play('d_hadran_text_play', 136),
        card('d_hadran_text_sheet', sheet, 6),
        // Gaffer tape over the two top corners of the sheet.
        art('d_hadran_text_tape1', at(START - 44, 206, 200, 76), gaffer(9)),
        art('d_hadran_text_tape2', atEnd(END - 44, 206, 200, 76), gaffer(-7)),
        // A pick left on the sheet's last corner, clear of the text.
        lifted(
          art(
            'd_hadran_text_plectrum',
            atEnd(END + 26, 790, 108, 116),
            `<g transform="rotate(-18 54 58)"><g transform="translate(12 12)">${pick(84, 92)}</g></g>`,
          ),
          6,
          12,
          0.22,
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_hadran_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 960).placeholders,
        place('p_image', 'image', atEnd(290, 240, 620, 620)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 86, 298 + i * 190, 720, 46), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 86, 348 + i * 190, 720, 120), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 960).decorations,
        // The record sliding out of the sleeve, the photograph, toward the edge.
        art('d_hadran_text_image_record', atEnd(10, 262, 576, 576), record(288, 288, 284, CRIMSON)),
        rect('d_hadran_text_image_sleeve', atEnd(290, 240, 620, 620), solid(token('text')), {
          effects: { shadow: { x: 0, y: 22, blur: 50, color: { value: '#3a0f1c', alpha: 0.3 } } },
        }),
        art(
          'd_hadran_text_image_groove',
          at(START + 22, 362, 14, 318),
          `<path d="M7 2V316" stroke="${INK}" stroke-opacity=".25" stroke-width="2" stroke-dasharray="1 7" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          numberRecord(`d_hadran_text_image_marker${i + 1}`, at(START, 294 + i * 190, 58, 58), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_hadran_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', at(0, 0, W, 600)),
        place('p_place', 'caption', at(KICK, 706, 760, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 748, 900, 252), 'display'),
        place('p_body', 'body', atEnd(END, 770, 620, 210), 'body', { vAlign: 'middle' }),
      ],
      decorations: [
        art('d_hadran_full_image_wave', at(START, 622, WIDTH, 58), waveform(WIDTH, 58, 0.62)),
        play('d_hadran_full_image_play', 706),
        rect('d_hadran_full_image_rule', atEnd(END + 664, 780, 2, 190), solid(token('text', 0.16))),
      ],
    },
    {
      id: 'l_hadran_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          // The label is written on the strip of the cassette's label.
          place(`p_label${i + 1}`, 'caption', at(s + 84, 308, 352, 48), 'caption', {
            color: token('text'),
            vAlign: 'middle',
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 28, 580, 464, 84), 'heading'),
          place(`p_card${i + 1}_body`, 'body', at(s + 28, 666, 464, 158), 'body'),
        ]),
        place('p_note', 'body', at(KICK, 868, 1500, 42), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => [
          card(`d_hadran_cards_card${i + 1}`, at(s, 252, 520, 594), 10),
          art(
            `d_hadran_cards_cassette${i + 1}`,
            at(s + 28, 278, 464, 280),
            cassette(`d_hadran_cards_cassette${i + 1}`, [CRIMSON, COBALT, AMBER][i]!, (
              [
                [44, 22],
                [33, 33],
                [22, 44],
              ] as [number, number][]
            )[i]!),
          ),
        ]),
        art('d_hadran_cards_note_icon', at(START, 877, 26, 26), ICONS.ticket(26, CRIMSON)),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_hadran_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 476, 380, 74), 'title', {
            color: i === 3 ? token('primary') : token('text'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 556, 380, 84), 'heading'),
          place(`p_stop${i + 1}_body`, 'body', at(s, 644, 380, 160), 'body'),
        ]),
        place('p_note', 'caption', at(KICK, 862, 1450, 36), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        upright('d_hadran_timeline_staff', at(START, 240, WIDTH, 222), staff(WIDTH, true), staff(WIDTH, false)),
        // A note reads one way in both directions.
        upright('d_hadran_timeline_note_icon', at(START, 863, 26, 32), ICONS.note(26)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_hadran_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => [
          place(`p_station${i + 1}`, 'number', at(s, 268, 300, 76), 'title', {
            align: 'center',
            vAlign: 'middle',
            color: i === 4 ? token('primary') : token('secondary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 666, 300, 46), 'heading', { align: 'center' }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 714, 300, 104), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 62, 850, WIDTH - 62, 42), 'body'),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        ...steps5.map((s, i) => card(`d_hadran_process_strip${i + 1}`, at(s, 256, 300, 392), 14)),
        art(
          'd_hadran_process_automation',
          at(START, 352, WIDTH, 280),
          (() => {
            const xs = steps5.map((s) => WIDTH - (s - START) - 150);
            const pts: [number, number][] = xs.map((x, i) => [x, FADERS[i]!]);
            return (
              `<path d="M${n1(xs[0]! + 150)} ${FADERS[0]}H${xs[0]}" stroke="${CRIMSON}" stroke-opacity=".35" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>` +
              `<path d="${curve(pts)}" stroke="${CRIMSON}" stroke-opacity=".6" stroke-width="3" stroke-dasharray="2 8" stroke-linecap="round"/>`
            );
          })(),
        ),
        ...steps5.map((s, i) =>
          art(`d_hadran_process_fader${i + 1}`, at(s + 80, 352, 140, 280), fader(FADERS[i]!, i === 4)),
        ),
        art('d_hadran_process_note_icon', at(START, 850, 40, 40), ICONS.headphones(40)),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_hadran_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(START, 262, 790, 606)],
            ['after', atEnd(END, 262, 790, 606)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 44, y: 544, w: 710, h: 36 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 44, y: 584, w: 710, h: 84 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 44, y: 670, w: 710, h: 160 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        card('d_hadran_comparison_before', at(START, 262, 790, 606)),
        card('d_hadran_comparison_after', atEnd(END, 262, 790, 606)),
        art(
          'd_hadran_comparison_then',
          at(START + 24, 286, 742, 236),
          orchestra(742, 236, [
            [84, 5],
            [132, 7],
          ], undefined, [
            [176, 18],
            [214, 22],
          ]),
        ),
        art(
          'd_hadran_comparison_now',
          atEnd(END + 24, 286, 742, 236),
          orchestra(
            742,
            236,
            [
              [70, 10],
              [108, 14],
              [146, 18],
              [184, 22],
            ],
            [CRIMSON, [CRIMSON, 0.6], COBALT, AMBER],
          ),
        ),
        art(
          'd_hadran_comparison_arrow',
          atEnd(926, 372, 68, 68),
          `<circle cx="34" cy="34" r="32" fill="${WHITE}" stroke="${INK}" stroke-width="2"/><path d="M46 34H22M31 24L21 34L31 44" stroke="${CRIMSON}" stroke-width="3.2" stroke-linecap="round" stroke-linejoin="round"/>`,
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_hadran_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(KICK, 350, 1020, 468)),
        place('p_source', 'caption', at(KICK, 826, 1020, 52), 'caption'),
        place('p_figure1', 'number', atEnd(END, 292, 480, 132), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 430, 480, 120), 'body'),
        place('p_figure2', 'number', atEnd(END, 596, 480, 132), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 734, 480, 120), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1080).decorations,
        card('d_hadran_chart_panel', at(START, 256, 1092, 640), 20),
        art(
          'd_hadran_chart_amp',
          at(START, 256, 1092, 74),
          (() => {
            const w = 1092;
            const knobs = [-60, -24, 8, 40, 76, 118]
              .map((turn, k) => {
                const x = w - 112 - k * 96;
                const dots = Array.from({ length: 11 }, (_, i) => {
                  const [dx, dy] = pt(x, 37, 27, -225 + i * 27);
                  return `<circle cx="${dx}" cy="${dy}" r="1.6"/>`;
                }).join('');
                const [px, py] = pt(x, 37, 15, turn - 90);
                return (
                  `<g fill="${WHITE}" fill-opacity=".45">${dots}</g>` +
                  `<circle cx="${x}" cy="37" r="19" fill="${INK}" stroke="${WHITE}" stroke-opacity=".6" stroke-width="2"/>` +
                  `<circle cx="${x}" cy="37" r="12" fill="${WHITE}" fill-opacity=".12"/>` +
                  `<path d="M${x} 37L${px} ${py}" stroke="${WHITE}" stroke-width="3" stroke-linecap="round"/>`
                );
              })
              .join('');
            return (
              `<path d="M0 74V20A20 20 0 0 1 20 0H${w - 20}A20 20 0 0 1 ${w} 20V74Z" fill="${INK}"/>` +
              `<path d="M0 73H${w}" stroke="${AMBER}" stroke-opacity=".7" stroke-width="2"/>` +
              knobs +
              `<circle cx="60" cy="37" r="20" fill="${CRIMSON}" fill-opacity=".25"/><circle cx="60" cy="37" r="11" fill="${CRIMSON}"/><circle cx="56" cy="33" r="3.5" fill="${WHITE}" fill-opacity=".7"/>` +
              `<circle cx="${w - 46}" cy="37" r="13" fill="${WHITE}" fill-opacity=".7"/><circle cx="${w - 46}" cy="37" r="6" fill="${INK}"/>`
            );
          })(),
        ),
        rect('d_hadran_chart_rule', atEnd(END, 574, 480, 1.5), solid(token('text', 0.14))),
        art('d_hadran_chart_key1', atEnd(END, 316, 58, 58), record(29, 29, 28, CRIMSON)),
        art('d_hadran_chart_key2', atEnd(END, 622, 58, 58), ICONS.ticket(58, COBALT)),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_hadran_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 44, 286, WIDTH - 88, 540)),
        place('p_note', 'caption', at(KICK, 882, 1500, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1200).decorations,
        lifted(
          art(
            'd_hadran_table_case',
            tableCase,
            `<rect width="${tableCase.w}" height="${tableCase.h}" rx="16" fill="${INK}"/>` +
              `<rect x="3" y="3" width="${tableCase.w - 6}" height="${tableCase.h - 6}" rx="14" stroke="${WHITE}" stroke-opacity=".2" stroke-width="2"/>` +
              `<rect x="22" y="22" width="${tableCase.w - 44}" height="${tableCase.h - 44}" rx="6" fill="${WHITE}"/>`,
          ),
          16,
          36,
          0.18,
        ),
        ...(
          [
            ['ts', at(START - 8, 244, 76, 76), 90],
            ['te', atEnd(END - 8, 244, 76, 76), 0],
            ['bs', at(START - 8, 792, 76, 76), 180],
            ['be', atEnd(END - 8, 792, 76, 76), 270],
          ] as const
        ).map(([corner, f, turn]) =>
          art(
            `d_hadran_table_corner_${corner}`,
            f,
            `<g transform="rotate(${turn} 38 38)">` +
              `<path d="M6 2H58A8 8 0 0 1 64 15L15 64A8 8 0 0 1 2 58V6A4 4 0 0 1 6 2Z" fill="${WHITE}" stroke="${MUTED}" stroke-width="2"/>` +
              `<path d="M12 12H48L12 48Z" fill="${MUTED}" fill-opacity=".14"/>` +
              `<circle cx="20" cy="20" r="4" fill="${MUTED}"/><circle cx="44" cy="12" r="3.2" fill="${MUTED}"/><circle cx="12" cy="44" r="3.2" fill="${MUTED}"/></g>`,
          ),
        ),
        art(
          'd_hadran_table_handle',
          at(W / 2 - 120, 230, 240, 46),
          `<rect x="1" y="1" width="238" height="44" rx="12" fill="${WHITE}" stroke="${MUTED}" stroke-width="2"/>` +
            `<rect x="30" y="14" width="180" height="18" rx="9" fill="${INK}" fill-opacity=".85"/>` +
            `<circle cx="14" cy="23" r="3.2" fill="${MUTED}"/><circle cx="226" cy="23" r="3.2" fill="${MUTED}"/>`,
        ),
        art('d_hadran_table_note_icon', at(START, 887, 26, 26), ICONS.ticket(26, CRIMSON)),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_hadran_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s + 24, 384, 336, 296)),
          place(`p_city${i + 1}`, 'caption', at(s + 24, 696, 336, 34), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s + 24, 732, 336, 46), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s + 24, 782, 336, 118), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        ...team4.flatMap((s, i) => {
          const colour = [CRIMSON, COBALT, AMBER, INK][i]!;
          const strap = `d_hadran_team_lanyard${i + 1}`;
          return [
            art(
              strap,
              at(s + 142, 226, 100, 86),
              `<defs><linearGradient id="${strap}-fade" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${colour}" stop-opacity="0"/><stop offset=".45" stop-color="${colour}"/></linearGradient></defs>` +
                `<path d="M4 0L40 66H52L18 0Z" fill="url(#${strap}-fade)"/>` +
                `<path d="M96 0L60 66H48L82 0Z" fill="url(#${strap}-fade)"/>` +
                `<rect x="38" y="58" width="24" height="18" rx="4" fill="${WHITE}" stroke="${MUTED}" stroke-width="2"/>` +
                `<path d="M50 74V86" stroke="${MUTED}" stroke-width="3" stroke-linecap="round"/>`,
            ),
            lifted(
              art(
                `d_hadran_team_pass${i + 1}`,
                at(s, 304, 384, 612),
                `<rect x=".75" y=".75" width="382.5" height="610.5" rx="20" fill="${WHITE}" stroke="${INK}" stroke-opacity=".12" stroke-width="1.5"/>` +
                  `<path d="M.75 66V20A19.25 19.25 0 0 1 20 .75H364A19.25 19.25 0 0 1 383.25 20V66Z" fill="${colour}"/>` +
                  `<rect x="152" y="18" width="80" height="16" rx="8" fill="${BLUSH}" stroke="${INK}" stroke-opacity=".2" stroke-width="1.5"/>` +
                  `<path d="${Array.from({ length: 6 }, (_, k) => `M${296 + k * 12} 56L${306 + k * 12} 44`).join('')}" stroke="${WHITE}" stroke-opacity=".5" stroke-width="3" stroke-linecap="round"/>` +
                  `<circle cx="48" cy="44" r="13" fill="${WHITE}" fill-opacity=".85"/><circle cx="48" cy="44" r="7" fill="${colour}"/>`,
              ),
              12,
              28,
              0.16,
            ),
          ];
        }),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_hadran_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(KICK, 254, 860, 34), 'caption', {
          color: token('accent'),
        }),
        place('p_title', 'title', at(START, 300, 860, 252), 'display', { color: token('bg') }),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 58, 588 + i * 84, 820, 76), 'body', {
            vAlign: 'top',
            color: token('bg', 0.9),
          }),
        ),
        place('p_meta', 'caption', at(KICK, 896, 860, 36), 'caption', {
          color: token('bg', 0.72),
        }),
      ],
      decorations: [
        art('d_hadran_closing_stage', { x: 0, y: 0, w: W, h: H }, stage('d_hadran_closing_stage', 460, true)),
        // The microphone on its stand, in the light: the stand, its base, the capsule.
        art(
          'd_hadran_closing_stand',
          atEnd(410, 500, 100, 470),
          `<path d="M50 0V458" stroke="${WHITE}" stroke-opacity=".7" stroke-width="12" stroke-linecap="round"/>` +
            `<rect x="40" y="170" width="20" height="26" rx="4" fill="${WHITE}" fill-opacity=".85"/>` +
            `<path d="M58 30C96 70 92 150 66 214C44 268 30 330 60 390C76 422 88 446 96 470" stroke="${INK}" stroke-width="7" stroke-linecap="round"/>` +
            `<path d="M58 30C96 70 92 150 66 214C44 268 30 330 60 390C76 422 88 446 96 470" stroke="${WHITE}" stroke-opacity=".22" stroke-width="2" stroke-linecap="round"/>`,
        ),
        art(
          'd_hadran_closing_base',
          atEnd(340, 928, 240, 60),
          `<ellipse cx="120" cy="34" rx="116" ry="24" fill="${INK}" stroke="${WHITE}" stroke-opacity=".45" stroke-width="2"/>` +
            `<ellipse cx="120" cy="28" rx="90" ry="14" fill="${WHITE}" fill-opacity=".12"/>`,
        ),
        art(
          'd_hadran_closing_mic',
          atEnd(330, 130, 260, 400),
          (() => {
            const id = 'd_hadran_closing_mic';
            const ribs = Array.from({ length: 16 }, (_, i) => `M40 ${34 + i * 16}H220`).join('');
            return (
              `<defs>` +
              `<linearGradient id="${id}-chrome" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${MUTED}"/><stop offset=".18" stop-color="${WHITE}"/><stop offset=".45" stop-color="${MUTED}" stop-opacity=".9"/><stop offset=".7" stop-color="${WHITE}"/><stop offset="1" stop-color="${MUTED}"/></linearGradient>` +
              `<clipPath id="${id}-grille"><rect x="34" y="14" width="192" height="282" rx="80"/></clipPath>` +
              `</defs>` +
              `<rect x="30" y="10" width="200" height="290" rx="84" fill="url(#${id}-chrome)"/>` +
              `<g clip-path="url(#${id}-grille)"><path d="${ribs}" stroke="${INK}" stroke-opacity=".55" stroke-width="7"/></g>` +
              `<rect x="114" y="10" width="32" height="290" rx="16" fill="url(#${id}-chrome)"/>` +
              `<rect x="30" y="10" width="200" height="290" rx="84" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/>` +
              `<path d="M62 70C58 120 58 190 66 240" stroke="${WHITE}" stroke-opacity=".7" stroke-width="5" stroke-linecap="round"/>` +
              `<rect x="108" y="298" width="44" height="42" rx="6" fill="url(#${id}-chrome)" stroke="${INK}" stroke-opacity=".4" stroke-width="1.5"/>` +
              `<circle cx="168" cy="318" r="14" fill="url(#${id}-chrome)" stroke="${INK}" stroke-opacity=".4" stroke-width="1.5"/>` +
              `<rect x="118" y="340" width="24" height="60" rx="4" fill="url(#${id}-chrome)"/>`
            );
          })(),
        ),
        play('d_hadran_closing_play', 254, AMBER),
        ...[0, 1, 2].map((i) =>
          art(
            `d_hadran_closing_icon${i + 1}`,
            at(START, 592 + i * 84, 36, 36),
            [ICONS.disc(36), ICONS.ticket(36, BLUSH), ICONS.pencil(36)][i]!,
          ),
        ),
        art('d_hadran_closing_live', at(START, 901, 26, 26), ICONS.dot(26)),
        mark('d_hadran_closing_mark', at(START, 96, 48, 48), true),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the meter, the figures, the music) moved across as they are, or drawn for it.
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
// The sample: Night Tram Records launches its 2027 season

const TABLE_COLS = [250, 250, 190, 440, 446];
const TABLE_ROW = 84;
const RECORDS = [6.1, 9.4, 13.2, 18.5];
const TICKETS = [11.8, 17.5, 25.9, 34.2];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari meet across lines set as tight as Latin display type.
 * The display titles of the opening, a part, the full image and the closing, and every other
 * title. Two display lines fill their 252px boxes at 1.05; Teko's Devanagari, short for its
 * size, keeps its signs apart there.
 */
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number }>
> = {
  hi: { display: 1.05, title: 1.32, subtitle: 1.44 },
};
const DISPLAYED = new Set([
  'l_hadran_hero',
  'l_hadran_section',
  'l_hadran_full_image',
  'l_hadran_closing',
]);

/** The sample deck in one language, from its copy. */
function sample(copy: HadranCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: HadranCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_hadran_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_hadran_text',
      name: copy.setlist.name,
      content: {
        title: lines(copy.setlist.title),
        body: {
          paragraphs: [
            ...lines(copy.setlist.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 46 } : p,
            ),
            ...points(copy.setlist.items, { kind: 'number', mark: token('primary'), gap: 34 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_hadran_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_hadran_big_number',
      name: copy.season.name,
      content: {
        caption: [
          text(copy.season.kicker),
          ...copy.season.others.map(([, label]) => text(label)),
        ],
        title: lines(copy.season.title),
        number: [
          text(copy.season.hero.value),
          ...copy.season.others.map(([value]) => text(value)),
        ],
        subtitle: text(copy.season.hero.label),
        body: lines(copy.season.hero.note),
        footer,
      },
    },
    {
      layout: 'l_hadran_chart',
      name: copy.growth.name,
      content: {
        caption: [text(copy.growth.kicker), text(copy.growth.source)],
        title: lines(copy.growth.title),
        number: copy.growth.figures.map(([value]) => text(value)),
        body: copy.growth.figures.map(([, body]) => lines(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.growth.series[0], values: RECORDS },
            { name: copy.growth.series[1], values: TICKETS },
          ],
        },
      },
    },
    {
      layout: 'l_hadran_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_hadran_text_image',
      name: copy.room.name,
      content: {
        caption: text(copy.room.kicker),
        title: lines(copy.room.title),
        image: { assetId: pictures.studio.id },
        subtitle: copy.room.items.map(([title]) => text(title)),
        body: copy.room.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_hadran_process',
      name: copy.making.name,
      content: {
        caption: [
          text(copy.making.kicker),
          ...copy.making.steps.map(([, caption]) => text(caption)),
        ],
        title: lines(copy.making.title),
        number: copy.making.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.making.steps.map(([step]) => text(step)),
        body: text(copy.making.note),
        footer,
      },
    },
    {
      layout: 'l_hadran_cards',
      name: copy.stages.name,
      content: {
        caption: [text(copy.stages.kicker), ...copy.stages.cards.map(([label]) => text(label))],
        title: lines(copy.stages.title),
        subtitle: copy.stages.cards.map(([, title]) => text(title)),
        body: [...copy.stages.cards.map(([, , body]) => lines(body)), text(copy.stages.note)],
        footer,
      },
    },
    {
      layout: 'l_hadran_timeline',
      name: copy.calendar.name,
      content: {
        caption: [text(copy.calendar.kicker), text(copy.calendar.note)],
        title: lines(copy.calendar.title),
        number: copy.calendar.stops.map(([when]) => text(when)),
        subtitle: copy.calendar.stops.map(([, title]) => text(title)),
        body: copy.calendar.stops.map(([, , body]) => lines(body)),
        footer,
      },
    },
    {
      layout: 'l_hadran_table',
      name: copy.tour.name,
      content: {
        caption: [text(copy.tour.kicker), text(copy.tour.note)],
        title: lines(copy.tour.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.tour.header, ...copy.tour.rows],
      },
    },
    {
      layout: 'l_hadran_full_image',
      name: copy.depot.name,
      content: {
        image: { assetId: pictures.concert.id },
        caption: text(copy.depot.place),
        title: text(...copy.depot.title),
        body: text(copy.depot.body),
      },
    },
    {
      layout: 'l_hadran_comparison',
      name: copy.school.name,
      content: {
        caption: [text(copy.school.kicker), text(copy.school.before[0]), text(copy.school.after[0])],
        title: lines(copy.school.title),
        subtitle: [text(copy.school.before[1]), text(copy.school.after[1])],
        body: [text(copy.school.before[2]), text(copy.school.after[2])],
        footer,
      },
    },
    {
      layout: 'l_hadran_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([city]) => text(city))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => lines(role)),
        footer,
      },
    },
    {
      layout: 'l_hadran_closing',
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
export const hadranSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => HADRAN_COPY[lang]).map((lang) => [
    lang,
    sample(HADRAN_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Hadran template: the theme, its layouts for both directions, and its sample deck. */
export function hadranTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(hadranTheme),
    description:
      'Encore, the night of a record label: blush sleeve paper and a dark stage, a turntable, a kick drum, a VU meter, a concert ticket, cassettes, a staff of music, faders, backstage passes and a microphone in the spotlight, written for every language of the app.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.studio, pictures.concert, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, hadranSamples.he);
  return finished;
}

export const entry = { id: 'hadran', template: hadranTemplate, samples: hadranSamples };
