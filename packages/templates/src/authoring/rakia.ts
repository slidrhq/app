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
import { RAKIA_COPY, type RakiaCopy } from './rakia/copy';
import { picture } from './pictures';

const pictures = {
  mirror: picture('rakiaMirror'),
  site: picture('rakiaSite'),
  team: [1, 2, 3, 4].map((n) => picture(`rakiaTeam${n}`)),
};

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A small seeded generator, so a field of stars is the same field on every draw. */
function seeded(seed: number): () => number {
  let state = seed;
  return () => {
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * The ground: the night over the observatory. A faint field of stars, scattered over two tiles
 * of different sizes so that it does not repeat as a grid, and a glow of the horizon at the
 * foot of the slide, under every slide's horizon line.
 */
function nightSky(): string {
  const rand = seeded(11);
  const layers: string[] = [
    'radial-gradient(150% 62% at 50% 116%, color-mix(in srgb, var(--color-primary) 14%, transparent), transparent 72%)',
  ];
  for (const [tw, th, n] of [
    [700, 440, 15],
    [1130, 690, 12],
  ] as const) {
    for (let i = 0; i < n; i++) {
      const x = Math.round(rand() * tw);
      const y = Math.round(rand() * th);
      const b = rand();
      const r = r1(0.7 + b * b * 1.1);
      const a = Math.round(20 + b * 44);
      const tint = rand() < 0.22 ? 'primary' : 'text';
      layers.push(
        `radial-gradient(circle at ${x}px ${y}px, color-mix(in srgb, var(--color-${tint}) ${a}%, transparent) ${r}px, transparent ${r1(r + 1)}px) 0 0 / ${tw}px ${th}px`,
      );
    }
  }
  layers.push('var(--color-bg)');
  return layers.join(', ');
}

/**
 * Rakia (Cosmos): the slide is the night over a mountain observatory, seen through its
 * instruments. A deep night ground with a faint field of stars and the glow of the horizon at
 * its foot; every content slide stands on the same thin horizon line with its azimuth scale,
 * the deck's mark (a reflector's aperture, whose four spider vanes give a star its spikes) at
 * its start and the slide's number beside a spiked star at its end. On it the objects of the
 * field, each doing a job: star trails wheeling around the pole over a dome on its ridge, the
 * Moon whose earthshine holds a part's number, two mirrors drawn to scale beside a figure, the
 * meridian arc over a quote, the square camera frame in the telescope's round field, negative
 * photographic plates on the cards, an orrery for a timeline, the spectrum and its absorption
 * lines for a process, the same patch of sky through two eyepieces, a plot frame with inward
 * ticks, Galileo's nightly sketches of Jupiter's moons, a team joined as a constellation, and a
 * truss telescope taking in a star's light. Starlight cream for the words, Vega blue and
 * Arcturus amber beside them, hydrogen-alpha red kept for the little that must stand out. For
 * observatories, space research, science outreach, physics teaching and planetariums.
 *
 * No drawing holds a word, so one set of layouts reads in every language: Bellefair, a fine
 * serif of the old star atlases, for what is said aloud, and Miriam Libre, a geometric sans,
 * for what is read; both carry Hebrew and Latin, and the other scripts take their counterparts.
 */
export const rakiaTheme: Theme = {
  id: 'rakia',
  name: 'Cosmos',
  colors: {
    bg: '#0a0e1d',
    surface: '#151b33',
    text: '#f3ecdc',
    muted: '#a7adc2',
    primary: '#9cc4ff',
    secondary: '#ffb45e',
    accent: '#ff7a66',
    chart: ['#9cc4ff', '#ffb45e', '#ff7a66', '#7fd8c4', '#f3ecdc', '#8b86f0'],
  },
  fonts: {
    heading: { he: 'Bellefair', latin: 'Bellefair' },
    body: { he: 'Miriam Libre', latin: 'Miriam Libre' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 120,
      weight: 400,
      lineHeight: 1.02,
      letterSpacing: -1.5,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 60,
      weight: 400,
      lineHeight: 1.12,
      letterSpacing: -0.4,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 40, weight: 400, lineHeight: 1.2, color: { token: 'text' } },
    body: { font: 'body', size: 27, weight: 400, lineHeight: 1.5, color: { token: 'text' } },
    caption: {
      font: 'body',
      size: 24,
      weight: 500,
      lineHeight: 1.4,
      letterSpacing: 0.6,
      color: { token: 'muted' },
    },
  },
  radius: 14,
  shadow: { x: 0, y: 24, blur: 56, color: { value: '#000000', alpha: 0.34 } },
  background: { fill: { kind: 'css', value: nightSky() } },
  backgroundVariants: [
    SURFACE,
    // The night alone, without its stars.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const NIGHT = '#0a0e1d';
const GLASS = '#151b33';
const CREAM = '#f3ecdc';
const DUSK = '#a7adc2';
const VEGA = '#9cc4ff';
const AMBER = '#ffb45e';
const NEBULA = '#ff7a66';

const PAINT = {
  [NIGHT]: token('bg'),
  [GLASS]: token('surface'),
  [CREAM]: token('text'),
  [DUSK]: token('muted'),
  [VEGA]: token('primary'),
  [AMBER]: token('secondary'),
  [NEBULA]: token('accent'),
};

/** The colours of the spectrum, which are the light's own and follow no token. */
const SPECTRUM = [
  [0, '#5a3fd0'],
  [0.12, '#4a5cf0'],
  [0.26, '#2f9be8'],
  [0.4, '#36c98d'],
  [0.52, '#b8de48'],
  [0.6, '#ffe04a'],
  [0.7, '#ffa040'],
  [0.84, '#f2503c'],
  [1, '#a8283e'],
] as const;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings that a left-to-right deck must not see mirrored: the Moon (a mirrored Moon is
 * another world) and those with figures in them. Their mirror moves them to the other side and
 * leaves them as they are, or takes the drawing given for that direction.
 */
const UPRIGHT = new Map<string, string | undefined>();

const upright = (id: string, frame: Frame, body: string, ltr?: string) => {
  UPRIGHT.set(id, ltr === undefined ? undefined : svg(frame.w, frame.h, ltr));
  return art(id, frame, body);
};

const RAD = Math.PI / 180;
const polar = (cx: number, cy: number, r: number, deg: number) =>
  [cx + r * Math.cos(deg * RAD), cy + r * Math.sin(deg * RAD)] as const;

// ---------------------------------------------------------------------------------------------
// The sky's small things

/**
 * A star as a reflector photographs it: a bright core, a soft glow, and the four spikes the
 * vanes of its secondary mirror draw, with four short faint ones between them.
 */
function sparkle(cx: number, cy: number, r: number, colour = CREAM) {
  const spike = (ax: number, ay: number, len: number, wide: number) => {
    const bx = -ay;
    const by = ax;
    return (
      `M${r1(cx + ax * len)} ${r1(cy + ay * len)}L${r1(cx + bx * wide)} ${r1(cy + by * wide)}` +
      `L${r1(cx - ax * len)} ${r1(cy - ay * len)}L${r1(cx - bx * wide)} ${r1(cy - by * wide)}Z`
    );
  };
  const k = Math.SQRT1_2;
  return (
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.52)}" fill="${colour}" fill-opacity=".08"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(r * 0.28)}" fill="${colour}" fill-opacity=".2"/>` +
    `<path d="${spike(0, 1, r, r * 0.1)}${spike(1, 0, r, r * 0.1)}" fill="${colour}"/>` +
    `<path d="${spike(k, k, r * 0.42, r * 0.07)}${spike(k, -k, r * 0.42, r * 0.07)}" fill="${colour}" fill-opacity=".5"/>` +
    `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r1(Math.max(1.2, r * 0.12))}" fill="${CREAM}"/>`
  );
}

/** A scatter of faint stars in a box, away from the boxes in `keepOut`. */
function specks(
  seed: number,
  w: number,
  h: number,
  n: number,
  colour = CREAM,
  keepOut: readonly [number, number, number, number][] = [],
  size = 1,
) {
  const rand = seeded(seed);
  let body = '';
  for (let i = 0; i < n; i++) {
    const x = rand() * w;
    const y = rand() * h;
    const b = rand();
    if (keepOut.some(([kx, ky, kw, kh]) => x > kx && x < kx + kw && y > ky && y < ky + kh)) continue;
    body += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1((0.6 + b * b * 1.6) * size)}" fill="${colour}" fill-opacity="${r1(0.2 + b * 0.6)}"/>`;
  }
  return body;
}

/** The front of a reflector: its ring, the secondary mirror, and the four vanes that hold it. */
function aperture(s: number) {
  const c = s / 2;
  const inner = c - 5;
  const sec = s * 0.15;
  return (
    `<circle cx="${c}" cy="${c}" r="${r1(c - 1.5)}" stroke="${CREAM}" stroke-width="1.6"/>` +
    `<circle cx="${c}" cy="${c}" r="${r1(inner)}" fill="${VEGA}" fill-opacity=".18" stroke="${VEGA}" stroke-opacity=".55" stroke-width="1"/>` +
    `<path d="M${c} ${r1(c - inner)}V${r1(c - sec)}M${c} ${r1(c + sec)}V${r1(c + inner)}M${r1(c - inner)} ${c}H${r1(c - sec)}M${r1(c + sec)} ${c}H${r1(c + inner)}" stroke="${CREAM}" stroke-width="1.4"/>` +
    `<circle cx="${c}" cy="${c}" r="${r1(sec)}" fill="${CREAM}"/>`
  );
}

/** A horizon: a hairline with the ticks of an azimuth scale hanging from it. */
function horizon(w: number, step = 26) {
  let ticks = '';
  for (let x = 0, i = 0; x <= w + 0.5; x += step, i++) {
    ticks += `M${r1(Math.min(x, w - 0.6))} 1V${i % 5 === 0 ? 10 : 5}`;
  }
  return (
    `<path d="M0 1H${w}" stroke="${CREAM}" stroke-opacity=".28" stroke-width="1.2"/>` +
    `<path d="${ticks}" stroke="${CREAM}" stroke-opacity=".22" stroke-width="1"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The scenes

/**
 * Star trails: every star an arc of the same angle around the celestial pole, as a long
 * exposure draws them, in the colours of their temperatures. They fade away from the pole and
 * towards the inner side of their box, where the words are.
 */
function trails(id: string, w: number, h: number, px: number, py: number) {
  const rand = seeded(5);
  const reach = Math.hypot(Math.max(px, w - px), Math.max(py, h - py));
  const sweep = 34;
  let arcs = '';
  for (let i = 0; i < 320; i++) {
    const r = 14 + reach * Math.sqrt(rand());
    const a0 = rand() * 360;
    const b = rand() ** 2.4;
    const pick = rand();
    const colour = pick < 0.16 ? VEGA : pick < 0.28 ? AMBER : pick < 0.31 ? NEBULA : CREAM;
    const [x1, y1] = polar(px, py, r, a0);
    const [x2, y2] = polar(px, py, r, a0 + sweep);
    arcs += `<path d="M${r1(x1)} ${r1(y1)}A${r1(r)} ${r1(r)} 0 0 1 ${r1(x2)} ${r1(y2)}" stroke="${colour}" stroke-opacity="${r1((0.2 + b * 0.75) * 100) / 100}" stroke-width="${r1(0.9 + b * 2.6)}" stroke-linecap="round"/>`;
  }
  const g = (n: string) => `${id}-${n}`;
  return (
    `<defs>` +
    `<radialGradient id="${g('rf')}" gradientUnits="userSpaceOnUse" cx="${px}" cy="${py}" r="${r1(reach * 0.92)}">` +
    `<stop offset="0" stop-color="#fff"/><stop offset=".5" stop-color="#fff"/><stop offset="1" stop-color="#000"/></radialGradient>` +
    `<linearGradient id="${g('lf')}" gradientUnits="userSpaceOnUse" x1="0" y1="0" x2="${w}" y2="${r1(h * 0.25)}">` +
    `<stop offset=".5" stop-color="#fff"/><stop offset=".97" stop-color="#000"/></linearGradient>` +
    `<mask id="${g('rm')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#${g('rf')})"/></mask>` +
    `<mask id="${g('lm')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${w}" height="${h}"><rect width="${w}" height="${h}" fill="url(#${g('lf')})"/></mask>` +
    `</defs>` +
    `<g mask="url(#${g('lm')})"><g mask="url(#${g('rm')})">${arcs}</g></g>` +
    sparkle(px, py, 13, CREAM)
  );
}

/** A ridge with an observatory on its summit: the dome, its slit open on a warm light. */
function observatory(id: string, w: number, h: number, sx: number) {
  const g = (n: string) => `${id}-${n}`;
  const top = h - 130;
  const ridge =
    `M0 ${h}V${top + 70}C${r1(sx * 0.35)} ${top + 64} ${r1(sx * 0.7)} ${top + 18} ${r1(sx - 120)} ${top + 2}` +
    `L${r1(sx + 150)} ${top + 2}C${r1(sx + 300)} ${top + 14} ${r1(sx + 420)} ${top + 70} ${r1(sx + 560)} ${top + 82}` +
    `C${r1(sx + 680)} ${top + 92} ${r1(w - 120)} ${top + 120} ${w} ${top + 128}V${h}Z`;
  const dr = 92;
  const base = top + 2;
  const drum = base - 62;
  const apex = drum - dr;
  const cap = `M${sx - dr} ${drum}A${dr} ${dr} 0 0 1 ${sx + dr} ${drum}Z`;
  // The slit: a band down the dome from its crown, open on the warm light inside.
  const [s1, s2] = [sx + 6, sx + 36];
  let seams = '';
  for (const x of [-0.62, -0.24, 0.62]) seams += `M${r1(sx + x * dr)} ${drum + 4}V${base - 4}`;
  return (
    `<defs><linearGradient id="${g('dome')}" x1="0" y1="0" x2="1" y2=".4">` +
    `<stop offset="0" stop-color="${DUSK}" stop-opacity=".9"/><stop offset=".55" stop-color="${DUSK}" stop-opacity=".45"/><stop offset="1" stop-color="${GLASS}"/></linearGradient>` +
    `<linearGradient id="${g('slit')}" x1="0" y1="0" x2="0" y2="1">` +
    `<stop offset="0" stop-color="${AMBER}" stop-opacity=".55"/><stop offset="1" stop-color="${AMBER}"/></linearGradient>` +
    `<radialGradient id="${g('glow')}"><stop offset="0" stop-color="${AMBER}" stop-opacity=".3"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="${g('cap')}"><path d="${cap}"/></clipPath></defs>` +
    `<path d="${ridge}" fill="${NIGHT}"/>` +
    `<path d="${ridge.replace(/V\d+Z$/, '')}" stroke="${CREAM}" stroke-opacity=".22" stroke-width="1.4"/>` +
    `<circle cx="${sx + 20}" cy="${apex + 64}" r="104" fill="url(#${g('glow')})"/>` +
    // The control room beside the drum, its one lit window.
    `<path d="M${sx + dr - 4} ${base}V${base - 38}H${sx + dr + 84}V${base}Z" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.2"/>` +
    `<rect x="${sx + dr + 44}" y="${base - 26}" width="14" height="10" fill="${AMBER}" fill-opacity=".8"/>` +
    // The drum, the dome and its slit.
    `<rect x="${sx - dr}" y="${drum}" width="${dr * 2}" height="${base - drum}" fill="${GLASS}"/>` +
    `<path d="${cap}" fill="${GLASS}"/>` +
    `<rect x="${sx - dr}" y="${drum}" width="${dr * 2}" height="${base - drum}" fill="url(#${g('dome')})" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.4"/>` +
    `<path d="${seams}" stroke="${NIGHT}" stroke-opacity=".35" stroke-width="1.2"/>` +
    `<path d="${cap}" fill="url(#${g('dome')})" stroke="${CREAM}" stroke-opacity=".5" stroke-width="1.4"/>` +
    `<g clip-path="url(#${g('cap')})">` +
    `<rect x="${s1}" y="${apex - 4}" width="${s2 - s1}" height="${dr + 4}" fill="url(#${g('slit')})"/>` +
    `<path d="M${s1 + 9} ${drum - 4}L${s2 - 7} ${apex + 26}" stroke="${NIGHT}" stroke-width="6" stroke-linecap="round"/>` +
    `<path d="M${s1 + 4} ${drum - 18}H${s2 - 4}" stroke="${NIGHT}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M${s1} ${apex - 4}V${drum}M${s2} ${apex - 4}V${drum}" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.4"/>` +
    `</g>` +
    `<path d="M${sx - dr} ${drum}H${sx + dr}" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.2"/>`
  );
}

interface MoonOptions {
  cx: number;
  cy: number;
  r: number;
  /** The side the Sun lights. */
  lit: 'left' | 'right';
  /** The share of the disc's width that is lit, from the lit limb. */
  phase: number;
}

/**
 * The Moon: its near side with the seas where they are, a scatter of craters, the halo, and
 * the night side lit faintly by the Earth. The terminator is drawn three times, softer each
 * time, so the light fades into it as it does on the Moon.
 */
function moon(id: string, o: MoonOptions) {
  const { cx, cy, r } = o;
  const g = (n: string) => `${id}-${n}`;
  const rand = seeded(29);
  // The seas, by their place on the face (x to the east limb, y down), and their size.
  const seas: [number, number, number, number][] = [
    [-0.28, -0.4, 0.34, 0.28],
    [0.2, -0.36, 0.19, 0.17],
    [0.36, -0.06, 0.23, 0.2],
    [0.68, -0.28, 0.12, 0.1],
    [0.55, 0.16, 0.14, 0.19],
    [0.3, 0.27, 0.1, 0.1],
    [-0.56, -0.04, 0.3, 0.46],
    [-0.15, 0.36, 0.2, 0.15],
    [-0.46, 0.36, 0.1, 0.1],
    [0.02, -0.08, 0.1, 0.12],
  ];
  let craters = '';
  for (let i = 0; i < 46; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * 0.92;
    const x = cx + Math.cos(a) * d * r;
    const y = cy + Math.sin(a) * d * r;
    const s = (0.008 + rand() ** 3 * 0.035) * r;
    craters += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1(s)}" fill="${DUSK}" fill-opacity=".14" stroke="${DUSK}" stroke-opacity=".38" stroke-width="${r1(Math.max(1, s * 0.18))}"/>`;
  }
  // Tycho and its rays, in the south.
  const tx = cx - 0.14 * r;
  const ty = cy + 0.68 * r;
  let rays = '';
  for (let i = 0; i < 14; i++) {
    const a = (i / 14) * 360 + rand() * 12;
    const [x2, y2] = polar(tx, ty, r * (0.25 + rand() * 0.35), a);
    rays += `M${r1(tx)} ${r1(ty)}L${r1(x2)} ${r1(y2)}`;
  }
  const right = o.lit === 'right';
  // The night side, reaching past the limb so that its blurred edge falls outside the disc,
  // and the terminator, a half ellipse, closing it.
  const shadow = (a: number) => {
    const sweep = right ? 0 : 1;
    const far = r1(cx + (right ? -1.4 : 1.4) * r);
    return (
      `M${cx} ${cy - r}V${cy - r - 60}H${far}V${cy + r + 60}H${cx}V${cy + r}` +
      `A${r1(Math.abs(a))} ${r} 0 0 ${a >= 0 ? sweep : 1 - sweep} ${cx} ${cy - r}Z`
    );
  };
  const a0 = r * (1 - 2 * o.phase);
  // The halo stands off the lit limb only: its centre is moved to the lit side, so that on the
  // night side it lies under the disc.
  const hx = cx + (right ? 1 : -1) * r * 0.22;
  const hr = r * 0.78 + 90;
  return (
    `<defs>` +
    `<filter id="${g('soft')}" x="-20%" y="-20%" width="140%" height="140%"><feGaussianBlur stdDeviation="${r1(r * 0.035)}"/></filter>` +
    `<radialGradient id="${g('lit')}" cx="${right ? 0.62 : 0.38}" cy=".4" r=".66">` +
    `<stop offset="0" stop-color="${CREAM}"/><stop offset=".72" stop-color="${CREAM}" stop-opacity=".94"/><stop offset="1" stop-color="${DUSK}" stop-opacity=".95"/></radialGradient>` +
    `<radialGradient id="${g('sea')}"><stop offset="0" stop-color="${NIGHT}" stop-opacity=".3"/><stop offset=".6" stop-color="${NIGHT}" stop-opacity=".2"/><stop offset="1" stop-color="${NIGHT}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${g('halo')}" gradientUnits="userSpaceOnUse" cx="${r1(hx)}" cy="${cy}" r="${r1(hr)}"><stop offset="${r1(((r * 0.78) / hr) * 100) / 100}" stop-color="${CREAM}" stop-opacity=".2"/><stop offset="1" stop-color="${CREAM}" stop-opacity="0"/></radialGradient>` +
    `<clipPath id="${g('disc')}"><circle cx="${cx}" cy="${cy}" r="${r}"/></clipPath>` +
    `</defs>` +
    `<circle cx="${r1(hx)}" cy="${cy}" r="${r1(hr)}" fill="url(#${g('halo')})"/>` +
    `<g clip-path="url(#${g('disc')})">` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g('lit')})"/>` +
    seas
      .map(
        ([x, y, w, h]) =>
          `<ellipse cx="${r1(cx + x * r)}" cy="${r1(cy + y * r)}" rx="${r1(w * r)}" ry="${r1(h * r)}" fill="url(#${g('sea')})"/>`,
      )
      .join('') +
    craters +
    `<path d="${rays}" stroke="${CREAM}" stroke-opacity=".3" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="${r1(tx)}" cy="${r1(ty)}" r="${r1(r * 0.026)}" fill="${CREAM}" stroke="${DUSK}" stroke-opacity=".5" stroke-width="1.4"/>` +
    `<path d="${shadow(a0 + r * 0.05)}" fill="${GLASS}" fill-opacity=".5" filter="url(#${g('soft')})"/>` +
    `<path d="${shadow(a0)}" fill="${GLASS}" fill-opacity=".8" filter="url(#${g('soft')})"/>` +
    `</g>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" stroke="${CREAM}" stroke-opacity=".2" stroke-width="1.4"/>`
  );
}

/** The phases of the Moon in a row, the given one ringed. */
function phases(n: number, size: number, gap: number, ringed: number) {
  let body = '';
  const r = size / 2;
  for (let i = 0; i < n; i++) {
    // From the start side of the row, which is its right in the drawing.
    const cx = (n - 1) * (size + gap) + r + 2 - i * (size + gap);
    const cy = r + 2;
    const f = i / n;
    // 0 new, 0.25 first quarter (lit on the right), 0.5 full, 0.75 last quarter.
    const litRight = f <= 0.5;
    const lit = f <= 0.5 ? f * 2 : (1 - f) * 2;
    const a = r * (1 - 2 * lit);
    const sweep = litRight ? 1 : 0;
    const path =
      `M${r1(cx)} ${r1(cy - r)}A${r} ${r} 0 0 ${sweep} ${r1(cx)} ${r1(cy + r)}` +
      `A${r1(Math.abs(a))} ${r} 0 0 ${a >= 0 ? 1 - sweep : sweep} ${r1(cx)} ${r1(cy - r)}Z`;
    body +=
      `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r}" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".35" stroke-width="1.2"/>` +
      (lit > 0.01 ? `<path d="${path}" fill="${CREAM}" fill-opacity=".9"/>` : '') +
      (i === ringed
        ? `<circle cx="${r1(cx)}" cy="${r1(cy)}" r="${r + 6}" stroke="${VEGA}" stroke-width="1.6"/>`
        : '');
  }
  return body;
}

/** A telescope's mirror seen face on: the silvered glass, its rings, and the hole at its centre. */
function mirrorFace(id: string, cx: number, cy: number, r: number) {
  const g = (n: string) => `${id}-${n}`;
  const [hx1, hy1] = polar(cx, cy, r * 0.8, 206);
  const [hx2, hy2] = polar(cx, cy, r * 0.8, 236);
  return (
    `<defs><radialGradient id="${g('glass')}" cx=".38" cy=".34" r=".8">` +
    `<stop offset="0" stop-color="${CREAM}" stop-opacity=".42"/><stop offset=".45" stop-color="${VEGA}" stop-opacity=".22"/><stop offset="1" stop-color="${GLASS}"/></radialGradient></defs>` +
    `<circle cx="${cx}" cy="${cy}" r="${r}" fill="url(#${g('glass')})" stroke="${CREAM}" stroke-opacity=".7" stroke-width="2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.93)}" stroke="${VEGA}" stroke-opacity=".4" stroke-width="1.2"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.6)}" stroke="${VEGA}" stroke-opacity=".16" stroke-width="1"/>` +
    `<path d="M${r1(hx1)} ${r1(hy1)}A${r1(r * 0.8)} ${r1(r * 0.8)} 0 0 1 ${r1(hx2)} ${r1(hy2)}" stroke="${CREAM}" stroke-opacity=".32" stroke-width="${r1(Math.max(2, r * 0.035))}" stroke-linecap="round"/>` +
    `<circle cx="${cx}" cy="${cy}" r="${r1(r * 0.16)}" fill="${NIGHT}" stroke="${CREAM}" stroke-opacity=".35" stroke-width="1.2"/>`
  );
}

/** The dimension line of a drawing: arrows to two ticks. */
function dimension(x1: number, x2: number, y: number) {
  return (
    `<path d="M${r1(x1)} ${r1(y - 12)}V${r1(y + 12)}M${r1(x2)} ${r1(y - 12)}V${r1(y + 12)}M${r1(x1 + 2)} ${y}H${r1(x2 - 2)}" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.3"/>` +
    `<path d="M${r1(x1 + 12)} ${y - 5}L${r1(x1 + 2)} ${y}L${r1(x1 + 12)} ${y + 5}M${r1(x2 - 12)} ${y - 5}L${r1(x2 - 2)} ${y}L${r1(x2 - 12)} ${y + 5}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.3" stroke-linejoin="round"/>`
  );
}

/** Opening quotation marks of a serif face, drawn. */
const QUOTE_MARKS =
  'M44 0C20 6 4 24 4 48c0 14 8 24 22 24 12 0 20-8 20-19s-8-18-18-18c-3 0-5 0-7 1 3-12 12-22 26-28Z' +
  'M98 0C74 6 58 24 58 48c0 14 8 24 22 24 12 0 20-8 20-19s-8-18-18-18c-3 0-5 0-7 1 3-12 12-22 26-28Z';

/** A small constellation: its stars joined, one of them spiked. */
function constellation(stars: readonly [number, number, number][], lines: readonly [number, number][]) {
  return (
    `<path d="${lines
      .map(([a, b]) => `M${stars[a]![0]} ${stars[a]![1]}L${stars[b]![0]} ${stars[b]![1]}`)
      .join('')}" stroke="${CREAM}" stroke-opacity=".32" stroke-width="1.2" stroke-dasharray="1 4" stroke-linecap="round"/>` +
    stars
      .map(([x, y, s], i) =>
        i === 0
          ? sparkle(x, y, s * 4.2, VEGA)
          : `<circle cx="${x}" cy="${y}" r="${r1(s * 1.6)}" fill="${CREAM}" fill-opacity=".14"/><circle cx="${x}" cy="${y}" r="${s}" fill="${CREAM}"/>`,
      )
      .join('')
  );
}

/** The corner marks of a camera's frame, an L at each corner of a box. */
function brackets(w: number, h: number, arm: number, colour = CREAM, opacity = 0.55) {
  return `<path d="M1 ${arm}V1H${arm}M${w - arm} 1H${w - 1}V${arm}M${w - 1} ${h - arm}V${h - 1}H${w - arm}M${arm} ${h - 1}H1V${h - arm}" stroke="${colour}" stroke-opacity="${opacity}" stroke-width="2"/>`;
}

/** A negative photographic plate: pale glass, the sky on it dark, its corner cut. */
function plate(w: number, h: number, kind: number) {
  const rand = seeded(41 + kind * 7);
  const cut = 22;
  let body = `<path d="M0 0H${w - cut}L${w} ${cut}V${h}H0Z" fill="${CREAM}" fill-opacity=".92"/>`;
  body += specks(53 + kind, w, h, 70, NIGHT, [[w - cut - 6, 0, cut + 6, cut + 6]], 1);
  const cx = w / 2;
  if (kind === 0) {
    // A planet in transit: the star a dark disc in the negative, the planet a pale spot on it,
    // and under them the star's light, dipping while it passes.
    body +=
      `<circle cx="${cx}" cy="76" r="62" fill="${NIGHT}" fill-opacity=".08"/>` +
      `<circle cx="${cx}" cy="76" r="48" fill="${NIGHT}" fill-opacity=".16"/>` +
      `<circle cx="${cx}" cy="76" r="38" fill="${NIGHT}"/>` +
      `<circle cx="${cx + 12}" cy="84" r="7" fill="${CREAM}"/>`;
    for (let x = 40; x <= w - 40; x += 10) {
      const t = (x - cx) / 62;
      const dip = Math.abs(t) < 1 ? 13 * Math.min(1, (1 - Math.abs(t)) * 3) : 0;
      body += `<circle cx="${x}" cy="${r1(152 + dip + (rand() - 0.5) * 3)}" r="2.3" fill="${NIGHT}"/>`;
    }
  } else if (kind === 1) {
    // A near-Earth asteroid: its streak on a long exposure, ringed, and the path ahead of it.
    const [ax, ay, bx, by] = [cx - 70, 126, cx + 10, 98];
    body +=
      `<path d="M${bx} ${by}L${cx + 150} 46" stroke="${NIGHT}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="3 7" stroke-linecap="round"/>` +
      `<path d="M${ax} ${ay}L${bx} ${by}" stroke="${NIGHT}" stroke-width="3.6" stroke-linecap="round"/>` +
      `<circle cx="${bx}" cy="${by}" r="20" stroke="${NIGHT}" stroke-width="1.6"/>` +
      `<path d="M${bx} ${by - 26}V${by - 32}M${bx} ${by + 26}V${by + 32}M${bx - 26} ${by}H${bx - 32}M${bx + 26} ${by}H${bx + 32}" stroke="${NIGHT}" stroke-width="1.6"/>`;
    body += `<circle cx="${cx - 150}" cy="60" r="7" fill="${NIGHT}"/><circle cx="${cx + 120}" cy="140" r="5" fill="${NIGHT}"/>`;
  } else {
    // A pulsating star, night after night: its image swells and shrinks, and its light curve.
    let curve = '';
    for (let i = 0; i < 7; i++) {
      const x = 74 + i * ((w - 148) / 6);
      const s = 0.5 + 0.5 * Math.sin(i * 1.05 - 1.2);
      body +=
        `<circle cx="${r1(x)}" cy="74" r="${r1(10 + s * 14)}" fill="${NIGHT}" fill-opacity=".14"/>` +
        `<circle cx="${r1(x)}" cy="74" r="${r1(5 + s * 9)}" fill="${NIGHT}"/>`;
      curve += `${i ? 'L' : 'M'}${r1(x)} ${r1(160 - s * 26)}`;
    }
    body += `<path d="${curve}" stroke="${NIGHT}" stroke-width="1.6" stroke-dasharray="2 5" stroke-linecap="round"/>`;
  }
  return body;
}

/** The same patch of sky through an eyepiece: few faint stars, or many and a spiral galaxy. */
function eyepiece(id: string, size: number, rich: boolean) {
  const c = size / 2;
  const r = c - 20;
  const g = (n: string) => `${id}-${n}`;
  const rand = seeded(73);
  let stars = '';
  for (let i = 0; i < 170; i++) {
    const a = rand() * Math.PI * 2;
    const d = Math.sqrt(rand()) * (r - 6);
    const b = rand() ** 3;
    const pick = rand();
    const x = c + Math.cos(a) * d;
    const y = c + Math.sin(a) * d;
    if (!rich && b < 0.18) continue;
    const colour = pick < 0.18 ? VEGA : pick < 0.3 ? AMBER : CREAM;
    stars += `<circle cx="${r1(x)}" cy="${r1(y)}" r="${r1((0.7 + b * 2.4) * (rich ? 1 : 0.8))}" fill="${colour}" fill-opacity="${r1(rich ? 0.35 + b * 0.65 : 0.18 + b * 0.4)}"/>`;
  }
  // The galaxy's two arms: logarithmic spirals, its disc tilted to the line of sight.
  const tilt = 0.46;
  const arms = [0, Math.PI]
    .map((turn) => {
      let d = '';
      for (let t = 0.25; t <= 3.5; t += 0.1) {
        const rr = 8.5 * Math.exp(0.62 * t);
        d += `${d ? 'L' : 'M'}${r1(rr * Math.cos(t + turn))} ${r1(rr * Math.sin(t + turn) * tilt)}`;
      }
      return d;
    })
    .join('');
  // The pink knots of star-forming clouds along the arms.
  const knots = [0.9, 1.6, 2.3, 2.9, 3.3]
    .flatMap((t, i) =>
      [0, Math.PI].map((turn) => {
        const rr = 8.5 * Math.exp(0.62 * t);
        return `<circle cx="${r1(rr * Math.cos(t + turn))}" cy="${r1(rr * Math.sin(t + turn) * tilt)}" r="${i % 2 ? 1.6 : 2.2}" fill="${NEBULA}" fill-opacity=".75"/>`;
      }),
    )
    .join('');
  const galaxy = rich
    ? `<g transform="translate(${c + 16} ${c - 12}) rotate(-26) scale(1.22)">` +
      `<ellipse rx="96" ry="40" fill="url(#${g('disk')})"/>` +
      `<path d="${arms}" stroke="${CREAM}" stroke-opacity=".1" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${arms}" stroke="${CREAM}" stroke-opacity=".26" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>` +
      `<path d="${arms}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"/>` +
      knots +
      `<ellipse rx="28" ry="16" fill="${CREAM}" fill-opacity=".22"/>` +
      `<ellipse rx="15" ry="9" fill="${CREAM}" fill-opacity=".95"/></g>` +
      sparkle(c - 82, c + 74, 22, CREAM) +
      sparkle(c + 86, c + 92, 15, VEGA)
    : `<g transform="translate(${c + 16} ${c - 12}) rotate(-26)"><ellipse rx="36" ry="14" fill="url(#${g('disk')})"/></g>`;
  let ticks = '';
  if (rich) {
    for (let deg = 0; deg < 360; deg += 6) {
      const len = deg % 30 === 0 ? 12 : 6;
      const [x1, y1] = polar(c, c, r + 6, deg);
      const [x2, y2] = polar(c, c, r + 6 + len, deg);
      ticks += `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`;
    }
  }
  return (
    `<defs><radialGradient id="${g('disk')}"><stop offset="0" stop-color="${CREAM}" stop-opacity="${rich ? 0.5 : 0.24}"/><stop offset="1" stop-color="${CREAM}" stop-opacity="0"/></radialGradient>` +
    `<radialGradient id="${g('field')}"><stop offset=".7" stop-color="${GLASS}"/><stop offset="1" stop-color="${NIGHT}"/></radialGradient></defs>` +
    `<circle cx="${c}" cy="${c}" r="${r}" fill="url(#${g('field')})"/>` +
    galaxy +
    stars +
    `<circle cx="${c}" cy="${c}" r="${r}" stroke="${rich ? VEGA : DUSK}" stroke-opacity="${rich ? 0.9 : 0.6}" stroke-width="2.2"/>` +
    (rich ? `<path d="${ticks}" stroke="${VEGA}" stroke-opacity=".5" stroke-width="1.2"/>` : '')
  );
}

/** A truss telescope on its fork, turned to a bright star, and the star's light coming in. */
function telescope(w: number, h: number) {
  const ax = 476;
  const ay = 560;
  const sx = 118;
  const sy = 120;
  const floor = h - 34;
  const angle = Math.atan2(sx - ax, ay - sy) / RAD;
  // The two edges of the aperture, in the drawing's own units.
  const turn = (x: number, y: number) => {
    const a = angle * RAD;
    return [
      ax + x * Math.cos(a) - y * Math.sin(a),
      ay + x * Math.sin(a) + y * Math.cos(a),
    ] as const;
  };
  const [p1x, p1y] = turn(-80, -400);
  const [p2x, p2y] = turn(80, -400);
  const tube =
    // The mirror box around the altitude axis, and its cell.
    `<rect x="-100" y="-44" width="200" height="132" rx="6" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M-100 52H100" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.4"/>` +
    // The truss: a V on each side, an X between them.
    `<path d="M-92 -44L-70 -352M-34 -44L-70 -352M92 -44L70 -352M34 -44L70 -352M-34 -44L22 -352M34 -44L-22 -352" stroke="${CREAM}" stroke-opacity=".7" stroke-width="3.4" stroke-linecap="round"/>` +
    // The upper cage, its ring, the focuser and the finder.
    `<rect x="-84" y="-404" width="168" height="54" rx="4" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".75" stroke-width="2"/>` +
    `<path d="M-84 -386H84" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.2"/>` +
    `<rect x="84" y="-390" width="22" height="20" rx="2" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.6"/>` +
    `<rect x="-118" y="-372" width="16" height="96" rx="3" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="M-102 -350H-84M-102 -300H-92" stroke="${CREAM}" stroke-opacity=".5" stroke-width="1.6"/>` +
    `<ellipse cx="0" cy="-404" rx="84" ry="9" fill="${NIGHT}" stroke="${CREAM}" stroke-opacity=".85" stroke-width="2"/>` +
    `<circle cx="0" cy="-404" r="6" fill="${CREAM}" fill-opacity=".8"/>`;
  return (
    `<defs><linearGradient id="d_rakia_closing_telescope-beam" gradientUnits="userSpaceOnUse" x1="${sx}" y1="${sy}" x2="${r1((p1x + p2x) / 2)}" y2="${r1((p1y + p2y) / 2)}">` +
    `<stop offset="0" stop-color="${CREAM}" stop-opacity=".3"/><stop offset="1" stop-color="${CREAM}" stop-opacity=".06"/></linearGradient></defs>` +
    specks(17, w, floor - 300, 60, CREAM, [[0, 0, 240, 240]], 1.1) +
    `<path d="M${sx} ${sy}L${r1(p1x)} ${r1(p1y)}L${r1(p2x)} ${r1(p2y)}Z" fill="url(#d_rakia_closing_telescope-beam)"/>` +
    sparkle(sx, sy, 58, CREAM) +
    `<circle cx="${sx}" cy="${sy}" r="16" fill="${AMBER}" fill-opacity=".35"/>` +
    // The pier, the turntable and the fork.
    `<path d="M${ax - 60} ${ay + 196}H${ax + 60}L${ax + 88} ${floor}H${ax - 88}Z" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.6"/>` +
    `<path d="M${ax - 150} ${ay + 168}H${ax + 150}V${ay + 196}H${ax - 150}Z" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".55" stroke-width="1.6"/>` +
    `<path d="M${ax - 142} ${ay + 168}L${ax - 136} ${ay - 18}H${ax - 106}L${ax - 104} ${ay + 168}Z" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.8"/>` +
    `<g transform="translate(${ax} ${ay}) rotate(${r1(angle)})">${tube}</g>` +
    `<path d="M${ax + 142} ${ay + 168}L${ax + 136} ${ay - 18}H${ax + 106}L${ax + 104} ${ay + 168}Z" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".6" stroke-width="1.8"/>` +
    `<circle cx="${ax - 121}" cy="${ay}" r="24" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".7" stroke-width="2"/><circle cx="${ax - 121}" cy="${ay}" r="7" fill="${AMBER}"/>` +
    `<circle cx="${ax + 121}" cy="${ay}" r="24" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".7" stroke-width="2"/><circle cx="${ax + 121}" cy="${ay}" r="7" fill="${AMBER}"/>` +
    `<g transform="translate(0 ${floor})">${horizon(w, 24)}</g>`
  );
}

/** A prism: white light in at one side, the colours fanned out at the other. */
function prism() {
  const fan = [0.06, 0.26, 0.44, 0.62, 0.86]
    .map((t, i) => {
      const colour = SPECTRUM.reduce((best, s) => (Math.abs(s[0] - t) < Math.abs(best[0] - t) ? s : best))[1];
      return `<path d="M50 40L4 ${r1(26 + i * 7)}" stroke="${colour}" stroke-width="3" stroke-linecap="round"/>`;
    })
    .join('');
  return (
    `<path d="M94 46H64" stroke="${CREAM}" stroke-width="3" stroke-linecap="round"/>` +
    fan +
    `<path d="M50 8L76 62H24Z" fill="${GLASS}" fill-opacity=".85" stroke="${CREAM}" stroke-width="2.2" stroke-linejoin="round"/>`
  );
}

/** The spectrum: the colours of the light, faded at their ends, crossed by absorption lines. */
function spectrum(id: string, w: number, h: number, y: number, centres: readonly number[]) {
  const g = (n: string) => `${id}-${n}`;
  // Violet at the start of the line, where the slide begins to read; the box's left is its end.
  const stops = SPECTRUM.map(
    ([t, c]) =>
      `<stop offset="${r1((1 - t) * 1000) / 1000}" stop-color="${c}" stop-opacity="${t < 0.04 || t > 0.97 ? 0.35 : 1}"/>`,
  )
    .reverse()
    .join('');
  // The Fraunhofer lines, by wavelength in nanometres, and their weight.
  const lines: [number, number][] = [
    [393, 3.2],
    [397, 3],
    [410, 1.4],
    [431, 2.2],
    [434, 1.6],
    [438, 1.2],
    [486, 2.6],
    [517, 1.6],
    [519, 1.2],
    [527, 1.4],
    [589, 2.4],
    [590, 2],
    [656, 3.2],
    [687, 2.4],
    [719, 1.4],
  ];
  const rand = seeded(61);
  const xOf = (nm: number) => w - ((nm - 380) / (750 - 380)) * w;
  let dark = lines.map(([nm, s]) => `M${r1(xOf(nm))} ${y}v${h}`).join('');
  let faint = '';
  for (let i = 0; i < 40; i++) faint += `M${r1(rand() * w)} ${y}v${h}`;
  const notches = centres
    .map(
      (x) =>
        `<path d="M${r1(x - 9)} ${y - 18}H${r1(x + 9)}L${r1(x)} ${y - 6}Z" fill="${CREAM}"/>` +
        `<path d="M${r1(x)} ${y + h + 6}V${y + h + 22}" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.4"/>`,
    )
    .join('');
  dark = `<path d="${dark}" stroke="${NIGHT}" stroke-opacity=".85" stroke-width="2.2"/>`;
  return (
    `<defs><linearGradient id="${g('light')}" x1="0" y1="0" x2="1" y2="0">${stops}</linearGradient></defs>` +
    `<rect x="0" y="${y - 10}" width="${w}" height="${h + 20}" fill="url(#${g('light')})" fill-opacity=".16"/>` +
    `<rect x="0" y="${y}" width="${w}" height="${h}" fill="url(#${g('light')})"/>` +
    `<path d="${faint}" stroke="${NIGHT}" stroke-opacity=".28" stroke-width="1"/>` +
    dark +
    notches
  );
}

/** Galileo's notes of Jupiter's moons: a night a row, the planet and its four moons. */
function jupiterLog(w: number) {
  const rows: number[][] = [
    [-92, -40, 26, 66],
    [-58, 18, 40, 104],
    [-120, -24, 54, 0],
  ];
  const cx = w / 2;
  return rows
    .map((moons, i) => {
      const y = 22 + i * 34;
      return (
        `<path d="M${r1(cx - 140)} ${y}H${r1(cx + 140)}" stroke="${CREAM}" stroke-opacity=".14" stroke-width="1" stroke-dasharray="2 5"/>` +
        `<circle cx="${cx}" cy="${y}" r="9" fill="${CREAM}" fill-opacity=".9"/>` +
        `<path d="M${cx - 9} ${y - 2}H${cx + 9}M${cx - 8} ${y + 3}H${cx + 8}" stroke="${AMBER}" stroke-opacity=".7" stroke-width="1.3"/>` +
        moons
          .filter((m) => m !== 0)
          .map((m) => `<circle cx="${r1(cx + m)}" cy="${y}" r="3.2" fill="${VEGA}"/>`)
          .join('') +
        `<path d="M${r1(cx - 168)} ${y}h10" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.6"/>`
      );
    })
    .join('');
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const START = 128;
const END = 128;
const WIDTH = 1920 - START - END;
/** The horizon every content slide stands on, and over which nothing is drawn. */
const HORIZON = 940;
/**
 * The box of a display title of two lines (the opening's and the closing's), with room for the
 * leading a script may need beyond the theme's (`LEADING`).
 */
const DISPLAY_TWO_LINES = 276;

/** The spiked star before a kicker. */
const kickerStar = (id: string, top: number, size = 28) =>
  art(id, at(START, top, size, size), sparkle(size / 2, size / 2, size / 2, VEGA));

/** The kicker on its star, and the title under it. */
function head(name: string, width = 1100, lines = 2) {
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 40, 92, Math.min(900, width - 40), 36), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', at(START, 134, width, Math.round(60 * 1.3 * lines) + 4), 'title'),
    ],
    decorations: [kickerStar(`d_rakia_${name}_star`, 96)],
  };
}

/** The mark of the deck: a reflector's aperture, which the user may replace with a logo. */
function mark(id: string, frame: Frame): Element {
  return drawing(id, frame, svg(frame.w, frame.w, aperture(frame.w)), PAINT, {
    role: 'logo',
    name: 'logo',
  });
}

/**
 * The foot of a content slide: the horizon with its azimuth scale across the slide, the mark
 * and the deck's name at its start, and at its end the slide's number beside a spiked star.
 */
function foot(name: string, withFooter = true) {
  return {
    placeholders: withFooter
      ? [place('p_footer', 'footer', at(START + 60, 962, 1000, 36), 'caption')]
      : [],
    decorations: [
      art(`d_rakia_${name}_horizon`, at(START, HORIZON, WIDTH, 12), horizon(WIDTH)),
      mark(`d_rakia_${name}_mark`, at(START, 958, 40, 40)),
      art(
        `d_rakia_${name}_folio_star`,
        atEnd(END + 70, 968, 24, 24),
        sparkle(12, 12, 12, VEGA),
      ),
      pageNumber(`d_rakia_${name}_number`, atEnd(END, 962, 62, 36), 'caption', {
        color: token('text'),
        weight: 600,
      }),
    ],
  };
}

/** A panel of dark glass: a card. */
const card = (id: string, frame: Frame, radius = 14) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.12), width: 1.5 },
    effects: { radius, shadow: { x: 0, y: 20, blur: 48, color: { value: '#000000', alpha: 0.3 } } },
  });

/** A numbered ring of a list. */
function numberRing(id: string, frame: Frame, n: number) {
  const s = frame.w;
  const c = s / 2;
  return upright(
    id,
    frame,
    `<circle cx="${c}" cy="${c}" r="${c - 1.5}" fill="${GLASS}" stroke="${VEGA}" stroke-width="1.6"/>` +
      `<circle cx="${c}" cy="${c}" r="${c - 6}" stroke="${VEGA}" stroke-opacity=".3" stroke-width="1"/>` +
      `<text x="${c}" y="${r1(c + s * 0.19)}" text-anchor="middle" font-family="Bellefair, serif" font-size="${r1(s * 0.56)}" fill="${CREAM}">${n}</text>`,
  );
}

/** Small keys of the closing's lines: the Moon, a dome, a star. */
const KEYS = [
  `<path d="M15.3 4.1A13 13 0 1 0 29.4 21A11 11 0 0 1 15.3 4.1Z" fill="${CREAM}"/>`,
  `<path d="M4 29H30V22H4Z" fill="${CREAM}" fill-opacity=".85"/><path d="M5 22A12 12 0 0 1 29 22Z" fill="${CREAM}"/><path d="M18 11V22" stroke="${NIGHT}" stroke-width="3"/>`,
  sparkle(17, 17, 16, VEGA),
];

/** A key drawn at `size`: they are drawn on a square of 34. */
const key = (i: number, size: number) => `<g transform="scale(${r1((size / 34) * 1000) / 1000})">${KEYS[i]!}</g>`;

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of cards, stops, steps and people. */
const cards3 = [START, START + 564, START + 1128];
const stops4 = [START, START + 416, START + 832, START + 1248];
const steps5 = [0, 1, 2, 3, 4].map((i) => START + Math.round((i * WIDTH) / 5));
const team4 = [START, START + 416, START + 832, START + 1248];
const readouts3 = [START, START + 568, START + 1136];

function layouts(): Layout[] {
  // The opening: the trails around the pole, and the observatory on its ridge under them.
  const trailsBox = atEnd(0, 0, 1180, 1000);
  const ridgeBox = atEnd(0, 740, 1200, 340);
  // The part's Moon, rising from the end edge, lit on the side the words are.
  const moonBox = atEnd(0, 60, 900, 960);
  const moonFor = (side: 'end' | 'start') =>
    moon('d_rakia_section_moon', {
      cx: side === 'end' ? 340 : moonBox.w - 340,
      cy: 480,
      r: 440,
      lit: side === 'end' ? 'right' : 'left',
      phase: 0.3,
    });
  // The quote's meridian: an arc from horizon to horizon, its altitude scale, the zenith.
  const arc = at(0, 230, 1920, 700);
  const arcR = 1010;
  const arcC = [960, 1070] as const;
  // Where the arc meets the foot of its box, in degrees above the horizontal.
  const arcFoot = Math.asin((arcC[1] - arc.h) / arcR) / RAD;
  const meridian = (() => {
    let ticks = '';
    // The altitude scale: a tick every 2.5°, longer every 7.5° and 15°, up to the zenith.
    for (let k = 0; ; k++) {
      const deg = 90 - k * 2.5;
      if (deg < arcFoot + 2) break;
      const len = k % 6 === 0 ? 22 : k % 3 === 0 ? 14 : 8;
      for (const side of k === 0 ? [deg] : [deg, 180 - deg]) {
        const [x1, y1] = polar(arcC[0], arcC[1], arcR, -side);
        const [x2, y2] = polar(arcC[0], arcC[1], arcR + len, -side);
        ticks += `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`;
      }
    }
    const [sx, sy] = polar(arcC[0], arcC[1], arcR, -(180 - arcFoot));
    const [ex, ey] = polar(arcC[0], arcC[1], arcR, -arcFoot);
    const sweep = `M${r1(sx)} ${r1(sy)}A${arcR} ${arcR} 0 0 1 ${r1(ex)} ${r1(ey)}`;
    return (
      `<path d="${sweep}" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.4"/>` +
      `<path d="${sweep}" stroke="${CREAM}" stroke-opacity=".07" stroke-width="18"/>` +
      `<path d="${ticks}" stroke="${CREAM}" stroke-opacity=".36" stroke-width="1.2"/>` +
      [-140, -116, -64, -38]
        .map((deg, i) => {
          const [x, y] = polar(arcC[0], arcC[1], arcR, deg);
          return `<circle cx="${r1(x)}" cy="${r1(y)}" r="${i % 2 ? 3 : 4.5}" fill="${[VEGA, CREAM, AMBER, CREAM][i]}"/>`;
        })
        .join('') +
      specks(83, arc.w, 300, 60, CREAM, [[400, 110, 1120, 400]], 1)
    );
  })();

  // The camera's square frame inside the telescope's round field.
  const photo = 520;
  const field = 800;
  const fc = field / 2;
  const reticle = (() => {
    let ticks = '';
    for (let deg = 0; deg < 360; deg += 2) {
      const len = deg % 30 === 0 ? 16 : deg % 10 === 0 ? 10 : 5;
      const [x1, y1] = polar(fc, fc, 382, deg);
      const [x2, y2] = polar(fc, fc, 382 + len, deg);
      ticks += `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`;
    }
    const cross = [0, 90, 180, 270]
      .map((deg) => {
        const [x1, y1] = polar(fc, fc, 274, deg);
        const [x2, y2] = polar(fc, fc, 364, deg);
        return `M${r1(x1)} ${r1(y1)}L${r1(x2)} ${r1(y2)}`;
      })
      .join('');
    const [px, py] = polar(fc, fc, 382, -52);
    const [qx, qy] = polar(fc, fc, 400, -54.5);
    const [ux, uy] = polar(fc, fc, 400, -49.5);
    const half = photo / 2;
    // The sky in the four segments between the frame and the field.
    const sky = specks(97, field, field, 260, CREAM, [[fc - half - 8, fc - half - 8, photo + 16, photo + 16]], 1);
    return (
      `<defs><clipPath id="d_rakia_text_image_field-clip"><circle cx="${fc}" cy="${fc}" r="370"/></clipPath></defs>` +
      `<circle cx="${fc}" cy="${fc}" r="370" fill="${GLASS}" fill-opacity=".55"/>` +
      `<g clip-path="url(#d_rakia_text_image_field-clip)">${sky}</g>` +
      `<circle cx="${fc}" cy="${fc}" r="370" stroke="${CREAM}" stroke-opacity=".45" stroke-width="1.6"/>` +
      `<path d="${ticks}" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.2"/>` +
      `<path d="${cross}" stroke="${VEGA}" stroke-opacity=".85" stroke-width="2"/>` +
      `<rect x="${fc - half - 7}" y="${fc - half - 7}" width="${photo + 14}" height="${photo + 14}" stroke="${CREAM}" stroke-opacity=".3" stroke-width="1.2"/>` +
      `<path d="M${r1(px)} ${r1(py)}L${r1(qx)} ${r1(qy)}L${r1(ux)} ${r1(uy)}Z" fill="${AMBER}"/>`
    );
  })();

  // The orrery of the timeline: the Sun just off the start edge, an orbit for every stop.
  const band = atEnd(0, 250, 1920, 220);
  const sunX = 1890;
  const sunY = 170;
  const planetX = stops4.map((s) => 1920 - s - 30);
  const orrery = (() => {
    const g = (n: string) => `d_rakia_timeline_orbits-${n}`;
    // Seen a little from above: the far half of each orbit, an ellipse out to its planet.
    const orbits = planetX
      .map((x) => {
        const rx = sunX - x;
        const ry = r1(30 + rx * 0.072);
        return `M${r1(x)} ${sunY}A${r1(rx)} ${ry} 0 0 1 ${r1(sunX + rx)} ${sunY}`;
      })
      .join('');
    const worlds = planetX
      .map((x, i) => {
        const s = [9, 13, 17, 22][i]!;
        const colour = [DUSK, VEGA, CREAM, AMBER][i]!;
        return (
          `<circle cx="${r1(x)}" cy="${sunY}" r="${s + 10}" fill="${NIGHT}"/>` +
          (i === 3
            ? `<circle cx="${r1(x)}" cy="${sunY}" r="${s + 26}" fill="${AMBER}" fill-opacity=".1"/>` +
              `<ellipse cx="${r1(x)}" cy="${sunY}" rx="${s + 18}" ry="7" transform="rotate(-18 ${r1(x)} ${sunY})" stroke="${AMBER}" stroke-width="2.2"/>`
            : '') +
          `<circle cx="${r1(x)}" cy="${sunY}" r="${s}" fill="${colour}"/>`
        );
      })
      .join('');
    return (
      `<defs><linearGradient id="${g('fade')}" x1="0" y1="0" x2="0" y2="1">` +
      `<stop offset="0" stop-color="#000"/><stop offset=".3" stop-color="#fff"/></linearGradient>` +
      `<mask id="${g('mask')}" maskUnits="userSpaceOnUse" x="0" y="0" width="${band.w}" height="${band.h}"><rect width="${band.w}" height="${band.h}" fill="url(#${g('fade')})"/></mask></defs>` +
      `<path d="${orbits}" mask="url(#${g('mask')})" stroke="${CREAM}" stroke-opacity=".4" stroke-width="1.4"/>` +
      worlds
    );
  })();

  // The spectrum of the process, and where each step stands on it.
  const stepCentre = steps5.map((s) => WIDTH - (s - START) - WIDTH / 10);

  return [
    {
      id: 'l_rakia_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 40, 300, 780, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 344, 900, DISPLAY_TWO_LINES), 'display'),
        place('p_subtitle', 'subtitle', at(START, 612, 800, 146), 'heading'),
        place('p_meta', 'caption', at(START + 56, 820, 800, 36), 'caption'),
      ],
      decorations: [
        art('d_rakia_hero_trails', trailsBox, trails('d_rakia_hero_trails', trailsBox.w, trailsBox.h, 560, 360)),
        art('d_rakia_hero_ridge', ridgeBox, observatory('d_rakia_hero_ridge', ridgeBox.w, ridgeBox.h, 520)),
        kickerStar('d_rakia_hero_star', 304),
        art('d_rakia_hero_horizon', at(START, 790, 800, 12), horizon(800)),
        art('d_rakia_hero_dome', at(START, 823, 28, 28), key(1, 28)),
        mark('d_rakia_hero_mark', at(START, 92, 48, 48)),
      ],
    },
    {
      id: 'l_rakia_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(160, 470, 280, 140), 'display', {
          align: 'center',
          vAlign: 'middle',
          color: token('primary'),
        }),
        place('p_kicker', 'caption', at(START + 40, 360, 760, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 404, 900, 252), 'display', { vAlign: 'middle' }),
        place('p_subtitle', 'subtitle', at(START, 668, 800, 146), 'heading'),
      ],
      decorations: [
        upright('d_rakia_section_moon', moonBox, moonFor('end'), moonFor('start')),
        kickerStar('d_rakia_section_star', 364),
        art('d_rakia_section_phases', at(START, 870, 8 * 34 + 7 * 18 + 4, 38), phases(8, 34, 18, 1)),
      ],
    },
    {
      id: 'l_rakia_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1100, 1).placeholders,
        place('p_number', 'number', at(START, 262, 720, 150), 'display', {
          color: token('secondary'),
        }),
        place('p_label', 'subtitle', at(START, 420, 700, 100), 'heading'),
        place('p_note', 'body', at(START, 532, 680, 130), 'body'),
        ...readouts3.flatMap((s, i) => [
          place(`p_number${i + 2}`, 'number', at(s, 744, 520, 70), 'title', {
            color: token('primary'),
          }),
          place(`p_label${i + 2}`, 'caption', at(s, 818, 520, 72), 'caption'),
        ]),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1100, 1).decorations,
        art(
          'd_rakia_big_number_mirrors',
          atEnd(END + 20, 236, 740, 456),
          `<circle cx="270" cy="216" r="214" stroke="${VEGA}" stroke-opacity=".14" stroke-width="1" stroke-dasharray="2 6"/>` +
            mirrorFace('d_rakia_big_number_mirrors', 270, 216, 196) +
            mirrorFace('d_rakia_big_number_mirrors-small', 600, 363, 49) +
            dimension(74, 466, 440) +
            dimension(551, 649, 440),
        ),
        rect('d_rakia_big_number_rule', at(START, 716, WIDTH, 1.5), solid(token('text', 0.16))),
        ...readouts3.slice(1).map((s, i) =>
          rect(
            `d_rakia_big_number_divider${i + 1}`,
            at(s - 25, 744, 1.5, 140),
            solid(token('text', 0.14)),
          ),
        ),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_rakia_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(430, 448, 1060, 272), 'title', { align: 'center' }),
        place('p_attribution', 'attribution', at(460, 744, 1000, 50), 'heading', {
          align: 'center',
        }),
        place('p_caption', 'caption', at(460, 798, 1000, 72), 'caption', {
          align: 'center',
          vAlign: 'top',
        }),
        ...foot('quote').placeholders,
      ],
      decorations: [
        art('d_rakia_quote_meridian', arc, meridian),
        art('d_rakia_quote_zenith', at(926, 256, 68, 68), sparkle(34, 34, 34, AMBER)),
        upright(
          'd_rakia_quote_marks',
          at(910, 350, 100, 72),
          `<path d="${QUOTE_MARKS}" fill="${AMBER}" fill-opacity=".9"/>`,
        ),
        rect('d_rakia_quote_rule', at(940, 728, 40, 2), solid(token('secondary'))),
        ...foot('quote').decorations,
      ],
    },
    {
      id: 'l_rakia_text',
      name: 'Text',
      archetype: 'text',
      // The text is on a panel of dark glass from margin to margin, down to over the horizon,
      // from its top; a small constellation stands in the margin beside the title.
      placeholders: [
        place('p_title', 'title', at(START + 48, 118, WIDTH - 330, 84), 'title'),
        place('p_body', 'body', at(START + 72, 292, WIDTH - 144, 584), 'body'),
      ],
      decorations: [
        kickerStar('d_rakia_text_star', 142),
        art(
          'd_rakia_text_constellation',
          atEnd(END, 104, 250, 116),
          constellation(
            [
              [212, 30, 2.6],
              [168, 72, 2],
              [118, 44, 2.4],
              [70, 86, 1.8],
              [24, 52, 2.2],
              [150, 104, 1.4],
            ],
            [
              [0, 1],
              [1, 2],
              [2, 3],
              [3, 4],
              [1, 5],
            ],
          ),
        ),
        card('d_rakia_text_panel', at(START, 236, WIDTH, 676), 10),
        // The corner marks of a camera's frame, each a part of its own.
        ...(
          [
            ['top_start', at(START + 18, 254, 32, 32), 'M0 1H31V32'],
            ['top_end', atEnd(END + 18, 254, 32, 32), 'M32 1H1V32'],
            ['bottom_start', at(START + 18, 862, 32, 32), 'M0 31H31V0'],
            ['bottom_end', atEnd(END + 18, 862, 32, 32), 'M32 31H1V0'],
          ] as const
        ).map(([corner, frame, d]) =>
          art(
            `d_rakia_text_corner_${corner}`,
            frame,
            `<path d="${d}" stroke="${VEGA}" stroke-opacity=".75" stroke-width="2"/>`,
          ),
        ),
        ...foot('text', false).decorations,
      ],
    },
    {
      id: 'l_rakia_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 940).placeholders,
        place('p_image', 'image', atEnd(470 - photo / 2, 522 - photo / 2, photo, photo)),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 80, 330 + i * 186, 820, 50), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 80, 384 + i * 186, 820, 120), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 940).decorations,
        art('d_rakia_text_image_field', atEnd(470 - fc, 522 - fc, field, field), reticle),
        art(
          'd_rakia_text_image_thread',
          at(START + 26, 384, 2, 370),
          `<path d="M1 2V368" stroke="${VEGA}" stroke-opacity=".5" stroke-width="1.6" stroke-dasharray="2 7" stroke-linecap="round"/>`,
        ),
        ...[0, 1, 2].map((i) =>
          numberRing(`d_rakia_text_image_ring${i + 1}`, at(START, 328 + i * 186, 54, 54), i + 1),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_rakia_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', atEnd(0, 0, 1920, 744)),
        place('p_place', 'caption', at(START + 40, 792, 800, 36), 'caption', {
          color: token('primary'),
        }),
        // Two lines, with room for the leading a script may need (`LEADING`).
        place('p_title', 'title', at(START, 834, 900, Math.round(60 * 1.3 * 2) + 4), 'title'),
        place('p_body', 'body', atEnd(END, 806, 640, 170), 'body'),
      ],
      decorations: [
        art('d_rakia_full_image_horizon', atEnd(0, 744, 1920, 14), horizon(1920, 24)),
        kickerStar('d_rakia_full_image_star', 796),
        rect('d_rakia_full_image_rule', atEnd(END + 690, 808, 1.5, 164), solid(token('text', 0.18))),
      ],
    },
    {
      id: 'l_rakia_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 30, 504, 476, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 30, 544, 476, 96), 'heading', {
            vAlign: 'middle',
          }),
          place(`p_card${i + 1}_body`, 'body', at(s + 30, 644, 476, 124), 'body'),
        ]),
        place('p_note', 'body', at(START + 40, 824, WIDTH - 40, 84), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        ...cards3.flatMap((s, i) => [
          card(`d_rakia_cards_card${i + 1}`, at(s, 296, 536, 504)),
          art(`d_rakia_cards_plate${i + 1}`, at(s + 14, 310, 508, 178), plate(508, 178, i)),
        ]),
        kickerStar('d_rakia_cards_note_star', 828),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_rakia_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...stops4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s, 470, 380, 70), 'title', {
            color: i === 3 ? token('secondary') : token('primary'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s, 546, 380, 96), 'heading', { vAlign: 'bottom' }),
          place(`p_stop${i + 1}_body`, 'body', at(s, 650, 380, 166), 'body'),
        ]),
        place('p_note', 'caption', at(START + 40, 846, WIDTH - 40, 70), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        art(
          'd_rakia_timeline_sun',
          at(-120, 270, 300, 300),
          `<defs><radialGradient id="d_rakia_timeline_sun-glow"><stop offset=".3" stop-color="${AMBER}" stop-opacity=".5"/><stop offset="1" stop-color="${AMBER}" stop-opacity="0"/></radialGradient></defs>` +
            `<circle cx="150" cy="150" r="150" fill="url(#d_rakia_timeline_sun-glow)"/>` +
            `<circle cx="150" cy="150" r="56" fill="${AMBER}"/><circle cx="150" cy="150" r="40" fill="${CREAM}" fill-opacity=".55"/>`,
        ),
        art('d_rakia_timeline_orbits', band, orrery),
        kickerStar('d_rakia_timeline_note_star', 848),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_rakia_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...steps5.flatMap((s, i) => [
          // The step's figure over its notch: a number, or a time, a share, a day.
          place(`p_station${i + 1}`, 'number', at(s + 16, 306, 300, 78), 'title', {
            align: 'center',
            vAlign: 'bottom',
            color: i === 4 ? token('secondary') : token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s + 16, 488, 300, 96), 'heading', {
            align: 'center',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s + 16, 588, 300, 70), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 156, 712, WIDTH - 196, 122), 'body', {
          vAlign: 'middle',
        }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        art('d_rakia_process_spectrum', at(START, 392, WIDTH, 92), spectrum('d_rakia_process_spectrum', WIDTH, 44, 22, stepCentre)),
        card('d_rakia_process_note', at(START, 698, WIDTH, 150)),
        art('d_rakia_process_prism', at(START + 40, 730, 100, 84), prism()),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_rakia_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(210, 0, 700, 0)],
            ['after', atEnd(210, 0, 700, 0)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x, y: 700, w: 700, h: 36 }, 'caption', {
            align: 'center',
            color: side === 'after' ? token('secondary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x, y: 740, w: 700, h: 50 }, 'heading', {
            align: 'center',
          }),
          place(`p_${side}_body`, 'body', { x: f.x, y: 796, w: 700, h: 124 }, 'body', {
            align: 'center',
          }),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        art('d_rakia_comparison_before', at(360, 276, 400, 400), eyepiece('d_rakia_comparison_before', 400, false)),
        art('d_rakia_comparison_after', atEnd(360, 276, 400, 400), eyepiece('d_rakia_comparison_after', 400, true)),
        art(
          'd_rakia_comparison_arrow',
          atEnd(924, 440, 72, 72),
          `<circle cx="36" cy="36" r="34" fill="${GLASS}" stroke="${CREAM}" stroke-opacity=".5" stroke-width="1.6"/>` +
            `<path d="M50 36H22M32 25L21 36L32 47" stroke="${AMBER}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>`,
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_rakia_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(START + 48, 330, 984, 456)),
        place('p_source', 'caption', at(START + 48, 798, 984, 70), 'caption'),
        place('p_figure1', 'number', atEnd(END, 300, 480, 134), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 440, 480, 124), 'body'),
        place('p_figure2', 'number', atEnd(END, 610, 480, 134), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 750, 480, 124), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1080).decorations,
        card('d_rakia_chart_panel', at(START, 300, 1080, 590), 10),
        art(
          'd_rakia_chart_ticks',
          at(START, 300, 1080, 590),
          (() => {
            let d = '';
            for (let x = 24, i = 1; x < 1080 - 10; x += 24, i++) {
              const len = i % 5 === 0 ? 14 : 7;
              d += `M${x} 1V${len}M${x} 589V${589 - len}`;
            }
            for (let y = 24, i = 1; y < 590 - 10; y += 24, i++) {
              const len = i % 5 === 0 ? 14 : 7;
              d += `M1 ${y}H${len}M1079 ${y}H${1079 - len}`;
            }
            return `<path d="${d}" stroke="${CREAM}" stroke-opacity=".24" stroke-width="1.2"/>`;
          })(),
        ),
        rect('d_rakia_chart_rule', atEnd(END, 588, 480, 1.5), solid(token('text', 0.16))),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_rakia_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1180).placeholders,
        place('p_table', 'table', at(START + 32, 314, WIDTH - 64, 480)),
        place('p_note', 'caption', at(START + 40, 848, WIDTH - 40, 36), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1180).decorations,
        art('d_rakia_table_jupiter', atEnd(END, 112, 360, 110), jupiterLog(360)),
        card('d_rakia_table_panel', at(START, 296, WIDTH, 530), 10),
        rect('d_rakia_table_band', at(START, 296, WIDTH, 4), solid(token('primary', 0.6))),
        kickerStar('d_rakia_table_note_star', 850),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_rakia_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(`p_photo${i + 1}`, 'image', at(s, 352, 300, 300)),
          place(`p_field${i + 1}`, 'caption', at(s, 678, 392, 36), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s, 716, 392, 50), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s, 770, 392, 122), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        (() => {
          // Each person a star of another colour, and the four joined as a constellation.
          const ys = [318, 302, 322, 306];
          const xs = team4.map((s) => WIDTH - (s - START) - 150);
          return art(
            'd_rakia_team_constellation',
            at(START, 286, WIDTH, 52),
            `<path d="${xs.map((x, i) => `${i ? 'L' : 'M'}${x} ${ys[i]! - 286}`).join('')}" stroke="${CREAM}" stroke-opacity=".35" stroke-width="1.3" stroke-dasharray="2 6" stroke-linecap="round"/>` +
              xs.map((x, i) => sparkle(x, ys[i]! - 286, 15, [VEGA, CREAM, AMBER, NEBULA][i]!)).join(''),
          );
        })(),
        ...team4.map((s, i) =>
          art(`d_rakia_team_frame${i + 1}`, at(s - 12, 340, 324, 324), brackets(324, 324, 30)),
        ),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_rakia_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 40, 246, 800, 36), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 290, 900, DISPLAY_TWO_LINES), 'display'),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 56, 574 + i * 88, 840, 84), 'body', {
            vAlign: 'top',
          }),
        ),
        place('p_meta', 'caption', at(START + 56, 892, 860, 36), 'caption'),
      ],
      decorations: [
        art('d_rakia_closing_telescope', atEnd(70, 90, 860, 940), telescope(860, 940)),
        kickerStar('d_rakia_closing_star', 250),
        ...[0, 1, 2].map((i) =>
          art(`d_rakia_closing_key${i + 1}`, at(START, 581 + i * 88, 28, 28), key(i, 28)),
        ),
        art('d_rakia_closing_horizon', at(START, 862, 860, 12), horizon(860)),
        mark('d_rakia_closing_mark', at(START, 890, 40, 40)),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the Moon, the figures) moved across as they are.
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
// The sample: the first-light briefing of a mountain observatory's new telescope

const TABLE_COLS = [380, 420, 250, 170, 380];
const TABLE_ROW = 80;
/** Clear nights in each season, and the nights of them with sharp seeing: 291 and 202 a year. */
const CLEAR = [61, 72, 86, 72];
const SHARP = [38, 49, 63, 52];

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
  hi: { display: 1.14, title: 1.3, subtitle: 1.42 },
  // The stacked tone marks of Vietnamese reach into the line above as Devanagari's vowels do.
  vi: { display: 1.12, title: 1.3, subtitle: 1.42 },
  // Arabic's counterpart of the display face is a tall Naskh: its hamzas and ascenders meet
  // the tails of the line above.
  ar: { display: 1.12, title: 1.3, subtitle: 1.42 },
  // Kana, kanji and hangul fill the whole em: two display lines as tight as Latin ones touch.
  ja: { display: 1.12, title: 1.12, subtitle: 1.2 },
  ko: { display: 1.12, title: 1.12, subtitle: 1.2 },
  'zh-CN': { display: 1.12, title: 1.12, subtitle: 1.2 },
};
const DISPLAYED = new Set(['l_rakia_hero', 'l_rakia_section', 'l_rakia_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: RakiaCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: RakiaCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_rakia_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
      },
    },
    {
      layout: 'l_rakia_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: text(copy.section.subtitle),
      },
    },
    {
      layout: 'l_rakia_text',
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
      layout: 'l_rakia_big_number',
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
      layout: 'l_rakia_text_image',
      name: copy.mirror.name,
      content: {
        caption: text(copy.mirror.kicker),
        title: lines(copy.mirror.title),
        image: { assetId: pictures.mirror.id },
        subtitle: copy.mirror.items.map(([title]) => text(title)),
        body: copy.mirror.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_rakia_full_image',
      name: copy.site.name,
      content: {
        image: { assetId: pictures.site.id },
        caption: text(copy.site.place),
        title: text(...copy.site.title),
        body: text(copy.site.body),
      },
    },
    {
      layout: 'l_rakia_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_rakia_cards',
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
      layout: 'l_rakia_timeline',
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
      layout: 'l_rakia_process',
      name: copy.nights.name,
      content: {
        caption: [
          text(copy.nights.kicker),
          ...copy.nights.steps.map(([, caption]) => text(caption)),
        ],
        title: lines(copy.nights.title),
        number: copy.nights.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.nights.steps.map(([step]) => text(step)),
        body: text(copy.nights.note),
        footer,
      },
    },
    {
      layout: 'l_rakia_comparison',
      name: copy.views.name,
      content: {
        caption: [text(copy.views.kicker), text(copy.views.before[0]), text(copy.views.after[0])],
        title: lines(copy.views.title),
        subtitle: [text(copy.views.before[1]), text(copy.views.after[1])],
        body: [text(copy.views.before[2]), text(copy.views.after[2])],
        footer,
      },
    },
    {
      layout: 'l_rakia_chart',
      name: copy.clear.name,
      content: {
        caption: [text(copy.clear.kicker), text(copy.clear.source)],
        title: lines(copy.clear.title),
        number: copy.clear.figures.map(([value]) => text(value)),
        body: copy.clear.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: [...copy.clear.seasons],
          series: [
            { name: copy.clear.series[0], values: CLEAR },
            { name: copy.clear.series[1], values: SHARP },
          ],
        },
      },
    },
    {
      layout: 'l_rakia_table',
      name: copy.targets.name,
      content: {
        caption: [text(copy.targets.kicker), text(copy.targets.note)],
        title: lines(copy.targets.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.targets.header, ...copy.targets.rows],
      },
    },
    {
      layout: 'l_rakia_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([field]) => text(field))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => text(role)),
        footer,
      },
    },
    {
      layout: 'l_rakia_closing',
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
export const rakiaSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => RAKIA_COPY[lang]).map((lang) => [
    lang,
    sample(RAKIA_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Rakia template: the theme, its layouts for both directions, and its sample deck. */
export function rakiaTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(rakiaTheme),
    description:
      'The night over a mountain observatory: star trails over a dome, the Moon, mirrors to scale, an eyepiece’s reticle, negative plates, an orrery, the spectrum and a truss telescope, in starlight cream, Vega blue and amber on a deep night sky.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.mirror, pictures.site, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, rakiaSamples.he);
  return finished;
}

export const entry = { id: 'rakia', template: rakiaTemplate, samples: rakiaSamples };
