import { describe, expect, it } from 'vitest';
import { flattenPath, shapePresets } from './geometry';
import { outlineHandle, outlineWidthTo } from './outlineHandle';

const preset = (name: string, adjust?: number[]) => ({
  kind: 'preset' as const,
  preset: name,
  ...(adjust ? { adjust } : {}),
});

describe('the outline handle (ADR-137)', () => {
  it('stands on the inner edge of a circle, in from its right side', () => {
    const handle = outlineHandle(preset('ellipse'), 360, 360, 16);
    expect(handle).toEqual({ at: { x: 344, y: 180 }, along: { x: -1, y: 0 } });
    // Dragged in to 40 pixels from the edge, and off its row: the outline is 40 thick.
    expect(outlineWidthTo(preset('ellipse'), 360, 360, { x: 320, y: 120 })).toBe(40);
    // It stops at the middle, where the outline fills the circle, and keeps one pixel at the edge.
    expect(outlineWidthTo(preset('ellipse'), 360, 360, { x: -50, y: 180 })).toBe(180);
    expect(outlineWidthTo(preset('ellipse'), 360, 360, { x: 400, y: 180 })).toBe(1);
  });

  it('goes as deep as the shorter side of a box allows', () => {
    expect(outlineWidthTo(preset('rect'), 400, 100, { x: 0, y: 50 })).toBe(50);
    expect(outlineHandle(preset('roundRect'), 400, 100, 500)?.at).toEqual({ x: 350, y: 50 });
  });

  it('measures a slanted edge across it, as the outline is drawn', () => {
    // A diamond's right corner: its edges run at 45 degrees, so the outline 10 thick ends
    // 10 / sin(45°) in from the corner.
    const handle = outlineHandle(preset('diamond'), 200, 200, 10)!;
    expect(handle.at.x).toBeCloseTo(200 - 10 * Math.SQRT2, 0);
    expect(handle.at.y).toBe(100);
    expect(outlineWidthTo(preset('diamond'), 200, 200, handle.at)).toBe(10);
  });

  it('stays clear of the handle of a ring, and goes no deeper than half the ring', () => {
    // A ring 90 thick: the outline handle is on its right, the ring's own on its left.
    const handle = outlineHandle(preset('donut', [0.25]), 360, 360, 4)!;
    expect(handle.at.x).toBeCloseTo(356, 0);
    expect(outlineWidthTo(preset('donut', [0.25]), 360, 360, { x: 0, y: 180 })).toBe(45);
  });

  it('brings every closed preset back to its width from where the handle stands', () => {
    const W = 480;
    const H = 320;
    let tried = 0;
    for (const name of shapePresets) {
      for (const width of [1, 6, 24]) {
        const handle = outlineHandle(preset(name), W, H, width);
        if (!handle) continue;
        tried++;
        const back = outlineWidthTo(preset(name), W, H, handle.at)!;
        // A shape thinner than the outline stops it where it fills the shape.
        expect(back, `${name} ${width}`).toBeLessThanOrEqual(width);
        if (back < width) {
          const deepest = outlineWidthTo(preset(name), W, H, { x: -W, y: H / 2 })!;
          expect(back, `${name} ${width}`).toBe(deepest);
        }
      }
    }
    expect(tried).toBeGreaterThan(60);
  });

  it('has no handle on an open outline', () => {
    expect(outlineHandle(preset('leftBracket'), 80, 400, 4)).toBeUndefined();
    expect(outlineWidthTo(preset('rightBrace'), 80, 400, { x: 0, y: 0 })).toBeUndefined();
    const open = { kind: 'path' as const, d: 'M0 0 L100 100', viewBox: { w: 100, h: 100 } };
    expect(outlineHandle(open, 200, 200, 4)).toBeUndefined();
  });

  it('follows a path stretched to its frame', () => {
    const triangle = {
      kind: 'path' as const,
      d: 'M0 0 L10 5 L0 10 Z',
      viewBox: { w: 10, h: 10 },
    };
    // The point on the right, at the middle height of a 300 by 300 frame.
    const handle = outlineHandle(triangle, 300, 300, 0)!;
    expect(handle.at).toEqual({ x: 300, y: 150 });
    expect(outlineWidthTo(triangle, 300, 300, { x: 300 - 50 * Math.sqrt(5), y: 150 })).toBe(50);
  });
});

describe('flattenPath', () => {
  it('reads the pairs after a move as lines', () => {
    expect(flattenPath('m10 10 20 0 0 20z')).toEqual([
      [
        [10, 10],
        [30, 10],
        [30, 30],
        [10, 10],
      ],
    ]);
  });

  it('cuts an arc into points on it', () => {
    const [run] = flattenPath('M0 50 A50 50 0 1 1 100 50 A50 50 0 1 1 0 50 Z');
    for (const [x, y] of run!) expect(Math.hypot(x - 50, y - 50)).toBeCloseTo(50, 6);
  });
});
