import { describe, expect, it } from 'vitest';
import { adjustDefaults, adjustHandles, adjustTo } from './adjustHandles';
import { presetPath, shapePresets } from './geometry';

const W = 480;
const H = 320;

/** Every preset with handles. */
const ADJUSTED = shapePresets.filter((preset) => adjustHandles(preset, W, H).length > 0);
/** Those whose values, as drawn by default, are within what their handles reach at W x H. */
const FREE = ADJUSTED.filter((preset) => !preset.endsWith('Bracket'));

describe('adjustment handles (ADR-133)', () => {
  it('knows the values each preset is drawn with when it has none', () => {
    expect(ADJUSTED.length).toBeGreaterThan(15);
    for (const preset of ADJUSTED) {
      const defaults = adjustDefaults(preset);
      expect(defaults, preset).toBeDefined();
      expect(presetPath(preset, W, H, defaults), preset).toEqual(presetPath(preset, W, H, []));
    }
  });

  it('gives no handle to a shape without values to set', () => {
    for (const preset of ['rect', 'ellipse', 'diamond', 'hexagon', 'heart', 'leftBrace', 'nope'])
      expect(adjustHandles(preset, W, H), preset).toEqual([]);
    expect(adjustTo('rect', 0, W, H, [], { x: 0, y: 0 })).toBeUndefined();
    expect(adjustTo('donut', 1, W, H, [], { x: 0, y: 0 })).toBeUndefined();
  });

  it('puts the handle of a ring on its inner edge, and a drag there sets its thickness', () => {
    const [handle] = adjustHandles('donut', 360, 360, [0.25]);
    expect(handle?.at).toEqual({ x: 90, y: 180 });
    expect(handle?.along).toEqual({ x: 1, y: 0 });
    // Dragged in to 60 pixels from the outer edge, and off its row: the ring is 60 thick.
    expect(adjustTo('donut', 0, 360, 360, [0.25], { x: 60, y: 140 })).toEqual([0.1667]);
    // Past the centre it stops where the hole closes; past the outside, where the ring vanishes.
    expect(adjustTo('donut', 0, 360, 360, [0.25], { x: 300, y: 180 })).toEqual([0.5]);
    expect(adjustTo('donut', 0, 360, 360, [0.25], { x: -40, y: 180 })).toEqual([0]);
  });

  it('brings each handle back to its value from where it stands', () => {
    for (const preset of FREE) {
      const defaults = adjustDefaults(preset) ?? [];
      adjustHandles(preset, W, H).forEach((handle, i) => {
        const back = adjustTo(preset, i, W, H, [], handle.at);
        expect(back, `${preset} ${i}`).toHaveLength(defaults.length);
        back?.forEach((v, k) => expect(v, `${preset} ${i}[${k}]`).toBeCloseTo(defaults[k]!, 3));
      });
    }
  });

  it('follows a drag: the handle ends where the pointer projects onto its path', () => {
    for (const preset of ADJUSTED) {
      const count = adjustHandles(preset, W, H).length;
      for (let i = 0; i < count; i++) {
        const before = adjustHandles(preset, W, H)[i]!;
        const along = before.along;
        // A small step back along the handle's own way, or anywhere for one that goes every way.
        const step = along ?? { x: 0.6, y: 0.8 };
        const to = { x: before.at.x - step.x * 12, y: before.at.y - step.y * 12 };
        const adjust = adjustTo(preset, i, W, H, [], to)!;
        const after = adjustHandles(preset, W, H, adjust)[i]!;
        expect(after.at.x, `${preset} ${i}`).toBeCloseTo(to.x, 0);
        expect(after.at.y, `${preset} ${i}`).toBeCloseTo(to.y, 0);
        // The other handles' values stay as they were.
        const defaults = adjustDefaults(preset) ?? [];
        adjust.forEach((v, k) => {
          if (k !== i && !(preset.includes('Callout') && k < 2))
            expect(v, `${preset} ${i}[${k}]`).toBe(defaults[k]);
        });
      }
    }
  });

  it('runs the arrows the way they point', () => {
    const right = adjustHandles('arrowRight', 480, 240);
    expect(right.map((h) => h.at)).toEqual([
      { x: 360, y: 60 },
      { x: 360, y: 0 },
    ]);
    const left = adjustHandles('arrowLeft', 480, 240);
    expect(left.map((h) => h.at)).toEqual([
      { x: 120, y: 60 },
      { x: 120, y: 0 },
    ]);
    const down = adjustHandles('arrowDown', 240, 480);
    expect(down.map((h) => h.at)).toEqual([
      { x: 60, y: 360 },
      { x: 0, y: 360 },
    ]);
    const up = adjustHandles('arrowUp', 240, 480);
    expect(up.map((h) => h.at)).toEqual([
      { x: 60, y: 120 },
      { x: 0, y: 120 },
    ]);
  });

  it('takes the tail of a speech bubble anywhere', () => {
    const [handle] = adjustHandles('wedgeRectCallout', 400, 200);
    expect(handle).toEqual({ at: { x: 80, y: 250 } });
    expect(adjustTo('wedgeRectCallout', 0, 400, 200, [], { x: -100, y: 100 })).toEqual([
      -0.25, 0.5,
    ]);
  });

  it('keeps a bracket corner within half its height', () => {
    expect(adjustTo('leftBracket', 0, 80, 400, [], { x: 0, y: 1000 })).toEqual([1]);
    expect(adjustTo('rightBracket', 0, 80, 120, [], { x: 80, y: 1000 })).toEqual([0.75]);
  });
});
