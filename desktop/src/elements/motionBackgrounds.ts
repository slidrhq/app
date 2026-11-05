import { radarBody } from './motionPieces';
import {
  ellipsePath,
  GLINT,
  INK,
  num,
  picture,
  polylineLength,
  polylinePath,
  random,
  RUNNING_LIGHTS_CSS,
  runningLights,
  smoothPath,
  travelling,
  type Pt,
} from './motionKit';

/*
 * The backgrounds of Elements (ADR-127): a drawing over the slide's ground (the background's
 * `elements`, ADR-125), most of them moving. The first four are the motion of the reference
 * deck's covers (`tests/import/מצגת רפרנס.html`, slides 1, 2, 4 and 6), drawn there on a canvas
 * by a script and here as a picture that moves by itself: `flow`, `waves`, `converge` and
 * `orbit`. A deck can hold no script, and a picture can.
 *
 * A drawing that stands on one side of the slide is drawn for a deck that reads from the right,
 * on the left as the reference has it; a deck that reads from the left gets it mirrored, away
 * from where its text starts. A field covers the slide from edge to edge (ADR-129): the traces
 * and the waves too, which the reference draws beside its text only; they still run the way the
 * reference has them, and are mirrored with the deck's direction as well.
 */

export interface MotionBackground {
  id: string;
  /** Whether it moves. */
  animated: boolean;
  /**
   * Whether it stands on one side of the slide, or runs one way across it, which changes with
   * the deck's direction.
   */
  sided: boolean;
  markup: string;
}

const W = 1920;
const H = 1080;
const { primary: P, secondary: S, accent: A, text: T, bg: B } = INK;

/** Where the reference centres what it draws beside the text, and how large. */
const CX = W * 0.3;
const CY = H * 0.52;
const R = Math.min(W, H) * 0.3;

/** Dots at points, as one path of round caps: lighter than a circle each. */
function dotsAt(points: readonly Pt[], colour: string, size: number, opacity: number): string {
  const d = points.map((p) => `M${num(p.x)} ${num(p.y)}h0`).join('');
  return `<path d="${d}" stroke="${colour}" stroke-opacity="${num(opacity, 2)}" stroke-width="${num(size)}" stroke-linecap="round"/>`;
}

/* ---------------------------------------------------------------- the reference's four */

/**
 * Slide 1: traces like a circuit's, with lights that run along them (`flow`). They come in from
 * beyond one edge of the slide and leave it beyond the other: the reference draws them on the
 * half of the slide beside its text, and a background covers the whole slide.
 */
function flow(): string {
  const rng = random(1);
  const paths: { points: Pt[]; off: number; speed: number }[] = [];
  for (let i = 0; i < 16; i++) {
    let x = -W * (0.02 + rng() * 0.06);
    let y = H * (0.1 + rng() * 0.8);
    const points: Pt[] = [{ x, y }];
    while (x < W) {
      x += 60 + rng() * 140;
      points.push({ x, y });
      if (rng() < 0.6) {
        y += (rng() < 0.5 ? -1 : 1) * (30 + rng() * 90);
        y = Math.max(H * 0.06, Math.min(H * 0.94, y));
        points.push({ x, y });
      }
    }
    // The share of its path a light runs in a frame, as the reference has it, for a path about
    // half as long: so a light keeps the reference's pace across the slide.
    paths.push({ points, off: rng(), speed: (0.0015 + rng() * 0.003) * 0.5 });
  }
  const layers = [
    [62, 3, 0.32],
    [0.5, 7.2, 0.85],
  ] as const;
  // Two lights on each trace, half a round apart, as the reference has them.
  const lights = paths
    .map(({ points, off, speed }) => {
      const length = polylineLength(points);
      // A round of the reference's: the whole path in `1 / (speed * 60)` seconds.
      const round = 1 / (speed * 60);
      const dur = (round * (length + layers[0][0])) / length;
      const path = polylinePath(points);
      return runningLights({ path, length, stroke: P, layers, dur, into: off * round, count: 2 });
    })
    .join('');
  const body =
    `<path d="${paths.map((p) => polylinePath(p.points)).join('')}" fill="none" stroke="${P}" stroke-opacity=".16" stroke-width="2"/>` +
    dotsAt(
      paths.flatMap((p) => p.points),
      P,
      5,
      0.35,
    ) +
    lights;
  return picture(W, H, body, RUNNING_LIGHTS_CSS);
}

/**
 * Slide 2: seven waves that roll across, swelling in the middle and still at the ends (`waves`):
 * from one edge of the slide to the other, where the reference stops beside its text.
 */
function waves(): string {
  const span = W;
  // A point every 24 units: as smooth as the reference's 20, and the ten shapes of seven lines
  // across the whole slide stay in the size a background may have.
  const step = 24;
  const xs: number[] = [];
  for (let x = 0; x < span; x += step) xs.push(x);
  xs.push(span);
  const frames = 10;
  const lines = Array.from({ length: 7 }, (_, k) => {
    const shapes = Array.from({ length: frames + 1 }, (_, j) => {
      const phase = ((j % frames) / frames) * Math.PI * 2;
      const ys = xs.map((x) =>
        Math.round(
          H * 0.5 +
            Math.sin(x * 0.006 + phase + k) * (30 + k * 14) * Math.sin((x / span) * Math.PI) +
            (k - 3) * 18,
        ),
      );
      let d = `M0 ${ys[0]}`;
      for (let i = 1; i < xs.length; i++) {
        d += `l${num(xs[i]! - xs[i - 1]!)} ${ys[i]! - ys[i - 1]!}`;
      }
      return d;
    });
    // The phase grows with time, as the reference's does: the waves roll toward the start.
    const dur = (Math.PI * 2) / (0.6 + k * 0.12);
    return (
      `<path d="${shapes[0]}" fill="none" stroke="${k % 2 ? P : A}" stroke-opacity="${num(0.12 + 0.05 * k, 2)}" stroke-width="${num(1.5 + k * 0.3, 2)}" stroke-linejoin="round">` +
      `<animate attributeName="d" values="${shapes.join(';')}" dur="${num(dur, 2)}s" repeatCount="indefinite"/></path>`
    );
  });
  return picture(W, H, lines.join(''));
}

/** Slide 4: particles that fly in and settle into three rings, which turn (`converge`). */
function converge(): string {
  const rng = random(4);
  const count = 180;
  const rings = [0.62, 0.86, 1];
  const dots = Array.from({ length: count }, (_, i) => {
    const a = (i / count) * Math.PI * 2;
    const rr = R * rings[i % 3]!;
    const [x, y] = [CX + Math.cos(a) * rr, CY + Math.sin(a) * rr];
    const [fx, fy] = [rng() * W, rng() * H];
    return `<circle cx="${num(x)}" cy="${num(y)}" r="${num(1 + rng() * 2.2)}" style="--x:${num(fx - x)}px;--y:${num(fy - y)}px"/>`;
  }).join('');
  const outlines = rings
    .map(
      (m) =>
        `<circle cx="${num(CX)}" cy="${num(CY)}" r="${num(R * m)}" fill="none" stroke="${P}" stroke-opacity=".12" stroke-width="1"/>`,
    )
    .join('');
  const ease = 'cubic-bezier(.33,1,.68,1)';
  const css =
    `.w{transform-origin:${num(CX)}px ${num(CY)}px;animation:turn 78s linear infinite}` +
    `.w circle{animation:gather 3.2s ${ease} both}` +
    `.o,.h{animation:show 3.2s ${ease} both}` +
    '@keyframes turn{to{transform:rotate(360deg)}}' +
    '@keyframes gather{from{transform:translate(var(--x),var(--y));opacity:.33}to{transform:none;opacity:1}}' +
    '@keyframes show{from{opacity:0}}';
  const body =
    '<defs><radialGradient id="g">' +
    `<stop offset="0" stop-color="${P}" stop-opacity=".22"/><stop offset="1" stop-color="${P}" stop-opacity="0"/></radialGradient></defs>` +
    `<g class="o">${outlines}</g>` +
    `<g class="w" fill="${P}" fill-opacity=".75">${dots}</g>` +
    `<circle class="h" cx="${num(CX)}" cy="${num(CY)}" r="${num(R * 0.55)}" fill="url(#g)"/>`;
  return picture(W, H, body, css);
}

/** Slide 6: a glowing sphere with three tilted orbits and their satellites (`orbit`). */
function orbit(): string {
  const rng = random(6);
  // The sphere in the theme's colour, and a light on it that is white in any theme.
  const sphere =
    '<defs><radialGradient id="s" cx=".5" cy=".5" r=".5" fx=".36" fy=".34">' +
    `<stop offset="0" stop-color="${GLINT}" stop-opacity=".95"/><stop offset=".55" stop-color="${GLINT}" stop-opacity=".2"/>` +
    `<stop offset="1" stop-color="${GLINT}" stop-opacity="0"/></radialGradient></defs>` +
    `<circle cx="${num(CX)}" cy="${num(CY)}" r="${num(R * 0.2)}" fill="${P}" fill-opacity=".9"/>` +
    `<circle cx="${num(CX)}" cy="${num(CY)}" r="${num(R * 0.2)}" fill="url(#s)"/>`;
  const orbits = [0.45, 0.75, 1.05]
    .map((m, k) => {
      const rx = R * m * 1.3;
      const ry = rx * 0.42;
      const path = ellipsePath(CX, CY, rx, ry);
      const line =
        `<path d="${path}" fill="none" stroke="${P}" stroke-opacity="${num(0.28 - 0.06 * k, 2)}" stroke-width="1.8"` +
        (k === 2 ? ' stroke-dasharray="6 8"' : '') +
        '/>';
      const size = 9 - k * 2.5;
      const satellites = Array.from({ length: 3 + k }, () => {
        // Radians a second, as the reference turns them at sixty frames a second.
        const speed = (0.006 - k * 0.0015) * (1 + rng() * 0.4) * 60;
        const dur = (Math.PI * 2) / speed;
        const into = rng() * dur;
        const begin = `${num(-into, 2)}s`;
        // The near half of the ring comes first: larger and stronger there, as the reference.
        const near = `<animate attributeName="r" values="${num(size * 1.15)};${num(size * 0.85)}" keyTimes="0;.5" calcMode="discrete" dur="${num(dur, 2)}s" begin="${begin}" repeatCount="indefinite"/>`;
        const strong = `<animate attributeName="fill-opacity" values=".9;.35" keyTimes="0;.5" calcMode="discrete" dur="${num(dur, 2)}s" begin="${begin}" repeatCount="indefinite"/>`;
        return travelling({
          shape: `<circle r="${num(size)}" fill="${P}"/>`,
          path,
          dur,
          into,
          extra: near + strong,
        });
      }).join('');
      return line + satellites;
    })
    .join('');
  return picture(W, H, sphere + orbits);
}

/* ---------------------------------------------------------------- more that move */

/** A radar beside the text: the sweep goes round, and lights what it passes (`radar`). */
function radar(): string {
  const { body, css } = radarBody(CX, CY, R * 1.15, 5.7, 3, 26);
  return picture(W, H, `<g opacity=".85">${body}</g>`, css);
}

/** Two layers of a network that drift apart, packets running along the nearer (`network`). */
function network(): string {
  const rng = random(8);
  // A node in each cell of a grid, somewhere in it: even, and not in rows.
  const scatter = (columns: number, rows: number) => {
    const [w, h] = [(W + 200) / columns, (H + 160) / rows];
    return Array.from({ length: columns * rows }, (_, i) => ({
      x: -100 + ((i % columns) + 0.15 + rng() * 0.7) * w,
      y: -80 + (Math.floor(i / columns) + 0.15 + rng() * 0.7) * h,
    }));
  };
  const linksOf = (nodes: readonly Pt[], reach: number, most: number) => {
    const links: [number, number][] = [];
    nodes.forEach((a, i) => {
      nodes
        .map((b, j) => ({ j, d: Math.hypot(a.x - b.x, a.y - b.y) }))
        .filter(({ j, d }) => j > i && d < reach)
        .sort((p, q) => p.d - q.d)
        .slice(0, most)
        .forEach(({ j }) => links.push([i, j]));
    });
    return links;
  };
  const lines = (nodes: readonly Pt[], links: readonly [number, number][]) =>
    links
      .map(
        ([i, j]) =>
          `M${num(nodes[i]!.x)} ${num(nodes[i]!.y)}L${num(nodes[j]!.x)} ${num(nodes[j]!.y)}`,
      )
      .join('');
  const far = scatter(9, 5);
  const near = scatter(6, 4);
  const farLinks = linksOf(far, 330, 3);
  const nearLinks = linksOf(near, 440, 3);
  const packets = nearLinks
    .filter((_, i) => i % 3 === 0)
    .map(([i, j], n) => {
      const [a, b] = n % 2 ? [near[j]!, near[i]!] : [near[i]!, near[j]!];
      const dur = Math.hypot(a.x - b.x, a.y - b.y) / 110;
      const into = rng() * dur;
      return travelling({
        shape: `<circle r="5" fill="${P}"/>`,
        path: `M${num(a.x)} ${num(a.y)}L${num(b.x)} ${num(b.y)}`,
        dur,
        into,
        extra: `<animate attributeName="opacity" values="0;1;1;0" keyTimes="0;.12;.88;1" dur="${num(dur, 2)}s" begin="${num(-into, 2)}s" repeatCount="indefinite"/>`,
      });
    })
    .join('');
  const css =
    '.f{animation:far 34s ease-in-out infinite alternate}' +
    '.n{animation:near 26s ease-in-out infinite alternate}' +
    '@keyframes far{to{transform:translate(-46px,26px)}}' +
    '@keyframes near{to{transform:translate(40px,-24px)}}';
  const body =
    '<g class="f">' +
    `<path d="${lines(far, farLinks)}" stroke="${T}" stroke-opacity=".07" stroke-width="1.5"/>` +
    dotsAt(far, T, 5, 0.14) +
    '</g><g class="n">' +
    `<path d="${lines(near, nearLinks)}" stroke="${P}" stroke-opacity=".14" stroke-width="2"/>` +
    packets +
    near
      .map(
        (p) =>
          `<circle cx="${num(p.x)}" cy="${num(p.y)}" r="${num(4 + rng() * 3)}" fill="${P}" fill-opacity=".5" stroke="${B}" stroke-width="3"/>`,
      )
      .join('') +
    '</g>';
  return picture(W, H, body, css);
}

/** Soft light that drifts over a field of dots: the reference deck's ambient ground (`drift`). */
function drift(): string {
  const blob = (id: string, colour: string, opacity: number) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${colour}" stop-opacity="${opacity}"/>` +
    `<stop offset=".5" stop-color="${colour}" stop-opacity="${num(opacity * 0.7, 3)}"/>` +
    `<stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient>`;
  const css =
    '.b{transform-box:fill-box;transform-origin:center}' +
    '.b1{animation:d1 22s ease-in-out infinite}' +
    '.b2{animation:d2 26s ease-in-out infinite}' +
    '.b3{animation:d1 30s ease-in-out infinite reverse}' +
    '@keyframes d1{50%{transform:translate(-77px,96px) scale(1.08)}}' +
    '@keyframes d2{50%{transform:translate(96px,-77px) scale(1.1)}}';
  const body =
    '<defs>' +
    blob('b1', P, 0.38) +
    blob('b2', A, 0.32) +
    blob('b3', S, 0.22) +
    '<pattern id="d" width="26" height="26" patternUnits="userSpaceOnUse">' +
    `<circle cx="13" cy="13" r="1.3" fill="${T}" fill-opacity=".12"/></pattern>` +
    '<radialGradient id="v"><stop offset=".3" stop-opacity="1"/><stop offset=".8" stop-opacity="0"/></radialGradient>' +
    `<mask id="m" mask-type="alpha" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="url(#v)"/></mask>` +
    '</defs>' +
    `<circle class="b b1" cx="1670" cy="173" r="560" fill="url(#b1)"/>` +
    `<circle class="b b2" cx="211" cy="1022" r="470" fill="url(#b2)"/>` +
    `<circle class="b b3" cx="999" cy="701" r="350" fill="url(#b3)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#d)" mask="url(#m)"/>`;
  return picture(W, H, body, css);
}

/** Soft lights, as out of focus, that rise slowly across the whole slide (`particles`). */
function particles(): string {
  const rng = random(12);
  const inks = [P, S, A];
  const glow = (id: string, colour: string) =>
    `<radialGradient id="${id}"><stop offset="0" stop-color="${colour}" stop-opacity=".9"/>` +
    `<stop offset=".6" stop-color="${colour}" stop-opacity=".55"/><stop offset="1" stop-color="${colour}" stop-opacity="0"/></radialGradient>`;
  const lights = Array.from({ length: 30 }, (_, i) => {
    const r = 8 + rng() ** 1.6 * 46;
    const x = rng() * W;
    const dur = 30 + rng() * 34;
    const delay = num(-rng() * dur, 1);
    const sway = num((rng() < 0.5 ? -1 : 1) * (18 + rng() * 46));
    return (
      `<g class="s" style="--s:${sway}px;animation-duration:${num(dur / 4, 1)}s;animation-delay:${delay}s">` +
      `<circle class="r" cx="${num(x)}" cy="${num(H + r)}" r="${num(r)}" fill="url(#g${i % 3})" opacity="${num(0.14 + rng() * 0.22, 2)}" style="animation-duration:${num(dur, 1)}s;animation-delay:${delay}s"/></g>`
    );
  }).join('');
  const css =
    '.r{animation:rise linear infinite both}' +
    '.s{animation:sway ease-in-out infinite alternate both}' +
    `@keyframes rise{0%{transform:translateY(0);opacity:0}12%{opacity:1}85%{opacity:1}100%{transform:translateY(-${H + 120}px);opacity:0}}` +
    '@keyframes sway{from{transform:translateX(calc(var(--s) * -1))}to{transform:translateX(var(--s))}}';
  return picture(
    W,
    H,
    `<defs>${inks.map((ink, i) => glow(`g${i}`, ink)).join('')}</defs>${lights}`,
    css,
  );
}

/* ---------------------------------------------------------------- still */

/**
 * A field of fine dots over the whole slide, which softens toward its corners, and a soft light
 * beside the text.
 */
function dots(): string {
  const body =
    '<defs><pattern id="d" width="30" height="30" patternUnits="userSpaceOnUse">' +
    `<circle cx="15" cy="15" r="1.6" fill="${T}" fill-opacity=".16"/></pattern>` +
    '<radialGradient id="v" cx=".5" cy=".5" r=".72"><stop offset=".5" stop-opacity="1"/><stop offset="1" stop-opacity=".35"/></radialGradient>' +
    `<radialGradient id="l"><stop offset="0" stop-color="${P}" stop-opacity=".2"/><stop offset="1" stop-color="${P}" stop-opacity="0"/></radialGradient>` +
    `<mask id="m" mask-type="alpha" style="mask-type:alpha" maskUnits="userSpaceOnUse" x="0" y="0" width="${W}" height="${H}">` +
    `<rect width="${W}" height="${H}" fill="url(#v)"/></mask></defs>` +
    `<circle cx="${num(CX)}" cy="${num(CY)}" r="760" fill="url(#l)"/>` +
    `<rect width="${W}" height="${H}" fill="url(#d)" mask="url(#m)"/>`;
  return picture(W, H, body);
}

/**
 * Contour lines, as on a map, around a point near the corner, out to the far corner of the
 * slide. They open out as they go, as on a slope that levels off.
 */
function contours(): string {
  const rng = random(21);
  const phases = Array.from({ length: 3 }, () => rng() * Math.PI * 2);
  const count = 36;
  const lines = Array.from({ length: 20 }, (_, k) => {
    const radius = 80 + k * 76 + k * k * 2;
    const pts = Array.from({ length: count }, (_, i) => {
      const a = (i / count) * Math.PI * 2;
      // A few slow undulations, which shift a little from one ring to the next.
      const wobble =
        1 +
        0.13 * Math.sin(2 * a + phases[0]!) +
        0.07 * Math.sin(3 * a + phases[1]! + k * 0.35) +
        0.035 * Math.sin(5 * a + phases[2]! + k * 0.7);
      return {
        x: 250 + Math.cos(a) * radius * wobble * 1.15,
        y: 290 + Math.sin(a) * radius * wobble,
      };
    });
    const strong = k % 4 === 0;
    return `<path d="${smoothPath(pts, true)}" fill="none" stroke="${P}" stroke-opacity="${strong ? '.24' : '.13'}" stroke-width="${strong ? 2.5 : 1.6}"/>`;
  });
  return picture(W, H, lines.join(''));
}

/**
 * Arcs around the top corner: a round of colour, and rings that thin out and open out as they
 * go, to the far corner of the slide.
 */
function arcs(): string {
  const arc = (r: number, attrs: string) =>
    `<path d="M${r} 0A${r} ${r} 0 0 1 0 ${r}" fill="none"${attrs}/>`;
  const far = [720, 920, 1160, 1440, 1760, 2120]
    .map((r) => arc(r, ` stroke="${T}" stroke-opacity=".06" stroke-width="2"`))
    .join('');
  const body =
    `<path d="M0 0H170A170 170 0 0 1 0 170Z" fill="${P}"/>` +
    arc(232, ` stroke="${A}" stroke-width="14"`) +
    arc(292, ` stroke="${P}" stroke-opacity=".38" stroke-width="4"`) +
    arc(
      344,
      ` stroke="${P}" stroke-opacity=".3" stroke-width="3" stroke-dasharray="1 16" stroke-linecap="round"`,
    ) +
    arc(420, ` stroke="${T}" stroke-opacity=".12" stroke-width="2"`) +
    arc(560, ` stroke="${T}" stroke-opacity=".07" stroke-width="2"`) +
    far;
  return picture(W, H, body);
}

/* ---------------------------------------------------------------- the catalog */

const BUILDERS: readonly [id: string, animated: boolean, sided: boolean, build: () => string][] = [
  ['flow', true, true, flow],
  ['waves', true, true, waves],
  ['converge', true, true, converge],
  ['orbit', true, true, orbit],
  ['radar', true, true, radar],
  ['network', true, false, network],
  ['drift', true, false, drift],
  ['particles', true, false, particles],
  ['dots', false, true, dots],
  ['contours', false, true, contours],
  ['arcs', false, true, arcs],
];

let backgrounds: readonly MotionBackground[] | undefined;

/** Every background, in the order the collection shows them. Drawn the first time it is asked. */
export function motionBackgrounds(): readonly MotionBackground[] {
  backgrounds ??= BUILDERS.map(([id, animated, sided, build]) => ({
    id,
    animated,
    sided,
    markup: build(),
  }));
  return backgrounds;
}
