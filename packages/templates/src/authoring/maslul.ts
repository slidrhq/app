import {
  CONTENT_LANGUAGES,
  type ContentLanguage,
  type Element,
  type Frame,
  type Layout,
  type Localized,
  type Theme,
} from '@slidr/model';
import type { RoleFill } from '../createSlide';
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
import { MASLUL_COPY, type MaslulCopy } from './maslul/copy';
import { picture } from './pictures';

const pictures = {
  blocks: picture('maslulBlocks'),
  dawn: picture('maslulDawn'),
  team: [1, 2, 3, 4].map((n) => picture(`maslulTeam${n}`)),
};

/**
 * Maslul (Track): the slide is the athletics stadium, seen by those who train in it. A cool
 * chalk ground under the floodlights, with the red kerb of the track along its foot; on it the
 * things of the track, each doing a job: the opening is the bend of an eight-lane track with its
 * staggered start and painted lane numbers, a part's number is painted in a lane of the straight
 * beside the starting blocks, a figure stands on the face of a stopwatch, the quote hangs beside a
 * medal on its ribbon, the cards are race bibs with their four safety pins, the season is a relay
 * with its exchange zones, the steps are hurdles, then and now are the two halves of a scoreboard,
 * the table is on a coach's clipboard, the coaches wear accreditation passes, and the closing is
 * the whole oval from above. Track red for the lanes, navy for the kit, timing yellow for what is
 * measured. For clubs, coaches, athletes, competitions, fitness programmes and sports events.
 *
 * No drawing holds a word, so one set of layouts reads in every language; the figures painted on
 * the track are drawn upright in both directions. Oswald (Karantina in Hebrew) for what is called
 * out, in capitals, and Golos Text (Heebo in Hebrew) for what is read.
 */
export const maslulTheme: Theme = {
  id: 'maslul',
  name: 'Track',
  colors: {
    bg: '#f1f2f4',
    surface: '#ffffff',
    text: '#0f1529',
    muted: '#5a6072',
    primary: '#c4362b',
    secondary: '#22305e',
    accent: '#f2b705',
    chart: ['#c4362b', '#22305e', '#f2b705', '#7b879e', '#2f8f5b', '#e8826f'],
  },
  // A condensed face of the stadium's boards and bibs for what is called out (Oswald, with
  // Karantina for Hebrew), and a plain grotesque for what is read (Golos Text, Heebo for Hebrew).
  fonts: {
    heading: { he: 'Karantina', latin: 'Oswald' },
    body: { he: 'Heebo', latin: 'Golos Text' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 132,
      weight: 700,
      lineHeight: 0.98,
      letterSpacing: 0.5,
      color: { token: 'text' },
      case: 'upper',
    },
    title: {
      font: 'heading',
      size: 64,
      weight: 700,
      lineHeight: 1.06,
      letterSpacing: 0.4,
      color: { token: 'text' },
      case: 'upper',
    },
    heading: { font: 'heading', size: 38, weight: 700, lineHeight: 1.18, color: { token: 'text' } },
    body: { font: 'body', size: 26, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 600,
      lineHeight: 1.4,
      letterSpacing: 0.4,
      color: { token: 'muted' },
    },
  },
  radius: 10,
  shadow: { x: 0, y: 14, blur: 34, color: { value: '#0f1529', alpha: 0.1 } },
  // The ground: chalk under a floodlight's glow from above, and the kerb of the track along the
  // foot of the slide, red with its white line.
  background: {
    fill: {
      kind: 'css',
      value: [
        'linear-gradient(to top, transparent 9px, var(--color-surface) 9px, var(--color-surface) 11.5px, transparent 11.5px)',
        'linear-gradient(to top, var(--color-primary) 16px, transparent 16px)',
        'radial-gradient(120% 70% at 50% 0%, color-mix(in srgb, var(--color-surface) 75%, transparent), transparent 72%)',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The chalk alone, without the kerb and the light.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#0f1529';
const MUTED = '#5a6072';
const RED = '#c4362b';
const NAVY = '#22305e';
const GOLD = '#f2b705';
const CHALK = '#f1f2f4';
const WHITE = '#ffffff';
/** The grass of the infield and the metal of pins, clips and blocks, which no token holds. */
const GRASS = '#3f8a55';
const STEEL = '#aab2c0';
const STEEL_DARK = '#6c7586';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [RED]: token('primary'),
  [NAVY]: token('secondary'),
  [GOLD]: token('accent'),
  [CHALK]: token('bg'),
  [WHITE]: token('surface'),
};

/** The heading face, for the figures painted on the track. */
const FIGURES = `font-family="Oswald, Karantina, sans-serif" font-weight="700"`;

const RAD = Math.PI / 180;
const r1 = (v: number) => Math.round(v * 10) / 10;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings a left-to-right deck must not see mirrored: those with figures in them, and the
 * stopwatch, whose time runs clockwise. Their mirror moves them to the other side and leaves them
 * as they are, or takes the drawing given for that direction.
 */
const UPRIGHT = new Map<string, string | undefined>();

const upright = (id: string, frame: Frame, body: string, ltr?: string) => {
  UPRIGHT.set(id, ltr === undefined ? undefined : svg(frame.w, frame.h, ltr));
  return art(id, frame, body);
};

/** A soft shadow under a thing that lies on the ground: a bib, a pass, a clipboard. */
const lifted = (element: Element, y = 12, blur = 28, alpha = 0.16): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: INK, alpha } } },
});

/** A circle's point at an angle, in degrees clockwise from three o'clock. */
const polar = (cx: number, cy: number, r: number, deg: number) =>
  [cx + r * Math.cos(deg * RAD), cy + r * Math.sin(deg * RAD)] as const;

// ---------------------------------------------------------------------------------------------
// The things of the track

/** Two slanted speed bars, leaning back from the way the slide reads. */
const speedBars = (id: string, frame: Frame, colour = RED) =>
  art(id, frame, `<path d="M0 0H8L17 22H9ZM15 0H23L32 22H24Z" fill="${colour}"/>`);

/** A safety pin through the fabric, lying along `deg` from its coil at x, y. */
function safetyPin(x: number, y: number, deg: number) {
  return (
    `<g transform="translate(${r1(x)} ${r1(y)}) rotate(${deg})">` +
    `<path d="M2 -1L50 0M2 9L46 6" stroke="${INK}" stroke-opacity=".16" stroke-width="5" stroke-linecap="round"/>` +
    `<path d="M2 -5.5L50 -4.5M2 5.5L46 2" stroke="${STEEL_DARK}" stroke-width="3.2" stroke-linecap="round"/>` +
    `<path d="M6 -6.2L42 -5.4" stroke="${WHITE}" stroke-opacity=".75" stroke-width="1.1" stroke-linecap="round"/>` +
    `<circle cx="-3" cy="0" r="6.5" stroke="${STEEL_DARK}" stroke-width="3"/>` +
    `<circle cx="-3" cy="0" r="2.2" fill="${STEEL_DARK}"/>` +
    `<path d="M43 -8.5H55A7 7 0 0 1 55 5.5H43Z" fill="${STEEL}" stroke="${STEEL_DARK}" stroke-width="1.6"/>` +
    `<path d="M46 -5.5H54" stroke="${WHITE}" stroke-opacity=".7" stroke-width="1.4" stroke-linecap="round"/>` +
    `</g>`
  );
}

/**
 * A hurdle from the front: the striped board, the two uprights and their feet, and its shadow
 * on the track.
 */
function hurdle(w: number, h: number, stripe: string) {
  const board = { x: w * 0.04, y: h * 0.06, w: w * 0.92, h: h * 0.2 };
  const n = 7;
  const seg = board.w / n;
  let body = `<ellipse cx="${r1(w / 2)}" cy="${r1(h - 4)}" rx="${r1(w * 0.48)}" ry="5" fill="${INK}" fill-opacity=".12"/>`;
  for (const px of [w * 0.12, w * 0.88]) {
    body +=
      `<rect x="${r1(px - 5)}" y="${r1(board.y + board.h)}" width="10" height="${r1(h - 10 - board.y - board.h)}" fill="${STEEL_DARK}"/>` +
      `<rect x="${r1(px - w * 0.1)}" y="${r1(h - 12)}" width="${r1(w * 0.2)}" height="8" rx="3" fill="${INK}"/>`;
  }
  body += `<rect x="${r1(board.x)}" y="${r1(board.y)}" width="${r1(board.w)}" height="${r1(board.h)}" fill="${WHITE}"/>`;
  for (let i = 0; i < n; i += 2) {
    body += `<rect x="${r1(board.x + i * seg)}" y="${r1(board.y)}" width="${r1(seg)}" height="${r1(board.h)}" fill="${stripe}"/>`;
  }
  body += `<rect x="${r1(board.x)}" y="${r1(board.y)}" width="${r1(board.w)}" height="${r1(board.h)}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>`;
  return body;
}

/** A small stopwatch, as the icon of a time. */
function stopwatchIcon(s: number) {
  const c = s / 2;
  const r = s * 0.36;
  const cy = c + s * 0.08;
  return (
    `<path d="M${r1(c - s * 0.12)} ${r1(s * 0.06)}H${r1(c + s * 0.12)}M${r1(c)} ${r1(s * 0.06)}V${r1(cy - r)}" stroke="${INK}" stroke-width="${r1(s * 0.08)}" stroke-linecap="round"/>` +
    `<circle cx="${r1(c)}" cy="${r1(cy)}" r="${r1(r)}" stroke="${INK}" stroke-width="${r1(s * 0.08)}"/>` +
    `<path d="M${r1(c)} ${r1(cy)}L${r1(c + r * 0.55)} ${r1(cy - r * 0.55)}" stroke="${RED}" stroke-width="${r1(s * 0.08)}" stroke-linecap="round"/>`
  );
}

/** The track oval, small: the deck's mark. */
function oval(w: number, h: number) {
  const lane = h * 0.14;
  return (
    `<rect x="1" y="1" width="${r1(w - 2)}" height="${r1(h - 2)}" rx="${r1((h - 2) / 2)}" fill="${RED}"/>` +
    `<rect x="${r1(1 + lane)}" y="${r1(1 + lane)}" width="${r1(w - 2 - lane * 2)}" height="${r1(h - 2 - lane * 2)}" rx="${r1((h - 2 - lane * 2) / 2)}" stroke="${WHITE}" stroke-width="1.4"/>` +
    `<rect x="${r1(1 + lane * 2)}" y="${r1(1 + lane * 2)}" width="${r1(w - 2 - lane * 4)}" height="${r1(h - 2 - lane * 4)}" rx="${r1((h - 2 - lane * 4) / 2)}" fill="${WHITE}"/>` +
    `<path d="M${r1(w * 0.6)} ${r1(h - 1 - lane * 2)}V${r1(h - 1)}" stroke="${WHITE}" stroke-width="2"/>`
  );
}

/** The mark of the deck: a small track oval, which the user may replace with a logo. */
const mark = (id: string, frame: Frame): Element =>
  drawing(id, frame, svg(frame.w, frame.h, oval(frame.w, frame.h)), PAINT, {
    role: 'logo',
    name: 'logo',
  });

/** A tile of the track between two lane lines, on which a lane's number is painted. */
const laneTile = (w: number, h: number) =>
  `<rect width="${w}" height="${h}" rx="3" fill="${RED}"/>` +
  `<path d="M${r1(w * 0.07)} 0V${h}M${r1(w * 0.93)} 0V${h}" stroke="${WHITE}" stroke-width="2.4"/>`;

/** A lane tile with its figure painted on it. */
const numberTile = (id: string, frame: Frame, n: number) =>
  upright(
    id,
    frame,
    laneTile(frame.w, frame.h) +
      `<text x="${r1(frame.w / 2)}" y="${r1(frame.h / 2)}" text-anchor="middle" dominant-baseline="central" ${FIGURES} font-size="${r1(frame.h * 0.56)}" fill="${WHITE}">${n}</text>`,
  );

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const W = 1920;
const START = 128;
const END = 128;
const WIDTH = W - START - END;

/**
 * The kicker on its speed bars, and the title; without a kicker, the title on the bars. Room
 * for the leading a script may need beyond the theme's (`LEADING`).
 */
function head(name: string, width = 1200, lines = 1, kicker = true) {
  const h = Math.round(64 * 1.25 * lines) + 4;
  if (!kicker) {
    return {
      placeholders: [place('p_title', 'title', at(START + 52, 116, width - 52, h), 'title')],
      decorations: [speedBars(`d_maslul_${name}_bars`, at(START, 137, 32, 22))],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 46, 90, Math.min(1000, width - 46), 34), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', at(START, 132, width, h), 'title'),
    ],
    decorations: [speedBars(`d_maslul_${name}_bars`, at(START, 96, 32, 22))],
  };
}

/**
 * The foot of a slide: the mark and the deck's name at the start; at the end the slide's number,
 * painted white on a tile of the track between two lane lines.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 74, 958, 900, 36), 'caption')]
      : [],
    decorations: [
      mark(`d_maslul_${name}_mark`, at(START, 959, 56, 34)),
      art(`d_maslul_${name}_folio`, atEnd(END, 946, 64, 60), laneTile(64, 60)),
      pageNumber(`d_maslul_${name}_number`, atEnd(END, 949, 64, 54), 'heading', {
        color: token('surface'),
        weight: 700,
        align: 'center',
        vAlign: 'middle',
      }),
    ],
  };
}

/** A white sheet with the edge of a lane along its start side: the card of the template. */
function sheet(id: string, frame: Frame): Element[] {
  const strip = 16;
  return [
    rect(id, frame, solid(token('surface')), {
      stroke: { color: token('text', 0.08), width: 1.5 },
      effects: {
        radius: 10,
        shadow: { x: 0, y: 14, blur: 34, color: { value: INK, alpha: 0.08 } },
      },
    }),
    art(
      `${id}_lane`,
      { x: frame.x + frame.w - strip, y: frame.y, w: strip, h: frame.h },
      `<path d="M0 0H${strip - 10}A10 10 0 0 1 ${strip} 10V${frame.h - 10}A10 10 0 0 1 ${strip - 10} ${frame.h}H0Z" fill="${RED}"/>` +
        `<path d="M5.5 0V${frame.h}" stroke="${WHITE}" stroke-width="2"/>`,
    ),
  ];
}

// ---------------------------------------------------------------------------------------------
// The scenes

/**
 * The bend of an eight-lane track, seen from above and cropped by the box: the green infield
 * with its mown stripes, the kerb, the lanes, and the staggered start with each lane's number
 * painted behind its line, to be read by the athlete who runs up the bend. `ltr` draws it for
 * the other side, the figures still upright.
 */
function bend(id: string, w: number, h: number, ltr: boolean) {
  const cx0 = -330;
  const cy = 520;
  const R0 = 600;
  const L = 44;
  const N = 8;
  const X = (x: number) => r1(ltr ? w - x : x);
  const cx = X(cx0);
  const g = (n: string) => `${id}-${n}`;
  const outer = R0 + N * L + 18;
  let body =
    `<defs><clipPath id="${g('field')}"><circle cx="${cx}" cy="${cy}" r="${R0}"/></clipPath>` +
    `<radialGradient id="${g('shade')}" gradientUnits="userSpaceOnUse" cx="${cx}" cy="${cy}" r="${outer}">` +
    `<stop offset="${r1((R0 / outer) * 100) / 100}" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".18"/></radialGradient></defs>` +
    `<circle cx="${cx}" cy="${cy}" r="${outer}" fill="${RED}"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${outer}" fill="url(#${g('shade')})"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${R0}" fill="${GRASS}"/>` +
    `<g clip-path="url(#${g('field')})">` +
    Array.from({ length: Math.ceil(w / 56) }, (_, i) =>
      i % 2 ? '' : `<rect x="${i * 56}" y="0" width="56" height="${h}" fill="${WHITE}" fill-opacity=".06"/>`,
    ).join('') +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${R0}" stroke="${WHITE}" stroke-width="7"/>`;
  for (let k = 1; k <= N; k++) {
    body += `<circle cx="${cx}" cy="${cy}" r="${R0 + k * L}" stroke="${WHITE}" stroke-width="2.6"/>`;
  }
  for (let k = 1; k <= N; k++) {
    const deg = 14 - (k - 1) * 5.4;
    const [x1, y1] = polar(cx0, cy, R0 + (k - 1) * L + 1.5, deg);
    const [x2, y2] = polar(cx0, cy, R0 + k * L - 1.5, deg);
    body += `<path d="M${X(x1)} ${r1(y1)}L${X(x2)} ${r1(y2)}" stroke="${WHITE}" stroke-width="5"/>`;
    const behind = deg + 3.6;
    const [nx, ny] = polar(cx0, cy, R0 + (k - 0.5) * L, behind);
    const turn = r1(ltr ? -behind : behind);
    body += `<text x="${X(nx)}" y="${r1(ny)}" text-anchor="middle" dominant-baseline="central" transform="rotate(${turn} ${X(nx)} ${r1(ny)})" ${FIGURES} font-size="30" fill="${WHITE}">${k}</text>`;
  }
  return body;
}

/**
 * The straight from above: three lanes, the start line near the start side, starting blocks in
 * the outer lanes, and the marks along the lines; the lanes darken a little as they run away.
 */
function straight(id: string, w: number, h: number, startX: number) {
  const top = 8;
  const L = 150;
  const g = (n: string) => `${id}-${n}`;
  let body =
    `<defs><linearGradient id="${g('run')}" x1="${w}" y1="0" x2="0" y2="0" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".16"/></linearGradient></defs>` +
    `<rect width="${w}" height="${h}" fill="${RED}"/><rect width="${w}" height="${h}" fill="url(#${g('run')})"/>`;
  for (let i = 0; i <= 3; i++) {
    body += `<path d="M0 ${top + i * L}H${w}" stroke="${WHITE}" stroke-width="4"/>`;
  }
  // The marks along the lines, every so many metres from the start.
  const finish = 150;
  for (let x = startX - 150; x > finish + 60; x -= 150) {
    for (let i = 1; i <= 2; i++) {
      body += `<path d="M${x} ${top + i * L - 9}V${top + i * L + 9}" stroke="${WHITE}" stroke-opacity=".6" stroke-width="3"/>`;
    }
  }
  // The start line, and the finish line at the far end of the straight.
  body +=
    `<path d="M${startX} ${top}V${top + 3 * L}" stroke="${WHITE}" stroke-width="9"/>` +
    `<path d="M${finish} ${top}V${top + 3 * L}" stroke="${WHITE}" stroke-width="9"/>` +
    `<path d="M${finish - 18} ${top}V${top + 3 * L}" stroke="${WHITE}" stroke-opacity=".5" stroke-width="2" stroke-dasharray="8 8"/>`;
  // Starting blocks behind the line, in the first lane and the third.
  for (const lane of [0, 2]) {
    const cy = top + lane * L + L / 2;
    const x0 = startX + 40;
    // A pedal: the metal plate and the dark pad the spikes push against.
    const pedal = (x: number, y: number) =>
      `<rect x="${x + 4}" y="${y + 6}" width="38" height="50" rx="6" fill="${INK}" fill-opacity=".22"/>` +
      `<rect x="${x}" y="${y}" width="38" height="50" rx="6" fill="${STEEL}" stroke="${STEEL_DARK}" stroke-width="2"/>` +
      `<rect x="${x + 7}" y="${y + 7}" width="18" height="36" rx="3" fill="${INK}" fill-opacity=".82"/>` +
      `<path d="M${x + 31} ${y + 8}V${y + 42}" stroke="${WHITE}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`;
    body +=
      `<rect x="${x0 + 4}" y="${cy - 3}" width="214" height="16" rx="4" fill="${INK}" fill-opacity=".2"/>` +
      `<rect x="${x0}" y="${cy - 8}" width="214" height="16" rx="4" fill="${STEEL_DARK}"/>` +
      Array.from(
        { length: 15 },
        (_, i) =>
          `<path d="M${x0 + 14 + i * 13} ${cy - 4}V${cy + 4}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="2"/>`,
      ).join('') +
      pedal(x0 + 30, cy - 58) +
      pedal(x0 + 128, cy + 8);
  }
  return body;
}

/**
 * A stopwatch: the crown and its loop, the navy case with the time run so far as a red arc, the
 * white face with its sixty ticks, and the small dial of the minutes below the figure.
 */
function stopwatch(id: string) {
  const c = 300;
  const cy = 384;
  const R = 288;
  const face = 246;
  const g = (n: string) => `${id}-${n}`;
  let ticks = '';
  for (let i = 0; i < 60; i++) {
    const major = i % 5 === 0;
    const [x1, y1] = polar(c, cy, face - 8, i * 6 - 90);
    const [x2, y2] = polar(c, cy, face - (major ? 32 : 18), i * 6 - 90);
    ticks += `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" stroke="${INK}" stroke-opacity="${major ? 1 : 0.45}" stroke-width="${major ? 4 : 2}" stroke-linecap="round"/>`;
  }
  const run = 252;
  const [ax, ay] = polar(c, cy, 266, -90 + run);
  // The small dial of the minutes, under the crown, clear of the figure and its label.
  const sub = { x: c, y: cy - 168, r: 38 };
  let subTicks = '';
  for (let i = 0; i < 12; i++) {
    const [x1, y1] = polar(sub.x, sub.y, sub.r - 4, i * 30 - 90);
    const [x2, y2] = polar(sub.x, sub.y, sub.r - 11, i * 30 - 90);
    subTicks += `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" stroke="${INK}" stroke-opacity=".5" stroke-width="2"/>`;
  }
  const [hx, hy] = polar(sub.x, sub.y, sub.r - 10, -90 + 108);
  return (
    `<defs><radialGradient id="${g('glass')}" cx="38%" cy="30%" r="75%">` +
    `<stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${CHALK}"/></radialGradient></defs>` +
    `<ellipse cx="${c}" cy="${cy + R + 6}" rx="${R * 0.8}" ry="14" fill="${INK}" fill-opacity=".1"/>` +
    `<circle cx="${c}" cy="40" r="26" stroke="${INK}" stroke-width="10"/>` +
    `<rect x="${c - 22}" y="62" width="44" height="40" rx="6" fill="${INK}"/>` +
    `<rect x="${c - 34}" y="80" width="68" height="20" rx="6" fill="${NAVY}"/>` +
    `<g transform="rotate(40 ${c} ${cy})"><rect x="${c - 16}" y="${cy - R - 34}" width="32" height="44" rx="6" fill="${INK}"/></g>` +
    `<g transform="rotate(-40 ${c} ${cy})"><rect x="${c - 16}" y="${cy - R - 26}" width="32" height="36" rx="6" fill="${NAVY}"/></g>` +
    `<circle cx="${c}" cy="${cy}" r="${R}" fill="${NAVY}"/>` +
    `<circle cx="${c}" cy="${cy}" r="${R - 6}" stroke="${WHITE}" stroke-opacity=".16" stroke-width="2"/>` +
    `<circle cx="${c}" cy="${cy}" r="266" stroke="${WHITE}" stroke-opacity=".12" stroke-width="14"/>` +
    `<path d="M${c} ${cy - 266}A266 266 0 1 1 ${r1(ax)} ${r1(ay)}" stroke="${RED}" stroke-width="14" stroke-linecap="round"/>` +
    `<circle cx="${r1(ax)}" cy="${r1(ay)}" r="11" fill="${GOLD}" stroke="${NAVY}" stroke-width="3"/>` +
    `<circle cx="${c}" cy="${cy}" r="${face}" fill="url(#${g('glass')})"/>` +
    ticks +
    `<circle cx="${sub.x}" cy="${sub.y}" r="${sub.r}" fill="${CHALK}" stroke="${INK}" stroke-opacity=".2" stroke-width="2"/>` +
    subTicks +
    `<path d="M${sub.x} ${sub.y}L${r1(hx)} ${r1(hy)}" stroke="${RED}" stroke-width="3.4" stroke-linecap="round"/>` +
    `<circle cx="${sub.x}" cy="${sub.y}" r="4.5" fill="${INK}"/>`
  );
}

/** A strap of a medal's ribbon between two edges, with its stripes. */
function strap(a: [number, number][], shade: number) {
  const [tl, tr, br, bl] = a as [[number, number], [number, number], [number, number], [number, number]];
  const lerp = (p: [number, number], q: [number, number], t: number) =>
    `${r1(p[0] + (q[0] - p[0]) * t)} ${r1(p[1] + (q[1] - p[1]) * t)}`;
  const band = (t0: number, t1: number, fill: string) =>
    `<path d="M${lerp(tl, tr, t0)}L${lerp(tl, tr, t1)}L${lerp(bl, br, t1)}L${lerp(bl, br, t0)}Z" fill="${fill}"/>`;
  return (
    band(0, 1, RED) +
    band(0.36, 0.64, NAVY) +
    band(0.1, 0.15, WHITE) +
    band(0.85, 0.9, WHITE) +
    (shade ? `<path d="M${lerp(tl, tr, 0)}L${lerp(tl, tr, 1)}L${lerp(bl, br, 1)}L${lerp(bl, br, 0)}Z" fill="${INK}" fill-opacity="${shade}"/>` : '')
  );
}

/** A gold medal on its ribbon, which falls from the top of the box. */
function medal(id: string, w: number) {
  const c = w / 2;
  const cy = 590;
  const r = 168;
  const g = (n: string) => `${id}-${n}`;
  // The wreath: a stem up each side from the foot of the medal, and pairs of leaves along it,
  // each pointing up the stem, one to the outside and one to the inside.
  const leaves: string[] = [];
  const R = 106;
  for (const side of [-1, 1]) {
    const from = 90 + side * 16;
    const to = 90 + side * 142;
    const [sx, sy] = polar(c, cy, R, from);
    const [ex, ey] = polar(c, cy, R, to);
    leaves.push(
      `<path d="M${r1(sx)} ${r1(sy)}A${R} ${R} 0 0 ${side > 0 ? 1 : 0} ${r1(ex)} ${r1(ey)}" stroke="${INK}" stroke-opacity=".24" stroke-width="3" stroke-linecap="round"/>`,
    );
    for (let i = 0; i < 8; i++) {
      const deg = from + side * (8 + i * 16);
      const ahead = deg + side * 90;
      // `off` 1 is the leaf on the outside of the stem, -1 the one inside.
      for (const off of [1, -1]) {
        const [bx, by] = polar(c, cy, R + off * 3, deg);
        const angle = ahead - side * 34 * off;
        const [lx, ly] = polar(bx, by, 12, angle);
        leaves.push(
          `<ellipse cx="${r1(lx)}" cy="${r1(ly)}" rx="13" ry="5.5" transform="rotate(${r1(angle)} ${r1(lx)} ${r1(ly)})" fill="${INK}" fill-opacity=".22"/>`,
        );
      }
    }
  }
  const star = Array.from({ length: 10 }, (_, i) => {
    const [x, y] = polar(c, cy + 4, i % 2 ? 22 : 54, -90 + i * 36);
    return `${i ? 'L' : 'M'}${r1(x)} ${r1(y)}`;
  }).join('');
  return (
    `<defs><radialGradient id="${g('shine')}" cx="35%" cy="28%" r="80%">` +
    `<stop offset="0" stop-color="${WHITE}" stop-opacity=".55"/><stop offset=".45" stop-color="${WHITE}" stop-opacity="0"/>` +
    `<stop offset="1" stop-color="${INK}" stop-opacity=".22"/></radialGradient></defs>` +
    strap(
      [
        [c - 180, 0],
        [c - 70, 0],
        [c + 30, 420],
        [c - 30, 420],
      ],
      0,
    ) +
    strap(
      [
        [c + 70, 0],
        [c + 180, 0],
        [c + 30, 420],
        [c - 30, 420],
      ],
      0.14,
    ) +
    `<circle cx="${c}" cy="${cy - r - 14}" r="22" stroke="${GOLD}" stroke-width="9"/>` +
    `<circle cx="${c}" cy="${cy - r - 14}" r="22" stroke="${INK}" stroke-opacity=".2" stroke-width="9"/>` +
    `<ellipse cx="${c}" cy="${cy + r + 30}" rx="${r * 0.8}" ry="12" fill="${INK}" fill-opacity=".1"/>` +
    `<circle cx="${c}" cy="${cy}" r="${r}" fill="${GOLD}"/>` +
    `<circle cx="${c}" cy="${cy}" r="${r}" fill="url(#${g('shine')})"/>` +
    `<circle cx="${c}" cy="${cy}" r="${r - 3}" stroke="${INK}" stroke-opacity=".2" stroke-width="3"/>` +
    `<circle cx="${c}" cy="${cy}" r="${r - 24}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="3"/>` +
    `<circle cx="${c}" cy="${cy}" r="${r - 30}" stroke="${INK}" stroke-opacity=".14" stroke-width="2"/>` +
    leaves.join('') +
    `<path d="${star}Z" fill="${WHITE}" fill-opacity=".7" stroke="${INK}" stroke-opacity=".2" stroke-width="2" stroke-linejoin="round"/>`
  );
}

/** A race bib: white, its band in the group's colour, the four safety pins and the tear-off strip. */
function bib(w: number, h: number, band: number, colour: string) {
  const bars = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 3, 1, 2, 2, 1, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2];
  let x = 96;
  let code = '';
  bars.forEach((b, i) => {
    if (i % 2 === 0)
      code += `<rect x="${r1(x)}" y="${h - 50}" width="${r1(b * 2.4)}" height="26" fill="${INK}" fill-opacity=".8"/>`;
    x += b * 2.4 + 2;
  });
  return (
    `<rect width="${w}" height="${h}" rx="8" fill="${WHITE}"/>` +
    `<path d="M0 8A8 8 0 0 1 8 0H${w - 8}A8 8 0 0 1 ${w} 8V${band}H0Z" fill="${colour}"/>` +
    `<path d="M14 ${h - 70}H${w - 14}" stroke="${INK}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="6 6"/>` +
    code +
    // The timing chip on the tear-off strip.
    `<rect x="${w - 176}" y="${h - 52}" width="78" height="30" rx="6" fill="${CHALK}" stroke="${INK}" stroke-opacity=".3" stroke-width="1.5"/>` +
    `<path d="M${w - 164} ${h - 37}H${w - 110}" stroke="${colour}" stroke-width="4" stroke-linecap="round"/>` +
    safetyPin(16, 42, -30) +
    safetyPin(w - 16, 42, 210) +
    safetyPin(16, h - 42, 30) +
    safetyPin(w - 16, h - 42, 150)
  );
}

/** The line pictograms of the three groups, drawn running toward the end of the slide. */
const PICTOGRAMS = (() => {
  const limb = `stroke="${INK}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"`;
  const p = (pts: [number, number][]) =>
    `<path d="M${pts.map(([x, y]) => `${x} ${y}`).join('L')}" ${limb}/>`;
  // Each is drawn facing the start of a right-to-left page (to the right), then turned.
  const turn = (body: string) => `<g transform="translate(120 0) scale(-1 1)">${body}</g>`;
  return [
    // Sprints and hurdles: a hurdler over the board.
    turn(
      `<path d="M70 86H112" stroke="${RED}" stroke-width="8" stroke-linecap="round"/>` +
        `<path d="M74 86V112M108 86V112" stroke="${INK}" stroke-width="5" stroke-linecap="round"/>` +
        `<circle cx="82" cy="20" r="10" fill="${INK}"/>` +
        p([
          [76, 34],
          [56, 60],
        ]) +
        p([
          [56, 60],
          [82, 64],
          [106, 60],
        ]) +
        p([
          [56, 60],
          [40, 74],
          [22, 64],
        ]) +
        p([
          [70, 42],
          [88, 52],
          [98, 44],
        ]) +
        p([
          [70, 42],
          [52, 40],
          [42, 30],
        ]),
    ),
    // Middle and long distance: a runner in stride, on the lane.
    turn(
      `<path d="M8 112H112" stroke="${RED}" stroke-width="5" stroke-linecap="round" stroke-dasharray="2 10"/>` +
        `<circle cx="72" cy="16" r="10" fill="${INK}"/>` +
        p([
          [67, 31],
          [58, 62],
        ]) +
        p([
          [58, 62],
          [78, 80],
          [72, 102],
        ]) +
        p([
          [58, 62],
          [46, 84],
          [24, 92],
        ]) +
        p([
          [65, 38],
          [80, 52],
          [92, 44],
        ]) +
        p([
          [65, 38],
          [50, 50],
          [40, 42],
        ]),
    ),
    // Jumps and throws: a high jumper arched back over the bar, the mat beyond it.
    turn(
      `<rect x="58" y="96" width="58" height="16" rx="4" fill="${NAVY}"/>` +
        `<path d="M14 44V112M110 44V112" stroke="${INK}" stroke-width="4" stroke-linecap="round"/>` +
        `<path d="M12 68H112" stroke="${RED}" stroke-width="4" stroke-linecap="round"/>` +
        `<circle cx="92" cy="74" r="9" fill="${INK}"/>` +
        p([
          [56, 48],
          [80, 60],
        ]) +
        p([
          [80, 61],
          [84, 84],
        ]) +
        p([
          [56, 48],
          [38, 40],
          [28, 52],
        ]) +
        p([
          [56, 48],
          [40, 52],
          [30, 64],
        ]),
    ),
  ];
})();

/** An accreditation pass on its lanyard: the strap fades upward, the clip, the slot, the band. */
function pass(id: string, w: number, h: number, colour: string) {
  const c = w / 2;
  const top = 56;
  const g = (n: string) => `${id}-${n}`;
  return (
    `<defs><linearGradient id="${g('strap')}" x1="0" y1="0" x2="0" y2="${top}" gradientUnits="userSpaceOnUse">` +
    `<stop offset="0" stop-color="${colour}" stop-opacity="0"/><stop offset=".7" stop-color="${colour}"/></linearGradient></defs>` +
    `<path d="M${c - 44} 0H${c - 22}L${c - 4} ${top - 8}H${c - 22}Z" fill="url(#${g('strap')})"/>` +
    `<path d="M${c + 22} 0H${c + 44}L${c + 22} ${top - 8}H${c + 4}Z" fill="url(#${g('strap')})"/>` +
    `<rect x="0" y="${top}" width="${w}" height="${h - top}" rx="18" fill="${WHITE}"/>` +
    `<path d="M0 ${top + 18}A18 18 0 0 1 18 ${top}H${w - 18}A18 18 0 0 1 ${w} ${top + 18}V${top + 64}H0Z" fill="${colour}"/>` +
    `<rect x="${c - 38}" y="${top + 14}" width="76" height="14" rx="7" fill="${CHALK}" stroke="${INK}" stroke-opacity=".2"/>` +
    `<rect x="${c - 14}" y="${top - 18}" width="28" height="40" rx="5" fill="${STEEL}" stroke="${STEEL_DARK}" stroke-width="2"/>` +
    `<circle cx="${c}" cy="${top - 18}" r="8" stroke="${STEEL_DARK}" stroke-width="3"/>` +
    `<path d="M0 ${h - 10}H${w}V${h - 18}A18 18 0 0 1 ${w - 18} ${h}H18A18 18 0 0 1 0 ${h - 18}Z" fill="${colour}"/>`
  );
}

/** The stadium's board, its lamps between the two halves, and the dots of its matrix. */
function scoreboard(id: string, w: number, h: number) {
  const g = (n: string) => `${id}-${n}`;
  const c = w / 2;
  return (
    `<defs><pattern id="${g('dots')}" width="16" height="16" patternUnits="userSpaceOnUse">` +
    `<circle cx="8" cy="8" r="2" fill="${WHITE}" fill-opacity=".09"/></pattern></defs>` +
    `<rect width="${w}" height="${h}" rx="18" fill="${INK}"/>` +
    `<rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="10" fill="${NAVY}"/>` +
    `<rect x="14" y="14" width="${w - 28}" height="${h - 28}" rx="10" fill="url(#${g('dots')})"/>` +
    `<rect x="${c - 40}" y="14" width="80" height="${h - 28}" fill="${INK}"/>` +
    [h / 2 - 36, h / 2 + 36]
      .map(
        (y) =>
          `<circle cx="${c}" cy="${y}" r="24" fill="${GOLD}" fill-opacity=".18"/><circle cx="${c}" cy="${y}" r="13" fill="${GOLD}"/>`,
      )
      .join('') +
    [
      [26, 26],
      [w - 26, 26],
      [26, h - 26],
      [w - 26, h - 26],
    ]
      .map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="${STEEL}"/>`)
      .join('')
  );
}

/** A meter of the board's lamps: a column of lit lamps for each value. */
function lampMeter(values: readonly number[], rows = 5, step = 30) {
  let body = '';
  values.forEach((v, i) => {
    for (let j = 0; j < rows; j++) {
      const lit = rows - j <= v;
      const cx = r1(step / 2 + i * step);
      const cy = r1(step / 2 + j * step);
      body += lit
        ? `<circle cx="${cx}" cy="${cy}" r="${r1(step * 0.48)}" fill="${GOLD}" fill-opacity=".16"/><circle cx="${cx}" cy="${cy}" r="${r1(step * 0.34)}" fill="${GOLD}"/>`
        : `<circle cx="${cx}" cy="${cy}" r="${r1(step * 0.34)}" fill="${WHITE}" fill-opacity=".1"/>`;
    }
  });
  return body;
}

/** A coach's clipboard: the board, the paper on it and the metal clip at its head. */
function clipboard(w: number, h: number) {
  const c = w / 2;
  return (
    `<rect y="20" width="${w}" height="${h - 20}" rx="22" fill="${NAVY}"/>` +
    `<rect x="20" y="52" width="${w - 40}" height="${h - 72}" rx="4" fill="${WHITE}"/>` +
    `<path d="M${c - 76} 50V24Q${c - 76} 6 ${c - 58} 6H${c + 58}Q${c + 76} 6 ${c + 76} 24V50" stroke="${STEEL_DARK}" stroke-width="7"/>` +
    `<rect x="${c - 190}" y="26" width="380" height="58" rx="14" fill="${STEEL}"/>` +
    `<rect x="${c - 158}" y="36" width="316" height="34" rx="9" fill="${WHITE}" fill-opacity=".35"/>` +
    `<circle cx="${c - 172}" cy="55" r="6" fill="${STEEL_DARK}"/><circle cx="${c + 172}" cy="55" r="6" fill="${STEEL_DARK}"/>`
  );
}

/** The whole oval from above: the lanes, the infield and its field events, the finish line. */
function stadium(id: string, w: number, h: number) {
  const cx = w / 2;
  const cy = h / 2;
  const S = 190;
  const RIN = 150;
  const L = 13;
  const N = 6;
  const g = (n: string) => `${id}-${n}`;
  const lap = (r: number) =>
    `M${cx - S} ${r1(cy - r)}H${cx + S}A${r} ${r} 0 0 1 ${cx + S} ${r1(cy + r)}H${cx - S}A${r} ${r} 0 0 1 ${cx - S} ${r1(cy - r)}Z`;
  const out = RIN + N * L;
  let body =
    `<defs><clipPath id="${g('in')}"><path d="${lap(RIN)}"/></clipPath></defs>` +
    `<path d="${lap(out + 14)}" fill="${INK}" fill-opacity=".06"/>` +
    `<path d="${lap(out + 6)}" fill="${RED}"/>` +
    `<path d="${lap(RIN)}" fill="${GRASS}"/>` +
    `<g clip-path="url(#${g('in')})">` +
    Array.from({ length: 12 }, (_, i) =>
      i % 2 ? '' : `<rect x="${r1(cx - S - RIN + i * 50)}" y="0" width="50" height="${h}" fill="${WHITE}" fill-opacity=".07"/>`,
    ).join('') +
    `</g>`;
  for (let k = 1; k <= N; k++) {
    body += `<path d="${lap(RIN + k * L)}" stroke="${WHITE}" stroke-width="1.6"/>`;
  }
  body += `<path d="${lap(RIN)}" stroke="${WHITE}" stroke-width="4"/>`;
  // The field events: the long jump's runway and pit along the far straight, the high jump's
  // fan in one end, the throwing circle and its sector in the other, and a pitch between.
  body +=
    `<rect x="${cx - 150}" y="${cy - RIN + 18}" width="220" height="10" fill="${RED}"/>` +
    `<rect x="${cx + 74}" y="${cy - RIN + 12}" width="56" height="22" rx="3" fill="${GOLD}"/>` +
    `<path d="M${cx - S - 2} ${cy - 70}A70 70 0 0 0 ${cx - S - 2} ${cy + 70}Z" fill="${RED}" fill-opacity=".9"/>` +
    `<path d="M${cx - S - 2} ${cy - 70}V${cy + 70}" stroke="${WHITE}" stroke-width="2"/>` +
    `<circle cx="${cx + S + 40}" cy="${cy}" r="9" stroke="${WHITE}" stroke-width="2.4"/>` +
    `<path d="M${cx + S + 33} ${cy - 4}L${cx + S - 44} ${cy - 40}M${cx + S + 33} ${cy + 4}L${cx + S - 44} ${cy + 40}" stroke="${WHITE}" stroke-opacity=".8" stroke-width="2"/>` +
    `<path d="M${cx + S - 44} ${cy - 40}A84 84 0 0 0 ${cx + S - 44} ${cy + 40}" stroke="${WHITE}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="4 5"/>` +
    `<rect x="${cx - 100}" y="${cy - 52}" width="200" height="104" stroke="${WHITE}" stroke-opacity=".55" stroke-width="2"/>` +
    `<path d="M${cx} ${cy - 52}V${cy + 52}" stroke="${WHITE}" stroke-opacity=".55" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="20" stroke="${WHITE}" stroke-opacity=".55" stroke-width="2"/>`;
  // The finish line across the home straight, and the photo-finish post beside it.
  const fx = cx + S - 60;
  body +=
    `<path d="M${fx} ${cy + RIN}V${cy + out + 6}" stroke="${WHITE}" stroke-width="6"/>` +
    `<rect x="${fx - 5}" y="${cy + out + 12}" width="10" height="26" rx="2" fill="${INK}"/>` +
    `<circle cx="${fx}" cy="${cy + out + 12}" r="7" fill="${GOLD}"/>`;
  // The staggered start of the 400 metres, on the bend.
  for (let k = 0; k < N; k++) {
    const [x1, y1] = polar(cx - S, cy, RIN + k * L + 1, 180 + 22 + k * 7);
    const [x2, y2] = polar(cx - S, cy, RIN + (k + 1) * L - 1, 180 + 22 + k * 7);
    body += `<path d="M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}" stroke="${WHITE}" stroke-width="3"/>`;
  }
  return body;
}

/** A block of track under a photograph: five lanes and their figures, where the photo ends. */
function trackBlock(w: number, h: number, ltr: boolean) {
  const n = 5;
  const lane = w / n;
  let body = `<rect width="${w}" height="${h}" fill="${RED}"/>`;
  for (let i = 0; i <= n; i++) {
    const x = Math.min(w - 1.5, Math.max(1.5, i * lane));
    body += `<path d="M${r1(x)} 0V${h}" stroke="${WHITE}" stroke-width="3"/>`;
  }
  for (let k = 1; k <= n; k++) {
    const x = ltr ? (k - 0.5) * lane : w - (k - 0.5) * lane;
    body += `<text x="${r1(x)}" y="${h - 28}" text-anchor="middle" dominant-baseline="central" ${FIGURES} font-size="34" fill="${WHITE}">${k}</text>`;
  }
  return body;
}

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of bibs, legs, hurdles and passes. */
const cards3 = [START, START + 576, START + 1152];
const stops4 = [START, START + 428, START + 856, START + 1284];
const steps5 = [START, START + 341, START + 682, START + 1023, START + 1364];
const team4 = [START, START + 424, START + 848, START + 1272];

function layouts(): Layout[] {
  const heroArt = atEnd(0, 0, 700, 1064);
  const timelineBand = at(0, 270, W, 164);
  const markX = stops4.map((s) => W - s);
  const relay = (() => {
    const lanes = [6, 44, 82, 120, 158];
    let body = `<rect width="${W}" height="164" fill="${RED}"/>`;
    // The legs by turns a shade darker, from one hand-over to the next.
    markX.forEach((x, i) => {
      const to = markX[i + 1] ?? END;
      if (i % 2) body += `<rect x="${to}" y="0" width="${x - to}" height="164" fill="${INK}" fill-opacity=".08"/>`;
    });
    body += lanes.map((y) => `<path d="M0 ${y}H${W}" stroke="${WHITE}" stroke-width="3"/>`).join('');
    markX.forEach((x, i) => {
      if (i === 0) {
        body += `<path d="M${x} 6V158" stroke="${WHITE}" stroke-width="7"/>`;
      } else {
        // The exchange zone: a yellow field across the lanes between its two lines, and the
        // marks at its entry pointing the way the race runs.
        body +=
          `<rect x="${x - 84}" y="6" width="112" height="152" fill="${GOLD}" fill-opacity=".22"/>` +
          `<path d="M${x - 84} 6V158M${x + 28} 6V158" stroke="${GOLD}" stroke-width="4"/>` +
          lanes
            .map((y) => `<path d="M${x + 12} ${y}L${x + 28} ${y - 8}V${y + 8}Z" fill="${GOLD}"/>`)
            .join('');
      }
      // The baton, handed on in the second lane.
      body +=
        `<rect x="${x - 72}" y="56" width="64" height="14" rx="7" fill="${GOLD}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.5"/>` +
        `<path d="M${x - 64} 60H${x - 18}" stroke="${WHITE}" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>`;
    });
    body += `<path d="M${END} 6V158" stroke="${WHITE}" stroke-width="10"/><path d="M${END - 10} 6V158" stroke="${WHITE}" stroke-opacity=".5" stroke-width="3" stroke-dasharray="6 6"/>`;
    return body;
  })();

  // The stopwatch and the places on its face.
  const watch = atEnd(END + 8, 236, 600, 680);
  const face = { x: END + 8 + 300, y: 236 + 384 };

  // The scoreboard and its two halves.
  const board = at(START, 268, WIDTH, 560);
  const half = 778;

  return [
    {
      id: 'l_maslul_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 46, 300, 860, 34), 'caption', {
          color: token('primary'),
        }),
        // Ordinary cover titles need two full display lines, clear of the track in either direction.
        place('p_title', 'title', at(START, 344, 1100, 290), 'display'),
        place('p_subtitle', 'subtitle', at(START, 646, 860, 140), 'heading'),
        place('p_meta', 'caption', at(START + 46, 836, 860, 34), 'caption'),
      ],
      decorations: [
        mark('d_maslul_hero_mark', at(START, 96, 56, 34)),
        upright(
          'd_maslul_hero_bend',
          heroArt,
          bend('d_maslul_hero_bend', heroArt.w, heroArt.h, false),
          bend('d_maslul_hero_bend', heroArt.w, heroArt.h, true),
        ),
        speedBars('d_maslul_hero_bars', at(START, 306, 32, 22)),
        rect('d_maslul_hero_rule', at(START, 806, 150, 8), solid(token('primary'))),
        rect('d_maslul_hero_rule2', at(START + 162, 806, 40, 8), solid(token('primary', 0.35))),
        art('d_maslul_hero_watch', at(START, 836, 32, 34), stopwatchIcon(32)),
      ],
    },
    {
      id: 'l_maslul_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', at(START + 44, 781, 240, 132), 'display', {
          vAlign: 'middle',
          color: token('surface'),
        }),
        place('p_kicker', 'caption', at(START + 46, 160, 1000, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 204, 1400, 280), 'display', { vAlign: 'bottom' }),
        place('p_subtitle', 'subtitle', at(START, 494, 1300, 100), 'heading'),
      ],
      decorations: [
        mark('d_maslul_section_mark', at(START, 96, 56, 34)),
        speedBars('d_maslul_section_bars', at(START, 166, 32, 22)),
        art('d_maslul_section_straight', at(0, 614, W, 466), straight('d_maslul_section_straight', W, 466, W - START - 332)),
      ],
    },
    {
      id: 'l_maslul_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', WIDTH, 1).placeholders,
        place('p_number', 'number', atEnd(face.x - 210, face.y - 110, 420, 140), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('primary'),
        }),
        place('p_label', 'subtitle', atEnd(face.x - 180, face.y + 36, 360, 140), 'heading', {
          align: 'center',
        }),
        place('p_note', 'body', at(START, 282, 900, 124), 'body'),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_number${i + 2}`, 'number', at(START + 24, 452 + i * 150, 220, 84), 'title', {
            color: token('secondary'),
            vAlign: 'middle',
          }),
          place(`p_label${i + 2}`, 'caption', at(START + 264, 452 + i * 150, 636, 84), 'caption', {
            vAlign: 'middle',
          }),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', WIDTH, 1).decorations,
        // The laps of the stopwatch's memory: a red tick at the start of each line.
        ...[0, 1, 2].map((i) =>
          rect(`d_maslul_big_number_lap${i + 1}`, at(START, 474 + i * 150, 6, 40), solid(token('primary'))),
        ),
        upright('d_maslul_big_number_watch', watch, stopwatch('d_maslul_big_number_watch')),
        ...[0, 1, 2, 3].map((i) =>
          art(
            `d_maslul_big_number_split${i + 1}`,
            at(START, 432 + i * 150, 900, 3),
            `<path d="M0 1.5H900" stroke="${INK}" stroke-opacity="${i === 0 ? 0.6 : 0.2}" stroke-width="${i === 0 ? 3 : 2}" stroke-dasharray="${i === 0 ? '0' : '6 7'}"/>`,
          ),
        ),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_maslul_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(START, 296, 1080, 384), 'title', { vAlign: 'middle' }),
        place('p_attribution', 'attribution', at(START, 734, 900, 50), 'heading'),
        place('p_caption', 'caption', at(START, 790, 900, 34), 'caption'),
        ...foot('quote').placeholders,
      ],
      decorations: [
        upright(
          'd_maslul_quote_marks',
          at(START, 196, 104, 80),
          `<path d="M8 80V48C8 20 24 4 48 0L52 11C37 17 30 28 30 44H48V80Z M60 80V48C60 20 76 4 100 0L104 11C89 17 82 28 82 44H100V80Z" fill="${RED}"/>`,
        ),
        upright('d_maslul_quote_medal', atEnd(END + 70, 0, 440, 800), medal('d_maslul_quote_medal', 440)),
        rect('d_maslul_quote_rule', at(START, 710, 96, 6), solid(token('primary'))),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_maslul_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a white sheet from margin to margin, down to over the foot, from its top;
      // a hurdle stands on the sheet's corner, beside the title.
      placeholders: [
        ...head('text', WIDTH - 230, 1, false).placeholders,
        place('p_body', 'body', at(START + 72, 290, WIDTH - 144, 590), 'body'),
      ],
      decorations: [
        ...head('text', WIDTH - 230, 1, false).decorations,
        ...sheet('d_maslul_text_sheet', at(START, 236, WIDTH, 684)),
        art('d_maslul_text_hurdle', atEnd(END + 44, 120, 170, 118), hurdle(170, 118, RED)),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_maslul_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 900, 2).placeholders,
        place('p_image', 'image', atEnd(END + 56, 128, 640, 736)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 88, 336 + i * 190, 812, 50), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 88, 390 + i * 190, 812, 122), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 900, 2).decorations,
        upright(
          'd_maslul_text_image_track',
          atEnd(END, 196, 696, 724),
          trackBlock(696, 724, false),
          trackBlock(696, 724, true),
        ),
        ...[0, 1, 2].map((i) =>
          numberTile(`d_maslul_text_image_lane${i + 1}`, at(START, 336 + i * 190, 60, 56), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_maslul_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', at(0, 0, W, 760)),
        place('p_place', 'caption', at(START + 46, 806, 820, 34), 'caption', {
          color: token('accent'),
        }),
        place('p_title', 'title', at(START, 850, 900, 164), 'title', { color: token('surface') }),
        place('p_body', 'body', atEnd(END, 820, 660, 200), 'body', {
          vAlign: 'middle',
          color: token('surface', 0.88),
        }),
      ],
      decorations: [
        rect('d_maslul_full_image_band', at(0, 760, W, 304), solid(token('secondary'))),
        art(
          'd_maslul_full_image_scale',
          at(0, 760, W, 24),
          Array.from({ length: Math.floor(W / 16) + 1 }, (_, i) => {
            const len = i % 10 === 0 ? 22 : i % 5 === 0 ? 14 : 7;
            return `<path d="M${i * 16 + 1} 0V${len}" stroke="${GOLD}" stroke-opacity="${i % 10 === 0 ? 0.95 : 0.55}" stroke-width="2"/>`;
          }).join(''),
        ),
        speedBars('d_maslul_full_image_bars', at(START, 812, 32, 22), GOLD),
        rect('d_maslul_full_image_rule', atEnd(END + 708, 830, 2, 180), solid(token('surface', 0.25))),
      ],
    },
    {
      id: 'l_maslul_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 80, 300, 352, 44), 'caption', {
            color: i === 2 ? token('text') : token('surface'),
            vAlign: 'middle',
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 44, 516, 424, 96), 'heading', {
            vAlign: 'bottom',
          }),
          place(`p_card${i + 1}_body`, 'body', at(s + 44, 616, 424, 160), 'body'),
        ]),
        place('p_note', 'body', at(START, 880, 1500, 42), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => {
          const colour = [RED, NAVY, GOLD][i]!;
          return [
            lifted(art(`d_maslul_cards_bib${i + 1}`, at(s, 276, 512, 584), bib(512, 584, 92, colour))),
            art(
              `d_maslul_cards_icon${i + 1}`,
              at(s + 36, 384, 120, 120),
              PICTOGRAMS[i]!,
            ),
          ];
        }),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_maslul_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 466, 380, 76), 'title', {
            color: token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 548, 380, 96), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 650, 380, 160), 'body'),
        ]),
        place('p_note', 'caption', at(START + 46, 846, 1400, 64), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        art('d_maslul_timeline_relay', timelineBand, relay),
        speedBars('d_maslul_timeline_note_bars', at(START, 851, 32, 22)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_maslul_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => [
          place(`p_station${i + 1}`, 'number', at(s, 280, 300, 80), 'title', {
            align: 'center',
            vAlign: 'bottom',
            color: i === 4 ? token('primary') : token('text'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s, 560, 300, 56), 'heading', { align: 'center' }),
          place(`p_step${i + 1}_caption`, 'caption', at(s, 622, 300, 100), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 72, 812, WIDTH - 144, 84), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        art(
          'd_maslul_process_lane',
          at(START - 40, 518, WIDTH + 80, 16),
          `<rect width="${WIDTH + 80}" height="16" rx="3" fill="${RED}"/><path d="M0 2H${WIDTH + 80}" stroke="${WHITE}" stroke-width="2.5"/>`,
        ),
        ...steps5.map((s, i) =>
          art(
            `d_maslul_process_hurdle${i + 1}`,
            at(s + 40, 372, 220, 150),
            hurdle(220, 150, i === 4 ? RED : INK),
          ),
        ),
        ...sheet('d_maslul_process_note', at(START, 798, WIDTH, 112)),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_maslul_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', START + 14],
            ['after', START + 14 + half + 80],
          ] as const
        ).flatMap(([side, s]) => [
          place(`p_${side}_label`, 'caption', at(s + 56, board.y + 50, half - 112, 34), 'caption', {
            color: token('accent'),
          }),
          place(`p_${side}_title`, 'subtitle', at(s + 56, board.y + 90, half - 112, 96), 'heading', {
            color: token('surface'),
          }),
          place(`p_${side}_body`, 'body', at(s + 56, board.y + 190, half - 112, 124), 'body', {
            color: token('surface', 0.86),
          }),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        art('d_maslul_comparison_board', board, scoreboard('d_maslul_comparison_board', board.w, board.h)),
        art(
          'd_maslul_comparison_then',
          at(START + 14 + 56, board.y + board.h - 50 - 150, 480, 150),
          lampMeter([1, 2, 1, 1, 2, 1, 2, 2, 1, 1, 2, 1, 1, 2, 1, 1]),
        ),
        art(
          'd_maslul_comparison_now',
          at(START + 14 + half + 80 + 56, board.y + board.h - 50 - 150, 480, 150),
          // Rising toward the end of the slide, the way its time reads.
          lampMeter([5, 5, 5, 4, 5, 5, 4, 5, 4, 4, 5, 4, 3, 4, 4, 3]),
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_maslul_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1060).placeholders,
        place('p_chart', 'chart', at(START + 60, 292, 966, 504)),
        place('p_source', 'caption', at(START + 60, 814, 966, 66), 'caption'),
        place('p_figure1', 'number', atEnd(END + 52, 290, 448, 140), 'display', {
          color: token('surface'),
        }),
        place('p_figure1_body', 'body', atEnd(END + 52, 434, 448, 132), 'body', {
          color: token('surface'),
        }),
        place('p_figure2', 'number', atEnd(END + 52, 612, 448, 140), 'display', {
          color: token('surface'),
        }),
        place('p_figure2_body', 'body', atEnd(END + 52, 756, 448, 124), 'body', {
          color: token('surface'),
        }),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1060).decorations,
        ...sheet('d_maslul_chart_sheet', at(START, 262, 1064, 640)),
        art(
          'd_maslul_chart_lanes',
          atEnd(END, 262, 552, 640),
          `<rect width="552" height="640" rx="10" fill="${RED}"/>` +
            `<path d="M20 0V640M532 0V640" stroke="${WHITE}" stroke-width="2.6"/>` +
            `<path d="M20 334H532" stroke="${WHITE}" stroke-width="6"/>`,
        ),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_maslul_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1300).placeholders,
        place('p_table', 'table', at(START + 60, 334, WIDTH - 120, 480)),
        place('p_note', 'caption', at(START + 60, 834, WIDTH - 120, 40), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1300).decorations,
        lifted(art('d_maslul_table_clipboard', at(START, 232, WIDTH, 688), clipboard(WIDTH, 688)), 14, 30, 0.18),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_maslul_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1200).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s + 30, 342, 332, 296)),
          place(`p_group${i + 1}`, 'caption', at(s + 30, 648, 332, 66), 'caption', {
            vAlign: 'bottom',
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s + 30, 718, 332, 48), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s + 30, 768, 332, 118), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1200).decorations,
        ...team4.map((s, i) =>
          lifted(
            art(
              `d_maslul_team_pass${i + 1}`,
              at(s, 204, 392, 700),
              pass(`d_maslul_team_pass${i + 1}`, 392, 700, [RED, NAVY, GOLD, GRASS][i]!),
            ),
          ),
        ),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_maslul_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 46, 250, 820, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 294, 860, 290), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 60, 618 + i * 80, 800, 72), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START, 900, 860, 34), 'caption'),
      ],
      decorations: [
        mark('d_maslul_closing_mark', at(START, 96, 56, 34)),
        speedBars('d_maslul_closing_bars', at(START, 256, 32, 22)),
        art('d_maslul_closing_stadium', atEnd(48, 214, 880, 580), stadium('d_maslul_closing_stadium', 880, 580)),
        ...[0, 1, 2].map((i) =>
          art(
            `d_maslul_closing_key${i + 1}`,
            at(START, 622 + i * 80, 32, 32),
            `<g transform="scale(${r1(32 / 36)})">` +
              [
                `<rect x="3" y="6" width="30" height="27" rx="4" stroke="${INK}" stroke-width="2.6"/><path d="M3 14H33M11 3V9M25 3V9" stroke="${INK}" stroke-width="2.6" stroke-linecap="round"/><rect x="20" y="20" width="7" height="7" rx="1.5" fill="${RED}"/>`,
                `<g transform="translate(0 6)">${oval(36, 24)}</g>`,
                stopwatchIcon(36),
              ][i]! +
              `</g>`,
          ),
        ),
        rect('d_maslul_closing_rule', at(START, 878, 860, 2), solid(token('text', 0.14))),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the figures painted on the track, the stopwatch, the quote marks) moved across as
 * they are, or drawn again for that side.
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
// The sample: the 2027 season launch of an athletics club

const TABLE_COLS = [440, 170, 300, 300, 334];
const TABLE_ROW = 80;
const UNDER_18 = [38, 52, 71, 118];
const SENIORS = [41, 49, 60, 94];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari, the marks over Vietnamese capitals, and the accents,
 * umlauts and breves over the capitals of the other Latin and Cyrillic languages, and the
 * deep tails of Arabic over its tall letters, meet across lines set as tight as English
 * capitals. The display titles of the opening, a part and the
 * closing (two lines of them fill the 280px of a part's box at 1.06), and every other title.
 */
const ACCENTED = { display: 1.06, title: 1.16, subtitle: 1.18 };
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number }>
> = {
  hi: { display: 1.06, title: 1.3, subtitle: 1.42 },
  // Vietnamese display titles take a second line only where it carries no mark above its
  // capitals and the first none below: no leading in these boxes clears stacked marks.
  vi: { display: 1.09, title: 1.2, subtitle: 1.3 },
  ar: ACCENTED,
  de: ACCENTED,
  es: ACCENTED,
  fr: ACCENTED,
  it: ACCENTED,
  'pt-BR': ACCENTED,
  ru: ACCENTED,
  tr: ACCENTED,
};
const DISPLAYED = new Set(['l_maslul_hero', 'l_maslul_section', 'l_maslul_closing']);

/**
 * The letters a language draws in a counterpart of the heading face that has one weight: the
 * Korean of Oswald is Black Han Sans, 400 only, and at the theme's 700 the browser emboldens it,
 * which opens white seams where its strokes overlap. Those letters are set at the weight the
 * face has (it is a black face already); the figures and Latin letters beside them stay Oswald.
 */
const ONE_WEIGHT: Partial<Record<ContentLanguage, { letters: RegExp; weight: number }>> = {
  ko: { letters: /(\p{Script=Hangul}+)/u, weight: 400 },
};
/** The roles this template sets in the heading face. */
const HEADING_ROLES = ['title', 'quote', 'subtitle', 'attribution', 'number'] as const;

function reweighted(fill: RoleFill, face: { letters: RegExp; weight: number }): RoleFill {
  if (!('paragraphs' in fill)) return fill;
  return {
    paragraphs: fill.paragraphs.map((p) => ({
      ...p,
      runs: p.runs.flatMap((run) =>
        run.text
          .split(face.letters)
          .filter(Boolean)
          .map((part) =>
            face.letters.test(part)
              ? { ...run, text: part, marks: { ...run.marks, weight: face.weight } }
              : { ...run, text: part },
          ),
      ),
    })),
  };
}

/** The sample deck in one language, from its copy. */
function sample(copy: MaslulCopy, lang: ContentLanguage): SampleSlide[] {
  const face = ONE_WEIGHT[lang];
  const slides = face
    ? drawSample(copy).map((slide) => {
        const content = { ...slide.content };
        for (const role of HEADING_ROLES) {
          const fill = content[role];
          if (fill) {
            content[role] = Array.isArray(fill)
              ? fill.map((f: RoleFill) => reweighted(f, face))
              : reweighted(fill as RoleFill, face);
          }
        }
        return { ...slide, content };
      })
    : drawSample(copy);
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

function drawSample(copy: MaslulCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_maslul_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_maslul_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_maslul_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 34 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('primary'), gap: 22 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_maslul_big_number',
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
      layout: 'l_maslul_text_image',
      name: copy.academy.name,
      content: {
        caption: text(copy.academy.kicker),
        title: lines(copy.academy.title),
        image: { assetId: pictures.blocks.id },
        subtitle: copy.academy.items.map(([title]) => text(title)),
        body: copy.academy.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_maslul_full_image',
      name: copy.track.name,
      content: {
        image: { assetId: pictures.dawn.id },
        caption: text(copy.track.place),
        title: text(...copy.track.title),
        body: text(copy.track.body),
      },
    },
    {
      layout: 'l_maslul_quote',
      name: copy.quote.name,
      content: {
        quote: text(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_maslul_cards',
      name: copy.groups.name,
      content: {
        caption: [text(copy.groups.kicker), ...copy.groups.cards.map(([label]) => text(label))],
        title: lines(copy.groups.title),
        subtitle: copy.groups.cards.map(([, title]) => text(title)),
        body: [...copy.groups.cards.map(([, , body]) => text(body)), text(copy.groups.note)],
        footer,
      },
    },
    {
      layout: 'l_maslul_timeline',
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
      layout: 'l_maslul_process',
      name: copy.joining.name,
      content: {
        caption: [
          text(copy.joining.kicker),
          ...copy.joining.steps.map(([, caption]) => text(caption)),
        ],
        title: lines(copy.joining.title),
        number: copy.joining.steps.map((_, i) => text(String(i + 1).padStart(2, '0'))),
        subtitle: copy.joining.steps.map(([step]) => text(step)),
        body: text(copy.joining.note),
        footer,
      },
    },
    {
      layout: 'l_maslul_comparison',
      name: copy.thenNow.name,
      content: {
        caption: [
          text(copy.thenNow.kicker),
          text(copy.thenNow.before[0]),
          text(copy.thenNow.after[0]),
        ],
        title: lines(copy.thenNow.title),
        subtitle: [text(copy.thenNow.before[1]), text(copy.thenNow.after[1])],
        body: [text(copy.thenNow.before[2]), text(copy.thenNow.after[2])],
        footer,
      },
    },
    {
      layout: 'l_maslul_chart',
      name: copy.bests.name,
      content: {
        caption: [text(copy.bests.kicker), text(copy.bests.source)],
        title: lines(copy.bests.title),
        number: copy.bests.figures.map(([value]) => text(value)),
        body: copy.bests.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: ['2023', '2024', '2025', '2026'],
          series: [
            { name: copy.bests.series[0], values: UNDER_18 },
            { name: copy.bests.series[1], values: SENIORS },
          ],
        },
      },
    },
    {
      layout: 'l_maslul_table',
      name: copy.timetable.name,
      content: {
        caption: [text(copy.timetable.kicker), text(copy.timetable.note)],
        title: lines(copy.timetable.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.timetable.header, ...copy.timetable.rows],
      },
    },
    {
      layout: 'l_maslul_team',
      name: copy.coaches.name,
      content: {
        caption: [text(copy.coaches.kicker), ...copy.coaches.people.map(([group]) => text(group))],
        title: lines(copy.coaches.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.coaches.people.map(([, name]) => text(name)),
        body: copy.coaches.people.map(([, , role]) => text(role)),
        footer,
      },
    },
    {
      layout: 'l_maslul_closing',
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
export const maslulSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => MASLUL_COPY[lang]).map((lang) => [
    lang,
    sample(MASLUL_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Maslul template: the theme, its layouts for both directions, and its sample deck. */
export function maslulTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(maslulTheme),
    description:
      'An athletics stadium: red lanes and white lines on chalk, the bend with its staggered start, a stopwatch, race bibs, hurdles, a relay, a scoreboard and the whole oval, for clubs, coaches and sports events.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.blocks, pictures.dawn, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, maslulSamples.he);
  return finished;
}

export const entry = { id: 'maslul', template: maslulTemplate, samples: maslulSamples };
