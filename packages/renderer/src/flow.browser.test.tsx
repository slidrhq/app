import { createDeck, createElement, createSlide, type LineElement } from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { linePath } from './elements';
import { pathLength } from './flow';
import { renderSlideOffscreen } from './offscreen';

/*
 * What runs along a line (ADR-131), in a real engine: its dashes flow, and its riders go the very
 * path the line is drawn with, wherever its points are, mirrored or not.
 */

function conveyor(patch: Partial<LineElement> = {}): LineElement {
  return createElement.line({
    id: 'e_flow',
    frame: { x: 300, y: 300, w: 600, h: 300 },
    points: [
      { x: 0, y: 300 },
      { x: 600, y: 0 },
    ],
    stroke: { color: { value: '#2f6bff' }, width: 4, dash: 'dashed', cap: 'round' },
    curve: 'curved',
    flow: { speed: 200, rider: 'box', count: 4 },
    ...patch,
  });
}

async function drawn(line: LineElement) {
  const slide = createSlide({ elements: [line] });
  const deck = createDeck({ lang: 'en', slides: [slide] });
  const offscreen = await renderSlideOffscreen({ deck, slide, mode: 'present' }, { hidden: false });
  const host = offscreen.root.querySelector<HTMLElement>(`[data-element-id="${line.id}"]`)!;
  const stroke = host.querySelector<SVGPathElement>('svg > path')!;
  const riders = Array.from(host.querySelectorAll<SVGGElement>('[data-slidr-riders] > g'));
  return { offscreen, host, stroke, riders };
}

/** The middle of what a rider draws, in the page's pixels. */
function centre(el: Element): { x: number; y: number } {
  const r = el.getBoundingClientRect();
  return { x: r.left + r.width / 2, y: r.top + r.height / 2 };
}

/** A point `at` of the way along the stroke, in the page's pixels. */
function along(stroke: SVGPathElement, at: number): { x: number; y: number } {
  const p = stroke.getPointAtLength(stroke.getTotalLength() * at);
  const m = stroke.getScreenCTM()!;
  return { x: m.a * p.x + m.c * p.y + m.e, y: m.b * p.x + m.d * p.y + m.f };
}

describe('a line that something runs along', () => {
  it('measures its path as the engine does', () => {
    const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
    document.body.append(svg);
    try {
      for (const curve of ['straight', 'elbow', 'curved'] as const) {
        const points = [
          { x: 0, y: 300 },
          { x: 250, y: 40 },
          { x: 600, y: 0 },
        ];
        const d = linePath(points, curve);
        const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
        path.setAttribute('d', d);
        svg.append(path);
        expect(pathLength(d)).toBeCloseTo(path.getTotalLength(), 0);
      }
    } finally {
      svg.remove();
    }
  });

  it('flows its dashes, and its riders go its path evenly spaced', async () => {
    const { offscreen, stroke, riders } = await drawn(conveyor());
    try {
      // The dashes: one period of `dashed` at width 4 (16 + 12) a round, toward the end.
      const [flow] = stroke.getAnimations() as CSSAnimation[];
      expect(flow?.animationName).toBe('slidr-flow');
      expect(flow?.playState).toBe('running');
      expect(flow!.effect!.getComputedTiming().duration).toBeCloseTo((28 / 200) * 1000, 0);
      flow!.pause();
      flow!.currentTime = (28 / 200) * 500;
      expect(parseFloat(getComputedStyle(stroke).strokeDashoffset)).toBeCloseTo(-14, 0);

      // Four riders, each a round of its own, a quarter of the way apart.
      expect(riders).toHaveLength(4);
      const round = (pathLength(stroke.getAttribute('d')!) / 200) * 1000;
      for (const [i, rider] of riders.entries()) {
        const [ride] = rider.getAnimations() as CSSAnimation[];
        expect(ride?.animationName).toBe('slidr-ride');
        expect(ride!.effect!.getComputedTiming().duration).toBeCloseTo(round, 0);
        ride!.pause();
        // At 30% of the round the first rider is 30% of the way, the second 55%, and so on.
        ride!.currentTime = round * 0.3;
        const at = (0.3 + i / 4) % 1;
        const expected = along(stroke, at);
        const actual = centre(rider);
        expect(Math.abs(actual.x - expected.x), `rider ${i} x at ${at}`).toBeLessThan(3);
        expect(Math.abs(actual.y - expected.y), `rider ${i} y at ${at}`).toBeLessThan(3);
      }
    } finally {
      offscreen.dispose();
    }
  });

  it('keeps its riders on the line when the line is mirrored, or goes back', async () => {
    const { offscreen, stroke, riders } = await drawn(
      conveyor({ flipH: true, flow: { speed: 200, rider: 'dot', count: 1, reverse: true } }),
    );
    try {
      expect(riders).toHaveLength(1);
      const rider = riders[0]!;
      expect(rider.querySelector('circle')).not.toBeNull();
      const [ride] = rider.getAnimations();
      ride!.pause();
      const round = ride!.effect!.getComputedTiming().duration as number;
      // Going back: a fifth into its round it is four fifths of the way.
      ride!.currentTime = round * 0.2;
      const expected = along(stroke, 0.8);
      const actual = centre(rider);
      expect(Math.abs(actual.x - expected.x)).toBeLessThan(3);
      expect(Math.abs(actual.y - expected.y)).toBeLessThan(3);
    } finally {
      offscreen.dispose();
    }
  });

  it('has nothing running without a flow, and no riders for dashes alone', async () => {
    const plain = await drawn(conveyor({ flow: undefined }));
    try {
      expect(plain.stroke.getAnimations()).toHaveLength(0);
      expect(plain.riders).toHaveLength(0);
      expect(plain.offscreen.root.querySelector('style[data-slidr-ambient]')).toBeNull();
    } finally {
      plain.offscreen.dispose();
    }
    const dashes = await drawn(conveyor({ flow: { speed: 60 } }));
    try {
      expect(dashes.stroke.getAnimations()).toHaveLength(1);
      expect(dashes.riders).toHaveLength(0);
      expect(dashes.offscreen.root.querySelector('style[data-slidr-ambient]')).not.toBeNull();
    } finally {
      dashes.offscreen.dispose();
    }
  });
});
