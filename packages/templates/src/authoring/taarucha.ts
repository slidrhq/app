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
import { TAARUCHA_COPY, type TaaruchaCopy } from './taarucha/copy';
import { picture } from './pictures';

const pictures = {
  painting: picture('taaruchaPainting'),
  studio: picture('taaruchaStudio'),
  gallery: picture('taaruchaGallery'),
  team: [1, 2, 3, 4].map((n) => picture(`taaruchaTeam${n}`)),
};

/**
 * Taarucha (Exhibit): the slide is a wall of a museum exhibition. The content slides are the
 * gallery's light walls, washed by the light of the ceiling; the opening, the quote and the
 * closing are the claret wall of the entrance, and a part is a room painted ultramarine. A brass
 * picture rail runs along the top of every slide, and what a gallery holds does the work: a
 * salon hang of framed works under two track spots opens the deck, a doorway shows the next
 * room, figures stand on plinths, a photograph hangs by its cords, notices hang on nails,
 * dates are admission tickets clipped to a wire, a process is the exhibition's floor plan, the
 * people are a portrait gallery under picture lights. Claret and ultramarine are the pigments,
 * brass the fittings, a warm ink the words. For museums, galleries, exhibitions, curators,
 * cultural institutions and art schools.
 *
 * No drawing holds a word, so one set of layouts reads in every language. Bellefair, a display
 * serif of exhibition lettering, sets the titles in Hebrew and Latin (its counterparts carry
 * the other scripts); Alef and Golos Text set the labels and the text.
 */
export const taaruchaTheme: Theme = {
  id: 'taarucha',
  name: 'Exhibit',
  colors: {
    bg: '#e4e0da',
    surface: '#faf8f5',
    text: '#1f1b1d',
    muted: '#5d5755',
    primary: '#7a1f2b',
    secondary: '#2a3a8f',
    accent: '#a9844c',
    chart: ['#7a1f2b', '#2a3a8f', '#a9844c', '#5f7d68', '#1f1b1d', '#c79aa2'],
  },
  // Exhibition lettering for what is said aloud (Bellefair, one face, in Hebrew and Latin), and
  // a plain sans of the wall labels for what is read: Alef in Hebrew, Golos Text in Latin.
  fonts: {
    heading: { he: 'Bellefair', latin: 'Bellefair' },
    body: { he: 'Alef', latin: 'Golos Text' },
  },
  textStyles: {
    display: {
      font: 'heading',
      size: 108,
      weight: 400,
      lineHeight: 1.04,
      letterSpacing: -1.5,
      color: { token: 'text' },
    },
    title: {
      font: 'heading',
      size: 60,
      weight: 400,
      lineHeight: 1.12,
      letterSpacing: -0.5,
      color: { token: 'text' },
    },
    heading: { font: 'heading', size: 40, weight: 400, lineHeight: 1.2, color: { token: 'text' } },
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
  radius: 4,
  shadow: { x: 0, y: 16, blur: 36, color: { value: '#2a1a14', alpha: 0.14 } },
  // The ground: the plaster of a gallery wall, washed with light from the ceiling.
  background: {
    fill: {
      kind: 'css',
      value: [
        'radial-gradient(1700px 560px at 50% -140px, color-mix(in srgb, var(--color-surface) 62%, transparent), transparent 78%)',
        'linear-gradient(transparent 70%, color-mix(in srgb, var(--color-text) 4%, transparent))',
        'var(--color-bg)',
      ].join(', '),
    },
  },
  backgroundVariants: [
    SURFACE,
    // The plaster alone, without the light.
    { fill: { kind: 'solid', color: { token: 'bg' } } },
  ],
};

// ---------------------------------------------------------------------------------------------
// The colours of the drawings, each tied to its token

const INK = '#1f1b1d';
const MUTED = '#5d5755';
const CLARET = '#7a1f2b';
const ULTRA = '#2a3a8f';
const BRASS = '#a9844c';
const WALL = '#e4e0da';
const WHITE = '#faf8f5';
/** The wood of a bench and of a floor, which no token holds. */
const OAK = '#9b7652';

const PAINT = {
  [INK]: token('text'),
  [MUTED]: token('muted'),
  [CLARET]: token('primary'),
  [ULTRA]: token('secondary'),
  [BRASS]: token('accent'),
  [WALL]: token('bg'),
  [WHITE]: token('surface'),
};

const r1 = (v: number) => Math.round(v * 10) / 10;

/** A drawing whose box is `w` by `h`. */
const svg = (w: number, h: number, body: string) =>
  `<svg viewBox="0 0 ${r1(w)} ${r1(h)}" fill="none">${body}</svg>`;

const art = (id: string, frame: Frame, body: string) =>
  drawing(id, frame, svg(frame.w, frame.h, body), PAINT);

/**
 * The drawings that a left-to-right deck must not see mirrored: those with figures in them,
 * and the quotation mark. Their mirror moves them to the other side and leaves them as they are.
 */
const UPRIGHT = new Set<string>();

const upright = (id: string, frame: Frame, body: string) => {
  UPRIGHT.add(id);
  return art(id, frame, body);
};

/** The shadow a thing hung on the wall casts on it. */
const hung = (element: Element, y = 14, blur = 26, alpha = 0.22): Element => ({
  ...element,
  effects: { shadow: { x: 0, y, blur, color: { value: '#2a1a14', alpha } } },
});

// ---------------------------------------------------------------------------------------------
// The things of a gallery

/** The moulding of a frame, its mat, and the window the work is seen in. */
interface Look {
  moulding: number;
  mat: number;
  finish: string;
}

const BLACK_FRAME: Look = { moulding: 16, mat: 40, finish: INK };

/** Where the window of a frame is, inside a box `w` by `h`. */
const windowOf = (w: number, h: number, look: Look) => {
  const k = look.moulding + look.mat;
  return { x: k, y: k, w: w - 2 * k, h: h - 2 * k };
};

/**
 * A picture frame `w` by `h`: the moulding with its lit ridge and its shaded lip, the white mat
 * with the shadow the moulding throws on it, the bevelled window, and in it `inner` (drawn in
 * the window's own coordinates), or nothing where a photograph lies over it.
 */
function frameBody(w: number, h: number, look: Look, inner = '', clip = 'w'): string {
  const m = look.moulding;
  const win = windowOf(w, h, look);
  let s =
    `<rect width="${r1(w)}" height="${r1(h)}" fill="${look.finish}"/>` +
    `<rect x="1.5" y="1.5" width="${r1(w - 3)}" height="${r1(h - 3)}" stroke="${WHITE}" stroke-opacity=".2" stroke-width="1.4"/>` +
    `<rect x="${r1(m * 0.5)}" y="${r1(m * 0.5)}" width="${r1(w - m)}" height="${r1(h - m)}" stroke="${INK}" stroke-opacity=".28" stroke-width="1"/>`;
  if (look.mat > 0) {
    s +=
      `<rect x="${m}" y="${m}" width="${r1(w - 2 * m)}" height="${r1(h - 2 * m)}" fill="${WHITE}"/>` +
      `<path d="M${m} ${m}H${r1(w - m)}V${m + 6}H${m + 6}V${r1(h - m)}H${m}Z" fill="${INK}" fill-opacity=".09"/>` +
      `<rect x="${r1(win.x - 5)}" y="${r1(win.y - 5)}" width="${r1(win.w + 10)}" height="${r1(win.h + 10)}" fill="${WHITE}" stroke="${INK}" stroke-opacity=".16" stroke-width="1"/>` +
      `<path d="M${r1(win.x - 5)} ${r1(win.y - 5)}L${win.x} ${win.y}M${r1(win.x + win.w + 5)} ${r1(win.y - 5)}L${r1(win.x + win.w)} ${win.y}" stroke="${INK}" stroke-opacity=".12" stroke-width="1"/>`;
  }
  s += inner
    ? `<defs><clipPath id="${clip}"><rect x="${win.x}" y="${win.y}" width="${r1(win.w)}" height="${r1(win.h)}"/></clipPath></defs>` +
      `<g clip-path="url(#${clip})"><g transform="translate(${win.x} ${win.y})">${inner}</g></g>`
    : `<rect x="${win.x}" y="${win.y}" width="${r1(win.w)}" height="${r1(win.h)}" fill="${INK}" fill-opacity=".12"/>`;
  return s;
}

/** The box of a frame's window on the slide, for the photograph seated in it. */
const inside = (frame: Frame, win: Frame): Frame => ({
  x: frame.x + win.x,
  y: frame.y + win.y,
  w: win.w,
  h: win.h,
});

/** A framed work hung on the wall. */
const framed = (id: string, frame: Frame, look: Look, inner = '') =>
  hung(art(id, frame, frameBody(frame.w, frame.h, look, inner)));

// The works in the frames: abstract, in the template's pigments, each drawn in a box `w` by `h`.

/** A colour field: two soft-edged blocks floating on a ground, as a painter of fields hangs them. */
function colourField(w: number, h: number, top = BRASS, bottom = ULTRA, ground = CLARET) {
  const blur = r1(Math.max(1.5, w * 0.012));
  return (
    `<defs><filter id="soft" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="${blur}"/></filter></defs>` +
    `<rect width="${r1(w)}" height="${r1(h)}" fill="${ground}"/>` +
    `<rect x="${r1(w * 0.1)}" y="${r1(h * 0.08)}" width="${r1(w * 0.8)}" height="${r1(h * 0.48)}" fill="${top}" fill-opacity=".9" filter="url(#soft)"/>` +
    `<rect x="${r1(w * 0.1)}" y="${r1(h * 0.62)}" width="${r1(w * 0.8)}" height="${r1(h * 0.3)}" fill="${bottom}" fill-opacity=".92" filter="url(#soft)"/>`
  );
}

/** The sea at first light: a sun over a horizon and the lines of the water. */
function horizon(w: number, h: number) {
  const sea = h * 0.58;
  let waves = '';
  for (let i = 1; i <= 4; i++) {
    const y = sea + ((h - sea) * i) / 5;
    waves += `M${r1(w * 0.08 + i * 6)} ${r1(y)}H${r1(w * 0.92 - i * 9)}`;
  }
  return (
    `<rect width="${r1(w)}" height="${r1(sea)}" fill="${WALL}"/>` +
    `<circle cx="${r1(w * 0.64)}" cy="${r1(sea)}" r="${r1(Math.min(w, h) * 0.2)}" fill="${BRASS}"/>` +
    `<rect y="${r1(sea)}" width="${r1(w)}" height="${r1(h - sea)}" fill="${ULTRA}"/>` +
    `<path d="${waves}" stroke="${WHITE}" stroke-opacity=".45" stroke-width="${r1(Math.max(1, h * 0.012))}" stroke-linecap="round"/>`
  );
}

/** An arch standing on a ground, a ball of brass beside it. */
function arch(w: number, h: number) {
  const aw = w * 0.5;
  const x = w * 0.22;
  const top = h * 0.22;
  return (
    `<rect width="${r1(w)}" height="${r1(h)}" fill="${WALL}"/>` +
    `<path d="M${r1(x)} ${r1(h * 0.86)}V${r1(top + aw / 2)}A${r1(aw / 2)} ${r1(aw / 2)} 0 0 1 ${r1(x + aw)} ${r1(top + aw / 2)}V${r1(h * 0.86)}Z" fill="${CLARET}"/>` +
    `<circle cx="${r1(w * 0.8)}" cy="${r1(h * 0.78)}" r="${r1(w * 0.08)}" fill="${BRASS}"/>` +
    `<path d="M${r1(w * 0.12)} ${r1(h * 0.86)}H${r1(w * 0.9)}" stroke="${INK}" stroke-opacity=".5" stroke-width="1.4"/>`
  );
}

/** A drawing on paper: a vase and a branch in a few lines of ink. */
function sketch(w: number, h: number) {
  const s = Math.min(w / 160, h / 200);
  const g = (d: string, width = 1.6) =>
    `<path d="${d}" stroke="${INK}" stroke-opacity=".78" stroke-width="${r1(width / s)}" stroke-linecap="round" stroke-linejoin="round"/>`;
  return (
    `<rect width="${r1(w)}" height="${r1(h)}" fill="${WHITE}"/>` +
    `<g transform="translate(${r1((w - 160 * s) / 2)} ${r1((h - 200 * s) / 2)}) scale(${r1(s * 100) / 100})">` +
    g('M62 176C48 170 44 150 52 132C58 118 66 110 64 96C63 90 60 86 60 82H100C100 86 97 90 96 96C94 110 102 118 108 132C116 150 112 170 98 176Z') +
    g('M56 176H104', 1.2) +
    g('M80 82C78 60 70 44 58 30M74 60C64 56 54 58 46 64M80 82C84 58 96 42 112 34M92 56C100 50 110 50 118 54', 1.4) +
    `<circle cx="58" cy="30" r="5" fill="${CLARET}"/><circle cx="112" cy="34" r="4" fill="${BRASS}"/>` +
    `</g>`
  );
}

/** Upright bands of colour with a hairline between them. */
function bands(w: number, h: number) {
  const colours = [CLARET, WHITE, ULTRA, BRASS];
  const bw = w / colours.length;
  return (
    colours
      .map(
        (c, i) =>
          `<rect x="${r1(i * bw)}" width="${r1(bw)}" height="${r1(h)}" fill="${c}"${c === WHITE ? '' : ' fill-opacity=".92"'}/>`,
      )
      .join('') +
    `<circle cx="${r1(w / 2)}" cy="${r1(h * 0.3)}" r="${r1(w * 0.14)}" fill="${WHITE}" fill-opacity=".85"/>`
  );
}

/** A round work: a moon of brass over the dark sea, held in a gilt tondo. */
function tondo(d: number) {
  const c = d / 2;
  const r = c - 12;
  return (
    `<circle cx="${c}" cy="${c}" r="${r1(c - 1)}" fill="${BRASS}"/>` +
    `<circle cx="${c}" cy="${c}" r="${r1(c - 4)}" stroke="${WHITE}" stroke-opacity=".35" stroke-width="1.4"/>` +
    `<circle cx="${c}" cy="${c}" r="${r1(r)}" fill="${ULTRA}"/>` +
    `<circle cx="${r1(c + r * 0.18)}" cy="${r1(c - r * 0.2)}" r="${r1(r * 0.36)}" fill="${WHITE}" fill-opacity=".9"/>` +
    `<circle cx="${r1(c + r * 0.32)}" cy="${r1(c - r * 0.3)}" r="${r1(r * 0.3)}" fill="${ULTRA}"/>` +
    `<path d="M${r1(c - r * 0.8)} ${r1(c + r * 0.36)}H${r1(c + r * 0.8)}M${r1(c - r * 0.66)} ${r1(c + r * 0.56)}H${r1(c + r * 0.66)}" stroke="${WHITE}" stroke-opacity=".4" stroke-width="2" stroke-linecap="round"/>` +
    `<circle cx="${c}" cy="${c}" r="${r1(r)}" stroke="${INK}" stroke-opacity=".35" stroke-width="1.2"/>`
  );
}

/** A pool of light thrown on the wall: an ellipse that fades out. */
function pool(id: string, frame: Frame, strength = 0.5, colour = WHITE) {
  return art(
    id,
    frame,
    `<defs><radialGradient id="l" cx="50%" cy="45%" r="50%"><stop offset="0" stop-color="${colour}" stop-opacity="${strength}"/><stop offset=".55" stop-color="${colour}" stop-opacity="${r1(strength * 0.4 * 100) / 100}"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient></defs>` +
      `<ellipse cx="${r1(frame.w / 2)}" cy="${r1(frame.h / 2)}" rx="${r1(frame.w / 2)}" ry="${r1(frame.h / 2)}" fill="url(#l)"/>`,
  );
}

/** A spot of a lighting track, hanging from the rail, its head tilted by `tilt` degrees. */
function spot(x: number, tilt: number) {
  return (
    `<rect x="${x - 9}" y="0" width="18" height="10" rx="2" fill="${INK}"/>` +
    `<path d="M${x} 10V30" stroke="${INK}" stroke-width="4"/>` +
    `<g transform="translate(${x} 34) rotate(${tilt})">` +
    `<circle r="7" fill="${INK}"/>` +
    `<rect x="-13" y="2" width="26" height="46" rx="5" fill="${INK}"/>` +
    `<rect x="-13" y="2" width="7" height="46" rx="3" fill="${WHITE}" fill-opacity=".14"/>` +
    `<ellipse cy="48" rx="13" ry="4.5" fill="${WHITE}"/></g>`
  );
}

/** The beam of a spot, from its lamp at `x` on the top of the box down to its foot. */
function beam(w: number, h: number, x: number) {
  return (
    `<defs><linearGradient id="b" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".5"/><stop offset=".7" stop-color="${WHITE}" stop-opacity=".16"/><stop offset="1" stop-color="${WHITE}" stop-opacity="0"/></linearGradient>` +
    `<filter id="s" x="-10%" y="-10%" width="120%" height="120%"><feGaussianBlur stdDeviation="7"/></filter></defs>` +
    `<path d="M${x - 14} 0H${x + 14}L${w - 16} ${h}H16Z" fill="url(#b)" filter="url(#s)"/>`
  );
}

/**
 * A frame of brass lines for words hung on the wall: two rules, a square at each corner, and a
 * break in the top rules from `gap[0]` to `gap[1]`, where a quotation mark stands across them.
 */
function wallFrame(w: number, h: number, gap: [number, number]) {
  const corners = [
    [6, 6],
    [w - 18, 6],
    [6, h - 18],
    [w - 18, h - 18],
  ]
    .map(([x, y]) => `<rect x="${x}" y="${y}" width="12" height="12" fill="${BRASS}"/>`)
    .join('');
  const [a, b] = gap;
  const rules = (i: number) =>
    `M${a} ${i}H${i}V${h - i}H${w - i}V${i}H${b}`;
  return (
    `<rect x="1.5" y="1.5" width="${w - 3}" height="${h - 3}" fill="${WHITE}" fill-opacity=".04"/>` +
    `<path d="${rules(1.5)}" stroke="${BRASS}" stroke-width="3"/>` +
    `<path d="${rules(16)}" stroke="${BRASS}" stroke-opacity=".5" stroke-width="1.2"/>` +
    corners
  );
}

/** A picture light: a brass hood on an arm, over the top of a frame. */
function pictureLight(w: number) {
  const c = w / 2;
  return (
    `<defs><linearGradient id="hood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}" stop-opacity=".55"/><stop offset=".5" stop-color="${BRASS}" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="M${r1(c)} 22C${r1(c)} 34 ${r1(c)} 40 ${r1(c)} 52" stroke="${BRASS}" stroke-width="5" stroke-linecap="round"/>` +
    `<rect x="${r1(c - 14)}" y="44" width="28" height="12" rx="3" fill="${BRASS}"/>` +
    `<rect x="0" y="4" width="${r1(w)}" height="20" rx="10" fill="${BRASS}"/>` +
    `<rect x="0" y="4" width="${r1(w)}" height="20" rx="10" fill="url(#hood)"/>` +
    `<rect x="6" y="22" width="${r1(w - 12)}" height="3" rx="1.5" fill="${WHITE}" fill-opacity=".9"/>`
  );
}

/** A nail in the wall and the wire of a frame hung on it, down to the frame's top corners. */
function wire(w: number, h: number, spread: number) {
  const c = w / 2;
  return (
    `<path d="M${r1(c - spread)} ${h}L${r1(c)} 9L${r1(c + spread)} ${h}" stroke="${INK}" stroke-opacity=".55" stroke-width="1.6" stroke-linejoin="round"/>` +
    `<circle cx="${r1(c)}" cy="8" r="6" fill="${BRASS}"/><circle cx="${r1(c - 1.5)}" cy="6.5" r="2" fill="${WHITE}" fill-opacity=".6"/>`
  );
}

// ---------------------------------------------------------------------------------------------
// The parts every slide is made of

const W = 1920;
const H = 1080;
const START = 128;
const END = 128;
const WIDTH = W - START - END;

/** The picture rail along the top of the wall, in brass. */
const rail = (id: string, top = 40) =>
  art(
    id,
    { x: 0, y: top, w: W, h: 16 },
    `<rect y="3" width="${W}" height="8" fill="${BRASS}"/>` +
      `<rect y="3" width="${W}" height="2.4" fill="${WHITE}" fill-opacity=".38"/>` +
      `<rect y="11" width="${W}" height="4" fill="${INK}" fill-opacity=".14"/>`,
  );

/** The tag of an object: the square of claret that opens a kicker, brass on a dark wall. */
const tag = (id: string, frame: Frame, dark = false) =>
  art(id, frame, `<rect width="${frame.w}" height="${frame.h}" fill="${dark ? BRASS : CLARET}"/>`);

/** A wall painted in the colour of `colour`, with the light falling off toward its corners. */
function paintedWall(name: string, colour: 'primary' | 'secondary'): Element[] {
  return [
    rect(`d_taarucha_${name}_wall`, { x: 0, y: 0, w: W, h: H }, solid(token(colour))),
    art(
      `d_taarucha_${name}_shade`,
      { x: 0, y: 0, w: W, h: H },
      `<defs><radialGradient id="v" cx="50%" cy="38%" r="75%"><stop offset=".45" stop-color="${INK}" stop-opacity="0"/><stop offset="1" stop-color="${INK}" stop-opacity=".34"/></radialGradient></defs>` +
        `<rect width="${W}" height="${H}" fill="url(#v)"/>`,
    ),
  ];
}

/** The floor the wall stands on, from `top` down, and the shadow line where they meet. */
const floor = (id: string, top: number) =>
  art(
    id,
    { x: 0, y: top, w: W, h: H - top },
    `<defs><linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".42"/><stop offset="1" stop-color="${INK}" stop-opacity=".3"/></linearGradient></defs>` +
      `<rect width="${W}" height="${H - top}" fill="url(#f)"/>` +
      `<rect width="${W}" height="3" fill="${WHITE}" fill-opacity=".2"/>`,
  );

/** The kicker on its tag, and the title, from the top of the wall under the rail. */
function head(name: string, width = 1200, kicker = true) {
  if (!kicker) {
    return {
      placeholders: [place('p_title', 'title', at(START + 34, 112, width - 34, 92), 'title')],
      decorations: [tag(`d_taarucha_${name}_tag`, at(START, 140, 14, 14))],
    };
  }
  return {
    placeholders: [
      place('p_kicker', 'caption', at(START + 30, 92, Math.min(900, width - 30), 34), 'caption', {
        color: token('primary'),
      }),
      place('p_title', 'title', at(START, 130, width, 156), 'title'),
    ],
    decorations: [tag(`d_taarucha_${name}_tag`, at(START, 102, 14, 14))],
  };
}

/** The mark of the deck: a small framed work with its mat, which the user may replace. */
function mark(id: string, frame: Frame): Element {
  const s = frame.w;
  const k = r1(s * 0.13);
  const win = r1(s * 0.28);
  return drawing(
    id,
    frame,
    svg(
      s,
      s,
      `<rect width="${s}" height="${s}" fill="${INK}"/>` +
        `<rect x="${k}" y="${k}" width="${r1(s - 2 * k)}" height="${r1(s - 2 * k)}" fill="${WHITE}"/>` +
        `<rect x="${win}" y="${win}" width="${r1(s - 2 * win)}" height="${r1(s - 2 * win)}" fill="${CLARET}"/>` +
        `<circle cx="${r1(s * 0.56)}" cy="${r1(s * 0.44)}" r="${r1(s * 0.08)}" fill="${BRASS}"/>` +
        `<path d="M${win} ${r1(s * 0.58)}H${r1(s - win)}" stroke="${WHITE}" stroke-width="${r1(s * 0.035)}"/>`,
    ),
    PAINT,
    { role: 'logo', name: 'logo' },
  );
}

/**
 * The foot of a slide: the skirting of the wall, the mark and the deck's name at the start; at
 * the end the slide's number on an object tag, as a museum numbers what it shows.
 */
function foot(name: string, { dark = false, footer = true } = {}) {
  return {
    placeholders: footer
      ? [
          place(
            'p_footer',
            'footer',
            at(START + 52, 967, 900, 34),
            'caption',
            dark ? { color: token('surface', 0.8) } : {},
          ),
        ]
      : [],
    decorations: [
      rect(
        `d_taarucha_${name}_skirting`,
        at(START, 942, WIDTH, 1.5),
        solid(dark ? token('surface', 0.24) : token('text', 0.16)),
      ),
      mark(`d_taarucha_${name}_mark`, at(START, 963, 38, 38)),
      art(
        `d_taarucha_${name}_folio`,
        atEnd(END, 962, 70, 40),
        `<rect width="70" height="40" rx="2" fill="${dark ? WHITE : CLARET}"/>`,
      ),
      pageNumber(`d_taarucha_${name}_number`, atEnd(END, 965, 70, 34), 'caption', {
        color: token(dark ? 'primary' : 'surface'),
        align: 'center',
      }),
    ],
  };
}

/** A card of the wall: a label, a panel, a notice. */
const card = (id: string, frame: Frame) =>
  rect(id, frame, solid(token('surface')), {
    stroke: { color: token('text', 0.08), width: 1 },
    effects: { radius: 3, shadow: { x: 0, y: 12, blur: 30, color: { value: '#2a1a14', alpha: 0.13 } } },
  });

/** An object tag with its figure: a number of a list. */
function figureTag(id: string, frame: Frame, n: number) {
  const s = frame.w;
  return upright(
    id,
    frame,
    `<rect width="${s}" height="${s}" rx="2" fill="${CLARET}"/>` +
      `<text x="${r1(s / 2)}" y="${r1(s * 0.68)}" text-anchor="middle" font-family="Golos Text, Alef, sans-serif" font-size="${r1(s * 0.48)}" font-weight="700" fill="${WHITE}">${n}</text>`,
  );
}

// ---------------------------------------------------------------------------------------------
// Drawings of single layouts

/**
 * A plinth seen a little from above and to the side: its lit top, its white front, its side in
 * shade, and the shadow it throws on the floor. `d` is how deep its top and side show.
 */
function plinth(w: number, h: number, d: number) {
  const base = h - 16;
  const front = w - d;
  return (
    `<defs><linearGradient id="face" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${WHITE}"/><stop offset="1" stop-color="${WALL}"/></linearGradient>` +
    `<radialGradient id="floor" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${INK}" stop-opacity=".42"/><stop offset=".6" stop-color="${INK}" stop-opacity=".14"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${r1(w / 2 + d * 0.4)}" cy="${r1(base - 2)}" rx="${r1(w * 0.6)}" ry="17" fill="url(#floor)"/>` +
    `<path d="M${front} ${d}L${w} 0V${r1(base - d)}L${front} ${base}Z" fill="${WALL}"/>` +
    `<path d="M${front} ${d}L${w} 0V${r1(base - d)}L${front} ${base}Z" fill="${INK}" fill-opacity=".16"/>` +
    `<rect x="0" y="${d}" width="${front}" height="${r1(base - d)}" fill="url(#face)"/>` +
    `<path d="M0 ${d}L${d} 0H${w}L${front} ${d}Z" fill="${WHITE}"/>` +
    `<path d="M0 ${d}H${front}L${w} 0" stroke="${INK}" stroke-opacity=".12" stroke-width="1.2"/>` +
    `<path d="M0 ${r1(base - 1)}H${front}L${w} ${r1(base - d - 1)}" stroke="${INK}" stroke-opacity=".22" stroke-width="2"/>`
  );
}

/** An admission ticket: its coloured stub, the perforation with its notches, and the slip. */
function ticket(w: number, h: number, stub: number, colour: string) {
  return (
    `<rect width="${r1(w)}" height="${r1(h)}" rx="6" fill="${WHITE}"/>` +
    `<path d="M0 6A6 6 0 0 1 6 0H${r1(w - 6)}A6 6 0 0 1 ${r1(w)} 6V${stub}H0Z" fill="${colour}"/>` +
    `<path d="M18 ${stub}H${r1(w - 18)}" stroke="${INK}" stroke-opacity=".28" stroke-width="2" stroke-dasharray="2 7" stroke-linecap="round"/>` +
    `<circle cx="0" cy="${stub}" r="11" fill="${WALL}"/><circle cx="${r1(w)}" cy="${stub}" r="11" fill="${WALL}"/>`
  );
}

/** A clip of brass that holds a ticket on the wire. */
const clip =
  `<rect x="14" y="10" width="32" height="30" rx="3" fill="${BRASS}"/>` +
  `<rect x="14" y="10" width="32" height="8" rx="3" fill="${WHITE}" fill-opacity=".3"/>` +
  `<path d="M20 10C20 0 40 0 40 10" stroke="${INK}" stroke-opacity=".7" stroke-width="2.2"/>` +
  `<path d="M18 34H42" stroke="${INK}" stroke-opacity=".25" stroke-width="1.5"/>`;

/** Pictograms of the cards, each in a window 132 square: line drawings, without a word. */
const LINE = `stroke="${INK}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"`;
const PICTOGRAMS = [
  // Evenings: a moon over the open door of the museum, and a note of the music inside.
  () =>
    `<rect width="132" height="132" fill="${ULTRA}"/>` +
    `<path d="M88 22A20 20 0 1 0 104 52A16 16 0 1 1 88 22Z" fill="${BRASS}"/>` +
    `<path d="M30 118V66A20 20 0 0 1 70 66V118" fill="${BRASS}" fill-opacity=".9"/>` +
    `<path d="M22 118H112" stroke="${WHITE}" stroke-opacity=".6" stroke-width="2"/>` +
    `<path d="M86 104V80L104 76V98" stroke="${WHITE}" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<ellipse cx="82" cy="105" rx="6" ry="4.5" fill="${WHITE}"/><ellipse cx="100" cy="99" rx="6" ry="4.5" fill="${WHITE}"/>` +
    `<circle cx="34" cy="28" r="2" fill="${WHITE}"/><circle cx="56" cy="16" r="1.6" fill="${WHITE}"/><circle cx="116" cy="30" r="1.6" fill="${WHITE}"/>`,
  // The open studio: an easel with a drawing begun on it, and the pencil.
  () =>
    `<rect width="132" height="132" fill="${WALL}"/>` +
    `<path d="M66 18L40 122M66 18L92 122M66 18V114" ${LINE}/>` +
    `<rect x="34" y="34" width="64" height="54" fill="${WHITE}" stroke="${INK}" stroke-width="3"/>` +
    `<path d="M44 76C52 58 60 70 66 60C72 50 80 62 88 52" stroke="${CLARET}" stroke-width="3" stroke-linecap="round"/>` +
    `<circle cx="80" cy="48" r="5" fill="${BRASS}"/>` +
    `<path d="M30 92H102" ${LINE}/>` +
    `<path d="M100 110L118 88L124 94L106 116L98 118Z" fill="${BRASS}" stroke="${INK}" stroke-width="2.4" stroke-linejoin="round"/>`,
  // Behind the scenes: a lens over a corner of a framed painting.
  () =>
    `<rect width="132" height="132" fill="${CLARET}"/>` +
    `<rect x="18" y="20" width="76" height="62" fill="${WHITE}" stroke="${BRASS}" stroke-width="5"/>` +
    `<path d="M24 74L44 50L56 62L68 46L88 74Z" fill="${ULTRA}"/><circle cx="74" cy="36" r="6" fill="${BRASS}"/>` +
    `<circle cx="80" cy="80" r="24" fill="${WHITE}" fill-opacity=".35" stroke="${WHITE}" stroke-width="5"/>` +
    `<path d="M97 97L116 116" stroke="${WHITE}" stroke-width="9" stroke-linecap="round"/>` +
    `<path d="M70 70A12 12 0 0 1 82 64" stroke="${WHITE}" stroke-width="3" stroke-linecap="round"/>`,
] as const;

/**
 * The floor plan of five rooms in a row: walls in solid ink, doorways between them, the works
 * on the walls and the benches and plinths on the floor, and the visitor's route from the door
 * at the start to the last room.
 */
function floorPlan(w: number, h: number, route: number) {
  const wall = 12;
  const inner = 9;
  const room = w / 5;
  const door = 86;
  const doorY = route;
  let walls =
    // The outer walls, with the way in at the start and the way out at the end.
    `<path d="M0 0H${w}V${r1(doorY - door / 2)}M${w} ${r1(doorY + door / 2)}V${h}H0V${r1(doorY + door / 2)}M0 ${r1(doorY - door / 2)}V0" stroke="${INK}" stroke-width="${wall * 2}"/>`;
  for (let i = 1; i < 5; i++) {
    const x = r1(room * i);
    walls += `<path d="M${x} 0V${r1(doorY - door / 2)}M${x} ${r1(doorY + door / 2)}V${h}" stroke="${INK}" stroke-width="${inner}"/>`;
  }
  // The works on the walls of each room: short thick lines along the long walls.
  let works = '';
  for (let i = 0; i < 5; i++) {
    const x0 = room * i;
    const n = i % 2 ? 3 : 2;
    for (let k = 0; k < n; k++) {
      const x = x0 + (room * (k + 1)) / (n + 1);
      works += `M${r1(x - 26)} ${wall + 6}H${r1(x + 26)}M${r1(x - 20)} ${h - wall - 6}H${r1(x + 20)}`;
    }
  }
  // Furniture: a bench, a plinth, a vitrine, a bench, two plinths.
  const fx = (i: number) => room * i + room / 2;
  const by = h - 52;
  const furniture =
    `<rect x="${r1(fx(0) - 44)}" y="${by}" width="88" height="20" rx="3" fill="${OAK}" fill-opacity=".55"/>` +
    `<rect x="${r1(fx(1) - 18)}" y="${by - 8}" width="36" height="36" fill="${WHITE}" stroke="${INK}" stroke-opacity=".45" stroke-width="2"/><circle cx="${r1(fx(1))}" cy="${by + 10}" r="9" fill="${BRASS}"/>` +
    `<rect x="${r1(fx(2) - 64)}" y="${by - 2}" width="128" height="28" fill="${WHITE}" stroke="${INK}" stroke-opacity=".45" stroke-width="2"/><path d="M${r1(fx(2) - 58)} ${by + 20}L${r1(fx(2) - 40)} ${by + 2}M${r1(fx(2) - 30)} ${by + 20}L${r1(fx(2) - 12)} ${by + 2}M${r1(fx(2) - 2)} ${by + 20}L${r1(fx(2) + 16)} ${by + 2}M${r1(fx(2) + 26)} ${by + 20}L${r1(fx(2) + 44)} ${by + 2}" stroke="${ULTRA}" stroke-opacity=".5" stroke-width="1.5"/>` +
    `<rect x="${r1(fx(3) - 44)}" y="${by}" width="88" height="20" rx="3" fill="${OAK}" fill-opacity=".55"/>` +
    `<rect x="${r1(fx(4) - 52)}" y="${by - 6}" width="32" height="32" fill="${WHITE}" stroke="${INK}" stroke-opacity=".45" stroke-width="2"/><rect x="${r1(fx(4) + 20)}" y="${by - 6}" width="32" height="32" fill="${WHITE}" stroke="${INK}" stroke-opacity=".45" stroke-width="2"/>`;
  // The route, from the door at the start (the right of a right-to-left plan) to the end.
  const routeLine =
    `<path d="M${w + 30} ${doorY}H26" stroke="${CLARET}" stroke-width="4" stroke-dasharray="3 11" stroke-linecap="round"/>` +
    `<path d="M40 ${doorY - 13}L20 ${doorY}L40 ${doorY + 13}" stroke="${CLARET}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>` +
    `<circle cx="${w + 30}" cy="${doorY}" r="9" fill="${CLARET}"/>`;
  return (
    `<rect width="${w}" height="${h}" fill="${WHITE}"/>` +
    `<path d="${works}" stroke="${INK}" stroke-opacity=".5" stroke-width="7"/>` +
    furniture +
    walls +
    routeLine
  );
}

/**
 * The elevation of a wall of the old hang: frames packed edge to edge in rows, high and low,
 * as the collection hung before its rooms were rebuilt.
 */
function crowdedWall(w: number, h: number) {
  let s = `<rect width="${w}" height="${h}" rx="3" fill="${MUTED}" fill-opacity=".22"/>`;
  const rows = [
    { y: 22, hh: 58, widths: [70, 48, 92, 56, 80, 44, 96, 62, 74] },
    { y: 92, hh: 74, widths: [56, 104, 64, 88, 50, 112, 70, 84] },
    { y: 178, hh: 46, widths: [84, 60, 52, 98, 66, 58, 90, 72, 54] },
  ];
  for (const row of rows) {
    const total = row.widths.reduce((a, b) => a + b, 0);
    const gap = (w - 40 - total) / (row.widths.length - 1);
    let x = 20;
    row.widths.forEach((bw, i) => {
      const fill = [CLARET, ULTRA, BRASS, MUTED, INK][(i + row.y) % 5]!;
      s +=
        `<rect x="${r1(x)}" y="${row.y}" width="${bw}" height="${row.hh}" fill="${INK}" fill-opacity=".85"/>` +
        `<rect x="${r1(x + 5)}" y="${row.y + 5}" width="${bw - 10}" height="${row.hh - 10}" fill="${fill}" fill-opacity=".55"/>`;
      x += bw + gap;
    });
  }
  return s + `<path d="M0 ${h - 8}H${w}" stroke="${INK}" stroke-opacity=".3" stroke-width="3"/>`;
}

/** The elevation of a wall of the new hang: three works, a light on each, a bench before them. */
function calmWall(w: number, h: number) {
  const works = [
    { x: 92, y: 52, w: 132, h: 112, inner: colourField(102, 82) },
    { x: 304, y: 34, w: 140, h: 148, inner: horizon(110, 118) },
    { x: 526, y: 58, w: 118, h: 100, inner: arch(88, 70) },
  ];
  let s =
    `<rect width="${w}" height="${h}" rx="3" fill="${CLARET}"/>` +
    `<defs><radialGradient id="p" cx="50%" cy="40%" r="50%"><stop offset="0" stop-color="${WHITE}" stop-opacity=".32"/><stop offset="1" stop-color="${WHITE}" stop-opacity="0"/></radialGradient></defs>`;
  works.forEach((work) => {
    s += `<ellipse cx="${work.x + work.w / 2}" cy="${work.y + work.h / 2 - 6}" rx="${work.w * 0.95}" ry="${work.h * 0.9}" fill="url(#p)"/>`;
  });
  works.forEach((work, i) => {
    s += `<g transform="translate(${work.x} ${work.y})">${frameBody(work.w, work.h, { moulding: 6, mat: 9, finish: INK }, work.inner, `c${i}`)}</g>`;
  });
  return (
    s +
    `<rect x="${w / 2 - 110}" y="${h - 44}" width="220" height="12" rx="3" fill="${OAK}"/>` +
    `<path d="M${w / 2 - 96} ${h - 32}V${h - 10}M${w / 2 + 96} ${h - 32}V${h - 10}" stroke="${OAK}" stroke-width="6"/>` +
    `<path d="M0 ${h - 8}H${w}" stroke="${INK}" stroke-opacity=".35" stroke-width="3"/>`
  );
}

/**
 * The doorway of the section: an arch cut into the wall, and through it the next room in
 * perspective: its claret walls, the ceiling with its track, a lit painting on the far wall, a
 * bench on the oak floor. `w` by `h` with a surround of 12 around the opening.
 */
function doorway(w: number, h: number) {
  const o = 12;
  const ow = w - 2 * o;
  const r = ow / 2;
  const bottom = h;
  const cx = w / 2;
  const opening = `M${o} ${bottom}V${o + r}A${r} ${r} 0 0 1 ${w - o} ${o + r}V${bottom}Z`;
  const surround = `M0 ${bottom}V${o + r}A${r + o} ${r + o} 0 0 1 ${w} ${o + r}V${bottom}`;
  const back = { x: cx - 120, y: o + r + 40, w: 240, h: 300 };
  const vpY = back.y + back.h * 0.62;
  const floorY = back.y + back.h;
  let planks = '';
  for (let i = -6; i <= 6; i++) {
    const xb = cx + i * 20;
    const xf = cx + i * 66;
    planks += `M${r1(xb)} ${r1(floorY)}L${r1(xf)} ${bottom}`;
  }
  let joints = '';
  for (const t of [0.18, 0.4, 0.66]) {
    const y = floorY + (bottom - floorY) * t;
    joints += `M${o} ${r1(y)}H${w - o}`;
  }
  const work = { x: cx - 52, y: back.y + 92, w: 104, h: 78 };
  return (
    `<defs><clipPath id="o"><path d="${opening}"/></clipPath>` +
    `<radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${WHITE}" stop-opacity=".45"/><stop offset="1" stop-color="${WHITE}" stop-opacity="0"/></radialGradient>` +
    `<linearGradient id="f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${INK}" stop-opacity=".25"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></linearGradient></defs>` +
    `<path d="${surround}" stroke="${WHITE}" stroke-opacity=".3" stroke-width="5"/>` +
    `<g clip-path="url(#o)">` +
    // The ceiling, the side walls, the far wall and the floor of the next room.
    `<rect width="${w}" height="${h}" fill="${WHITE}"/>` +
    `<path d="M${cx - 60} ${o + 40}L${cx - 60} ${back.y}M${cx + 60} ${o + 40}L${cx + 60} ${back.y}" stroke="${INK}" stroke-opacity=".18" stroke-width="3"/>` +
    `<path d="M${o} 0L${back.x} ${back.y}V${floorY}L${o} ${bottom}Z" fill="${CLARET}"/>` +
    `<path d="M${o} 0L${back.x} ${back.y}V${floorY}L${o} ${bottom}Z" fill="${INK}" fill-opacity=".3"/>` +
    `<path d="M${w - o} 0L${back.x + back.w} ${back.y}V${floorY}L${w - o} ${bottom}Z" fill="${CLARET}"/>` +
    `<path d="M${w - o} 0L${back.x + back.w} ${back.y}V${floorY}L${w - o} ${bottom}Z" fill="${INK}" fill-opacity=".12"/>` +
    `<rect x="${back.x}" y="${back.y}" width="${back.w}" height="${back.h}" fill="${CLARET}"/>` +
    `<ellipse cx="${cx}" cy="${work.y + work.h / 2}" rx="120" ry="110" fill="url(#g)"/>` +
    `<path d="M${o} ${bottom}L${back.x} ${floorY}H${back.x + back.w}L${w - o} ${bottom}Z" fill="${OAK}"/>` +
    `<path d="M${o} ${bottom}L${back.x} ${floorY}H${back.x + back.w}L${w - o} ${bottom}Z" fill="url(#f)"/>` +
    `<path d="${planks}${joints}" stroke="${INK}" stroke-opacity=".16" stroke-width="1.4"/>` +
    `<path d="M${back.x} ${floorY}H${back.x + back.w}" stroke="${INK}" stroke-opacity=".35" stroke-width="3"/>` +
    // Two works on the side walls, seen at a slant.
    `<path d="M${o + 34} ${r1(back.y - 10)}L${back.x - 22} ${r1(back.y + 36)}V${r1(back.y + 120)}L${o + 34} ${r1(back.y + 128)}Z" fill="${INK}" fill-opacity=".85"/>` +
    `<path d="M${o + 44} ${r1(back.y + 4)}L${back.x - 30} ${r1(back.y + 44)}V${r1(back.y + 112)}L${o + 44} ${r1(back.y + 116)}Z" fill="${BRASS}" fill-opacity=".8"/>` +
    `<path d="M${w - o - 34} ${r1(back.y - 10)}L${back.x + back.w + 22} ${r1(back.y + 36)}V${r1(back.y + 120)}L${w - o - 34} ${r1(back.y + 128)}Z" fill="${INK}" fill-opacity=".85"/>` +
    `<path d="M${w - o - 44} ${r1(back.y + 4)}L${back.x + back.w + 30} ${r1(back.y + 44)}V${r1(back.y + 112)}L${w - o - 44} ${r1(back.y + 116)}Z" fill="${ULTRA}" fill-opacity=".85"/>` +
    // The painting on the far wall, and the bench before it.
    `<g transform="translate(${work.x} ${work.y})">${frameBody(work.w, work.h, { moulding: 6, mat: 8, finish: INK }, horizon(work.w - 28, work.h - 28), 'd')}</g>` +
    `<path d="M${cx - 74} ${r1(floorY + 62)}H${cx + 74}L${cx + 86} ${r1(floorY + 76)}H${cx - 86}Z" fill="${INK}" fill-opacity=".8"/>` +
    `<path d="M${cx - 76} ${r1(floorY + 76)}V${r1(floorY + 100)}M${cx + 76} ${r1(floorY + 76)}V${r1(floorY + 100)}" stroke="${INK}" stroke-opacity=".8" stroke-width="6"/>` +
    `<circle cx="${cx - 60}" cy="${o + 52}" r="5" fill="${INK}" fill-opacity=".5"/><circle cx="${cx + 60}" cy="${o + 52}" r="5" fill="${INK}" fill-opacity=".5"/>` +
    // The reveal of the opening: the thickness of the wall, lit on one side.
    `<path d="${opening}" stroke="${INK}" stroke-opacity=".28" stroke-width="40"/>` +
    `</g>` +
    `<path d="${opening}" stroke="${WHITE}" stroke-opacity=".18" stroke-width="2"/>`
  );
}

/** A tape measure hanging down the wall: its brass case on top, the tape with its marks. */
function tape(w: number, h: number) {
  let ticks = '';
  for (let y = 70, i = 0; y < h - 10; y += 10, i++) {
    const len = i % 10 === 0 ? w * 0.6 : i % 5 === 0 ? w * 0.42 : w * 0.24;
    ticks += `M${r1(w * 0.2)} ${y}H${r1(w * 0.2 + len)}`;
  }
  return (
    `<rect x="${r1(w * 0.18)}" y="56" width="${r1(w * 0.64)}" height="${h - 60}" fill="${BRASS}" fill-opacity=".38"/>` +
    `<path d="${ticks}" stroke="${INK}" stroke-opacity=".55" stroke-width="1.4"/>` +
    `<rect x="0" y="0" width="${w}" height="58" rx="10" fill="${INK}"/>` +
    `<circle cx="${r1(w / 2)}" cy="29" r="11" stroke="${BRASS}" stroke-width="3"/>` +
    `<rect x="${r1(w * 0.12)}" y="${h - 8}" width="${r1(w * 0.76)}" height="8" rx="2" fill="${INK}"/>`
  );
}

/** Three exhibition catalogues lying in a stack, their spines in the pigments. */
function catalogues(w: number, h: number) {
  const books = [
    { x: 22, y: h - 30, w: w - 36, h: 28, c: CLARET },
    { x: 8, y: h - 58, w: w - 28, h: 26, c: ULTRA },
    { x: 34, y: h - 86, w: w - 52, h: 26, c: BRASS },
  ];
  return books
    .map(
      (b) =>
        `<rect x="${b.x}" y="${b.y}" width="${b.w}" height="${b.h}" rx="2" fill="${b.c}"/>` +
        `<rect x="${b.x + b.w - 18}" y="${b.y}" width="18" height="${b.h}" fill="${WHITE}" fill-opacity=".85"/>` +
        `<path d="M${b.x + b.w - 18} ${b.y + 6}H${b.x + b.w - 2}M${b.x + b.w - 18} ${b.y + 12}H${b.x + b.w - 2}M${b.x + b.w - 18} ${b.y + 18}H${b.x + b.w - 2}" stroke="${INK}" stroke-opacity=".18" stroke-width="1"/>` +
        `<rect x="${b.x + 18}" y="${b.y + b.h / 2 - 2}" width="${r1(b.w * 0.34)}" height="4" rx="2" fill="${WHITE}" fill-opacity=".55"/>`,
    )
    .join('');
}

/** A small plan of the wing with the room the picture shows, marked where the visitor stands. */
function youAreHere(w: number, h: number) {
  const cell = (x: number, y: number, cw: number, ch: number, hot = false) =>
    `<rect x="${x}" y="${y}" width="${cw}" height="${ch}" fill="${hot ? CLARET : WHITE}" fill-opacity="${hot ? 0.16 : 1}" stroke="${INK}" stroke-opacity=".6" stroke-width="3"/>`;
  return (
    cell(4, 4, 62, 70) +
    cell(66, 4, 62, 70) +
    cell(128, 4, w - 132, 70) +
    cell(4, 74, 124, h - 78, true) +
    cell(128, 74, w - 132, h - 78) +
    `<path d="M20 ${r1(74 + (h - 78) / 2)}H112" stroke="${INK}" stroke-opacity=".35" stroke-width="5"/>` +
    `<circle cx="66" cy="${r1(74 + (h - 78) * 0.72)}" r="16" fill="${CLARET}" fill-opacity=".2"/>` +
    `<circle cx="66" cy="${r1(74 + (h - 78) * 0.72)}" r="7" fill="${CLARET}"/>`
  );
}

/** A gallery bench seen from the front: a long leather seat on a frame of oak, its shadow. */
function bench(w: number, h: number) {
  return (
    `<defs><radialGradient id="s" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${INK}" stop-opacity=".5"/><stop offset="1" stop-color="${INK}" stop-opacity="0"/></radialGradient></defs>` +
    `<ellipse cx="${w / 2}" cy="${h - 6}" rx="${w * 0.56}" ry="10" fill="url(#s)"/>` +
    `<rect x="0" y="0" width="${w}" height="30" rx="8" fill="${INK}"/>` +
    `<rect x="6" y="3" width="${w - 12}" height="6" rx="3" fill="${WHITE}" fill-opacity=".14"/>` +
    `<rect x="10" y="30" width="${w - 20}" height="12" fill="${OAK}"/>` +
    `<rect x="22" y="42" width="16" height="${h - 48}" fill="${OAK}"/><rect x="${w - 38}" y="42" width="16" height="${h - 48}" fill="${OAK}"/>` +
    `<rect x="22" y="42" width="16" height="${h - 48}" fill="${INK}" fill-opacity=".25"/><rect x="${w - 38}" y="42" width="16" height="${h - 48}" fill="${INK}" fill-opacity=".25"/>`
  );
}

/** Line icons for the closing's lines: the day, the hours, the ticket. */
const CLOSING_ICONS = [
  `<rect x="3" y="6" width="28" height="25" rx="2" stroke="${BRASS}" stroke-width="2.4"/><path d="M3 13H31M10 3V9M24 3V9" stroke="${BRASS}" stroke-width="2.4" stroke-linecap="round"/><rect x="19" y="19" width="6" height="6" fill="${WHITE}"/>`,
  `<circle cx="17" cy="17" r="14" stroke="${BRASS}" stroke-width="2.4"/><path d="M17 9V17L23 21" stroke="${WHITE}" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>`,
  `<path d="M2 9H32V14A3 3 0 0 0 32 20V25H2V20A3 3 0 0 0 2 14Z" stroke="${BRASS}" stroke-width="2.4" stroke-linejoin="round"/><path d="M12 10V24" stroke="${WHITE}" stroke-width="2" stroke-dasharray="2 3"/>`,
];

// ---------------------------------------------------------------------------------------------
// The layouts

/** The columns of the rows of cards, tickets, rooms and people. */
const cards3 = [START, START + 582, START + 1164];
const tickets4 = [START, START + 426, START + 852, START + 1278];
const rooms5 = [0, 1, 2, 3, 4].map((i) => START + (i * WIDTH) / 5);
const team4 = [START, START + 428, START + 856, START + 1284];
/** The tops of the three lower plinths of the big number, from the start: rising to the main one. */
const PLINTH_TOPS = [700, 660, 620];

function layouts(): Layout[] {
  // The opening's salon hang, on the end side of the claret wall.
  const heroMain = atEnd(380, 176, 500, 640);
  const heroLook: Look = { moulding: 20, mat: 44, finish: INK };
  const heroWindow = windowOf(heroMain.w, heroMain.h, heroLook);

  // The closing's work: one large painting, a light over it, a bench before it.
  const closingWork = atEnd(170, 176, 560, 660);
  const closingLook: Look = { moulding: 22, mat: 52, finish: INK };
  const closingWindow = windowOf(closingWork.w, closingWork.h, closingLook);

  // The photograph of the text and image, hung by its cords from the rail.
  const studioFrame = atEnd(END + 20, 192, 620, 716);
  const studioLook: Look = { moulding: 18, mat: 50, finish: INK };
  const studioWindow = windowOf(studioFrame.w, studioFrame.h, studioLook);

  // The portraits of the team.
  const portrait = { w: 320, h: 364 };
  const portraitLook: Look = { moulding: 12, mat: 32, finish: INK };
  const portraitWindow = windowOf(portrait.w, portrait.h, portraitLook);

  return [
    {
      id: 'l_taarucha_hero',
      name: 'Hero',
      archetype: 'hero',
      placeholders: [
        place('p_kicker', 'caption', at(START + 30, 296, 760, 34), 'caption', {
          color: token('surface', 0.8),
        }),
        place('p_title', 'title', at(START, 342, 790, 252), 'display', {
          color: token('surface'),
        }),
        place('p_subtitle', 'subtitle', at(START, 604, 760, 118), 'heading', {
          color: token('surface', 0.88),
        }),
        place('p_meta', 'caption', at(START, 792, 664, 36), 'caption', {
          color: token('surface', 0.8),
        }),
        place('p_image', 'image', {
          x: heroMain.x + heroWindow.x,
          y: heroMain.y + heroWindow.y,
          w: heroWindow.w,
          h: heroWindow.h,
        }),
      ],
      decorations: [
        ...paintedWall('hero', 'primary'),
        // The light the two spots throw on the wall, under the works.
        pool('d_taarucha_hero_light', atEnd(270, 110, 720, 820), 0.3),
        pool('d_taarucha_hero_light_side', atEnd(60, 140, 380, 720), 0.22),
        rail('d_taarucha_hero_rail'),
        art('d_taarucha_hero_spots', atEnd(200, 52, 520, 96), spot(50, 14) + spot(430, -4)),
        // A colour field that runs on past the edge of the slide, as the wall runs on.
        framed('d_taarucha_hero_edge', atEnd(-96, 290, 200, 360), BLACK_FRAME, colourField(88, 248)),
        hung(art('d_taarucha_hero_tondo', atEnd(148, 176, 204, 204), tondo(204))),
        framed(
          'd_taarucha_hero_sea',
          atEnd(140, 414, 220, 168),
          { moulding: 12, mat: 18, finish: BRASS },
          horizon(160, 108),
        ),
        framed(
          'd_taarucha_hero_drawing',
          atEnd(168, 616, 164, 200),
          { moulding: 8, mat: 22, finish: WHITE },
          sketch(104, 140),
        ),
        framed('d_taarucha_hero_frame', heroMain, heroLook),
        // The fillet of brass a wall's lettering is set under: a short bar at the start of a
        // hairline. It reads with the date under it and without it.
        art(
          'd_taarucha_hero_fillet',
          at(START, 762, 664, 4),
          `<rect x="0" y="1.25" width="664" height="1.5" fill="${BRASS}" fill-opacity=".55"/>` +
            `<rect x="568" y="0" width="96" height="4" fill="${BRASS}"/>`,
        ),
        tag('d_taarucha_hero_kicker_tag', at(START, 306, 14, 14), true),
        floor('d_taarucha_hero_floor', 960),
      ],
    },
    {
      id: 'l_taarucha_section',
      name: 'Section',
      archetype: 'section',
      placeholders: [
        place('p_number', 'number', atEnd(820, 186, 230, 150), 'display', {
          align: 'center',
          vAlign: 'bottom',
          color: token('surface'),
        }),
        place('p_kicker', 'caption', at(START + 30, 376, 700, 34), 'caption', {
          color: token('surface', 0.8),
        }),
        place('p_title', 'title', at(START, 418, 720, 252), 'display', {
          vAlign: 'middle',
          color: token('surface'),
        }),
        place('p_subtitle', 'subtitle', at(START, 680, 700, 118), 'heading', {
          color: token('surface', 0.88),
        }),
      ],
      decorations: [
        ...paintedWall('section', 'secondary'),
        rail('d_taarucha_section_rail'),
        floor('d_taarucha_section_floor', 944),
        art('d_taarucha_section_door', atEnd(196, 152, 584, 792), doorway(584, 792)),
        rect('d_taarucha_section_rule', atEnd(895, 348, 80, 3), solid(token('accent'))),
        tag('d_taarucha_section_tag', at(START, 386, 14, 14), true),
      ],
    },
    {
      id: 'l_taarucha_big_number',
      name: 'Big number',
      archetype: 'bigNumber',
      placeholders: [
        ...head('big_number', 1000).placeholders,
        // The figure stands on the top of the tallest plinth, under a spot; its label is on the
        // plinth's face. The other three stand on lower plinths, rising toward it.
        place('p_number', 'number', atEnd(END + 20, 470, 514, 152), 'display', {
          align: 'center',
          vAlign: 'bottom',
          color: token('primary'),
        }),
        place('p_label', 'subtitle', atEnd(END + 60, 640, 434, 56), 'heading'),
        place('p_note', 'body', atEnd(END + 60, 700, 434, 156), 'body'),
        ...[0, 1, 2].flatMap((i) => {
          const s = START + i * 352;
          const top = PLINTH_TOPS[i]!;
          return [
            place(`p_number${i + 2}`, 'number', at(s + 18, top - 72, 282, 96), 'title', {
              align: 'center',
              vAlign: 'bottom',
              color: token('secondary'),
            }),
            place(`p_label${i + 2}`, 'caption', at(s + 30, top + 44, 258, 104), 'caption', {
              align: 'center',
            }),
          ];
        }),
        ...foot('big_number').placeholders,
      ],
      decorations: [
        ...head('big_number', 1000).decorations,
        rail('d_taarucha_big_number_rail'),
        pool('d_taarucha_big_number_light', atEnd(END - 30, 330, 660, 420), 0.5),
        ...[0, 1, 2].map((i) =>
          pool(
            `d_taarucha_big_number_light${i + 2}`,
            at(START + i * 352 - 40, PLINTH_TOPS[i]! - 190, 380, 300),
            0.55,
          ),
        ),
        art('d_taarucha_big_number_beam', atEnd(END + 20, 132, 540, 466), beam(540, 466, 257)),
        art('d_taarucha_big_number_spot', atEnd(END + 20 + 257 - 40, 52, 80, 96), spot(40, 0)),
        art('d_taarucha_big_number_plinth', atEnd(END + 20, 584, 540, 322), plinth(540, 322, 26)),
        ...[0, 1, 2].map((i) => {
          const s = START + i * 352;
          const top = PLINTH_TOPS[i]!;
          return art(
            `d_taarucha_big_number_plinth${i + 2}`,
            at(s, top, 300, 906 - top),
            plinth(300, 906 - top, 18),
          );
        }),
        ...foot('big_number').decorations,
      ],
    },
    {
      id: 'l_taarucha_quote',
      name: 'Quote',
      archetype: 'quote',
      placeholders: [
        place('p_quote', 'quote', at(START + 84, 340, 1030, 380), 'title', {
          vAlign: 'middle',
          color: token('surface'),
        }),
        place('p_attribution', 'attribution', atEnd(END + 52, 622, 356, 52), 'heading', {
          vAlign: 'bottom',
          color: token('text'),
        }),
        place('p_caption', 'caption', atEnd(END + 52, 678, 356, 70), 'caption', {
          vAlign: 'top',
          color: token('muted'),
        }),
        ...foot('quote', { dark: true }).placeholders,
      ],
      decorations: [
        ...paintedWall('quote', 'primary'),
        pool('d_taarucha_quote_light', at(START + 20, 160, 1140, 720), 0.2),
        rail('d_taarucha_quote_rail'),
        art('d_taarucha_quote_spot', at(START + 530, 52, 120, 96), spot(60, 0)),
        art('d_taarucha_quote_frame', at(START, 280, 1180, 480), wallFrame(1180, 480, [956, 1124])),
        // The quotation mark stands across the frame's top, where its rules break for it.
        upright(
          'd_taarucha_quote_marks',
          at(START + 70, 236, 140, 92),
          `<path d="M22 92V58C22 28 38 10 64 4L69 16C52 23 45 35 45 50H64V92Z M76 92V58C76 28 92 10 118 4L123 16C106 23 99 35 99 50H118V92Z" fill="${BRASS}"/>`,
        ),
        card('d_taarucha_quote_label', atEnd(END + 20, 588, 420, 172)),
        rect('d_taarucha_quote_label_band', atEnd(END + 20, 588, 420, 6), solid(token('accent'))),
        ...foot('quote', { dark: true }).decorations,
      ],
    },
    {
      id: 'l_taarucha_text',
      name: 'Text',
      archetype: 'text',
      // The text is on the panel that opens an exhibition, from margin to margin and down to
      // over the foot, from its top; two small works hang on nails beside the title.
      placeholders: [
        ...head('text', 1380, false).placeholders,
        place('p_body', 'body', at(START + 84, 238 + 58, WIDTH - 148, 560), 'body'),
      ],
      decorations: [
        ...head('text', 1380, false).decorations,
        card('d_taarucha_text_panel', at(START, 238, WIDTH, 676)),
        rect('d_taarucha_text_band', at(START, 238, 14, 676), solid(token('primary'))),
        rail('d_taarucha_text_rail'),
        art('d_taarucha_text_nail1', atEnd(END + 10, 74, 96, 40), wire(96, 40, 30)),
        framed(
          'd_taarucha_text_work1',
          atEnd(END + 10, 112, 96, 96),
          { moulding: 7, mat: 12, finish: INK },
          colourField(58, 58),
        ),
        art('d_taarucha_text_nail2', atEnd(END + 132, 58, 84, 40), wire(84, 40, 24)),
        framed(
          'd_taarucha_text_work2',
          atEnd(END + 132, 96, 84, 112),
          { moulding: 5, mat: 12, finish: WHITE },
          sketch(50, 78),
        ),
        // The exhibition's colours in the panel's lower corner, as its key: a brass rule and
        // three chips of its pigments.
        art(
          'd_taarucha_text_key',
          atEnd(END + 48, 864, 176, 22),
          `<path d="M0 11H88" stroke="${BRASS}" stroke-width="2"/>` +
            [CLARET, ULTRA, BRASS]
              .map((c, i) => `<rect x="${100 + i * 26}" y="1" width="20" height="20" fill="${c}"/>`)
              .join(''),
        ),
        ...foot('text', { footer: false }).decorations,
      ],
    },
    {
      id: 'l_taarucha_text_image',
      name: 'Text and image',
      archetype: 'textImage',
      placeholders: [
        ...head('text_image', 920).placeholders,
        place('p_image', 'image', {
          x: studioFrame.x + studioWindow.x,
          y: studioFrame.y + studioWindow.y,
          w: studioWindow.w,
          h: studioWindow.h,
        }),
        ...[0, 1, 2].flatMap((i) => [
          place(`p_point${i + 1}`, 'subtitle', at(START + 78, 316 + i * 192, 840, 52), 'heading'),
          place(`p_detail${i + 1}`, 'body', at(START + 78, 372 + i * 192, 840, 116), 'body'),
        ]),
        ...foot('text_image').placeholders,
      ],
      decorations: [
        ...head('text_image', 920).decorations,
        rail('d_taarucha_text_image_rail'),
        art(
          'd_taarucha_text_image_cords',
          atEnd(studioFrame.x, 54, studioFrame.w, studioFrame.y - 54 + 2),
          wire(studioFrame.w, studioFrame.y - 54 + 2, studioFrame.w / 2 - 26),
        ),
        framed('d_taarucha_text_image_frame', studioFrame, studioLook),
        ...[0, 1, 2].map((i) =>
          figureTag(`d_taarucha_text_image_tag${i + 1}`, at(START, 322 + i * 192, 46, 46), i + 1),
        ),
        ...[0, 1].map((i) =>
          rect(
            `d_taarucha_text_image_rule${i + 1}`,
            at(START + 78, 494 + i * 192, 840, 1.5),
            solid(token('text', 0.12)),
          ),
        ),
        ...foot('text_image').decorations,
      ],
    },
    {
      id: 'l_taarucha_full_image',
      name: 'Full image',
      archetype: 'fullImage',
      placeholders: [
        place('p_image', 'image', { x: 0, y: 0, w: W, h: 724 }),
        place('p_place', 'caption', at(START + 30, 790, 760, 34), 'caption', {
          color: token('primary'),
        }),
        place('p_title', 'title', at(START, 830, 840, 160), 'title'),
        place('p_body', 'body', at(START + 916, 794, 520, 186), 'body'),
      ],
      decorations: [
        rail('d_taarucha_full_image_rail', 724),
        tag('d_taarucha_full_image_tag', at(START, 800, 14, 14)),
        rect('d_taarucha_full_image_rule', at(START + 876, 790, 1.5, 186), solid(token('text', 0.18))),
        art('d_taarucha_full_image_plan', atEnd(END, 790, 196, 186), youAreHere(196, 186)),
      ],
    },
    {
      id: 'l_taarucha_cards',
      name: 'Cards',
      archetype: 'cards',
      placeholders: [
        ...head('cards', 1100).placeholders,
        ...cards3.flatMap((s, i) => [
          place(`p_label${i + 1}`, 'caption', at(s + 52, 526, 396, 34), 'caption', {
            color: token('primary'),
          }),
          place(`p_card${i + 1}_title`, 'subtitle', at(s + 52, 564, 396, 52), 'heading'),
          place(`p_card${i + 1}_body`, 'body', at(s + 52, 620, 396, 128), 'body'),
        ]),
        place('p_note', 'body', at(START, 866, 1500, 42), 'body'),
        ...foot('cards').placeholders,
      ],
      decorations: [
        ...head('cards', 1100).decorations,
        rail('d_taarucha_cards_rail'),
        ...cards3.flatMap((s, i) => [
          art(`d_taarucha_cards_wire${i + 1}`, at(s, 274, 500, 40), wire(500, 40, 190)),
          framed(`d_taarucha_cards_frame${i + 1}`, at(s, 312, 500, 470), {
            moulding: 14,
            mat: 0,
            finish: INK,
          }),
          rect(`d_taarucha_cards_mat${i + 1}`, at(s + 14, 326, 472, 442), solid(token('surface'))),
          upright(
            `d_taarucha_cards_work${i + 1}`,
            at(s + 44, 358, 148, 148),
            frameBody(148, 148, { moulding: 4, mat: 4, finish: INK }, PICTOGRAMS[i]!(), `p${i}`),
          ),
        ]),
        ...foot('cards').decorations,
      ],
    },
    {
      id: 'l_taarucha_timeline',
      name: 'Timeline',
      archetype: 'timeline',
      placeholders: [
        ...head('timeline', 1100).placeholders,
        ...tickets4.flatMap((s, i) => [
          place(`p_when${i + 1}`, 'number', at(s + 30, 392, 328, 76), 'title', {
            vAlign: 'middle',
            color: token('surface'),
          }),
          place(`p_stop${i + 1}`, 'subtitle', at(s + 30, 500, 328, 100), 'heading', {
            vAlign: 'bottom',
          }),
          place(`p_stop${i + 1}_body`, 'body', at(s + 30, 608, 328, 120), 'body'),
        ]),
        place('p_note', 'caption', at(START + 30, 818, 1400, 70), 'caption'),
        ...foot('timeline').placeholders,
      ],
      decorations: [
        ...head('timeline', 1100).decorations,
        rail('d_taarucha_timeline_rail'),
        art(
          'd_taarucha_timeline_wire',
          at(START - 60, 346, WIDTH + 120, 20),
          `<path d="M10 10H${WIDTH + 110}" stroke="${INK}" stroke-opacity=".55" stroke-width="1.6"/>` +
            `<circle cx="10" cy="10" r="8" fill="${BRASS}"/><circle cx="${WIDTH + 110}" cy="10" r="8" fill="${BRASS}"/>` +
            `<path d="M6 10H14M${WIDTH + 106} 10H${WIDTH + 114}" stroke="${INK}" stroke-opacity=".6" stroke-width="1.6"/>`,
        ),
        ...tickets4.flatMap((s, i) => [
          hung(
            art(
              `d_taarucha_timeline_ticket${i + 1}`,
              at(s, 370, 386, 386),
              ticket(386, 386, 116, [CLARET, ULTRA, BRASS, INK][i]!),
            ),
            10,
            22,
            0.18,
          ),
          art(`d_taarucha_timeline_clip${i + 1}`, at(s + 163, 336, 60, 44), clip),
        ]),
        tag('d_taarucha_timeline_note_tag', at(START, 828, 14, 14)),
        ...foot('timeline').decorations,
      ],
    },
    {
      id: 'l_taarucha_process',
      name: 'Process',
      archetype: 'process',
      placeholders: [
        ...head('process', 1100).placeholders,
        ...rooms5.flatMap((s, i) => [
          // The room's figure, in the room: a step's number, or a week, a share, a day.
          place(`p_room${i + 1}`, 'number', at(s, 326, WIDTH / 5, 76), 'title', {
            align: 'center',
            vAlign: 'middle',
            color: token('primary'),
          }),
          place(`p_step${i + 1}`, 'subtitle', at(s + 14, 576, WIDTH / 5 - 28, 52), 'heading', {
            align: 'center',
          }),
          place(`p_step${i + 1}_caption`, 'caption', at(s + 14, 632, WIDTH / 5 - 28, 104), 'caption', {
            align: 'center',
          }),
        ]),
        place('p_note', 'body', at(START + 124, 770, WIDTH - 172, 96), 'body', { vAlign: 'middle' }),
        ...foot('process').placeholders,
      ],
      decorations: [
        ...head('process', 1100).decorations,
        rail('d_taarucha_process_rail'),
        hung(art('d_taarucha_process_plan', at(START, 302, WIDTH, 240), floorPlan(WIDTH, 240, 168)), 8, 20, 0.12),
        card('d_taarucha_process_legend', at(START, 756, WIDTH, 124)),
        art(
          'd_taarucha_process_key',
          at(START + 30, 790, 64, 56),
          `<path d="M60 28H12" stroke="${CLARET}" stroke-width="4" stroke-dasharray="3 9" stroke-linecap="round"/>` +
            `<path d="M18 17L6 28L18 39" stroke="${CLARET}" stroke-width="4" stroke-linecap="round" stroke-linejoin="round"/>`,
        ),
        ...foot('process').decorations,
      ],
    },
    {
      id: 'l_taarucha_comparison',
      name: 'Comparison',
      archetype: 'comparison',
      placeholders: [
        ...head('comparison', 1100).placeholders,
        ...(
          [
            ['before', at(START, 300, 788, 530)],
            ['after', atEnd(END, 300, 788, 530)],
          ] as const
        ).flatMap(([side, f]) => [
          place(`p_${side}_label`, 'caption', { x: f.x + 40, y: f.y + 300, w: 708, h: 34 }, 'caption', {
            color: side === 'after' ? token('primary') : token('muted'),
          }),
          place(`p_${side}_title`, 'subtitle', { x: f.x + 40, y: f.y + 338, w: 708, h: 52 }, 'heading'),
          place(`p_${side}_body`, 'body', { x: f.x + 40, y: f.y + 396, w: 708, h: 106 }, 'body'),
        ]),
        ...foot('comparison').placeholders,
      ],
      decorations: [
        ...head('comparison', 1100).decorations,
        rail('d_taarucha_comparison_rail'),
        card('d_taarucha_comparison_before', at(START, 300, 788, 530)),
        card('d_taarucha_comparison_after', atEnd(END, 300, 788, 530)),
        art('d_taarucha_comparison_crowded', at(START + 30, 324, 728, 252), crowdedWall(728, 252)),
        art('d_taarucha_comparison_calm', atEnd(END + 30, 324, 728, 252), calmWall(728, 252)),
        art(
          'd_taarucha_comparison_arrow',
          atEnd(END + 800, 418, 64, 64),
          `<circle cx="32" cy="32" r="30" fill="${CLARET}"/><path d="M44 32H20M29 22L19 32L29 42" stroke="${WHITE}" stroke-width="3.4" stroke-linecap="round" stroke-linejoin="round"/>`,
        ),
        ...foot('comparison').decorations,
      ],
    },
    {
      id: 'l_taarucha_chart',
      name: 'Chart',
      archetype: 'chart',
      placeholders: [
        ...head('chart', 1080).placeholders,
        place('p_chart', 'chart', at(START + 40, 326, 980, 470)),
        place('p_source', 'caption', at(START + 40, 804, 980, 70), 'caption'),
        place('p_figure1', 'number', atEnd(END, 300, 470, 134), 'display', {
          color: token('primary'),
        }),
        place('p_figure1_body', 'body', atEnd(END, 436, 470, 118), 'body'),
        place('p_figure2', 'number', atEnd(END, 594, 470, 134), 'display', {
          color: token('secondary'),
        }),
        place('p_figure2_body', 'body', atEnd(END, 730, 470, 118), 'body'),
        ...foot('chart').placeholders,
      ],
      decorations: [
        ...head('chart', 1080).decorations,
        rail('d_taarucha_chart_rail'),
        card('d_taarucha_chart_panel', at(START, 300, 1060, 584)),
        rect('d_taarucha_chart_band', at(START, 300, 1060, 8), solid(token('primary'))),
        art('d_taarucha_chart_tape', atEnd(END + 508, 280, 40, 604), tape(40, 604)),
        rect('d_taarucha_chart_rule', atEnd(END, 574, 470, 1.5), solid(token('text', 0.16))),
        ...foot('chart').decorations,
      ],
    },
    {
      id: 'l_taarucha_table',
      name: 'Table',
      archetype: 'table',
      placeholders: [
        ...head('table', 1200).placeholders,
        place('p_table', 'table', at(START + 40, 330, WIDTH - 80, 480)),
        place('p_note', 'caption', at(START + 30, 876, 1400, 34), 'caption'),
        ...foot('table').placeholders,
      ],
      decorations: [
        ...head('table', 1200).decorations,
        rail('d_taarucha_table_rail'),
        art('d_taarucha_table_books', atEnd(END + 20, 206, 240, 96), catalogues(240, 96)),
        card('d_taarucha_table_panel', at(START, 302, WIDTH, 548)),
        rect('d_taarucha_table_band', at(START, 302, WIDTH, 8), solid(token('primary'))),
        tag('d_taarucha_table_note_tag', at(START, 886, 14, 14)),
        ...foot('table').decorations,
      ],
    },
    {
      id: 'l_taarucha_team',
      name: 'Team',
      archetype: 'team',
      placeholders: [
        ...head('team', 1100).placeholders,
        ...team4.flatMap((s, i) => [
          place(
            `p_photo${i + 1}`,
            'image',
            inside(at(s + 30, 316, portrait.w, portrait.h), portraitWindow),
          ),
          place(`p_department${i + 1}`, 'caption', at(s + 30, 712, 350, 34), 'caption', {
            color: token('primary'),
          }),
          place(`p_name${i + 1}`, 'subtitle', at(s + 30, 748, 350, 52), 'heading'),
          place(`p_role${i + 1}`, 'body', at(s + 30, 802, 350, 104), 'body'),
        ]),
        ...foot('team').placeholders,
      ],
      decorations: [
        ...head('team', 1100).decorations,
        rail('d_taarucha_team_rail'),
        ...team4.flatMap((s, i) => [
          pool(`d_taarucha_team_light${i + 1}`, at(s - 10, 286, 400, 360), 0.7),
          framed(`d_taarucha_team_frame${i + 1}`, at(s + 30, 316, portrait.w, portrait.h), portraitLook),
          art(`d_taarucha_team_lamp${i + 1}`, at(s + 110, 268, 160, 60), pictureLight(160)),
          rect(`d_taarucha_team_rule${i + 1}`, at(s + 30, 700, 48, 3), solid(token('accent'))),
        ]),
        ...foot('team').decorations,
      ],
    },
    {
      id: 'l_taarucha_closing',
      name: 'Closing',
      archetype: 'closing',
      placeholders: [
        place('p_kicker', 'caption', at(START + 30, 248, 760, 34), 'caption', {
          color: token('surface', 0.8),
        }),
        place('p_title', 'title', at(START, 292, 820, 252), 'display', {
          color: token('surface'),
        }),
        ...[0, 1, 2].map((i) =>
          place(`p_line${i + 1}`, 'body', at(START + 58, 578 + i * 80, 760, 72), 'body', {
            vAlign: 'top',
            color: token('surface'),
          }),
        ),
        place('p_meta', 'caption', at(START + 30, 850, 760, 34), 'caption', {
          color: token('surface', 0.72),
        }),
      ],
      decorations: [
        ...paintedWall('closing', 'primary'),
        pool('d_taarucha_closing_light', atEnd(70, 96, 760, 820), 0.3),
        rail('d_taarucha_closing_rail'),
        floor('d_taarucha_closing_floor', 960),
        art('d_taarucha_closing_lamp', atEnd(170 + 180, 116, 200, 60), pictureLight(200)),
        framed(
          'd_taarucha_closing_work',
          closingWork,
          closingLook,
          colourField(closingWindow.w, closingWindow.h, BRASS, ULTRA, CLARET) +
            `<circle cx="${r1(closingWindow.w * 0.5)}" cy="${r1(closingWindow.h * 0.33)}" r="${r1(closingWindow.w * 0.17)}" fill="${WHITE}" fill-opacity=".55"/>`,
        ),
        art('d_taarucha_closing_bench', atEnd(190, 886, 520, 86), bench(520, 86)),
        tag('d_taarucha_closing_tag', at(START, 258, 14, 14), true),
        ...[0, 1, 2].map((i) =>
          art(`d_taarucha_closing_icon${i + 1}`, at(START, 582 + i * 80, 34, 34), CLOSING_ICONS[i]!),
        ),
        tag('d_taarucha_closing_meta_tag', at(START, 860, 14, 14), true),
        mark('d_taarucha_closing_mark', at(START, 108, 48, 48)),
      ],
    },
  ];
}

/**
 * The layouts of a left-to-right deck: the mirrors, with the drawings that must not be seen
 * mirrored (the figures, the quotation mark) moved across as they are.
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
// The sample: the press and patrons' preview of a museum's rehung collection wing

const TABLE_COLS = [200, 520, 260, 300, 304];
const TABLE_ROW = 80;
/** Works on view by period of making, oldest first: before the closure, and from April 2027. */
const BEFORE = [140, 150, 130, 70, 30];
const AFTER = [190, 220, 286, 260, 224];

/** A text of one line, or of the lines it is given. */
const lines = (value: string | string[]) => text(...(Array.isArray(value) ? value : [value]));

/**
 * The leading of the titles and the quote where a script needs more than the theme's: the
 * vowel signs above and below Devanagari meet across lines set as tight as Latin display type,
 * and the tall letters and deep tails of Arabic (Amiri, Bellefair's counterpart) touch the line
 * above and the kicker. The display titles of the opening, a part and the closing, and every
 * other title. Two display lines at 1.16 just fill the 252px boxes of the opening and closing.
 */
const LEADING: Partial<
  Record<ContentLanguage, { display: number; title: number; subtitle: number }>
> = {
  hi: { display: 1.16, title: 1.32, subtitle: 1.42 },
  ar: { display: 1.16, title: 1.3, subtitle: 1.3 },
};
const DISPLAYED = new Set(['l_taarucha_hero', 'l_taarucha_section', 'l_taarucha_closing']);

/** The sample deck in one language, from its copy. */
function sample(copy: TaaruchaCopy, lang: ContentLanguage): SampleSlide[] {
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

function drawSample(copy: TaaruchaCopy): SampleSlide[] {
  const footer = text(copy.footer);
  return [
    {
      layout: 'l_taarucha_hero',
      name: copy.hero.name,
      content: {
        caption: [text(copy.hero.org), text(copy.hero.meta)],
        title: text(...copy.hero.title),
        subtitle: text(...copy.hero.subtitle),
        image: { assetId: pictures.painting.id },
      },
    },
    {
      layout: 'l_taarucha_section',
      name: copy.section.name,
      content: {
        number: text('01'),
        caption: text(copy.section.part),
        title: text(...copy.section.title),
        subtitle: lines(copy.section.subtitle),
      },
    },
    {
      layout: 'l_taarucha_text',
      name: copy.agenda.name,
      content: {
        title: lines(copy.agenda.title),
        body: {
          paragraphs: [
            ...lines(copy.agenda.intro).paragraphs.map((p, i, all) =>
              i === all.length - 1 ? { ...p, spaceAfter: 44 } : p,
            ),
            ...points(copy.agenda.items, { kind: 'number', mark: token('primary'), gap: 30 })
              .paragraphs,
          ],
        },
      },
    },
    {
      layout: 'l_taarucha_big_number',
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
        body: lines(copy.figures.hero.note),
        footer,
      },
    },
    {
      layout: 'l_taarucha_text_image',
      name: copy.studio.name,
      content: {
        caption: text(copy.studio.kicker),
        title: lines(copy.studio.title),
        image: { assetId: pictures.studio.id },
        subtitle: copy.studio.items.map(([title]) => text(title)),
        body: copy.studio.items.map(([, body]) => text(body)),
        footer,
      },
    },
    {
      layout: 'l_taarucha_full_image',
      name: copy.gallery.name,
      content: {
        image: { assetId: pictures.gallery.id },
        caption: text(copy.gallery.place),
        title: text(...copy.gallery.title),
        body: lines(copy.gallery.body),
      },
    },
    {
      layout: 'l_taarucha_quote',
      name: copy.quote.name,
      content: {
        quote: lines(copy.quote.text),
        attribution: text(copy.quote.who),
        caption: text(copy.quote.role),
        footer,
      },
    },
    {
      layout: 'l_taarucha_cards',
      name: copy.visits.name,
      content: {
        caption: [text(copy.visits.kicker), ...copy.visits.cards.map(([label]) => text(label))],
        title: lines(copy.visits.title),
        subtitle: copy.visits.cards.map(([, title]) => text(title)),
        body: [...copy.visits.cards.map(([, , body]) => lines(body)), text(copy.visits.note)],
        footer,
      },
    },
    {
      layout: 'l_taarucha_timeline',
      name: copy.year.name,
      content: {
        caption: [text(copy.year.kicker), text(copy.year.note)],
        title: lines(copy.year.title),
        number: copy.year.stops.map(([when]) => text(when)),
        subtitle: copy.year.stops.map(([, title]) => text(title)),
        body: copy.year.stops.map(([, , body]) => lines(body)),
        footer,
      },
    },
    {
      layout: 'l_taarucha_process',
      name: copy.journey.name,
      content: {
        caption: [
          text(copy.journey.kicker),
          ...copy.journey.steps.map(([, caption]) => lines(caption)),
        ],
        title: lines(copy.journey.title),
        number: copy.journey.steps.map((_, i) => text(String(i + 1))),
        subtitle: copy.journey.steps.map(([step]) => text(step)),
        body: text(copy.journey.note),
        footer,
      },
    },
    {
      layout: 'l_taarucha_comparison',
      name: copy.rehang.name,
      content: {
        caption: [
          text(copy.rehang.kicker),
          text(copy.rehang.before[0]),
          text(copy.rehang.after[0]),
        ],
        title: lines(copy.rehang.title),
        subtitle: [text(copy.rehang.before[1]), text(copy.rehang.after[1])],
        body: [text(copy.rehang.before[2]), text(copy.rehang.after[2])],
        footer,
      },
    },
    {
      layout: 'l_taarucha_chart',
      name: copy.onView.name,
      content: {
        caption: [text(copy.onView.kicker), text(copy.onView.source)],
        title: lines(copy.onView.title),
        number: copy.onView.figures.map(([value]) => text(value)),
        body: copy.onView.figures.map(([, body]) => text(body)),
        footer,
      },
      chart: {
        chartType: 'column',
        data: {
          categories: copy.onView.periods,
          series: [
            { name: copy.onView.series[0], values: BEFORE },
            { name: copy.onView.series[1], values: AFTER },
          ],
        },
      },
    },
    {
      layout: 'l_taarucha_table',
      name: copy.rooms.name,
      content: {
        caption: [text(copy.rooms.kicker), text(copy.rooms.note)],
        title: lines(copy.rooms.title),
        footer,
      },
      table: {
        cols: TABLE_COLS,
        rowHeight: TABLE_ROW,
        rows: [copy.rooms.header, ...copy.rooms.rows],
      },
    },
    {
      layout: 'l_taarucha_team',
      name: copy.team.name,
      content: {
        caption: [text(copy.team.kicker), ...copy.team.people.map(([department]) => text(department))],
        title: lines(copy.team.title),
        image: pictures.team.map((p) => ({ assetId: p.id })),
        subtitle: copy.team.people.map(([, name]) => text(name)),
        body: copy.team.people.map(([, , role]) => lines(role)),
        footer,
      },
    },
    {
      layout: 'l_taarucha_closing',
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
export const taaruchaSamples = Object.fromEntries(
  CONTENT_LANGUAGES.filter((lang) => TAARUCHA_COPY[lang]).map((lang) => [
    lang,
    sample(TAARUCHA_COPY[lang]!, lang),
  ]),
) as Localized<SampleSlide[]>;

/** The Exhibit template: the theme, its layouts for both directions, and its sample deck. */
export function taaruchaTemplate(): Template {
  const drawn = layouts();
  const template: Template = {
    theme: copyJson(taaruchaTheme),
    description:
      'A museum exhibition: gallery walls under a brass picture rail, a claret entrance wall with a salon hang lit by track spots, framed works with white mats, plinths, admission tickets, a floor plan and a portrait gallery.',
    dir: 'rtl',
    layouts: drawn,
    flipped: flipped(drawn),
    assets: assetTable([pictures.painting, pictures.studio, pictures.gallery, ...pictures.team]),
  };
  // What makes up a slide is the slide's own, and the user changes it (ADR-094).
  const finished = withObjects(template);
  finished.sample = sampleSlides(finished, taaruchaSamples.he);
  return finished;
}

export const entry = { id: 'taarucha', template: taaruchaTemplate, samples: taaruchaSamples };
