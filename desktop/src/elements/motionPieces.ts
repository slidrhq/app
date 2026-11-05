import type { LineElement, LineFlow } from '@slidr/model';
import {
  circlePath,
  ellipsePath,
  INK,
  num,
  picture,
  polylineLength,
  polylinePath,
  random,
  runningLight,
  smoothPath,
  travelling,
  withRootAttribute,
  type Pt,
} from './motionKit';

/*
 * The animations of Elements (ADR-127): drawings that move by themselves, each put on a slide as
 * an object of its own that moves, resizes and turns as any other. Some are a shape that moves
 * (a dot on a path, a line, a polygon, a circle), some are not one shape (waves, particles, a
 * network). The pieces in the reference deck's slides (`tests/import/מצגת רפרנס.html`) are among
 * them: the orbit around a hub, and the boxes that ride a dashed path.
 *
 * Most are pictures. Those that are a line with something running along it (ADR-131), the boxes
 * on a path and the flowing connector, are lines of the deck: their ends and bends are dragged
 * as any line's, with no box around them, and the flow follows the line wherever it goes.
 */

export const MOTION_GROUPS = ['path', 'spin', 'scale', 'lines', 'particles'] as const;
export type MotionGroup = (typeof MOTION_GROUPS)[number];

interface PieceBase {
  id: string;
  group: MotionGroup;
  /** The units of the drawing, and the size it lands on a slide at, in slide pixels. */
  size: { w: number; h: number };
  /**
   * Whether it runs from one side to the other, as an arrow does: drawn from left to right, and
   * mirrored in a deck that reads from the right, as a new line is.
   */
  reads: boolean;
}

/** A picture that moves by itself: an `svg` element (ADR-127). */
export interface PicturePiece extends PieceBase {
  kind: 'picture';
  markup: string;
}

/** What a line of the deck is drawn with, and what runs along it (ADR-131). */
export type LineShape = Pick<
  LineElement,
  'points' | 'stroke' | 'startHead' | 'endHead' | 'curve'
> & { flow: LineFlow };

/** A line that something runs along: a `line` element with a flow (ADR-131). */
export interface LinePiece extends PieceBase {
  kind: 'line';
  /** Its points in the units of `size`, from left to right. */
  line: LineShape;
}

export type MotionPiece = PicturePiece | LinePiece;

const { primary: P, secondary: S, accent: A, text: T, surface: U, bg: B } = INK;

/** Turning about a point, for a class of the stylesheet. */
const turning = (name: string, seconds: number, cx: number, cy: number, reverse = false) =>
  `.${name}{transform-origin:${cx}px ${cy}px;animation:turn ${seconds}s linear infinite${reverse ? ' reverse' : ''}}`;
const TURN = '@keyframes turn{to{transform:rotate(360deg)}}';

/* ---------------------------------------------------------------- along a path */

/** A hub with a dashed orbit and dots that go around it: the reference deck's hub. */
function orbit(): string {
  const css =
    turning('a', 36, 200, 200) +
    turning('b', 70, 200, 200, true) +
    '.h{transform-origin:200px 200px;animation:glow 4s ease-in-out infinite}' +
    TURN +
    '@keyframes glow{50%{transform:scale(1.14);opacity:.45}}';
  const body =
    `<circle class="b" cx="200" cy="200" r="178" fill="none" stroke="${S}" stroke-opacity=".45" stroke-width="2.5" stroke-dasharray="2 12" stroke-linecap="round"/>` +
    `<circle class="a" cx="200" cy="200" r="128" fill="none" stroke="${A}" stroke-width="3" stroke-dasharray="12 12" stroke-linecap="round"/>` +
    `<circle class="h" cx="200" cy="200" r="100" fill="${P}" fill-opacity=".14"/>` +
    `<circle cx="200" cy="200" r="74" fill="${T}"/>` +
    `<circle cx="200" cy="200" r="30" fill="none" stroke="${U}" stroke-opacity=".9" stroke-width="6"/>` +
    `<circle cx="200" cy="200" r="10" fill="${A}"/>` +
    travelling({
      shape: `<circle r="13" fill="${A}" stroke="${B}" stroke-width="4"/>`,
      path: circlePath(200, 200, 128),
      dur: 8,
      into: 1,
    }) +
    travelling({
      shape: `<circle r="10" fill="${S}" stroke="${B}" stroke-width="3"/>`,
      path: circlePath(200, 200, 178),
      dur: 14,
      into: 9,
      back: true,
    }) +
    travelling({
      shape: `<circle r="7" fill="${S}" stroke="${B}" stroke-width="3"/>`,
      path: circlePath(200, 200, 178),
      dur: 14,
      into: 2,
      back: true,
    });
  return picture(400, 400, body, css);
}

/**
 * Boxes that ride a dashed path: the reference deck's "floor to AI", the line alone, without the
 * nodes at its ends, so it can join whatever the slide puts there. A curved line from the bottom
 * on one side to the top on the other, its dashes and its boxes moving up it together.
 */
function conveyor(): LineShape {
  return {
    points: [
      { x: 0, y: 160 },
      { x: 380, y: 0 },
    ],
    stroke: { color: { token: 'secondary' }, width: 3.5, dash: 'dashed', cap: 'round' },
    startHead: 'none',
    endHead: 'none',
    curve: 'curved',
    flow: { speed: 90, rider: 'box', count: 4, color: { token: 'text' } },
  };
}

/** A circuit trace: lights with a trail run from a node to a chip. */
function trace(): string {
  const points: Pt[] = [
    { x: 30, y: 160 },
    { x: 150, y: 160 },
    { x: 150, y: 96 },
    { x: 290, y: 96 },
    { x: 290, y: 150 },
    { x: 410, y: 150 },
    { x: 410, y: 70 },
    { x: 512, y: 70 },
  ];
  const d = polylinePath(points);
  const length = polylineLength(points);
  const layers = [
    [96, 3, 0.2],
    [38, 5, 0.5],
    [0.5, 12, 1],
  ] as const;
  const corners = points
    .slice(1, -1)
    .map(
      (p) => `<circle cx="${p.x}" cy="${p.y}" r="6" fill="${B}" stroke="${P}" stroke-width="3"/>`,
    )
    .join('');
  const body =
    `<path d="${d}" fill="none" stroke="${P}" stroke-opacity=".28" stroke-width="3.5" stroke-linejoin="round"/>` +
    runningLight({ path: d, length, stroke: P, layers, dur: 3.2, into: 0.9 }) +
    runningLight({ path: d, length, stroke: P, layers, dur: 3.2, into: 2.5 }) +
    corners +
    `<circle cx="30" cy="160" r="13" fill="${P}"/>` +
    `<circle cx="30" cy="160" r="5" fill="${U}"/>` +
    `<rect x="508" y="44" width="52" height="52" rx="12" fill="${P}"/>` +
    `<rect x="524" y="60" width="20" height="20" rx="4" fill="${U}" fill-opacity=".9"/>`;
  return picture(580, 220, body);
}

/** Three orbits at angles to each other, each with its electron, around a nucleus. */
function atom(): string {
  const path = ellipsePath(200, 200, 172, 62);
  const ring = (angle: number, colour: string, dur: number, into: number) =>
    `<g transform="rotate(${angle} 200 200)">` +
    `<path d="${path}" fill="none" stroke="${T}" stroke-opacity=".22" stroke-width="2.5"/>` +
    travelling({
      shape: `<circle r="12" fill="${colour}" stroke="${B}" stroke-width="3.5"/>`,
      path,
      dur,
      into,
    }) +
    '</g>';
  const css = turning('w', 48, 200, 200) + TURN;
  const body =
    '<g class="w">' +
    ring(0, A, 3.6, 0.4) +
    ring(60, S, 4.4, 2.6) +
    ring(120, P, 5.2, 1.3) +
    '</g>' +
    `<circle cx="200" cy="200" r="38" fill="${P}"/>` +
    `<circle cx="187" cy="187" r="13" fill="${U}" fill-opacity=".35"/>`;
  return picture(400, 400, body, css);
}

/** A knob that glides along a track and back, filling it as it goes. */
function shuttle(): string {
  const ease = 'cubic-bezier(.65,0,.35,1)';
  const css =
    `.k{animation:glide 2.8s ${ease} infinite alternate}` +
    `.p{animation:fill 2.8s ${ease} infinite alternate}` +
    '@keyframes glide{from{transform:translateX(0)}to{transform:translateX(460px)}}' +
    '@keyframes fill{from{stroke-dashoffset:100}to{stroke-dashoffset:0}}';
  const body =
    `<path d="M50 70H510" stroke="${T}" stroke-opacity=".14" stroke-width="12" stroke-linecap="round"/>` +
    `<path class="p" d="M50 70H510" pathLength="100" stroke="${P}" stroke-width="12" stroke-linecap="round" stroke-dasharray="100 100" stroke-dashoffset="100"/>` +
    `<g class="k"><circle cx="50" cy="70" r="40" fill="${P}" fill-opacity=".15"/>` +
    `<circle cx="50" cy="70" r="24" fill="${P}" stroke="${B}" stroke-width="6"/></g>`;
  return picture(560, 140, body, css);
}

/* ---------------------------------------------------------------- turning */

function polygon(sides: number, cx: number, cy: number, r: number, start = -90): Pt[] {
  return Array.from({ length: sides }, (_, i) => {
    const a = ((start + (360 * i) / sides) * Math.PI) / 180;
    return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) };
  });
}

const points = (list: readonly Pt[]) => list.map((p) => `${num(p.x)},${num(p.y)}`).join(' ');

/** Hexagons inside each other, turning each its own way. */
function hexagon(): string {
  const outer = polygon(6, 200, 200, 176);
  const css =
    turning('a', 30, 200, 200) +
    turning('b', 18, 200, 200, true) +
    turning('c', 12, 200, 200) +
    TURN;
  const body =
    `<g class="a"><polygon points="${points(outer)}" fill="none" stroke="${P}" stroke-width="4" stroke-linejoin="round"/>` +
    outer
      .map(
        (p) =>
          `<circle cx="${num(p.x)}" cy="${num(p.y)}" r="10" fill="${A}" stroke="${B}" stroke-width="3.5"/>`,
      )
      .join('') +
    '</g>' +
    `<polygon class="b" points="${points(polygon(6, 200, 200, 124, 0))}" fill="${P}" fill-opacity=".1" stroke="${S}" stroke-width="3" stroke-dasharray="14 10" stroke-linejoin="round"/>` +
    `<polygon class="c" points="${points(polygon(6, 200, 200, 62))}" fill="${P}" stroke-linejoin="round"/>` +
    `<circle cx="200" cy="200" r="17" fill="${B}"/>`;
  return picture(400, 400, body, css);
}

/** Dashed rings around a centre, each turning at its own speed: a dial at work. */
function rings(): string {
  const css =
    turning('a', 70, 200, 200) +
    turning('b', 16, 200, 200) +
    turning('c', 10, 200, 200, true) +
    turning('d', 3.2, 200, 200) +
    TURN;
  const ring = (cls: string, r: number, colour: string, width: number, dash: string, op = 1) =>
    `<circle class="${cls}" cx="200" cy="200" r="${r}" fill="none" stroke="${colour}"${op < 1 ? ` stroke-opacity="${op}"` : ''} stroke-width="${width}" stroke-dasharray="${dash}" stroke-linecap="round"/>`;
  const body =
    ring('a', 182, T, 3, '1 11', 0.3) +
    ring('b', 150, P, 7, '150 50 24 50') +
    ring('c', 116, A, 5, '40 22') +
    ring('d', 82, S, 11, '170 345') +
    `<circle cx="200" cy="200" r="50" fill="${P}" fill-opacity=".14"/>` +
    `<circle cx="200" cy="200" r="16" fill="${P}"/>`;
  return picture(400, 400, body, css);
}

/**
 * A sweep that goes round a radar, its fading trail behind it, and blips that light up as it
 * passes over them (the reference deck's `radar`).
 */
function radarBody(cx: number, cy: number, R: number, period: number, seed: number, blips: number) {
  const rng = random(seed);
  const rings = [0.25, 0.5, 0.75, 1]
    .map(
      (m) =>
        `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(R * m)}" fill="none" stroke="${P}" stroke-opacity=".22" stroke-width="1.5"/>`,
    )
    .join('');
  const spokes = Array.from({ length: 12 }, (_, i) => {
    const a = (i / 12) * Math.PI * 2;
    return `M${num(cx)} ${num(cy)}L${num(cx + Math.cos(a) * R)} ${num(cy + Math.sin(a) * R)}`;
  }).join('');
  // The sweep points up at the start and turns clockwise; its trail is behind it.
  const wedge = (from: number, to: number) => {
    const [a, b] = [((from - 90) * Math.PI) / 180, ((to - 90) * Math.PI) / 180];
    return `M${num(cx)} ${num(cy)}L${num(cx + Math.cos(a) * R)} ${num(cy + Math.sin(a) * R)}A${num(R)} ${num(R)} 0 0 1 ${num(cx + Math.cos(b) * R)} ${num(cy + Math.sin(b) * R)}Z`;
  };
  const trail = Array.from(
    { length: 14 },
    (_, i) =>
      `<path d="${wedge(-3 * (i + 1), -3 * i)}" fill="${P}" fill-opacity="${num(0.2 * (1 - i / 14), 3)}"/>`,
  ).join('');
  const sweep =
    `<g class="sw">${trail}` +
    `<path d="M${num(cx)} ${num(cy)}V${num(cy - R)}" stroke="${P}" stroke-opacity=".75" stroke-width="2.5" stroke-linecap="round"/></g>`;
  const dots = Array.from({ length: blips }, () => {
    const angle = rng() * 360;
    const distance = (0.18 + rng() * 0.78) * R;
    const a = ((angle - 90) * Math.PI) / 180;
    const [x, y] = [cx + Math.cos(a) * distance, cy + Math.sin(a) * distance];
    // Lit as the sweep reaches it: that moment of the round is the start of its own.
    const delay = `${num((angle / 360) * period - period, 2)}s`;
    return (
      `<circle class="bl" cx="${num(x)}" cy="${num(y)}" r="8" fill="${P}" style="animation-delay:${delay}"/>` +
      `<circle class="pg" cx="${num(x)}" cy="${num(y)}" r="20" fill="none" stroke="${P}" stroke-width="2" style="animation-delay:${delay}"/>`
    );
  }).join('');
  const css =
    `.sw{transform-origin:${num(cx)}px ${num(cy)}px;animation:turn ${period}s linear infinite}` +
    `.bl{transform-box:fill-box;transform-origin:center;animation:blip ${period}s ease-out infinite both}` +
    `.pg{transform-box:fill-box;transform-origin:center;animation:ping ${period}s ease-out infinite both}` +
    TURN +
    '@keyframes blip{0%{transform:scale(1);opacity:.95}35%,100%{transform:scale(.4);opacity:.2}}' +
    '@keyframes ping{0%{transform:scale(.4);opacity:.6}30%,100%{transform:scale(1.1);opacity:0}}';
  const body =
    `<circle cx="${num(cx)}" cy="${num(cy)}" r="${num(R)}" fill="${P}" fill-opacity=".05"/>` +
    rings +
    `<path d="${spokes}" stroke="${P}" stroke-opacity=".14" stroke-width="1.5"/>` +
    sweep +
    dots;
  return { body, css };
}

function radar(): string {
  const { body, css } = radarBody(200, 200, 186, 4, 7, 7);
  return picture(400, 400, body, css);
}

/* ---------------------------------------------------------------- growing */

/** Rings that spread from a point and fade: a place that calls for attention. */
function ripple(): string {
  const ring = (into: number) =>
    `<circle cx="200" cy="200" r="30" fill="none" stroke="${P}" stroke-width="4">` +
    `<animate attributeName="r" values="30;188" dur="3.3s" begin="${num(-into, 2)}s" calcMode="spline" keyTimes="0;1" keySplines=".2 .6 .35 1" repeatCount="indefinite"/>` +
    `<animate attributeName="stroke-opacity" values=".9;0" dur="3.3s" begin="${num(-into, 2)}s" calcMode="spline" keyTimes="0;1" keySplines=".3 .1 .7 1" repeatCount="indefinite"/>` +
    '</circle>';
  const body =
    ring(0.2) +
    ring(1.3) +
    ring(2.4) +
    `<circle cx="200" cy="200" r="34" fill="${P}"/>` +
    `<circle cx="200" cy="200" r="12" fill="${U}"/>`;
  return picture(400, 400, body);
}

/** A soft shape that breathes: it swells, changes its outline and turns slowly. */
function breathe(): string {
  const outline = (seed: number, R: number) => {
    const rng = random(seed);
    const pts = Array.from({ length: 8 }, (_, i) => {
      const a = (i / 8) * Math.PI * 2;
      const r = R * (0.86 + rng() * 0.26);
      return { x: 200 + Math.cos(a) * r, y: 200 + Math.sin(a) * r };
    });
    return smoothPath(pts, true);
  };
  const morph = (seeds: number[], R: number, dur: number) => {
    const shapes = seeds.map((seed) => outline(seed, R));
    return `<animate attributeName="d" values="${[...shapes, shapes[0]].join(';')}" dur="${dur}s" calcMode="spline" keyTimes="0;.33;.67;1" keySplines=".45 0 .55 1;.45 0 .55 1;.45 0 .55 1" repeatCount="indefinite"/>`;
  };
  const css =
    turning('w', 40, 200, 200) +
    '.s{transform-origin:200px 200px;animation:swell 6s ease-in-out infinite}' +
    TURN +
    '@keyframes swell{50%{transform:scale(1.07)}}';
  const body =
    '<defs><linearGradient id="g" x1="0" y1="0" x2="1" y2="1">' +
    `<stop offset="0" stop-color="${P}" stop-opacity=".55"/><stop offset="1" stop-color="${P}"/></linearGradient></defs>` +
    '<g class="w"><g class="s">' +
    `<path d="${outline(11, 158)}" fill="url(#g)">${morph([11, 12, 13], 158, 9)}</path>` +
    `<path d="${outline(21, 64)}" transform="translate(78 -74)" fill="${A}" fill-opacity=".92">${morph([21, 22, 23], 64, 7)}</path>` +
    '</g></g>';
  return picture(400, 400, body, css);
}

/** Bars that rise and fall each in its own time: growth in motion. */
function bars(): string {
  const heights = [104, 150, 128, 186, 226];
  const base = 262;
  const low = 0.42;
  const body =
    heights
      .map((h, i) => {
        const fill = i === heights.length - 1 ? A : P;
        // Their height, not a scale: a scaled bar would squash its round corners.
        const timing = `dur="4.8s" begin="${num(-0.45 * (heights.length - i), 2)}s" calcMode="spline" keyTimes="0;.5;1" keySplines=".45 0 .55 1;.45 0 .55 1" repeatCount="indefinite"`;
        const short = h * low;
        return (
          `<rect x="${48 + i * 66}" y="${base - h}" width="44" height="${h}" rx="11" fill="${fill}">` +
          `<animate attributeName="height" values="${num(short)};${h};${num(short)}" ${timing}/>` +
          `<animate attributeName="y" values="${num(base - short)};${base - h};${num(base - short)}" ${timing}/></rect>`
        );
      })
      .join('') +
    `<path d="M30 268H400" stroke="${T}" stroke-opacity=".3" stroke-width="4" stroke-linecap="round"/>`;
  return picture(430, 300, body);
}

/* ---------------------------------------------------------------- lines and waves */

/**
 * A wave through `y` from `x0` to at least `x1`, `wave` units long and `amp` units up and down,
 * going down at `x0` as a sine does. Each quarter of it is one curve between its ends with the
 * slope the sine has at each, the quarters after the first as `s` relative to the last: a wave
 * however long stays short, and its ends fall on round numbers, so no rounding adds up along it.
 */
function sine(x0: number, x1: number, y: number, wave: number, amp: number): string {
  const q = wave / 4;
  const h = num((2 * q) / 3);
  // A third of a quarter at the slope the wave has where it crosses `y`.
  const k = (amp * Math.PI) / 6;
  // From the bottom of a wave (the first quarter goes down to one): up to `y`, on up to the top,
  // down to `y`, on down to the bottom.
  const turns = [
    [h, num(k - amp), q, -amp],
    [h, -amp, q, -amp],
    [h, num(amp - k), q, amp],
    [h, amp, q, amp],
  ].map((turn) => turn.join(' '));
  const rest = Array.from({ length: Math.ceil((x1 - x0) / q) - 1 }, (_, i) => turns[i % 4]);
  return `M${num(x0)} ${num(y)}c${num(q / 3)} ${num(k)} ${h} ${amp} ${q} ${amp}s${rest.join(' ')}`.replaceAll(
    ' -',
    '-',
  );
}

/**
 * How far past each side of the drawing of `waves` its lines run, in its units. A frame made
 * wider than the drawing shows more of them: up to some 32 times as wide as it is high, they
 * reach its sides.
 */
const WAVE_REACH = 3000;

/**
 * Waves that roll by, softening into the edges: the edges of the frame, however wide it is made.
 * Their lines run far past the sides of the drawing, and a frame wider than it shows them there
 * (a picture keeps its proportions, and what is past its sides is still drawn in the frame). The
 * fade is the frame's: a mask in the picture's units would only know the drawing. It is as long
 * as the drawing has it, 16% of the width, but no longer than that is of the height where the
 * frame is wider (so the waves fill a long frame): the stylesheet reads the frame's height, the
 * frame being its container (`:host`).
 */
function waves(): string {
  const [W, H] = [560, 200];
  const lines: [wave: number, amp: number, colour: string, width: number, op: number, s: number][] =
    [
      [280, 34, P, 5, 1, 4.8],
      [210, 24, S, 4, 0.75, 3.6],
      [160, 16, A, 3.5, 0.8, 2.6],
    ];
  const fade = num((0.16 * W * 100) / H);
  const css =
    ':host{container-type:size}' +
    `.e{mask-image:linear-gradient(90deg,transparent,black min(16%,${fade}cqh),black max(84%,calc(100% - ${fade}cqh)),transparent)}` +
    lines
      .map(
        ([wave], i) =>
          `.w${i}{animation:roll${i} ${lines[i]![5]}s linear infinite}@keyframes roll${i}{to{transform:translateX(${-wave}px)}}`,
      )
      .join('');
  const body = lines
    .map(([wave, amp, colour, width, op], i) => {
      // A whole number of waves before the drawing, so it starts as it always did; and one more
      // past its end than the reach, for the wave it rolls by.
      const from = -Math.ceil(WAVE_REACH / wave) * wave;
      const d = sine(from, W + WAVE_REACH + wave, H / 2, wave, amp);
      return `<path class="w${i}" d="${d}" fill="none" stroke="${colour}" stroke-width="${width}"${op < 1 ? ` stroke-opacity="${op}"` : ''} stroke-linecap="round"/>`;
    })
    .join('');
  return picture(W, H, body, css, ' class="e"');
}

/** A swoosh that draws itself into an arrow, holds, and fades to draw again. */
function draw(): string {
  const path = 'M44 176C150 182 176 66 290 86S420 186 500 70';
  const css =
    '.l{animation:draw 4.2s cubic-bezier(.6,.05,.3,1) infinite both}' +
    '.h{animation:head 4.2s ease infinite both}' +
    '.o{animation:dot 4.2s ease infinite both}' +
    '@keyframes draw{0%{stroke-dashoffset:100;opacity:1}45%{stroke-dashoffset:0;opacity:1}82%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}' +
    '@keyframes head{0%,40%{opacity:0}50%,82%{opacity:1}100%{opacity:0}}' +
    '@keyframes dot{0%,82%{opacity:1}100%{opacity:0}}';
  // The head points along the end of the curve: from its last control point to its end.
  const angle = num((Math.atan2(70 - 186, 500 - 420) * 180) / Math.PI);
  const body =
    `<path class="l" d="${path}" pathLength="100" fill="none" stroke="${P}" stroke-width="10" stroke-linecap="round" stroke-dasharray="100 100" style="animation-delay:-2.8s"/>` +
    `<g class="h" style="animation-delay:-2.8s"><path transform="translate(500 70) rotate(${angle})" d="M-26 -18L4 0L-26 18" fill="none" stroke="${P}" stroke-width="10" stroke-linecap="round" stroke-linejoin="round"/></g>` +
    `<circle class="o" cx="44" cy="176" r="13" fill="${A}" style="animation-delay:-2.8s"/>`;
  return picture(560, 230, body, css);
}

/** A connector whose dashes flow toward its arrow: an arc from a dot to a head. */
function flowArrow(): LineShape {
  return {
    points: [
      { x: 0, y: 80 },
      { x: 220, y: 0 },
      { x: 430, y: 50 },
    ],
    stroke: { color: { token: 'secondary' }, width: 6, dash: 'dashed', cap: 'round' },
    startHead: 'circle',
    endHead: 'triangle',
    curve: 'curved',
    flow: { speed: 40 },
  };
}

/** A pulse line: a beat runs along it, bright at its head. */
function heartbeat(): string {
  const pts: Pt[] = [
    { x: 20, y: 110 },
    { x: 160, y: 110 },
    { x: 182, y: 82 },
    { x: 204, y: 136 },
    { x: 232, y: 30 },
    { x: 262, y: 180 },
    { x: 286, y: 110 },
    { x: 360, y: 110 },
    { x: 378, y: 92 },
    { x: 396, y: 110 },
    { x: 540, y: 110 },
  ];
  const d = polylinePath(pts);
  const length = polylineLength(pts);
  const body =
    `<path d="${d}" fill="none" stroke="${P}" stroke-opacity=".22" stroke-width="5" stroke-linejoin="round" stroke-linecap="round"/>` +
    runningLight({
      path: d,
      length,
      stroke: P,
      layers: [
        [150, 5, 0.3],
        [70, 6, 0.7],
        [0.5, 14, 1],
      ],
      dur: 2.4,
      into: 1.75,
    }).replaceAll('stroke-linecap="round"', 'stroke-linecap="round" stroke-linejoin="round"');
  return picture(560, 220, body);
}

/* ---------------------------------------------------------------- particles */

/** A small network: packets run along its links between the nodes. */
function network(): string {
  const nodes: (Pt & { r: number; c: string })[] = [
    { x: 80, y: 90, r: 14, c: S },
    { x: 210, y: 60, r: 10, c: P },
    { x: 350, y: 96, r: 16, c: A },
    { x: 420, y: 220, r: 11, c: P },
    { x: 280, y: 250, r: 13, c: S },
    { x: 140, y: 230, r: 10, c: P },
    { x: 240, y: 156, r: 26, c: P },
    { x: 56, y: 170, r: 8, c: A },
    { x: 400, y: 30, r: 7, c: S },
  ];
  const links: [number, number][] = [
    [0, 1],
    [1, 2],
    [2, 3],
    [3, 4],
    [4, 5],
    [5, 0],
    [6, 0],
    [6, 1],
    [6, 2],
    [6, 3],
    [6, 4],
    [6, 5],
    [0, 7],
    [7, 5],
    [2, 8],
  ];
  const line = (a: Pt, b: Pt) => `M${a.x} ${a.y}L${b.x} ${b.y}`;
  const runs: [number, number, number, number][] = [
    [0, 6, 1.6, 0],
    [6, 2, 1.4, 0.5],
    [4, 6, 1.5, 1.1],
    [6, 3, 1.3, 0.2],
    [1, 2, 1.8, 0.9],
    [5, 6, 1.4, 0.7],
    [3, 4, 1.7, 1.3],
  ];
  const body =
    `<path d="${links.map(([a, b]) => line(nodes[a]!, nodes[b]!)).join('')}" stroke="${T}" stroke-opacity=".2" stroke-width="2.5"/>` +
    runs
      .map(([a, b, dur, into]) =>
        travelling({
          shape: `<circle r="5.5" fill="${P}"/>`,
          path: line(nodes[a]!, nodes[b]!),
          dur,
          into,
          extra: `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.15;.85;1" dur="${dur}s" begin="${num(-into, 2)}s" repeatCount="indefinite"/>`,
        }),
      )
      .join('') +
    nodes
      .map(
        (n) =>
          `<circle cx="${n.x}" cy="${n.y}" r="${n.r}" fill="${n.c}" stroke="${B}" stroke-width="4"/>`,
      )
      .join('') +
    `<circle cx="240" cy="156" r="9" fill="${U}"/>`;
  return picture(480, 300, body);
}

/**
 * Particles fly in from all around, settle into two rings that turn, and fade to gather again
 * (the reference deck's `converge`, made to go round).
 */
function converge(): string {
  const rng = random(31);
  const count = 72;
  const dots = Array.from({ length: count }, (_, i) => {
    const ring = i % 3 === 0 ? 96 : 150;
    const a = (i / count) * Math.PI * 2;
    const [x, y] = [200 + Math.cos(a) * ring, 200 + Math.sin(a) * ring];
    const [fx, fy] = [rng() * 400, rng() * 400];
    const r = 2.5 + rng() * 3.5;
    const colour = i % 5 === 0 ? A : P;
    return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(r)}" fill="${colour}" style="--x:${num(fx - x)}px;--y:${num(fy - y)}px"/>`;
  }).join('');
  const ease = 'cubic-bezier(.33,1,.68,1)';
  const css =
    turning('w', 24, 200, 200) +
    `.w circle{animation:gather 7s ${ease} infinite both;animation-delay:.15s}` +
    '.h{transform-origin:200px 200px;animation:glow 7s ease infinite both;animation-delay:.15s}' +
    TURN +
    '@keyframes gather{0%{transform:translate(var(--x),var(--y));opacity:0}8%{opacity:.5}38%{transform:none;opacity:1}86%{transform:none;opacity:1}100%{transform:none;opacity:0}}' +
    '@keyframes glow{0%,20%{opacity:0;transform:scale(.6)}45%,86%{opacity:1;transform:none}100%{opacity:0}}';
  const body =
    '<defs><radialGradient id="g">' +
    `<stop offset="0" stop-color="${P}" stop-opacity=".3"/><stop offset="1" stop-color="${P}" stop-opacity="0"/></radialGradient></defs>` +
    '<circle class="h" cx="200" cy="200" r="120" fill="url(#g)"/>' +
    `<g class="w">${dots}</g>`;
  return picture(400, 400, body, css);
}

/** Bubbles that rise, sway and fade. */
function float(): string {
  const rng = random(5);
  const inks = [P, S, A];
  const bubbles = Array.from({ length: 14 }, (_, i) => {
    const r = 6 + rng() * 22;
    const x = 30 + rng() * 260;
    const dur = 5 + rng() * 5;
    const delay = -rng() * dur;
    const sway = (rng() < 0.5 ? -1 : 1) * (10 + rng() * 24);
    return (
      `<g class="s" style="--s:${num(sway)}px;animation-duration:${num(dur / 2, 2)}s;animation-delay:${num(delay, 2)}s">` +
      `<circle class="r" cx="${num(x)}" cy="${num(390 - r)}" r="${num(r)}" fill="${inks[i % 3]}" fill-opacity="${num(0.35 + rng() * 0.5, 2)}" style="animation-duration:${num(dur, 2)}s;animation-delay:${num(delay, 2)}s"/></g>`
    );
  }).join('');
  const css =
    '.r{animation:rise linear infinite both}' +
    '.s{animation:sway ease-in-out infinite alternate both}' +
    '@keyframes rise{0%{transform:translateY(0);opacity:0}15%{opacity:1}80%{opacity:1}100%{transform:translateY(-330px);opacity:0}}' +
    '@keyframes sway{from{transform:translateX(calc(var(--s) * -1))}to{transform:translateX(var(--s))}}';
  return picture(320, 400, bubbles, css);
}

/* ---------------------------------------------------------------- the catalog */

const BUILDERS: readonly [
  id: string,
  group: MotionGroup,
  w: number,
  h: number,
  reads: boolean,
  build: () => string | LineShape,
][] = [
  ['orbit', 'path', 400, 400, false, orbit],
  ['conveyor', 'path', 380, 160, true, conveyor],
  ['trace', 'path', 580, 220, true, trace],
  ['atom', 'path', 400, 400, false, atom],
  ['shuttle', 'path', 560, 140, true, shuttle],
  ['hexagon', 'spin', 400, 400, false, hexagon],
  ['rings', 'spin', 400, 400, false, rings],
  ['radar', 'spin', 400, 400, false, radar],
  ['ripple', 'scale', 400, 400, false, ripple],
  ['breathe', 'scale', 400, 400, false, breathe],
  ['bars', 'scale', 430, 300, true, bars],
  ['waves', 'lines', 560, 200, false, waves],
  ['draw', 'lines', 560, 230, true, draw],
  ['flowArrow', 'lines', 430, 80, true, flowArrow],
  ['heartbeat', 'lines', 560, 220, true, heartbeat],
  ['network', 'particles', 480, 300, false, network],
  ['converge', 'particles', 400, 400, false, converge],
  ['float', 'particles', 320, 400, false, float],
];

/**
 * The attribute of a picture's root that names the animation it is (ADR-128): row B finds it by
 * it, to draw it again at another speed.
 */
export const PIECE_ATTRIBUTE = 'data-slidr-motion';

let pieces: readonly MotionPiece[] | undefined;

/** Every animation, in the order the collection shows them. Drawn the first time it is asked. */
export function motionPieces(): readonly MotionPiece[] {
  pieces ??= BUILDERS.map(([id, group, w, h, reads, build]): MotionPiece => {
    const built = build();
    const base = { id, group, size: { w, h }, reads };
    return typeof built === 'string'
      ? { ...base, kind: 'picture', markup: withRootAttribute(built, PIECE_ATTRIBUTE, id) }
      : { ...base, kind: 'line', line: built };
  });
  return pieces;
}

/** The animations that are pictures (ADR-127), without the lines (ADR-131). */
export function motionPictures(): readonly PicturePiece[] {
  return motionPieces().filter((piece): piece is PicturePiece => piece.kind === 'picture');
}

export { radarBody };
