import type { Color, ColorToken } from '@slidr/model';

/*
 * What the animations and the backgrounds of Elements are drawn with. Each of them is an `svg`
 * element whose markup moves by itself: CSS `@keyframes` in its own stylesheet for what turns,
 * grows or flows, and SMIL (`animateMotion`, `animate`) for what travels along a path or changes
 * its shape. A picture keeps both (`picture.ts` of the renderer), so it moves wherever it is
 * drawn: on the stage, in a show and in an exported file, and it moves, resizes and turns as any
 * other element does. Nothing of the deck's schema is new.
 */

/**
 * The colours the markup is drawn in, each standing for a colour of the theme. An element maps
 * them to the theme's tokens (`colorOverrides`), so the drawing follows the template and row B
 * can recolour it. Without that it looks as the reference deck does, whose colours these are.
 */
export const INK = {
  primary: '#6c4cf1',
  secondary: '#2f6bff',
  accent: '#f29a00',
  text: '#15213f',
  surface: '#ffffff',
  /** The ground: a ring that sets a dot apart from what it crosses. */
  bg: '#fbf6ec',
} as const satisfies Partial<Record<ColorToken, string>>;

export type Ink = keyof typeof INK;

/**
 * Light on something round: white in every theme, as light is. The one colour of a drawing that
 * stands for none of the theme's; row B can still change it.
 */
export const GLINT = '#fffffe';

/** The theme colours an element of this markup is drawn in: only those its markup uses. */
export function inkOverrides(markup: string): Record<string, Color> {
  const overrides: Record<string, Color> = {};
  for (const [token, hex] of Object.entries(INK) as [Ink, string][]) {
    if (markup.includes(`"${hex}"`)) overrides[hex] = { token };
  }
  return overrides;
}

/** A number as the markup writes it: at most `digits` decimals, and no `-0`. */
export function num(value: number, digits = 1): string {
  const factor = 10 ** digits;
  const rounded = Math.round(value * factor) / factor;
  return Object.is(rounded, -0) ? '0' : String(rounded);
}

/**
 * A picture of `w` by `h` units with its own stylesheet. Without `preserveAspectRatio` it keeps
 * its proportions in a box of others, as a picture of the library does.
 */
export function picture(w: number, h: number, body: string, css = '', extra = ''): string {
  const style = css ? `<style>${css}</style>` : '';
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"${extra}>${style}${body}</svg>`;
}

/**
 * A time as the markup writes one: seconds, signed or not, standing alone (not the end of a
 * name). Read only where times are written, since in a path's data `s` is a command.
 */
const TIME = /(?<![\w.-])(-?(?:\d+(?:\.\d+)?|\.\d+))s(?![\w-])/g;

/**
 * The markup with its motion `speed` times as fast (ADR-128): every time written in it divided
 * by `speed`: SMIL's `dur` and `begin`, and the durations and delays of its stylesheet and of
 * its `style` attributes. A part that starts partway into its round starts as far into it.
 */
export function atSpeed(markup: string, speed: number): string {
  if (!(speed > 0) || speed === 1) return markup;
  const scale = (text: string) =>
    text.replace(TIME, (_all, value: string) => `${num(Number(value) / speed, 3)}s`);
  return markup
    .replace(
      /(\s(?:dur|begin)=")([^"]*)"/g,
      (_all, name: string, value: string) => `${name}${scale(value)}"`,
    )
    .replace(
      /(\sstyle=")([^"]*)"/g,
      (_all, name: string, value: string) => `${name}${scale(value)}"`,
    )
    .replace(/<style>([\s\S]*?)<\/style>/g, (_all, css: string) => `<style>${scale(css)}</style>`);
}

/** The markup with an attribute added to its root, after the ones it has. */
export function withRootAttribute(markup: string, name: string, value: string): string {
  const end = markup.indexOf('>');
  if (!markup.startsWith('<svg') || end < 0) return markup;
  const at = markup[end - 1] === '/' ? end - 1 : end;
  return `${markup.slice(0, at)} ${name}="${value}"${markup.slice(at)}`;
}

/** The same numbers every time: a drawing that scatters its parts is the same drawing again. */
export function random(seed: number): () => number {
  let state = seed >>> 0;
  return () => {
    state = (state + 0x6d2b79f5) >>> 0;
    let t = state;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export interface Pt {
  x: number;
  y: number;
}

/** A circle as a path from its top, clockwise: what a dot travels around. */
export function circlePath(cx: number, cy: number, r: number): string {
  return `M${num(cx)} ${num(cy - r)}a${num(r)} ${num(r)} 0 1 1 0 ${num(2 * r)}a${num(r)} ${num(r)} 0 1 1 0 ${num(-2 * r)}`;
}

/**
 * An ellipse as a path from its end on the right, going down first: on a ring seen from above
 * the slide, the near half comes first.
 */
export function ellipsePath(cx: number, cy: number, rx: number, ry: number): string {
  const [x, y, a, b] = [num(cx + rx), num(cy), num(rx), num(ry)];
  return `M${x} ${y}A${a} ${b} 0 1 1 ${num(cx - rx)} ${y}A${a} ${b} 0 1 1 ${x} ${y}`;
}

/**
 * A smooth curve through points (Catmull-Rom as cubic Béziers). Closed, it returns to the first
 * point. Two curves of as many points have the same commands, so SMIL can morph one into the
 * other.
 */
export function smoothPath(points: readonly Pt[], closed = false): string {
  const n = points.length;
  const at = (i: number): Pt =>
    closed ? points[((i % n) + n) % n]! : points[Math.max(0, Math.min(n - 1, i))]!;
  let d = `M${num(points[0]!.x)} ${num(points[0]!.y)}`;
  const segments = closed ? n : n - 1;
  for (let i = 0; i < segments; i++) {
    const [p0, p1, p2, p3] = [at(i - 1), at(i), at(i + 1), at(i + 2)];
    const c1 = { x: p1.x + (p2.x - p0.x) / 6, y: p1.y + (p2.y - p0.y) / 6 };
    const c2 = { x: p2.x - (p3.x - p1.x) / 6, y: p2.y - (p3.y - p1.y) / 6 };
    d += `C${num(c1.x)} ${num(c1.y)} ${num(c2.x)} ${num(c2.y)} ${num(p2.x)} ${num(p2.y)}`;
  }
  return closed ? `${d}Z` : d;
}

/** The length of a broken line. */
export function polylineLength(points: readonly Pt[]): number {
  let length = 0;
  for (let i = 1; i < points.length; i++) {
    length += Math.hypot(points[i]!.x - points[i - 1]!.x, points[i]!.y - points[i - 1]!.y);
  }
  return length;
}

/** A broken line as path data. */
export function polylinePath(points: readonly Pt[]): string {
  return points.map((p, i) => `${i ? 'L' : 'M'}${num(p.x)} ${num(p.y)}`).join('');
}

/**
 * A light that runs along a path of length `length` and leaves a trail behind it: dashes of the
 * path, one per layer, whose fronts travel together from the start to beyond the end, so the
 * trail leaves the path too. `stroke` is drawn by every layer; `path` is the path data, or a
 * `#id` of a path of the picture to reuse. Each layer is `[length, width, opacity]`; the shortest
 * one with a round cap is the head.
 */
export function runningLight(options: {
  path: string;
  length: number;
  stroke: string;
  layers: readonly (readonly [dash: number, width: number, opacity: number])[];
  dur: number;
  /** Seconds the light is into its run when the picture starts. */
  into: number;
}): string {
  const { path, length, stroke, layers, dur, into } = options;
  const longest = Math.max(...layers.map(([dash]) => dash));
  const gap = length + longest + 2;
  const begin = `${num(-(((into % dur) + dur) % dur), 2)}s`;
  return layers
    .map(([dash, width, opacity]) => {
      const paint =
        ` fill="none" stroke="${stroke}" stroke-width="${num(width)}"` +
        (opacity < 1 ? ` stroke-opacity="${num(opacity, 2)}"` : '') +
        ` stroke-linecap="round" stroke-dasharray="${num(dash)} ${num(gap)}"` +
        ` stroke-dashoffset="${num(dash)}"`;
      const run = `<animate attributeName="stroke-dashoffset" from="${num(dash)}" to="${num(dash - length - longest)}" dur="${num(dur, 2)}s" begin="${begin}" repeatCount="indefinite"/>`;
      return path.startsWith('#')
        ? `<use href="${path}"${paint}>${run}</use>`
        : `<path d="${path}"${paint}>${run}</path>`;
    })
    .join('');
}

/**
 * A dot that travels along a path: `dur` seconds a round, `into` seconds into it when the
 * picture starts, backwards when `back`.
 *
 * The path is all that places it: the shape itself stands at the picture's origin. So it is
 * hidden until SMIL shows it, and a renderer without SMIL (PowerPoint draws the SVG of an
 * exported picture) leaves it out rather than drawing it in the corner. `extra` that animates
 * the opacity shows it by itself.
 */
export function travelling(options: {
  shape: string;
  path: string;
  dur: number;
  into?: number;
  back?: boolean;
  turn?: boolean;
  extra?: string;
}): string {
  const { shape, path, dur, into = 0, back = false, turn = false, extra = '' } = options;
  const begin = into ? ` begin="${num(-(((into % dur) + dur) % dur), 2)}s"` : '';
  const way = back ? ' keyPoints="1;0" keyTimes="0;1" calcMode="linear"' : '';
  const rotate = turn ? ' rotate="auto"' : '';
  const motion = `<animateMotion dur="${num(dur, 2)}s"${begin}${way}${rotate} repeatCount="indefinite" path="${path}"/>`;
  const shown = extra.includes('attributeName="opacity"')
    ? ''
    : '<set attributeName="opacity" to="1"/>';
  // The shape's own closing tag takes the motion and whatever else moves with it.
  const close = shape.lastIndexOf('/>');
  const tag = /^<(\w+)/.exec(shape)?.[1] ?? 'g';
  return `${shape.slice(0, close)} opacity="0">${motion}${shown}${extra}</${tag}>`;
}
