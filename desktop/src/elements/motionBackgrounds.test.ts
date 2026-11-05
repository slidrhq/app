import { describe, expect, it } from 'vitest';
import { motionBackgrounds } from './motionBackgrounds';

/*
 * A background of Elements that is a field, of lines or of dots, covers the slide from one edge
 * to the other (ADR-129). The reference deck draws its traces and its waves on the half of the
 * slide beside its text; as a background they stopped two thirds of the way across.
 */

const W = 1920;
const H = 1080;
const markupOf = (id: string) => motionBackgrounds().find((one) => one.id === id)!.markup;

/** The points a closed smooth path (`smoothPath`) passes through: its start, and each curve's end. */
function ringPoints(d: string): [number, number][] {
  const n = d.match(/-?[\d.]+/g)!.map(Number);
  const points: [number, number][] = [[n[0]!, n[1]!]];
  for (let i = 2; i + 5 < n.length; i += 6) points.push([n[i + 4]!, n[i + 5]!]);
  return points;
}

/** Whether a point is inside a polygon, by the rays it crosses. */
function inside(polygon: readonly [number, number][], x: number, y: number): boolean {
  let within = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i]!;
    const [xj, yj] = polygon[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) within = !within;
  }
  return within;
}

describe('a background that is a field', () => {
  it('runs its traces in from beyond one edge and out beyond the other (flow)', () => {
    const traces = [...markupOf('flow').matchAll(/<path id="p\d+" d="([^"]+)"/g)].map((m) => m[1]!);
    expect(traces.length).toBeGreaterThan(10);
    for (const d of traces) {
      const xs = [...d.matchAll(/[ML](-?[\d.]+) /g)].map((m) => Number(m[1]));
      expect(Math.min(...xs)).toBeLessThan(0);
      expect(Math.max(...xs)).toBeGreaterThan(W);
    }
  });

  it('rolls its waves across the whole width (waves)', () => {
    const lines = [...markupOf('waves').matchAll(/<path d="M(-?[\d.]+) [^"]*"/g)];
    expect(lines).toHaveLength(7);
    for (const [d, start] of lines) {
      expect(Number(start)).toBe(0);
      const across = [...d.matchAll(/l(-?[\d.]+) /g)].reduce((sum, m) => sum + Number(m[1]), 0);
      expect(across).toBeCloseTo(W, 0);
    }
  });

  it('opens its rings out to the far corner (contours, arcs)', () => {
    const diagonal = Math.hypot(W, H);
    const arcs = [...markupOf('arcs').matchAll(/A(\d+) \1 /g)].map((m) => Number(m[1]));
    expect(Math.max(...arcs)).toBeGreaterThan(diagonal * 0.95);
    // Every corner of the slide is inside the outermost contour: no part of the slide is beyond
    // the last line.
    const rings = [...markupOf('contours').matchAll(/<path d="([^"]+)"/g)].map((m) => m[1]!);
    const outer = ringPoints(rings.at(-1)!);
    for (const [x, y] of [
      [0, 0],
      [W, 0],
      [0, H],
      [W, H],
    ] as const) {
      expect(inside(outer, x, y), `corner ${x},${y}`).toBe(true);
    }
  });

  it('keeps its dots to the edges, softer toward the corners (dots)', () => {
    // The mask fades the dots to a third at most, never out.
    const stops = [
      ...markupOf('dots').matchAll(/<radialGradient id="v"[^>]*>(.*?)<\/radialGradient>/g),
    ];
    const opacities = [...stops[0]![1]!.matchAll(/stop-opacity="([\d.]+)"/g)].map((m) =>
      Number(m[1]),
    );
    expect(Math.min(...opacities)).toBeGreaterThan(0.3);
  });
});
