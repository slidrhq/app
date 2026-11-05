// @vitest-environment happy-dom
import {
  AMBIENT_DEFAULTS,
  AmbientMotion,
  createDeck,
  createElement,
  elementSchemas,
  type SvgElement,
} from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { en, he } from './messages';
import {
  markupAtSpeed,
  motionElement,
  pieceMarkup,
  pieceOf,
  pieceSpeed,
  PIECE_SPEEDS,
} from './motion';
import { atSpeed } from './motionKit';
import { motionPictures } from './motionPieces';
import { MOTION_SHAPES, motionShapeElement } from './motionShapes';
import { newAmbient } from './MotionTool';

/*
 * What ADR-128 adds to the animations of Elements: the motion any element repeats (`ambient`),
 * the animated shapes made of it, and the speed of an animation of ADR-127. That the renderer
 * moves an element by its motion is `ambient.test.tsx` of the renderer; that it moves in a real
 * browser, `motion.browser.test.tsx`.
 */

/** The animations that are pictures: a line's pace is its flow's (ADR-131). */
const pieces = motionPictures();

/** Every time written in a picture, in seconds, in order. */
function times(markup: string): number[] {
  const found: number[] = [];
  const take = (text: string) => {
    for (const m of text.matchAll(/(?<![\w.-])(-?(?:\d+(?:\.\d+)?|\.\d+))s(?![\w-])/g)) {
      found.push(Number(m[1]));
    }
  };
  for (const m of markup.matchAll(/\s(?:dur|begin)="([^"]*)"/g)) take(m[1]!);
  for (const m of markup.matchAll(/\sstyle="([^"]*)"/g)) take(m[1]!);
  for (const m of markup.matchAll(/<style>([\s\S]*?)<\/style>/g)) take(m[1]!);
  return found;
}

describe('an ambient motion', () => {
  it('is a field of every element, of five kinds', () => {
    for (const kind of Object.keys(AMBIENT_DEFAULTS) as AmbientMotion['kind'][]) {
      expect(AmbientMotion.safeParse(newAmbient(kind)).success).toBe(true);
    }
    const frame = { x: 0, y: 0, w: 100, h: 100 };
    const shape = createElement.shape({
      frame,
      ambient: { kind: 'spin', duration: 4000, reverse: true },
    });
    expect(elementSchemas.shape.safeParse(shape).error?.issues).toBeUndefined();
    const picture = createElement.svg({
      frame,
      markup: '<svg viewBox="0 0 1 1"/>',
      ambient: { kind: 'float', duration: 3000, rhythm: 'pause', amount: 30 },
    });
    expect(elementSchemas.svg.safeParse(picture).error?.issues).toBeUndefined();
    // A round takes some time, and a motion goes no way back.
    expect(AmbientMotion.safeParse({ kind: 'spin', duration: 0 }).success).toBe(false);
    expect(AmbientMotion.safeParse({ kind: 'pulse', duration: 900, amount: -1 }).success).toBe(
      false,
    );
    expect(AmbientMotion.safeParse({ kind: 'wobble', duration: 900 }).success).toBe(false);
  });

  it('starts as its kind is without a word of its own', () => {
    expect(newAmbient('pulse')).toEqual({ kind: 'pulse', duration: 2000 });
    expect(newAmbient('spin')).toEqual({ kind: 'spin', duration: 6000 });
  });
});

describe('the animated shapes', () => {
  it('are plain shapes of the library, each with its motion and its names', () => {
    const deck = createDeck({ lang: 'en' });
    expect(new Set(MOTION_SHAPES.map((s) => s.id)).size).toBe(MOTION_SHAPES.length);
    for (const shape of MOTION_SHAPES) {
      const element = motionShapeElement(shape, deck);
      expect(elementSchemas.shape.safeParse(element).success).toBe(true);
      expect(element.ambient).toEqual(shape.ambient);
      expect(Math.max(element.frame.w, element.frame.h)).toBe(shape.side);
      expect(he.animatedShapes.name).toHaveProperty(shape.id);
      expect(en.animatedShapes.name).toHaveProperty(shape.id);
      // In the theme's colours, so they follow the template.
      const paint = shape.look === 'fill' ? element.fill : element.stroke;
      expect(JSON.stringify(paint)).toContain(`"token":"${shape.ink}"`);
    }
    expect(Object.keys(en.animatedShapes.name)).toHaveLength(MOTION_SHAPES.length);
  });

  it('includes a circle and polygons that turn, and every kind of motion', () => {
    const turning = MOTION_SHAPES.filter((s) => s.ambient.kind === 'spin').map((s) => s.preset);
    expect(turning).toEqual(expect.arrayContaining(['ellipse', 'hexagon', 'octagon']));
    const kinds = new Set(MOTION_SHAPES.map((s) => s.ambient.kind));
    expect([...kinds].sort()).toEqual(Object.keys(AMBIENT_DEFAULTS).sort());
  });

  it('draws an outline as an outline, dashed when it is', () => {
    const deck = createDeck({ lang: 'en' });
    const ring = motionShapeElement(
      MOTION_SHAPES.find((s) => s.id === 'ring')!,
      deck,
    );
    expect(ring.fill).toEqual({ kind: 'none' });
    expect(ring.stroke).toMatchObject({ color: { token: 'primary' }, dash: 'dashed' });
    const hexagon = motionShapeElement(
      MOTION_SHAPES.find((s) => s.id === 'hexagon')!,
      deck,
    );
    expect(hexagon.fill).toEqual({ kind: 'solid', color: { token: 'primary' } });
    expect(hexagon.stroke).toBeUndefined();
  });

  it('points the way the deck reads, and steps aside from what is in the middle', () => {
    const arrow = MOTION_SHAPES.find((s) => s.id === 'arrow')!;
    const preset = (lang: string) => {
      const e = motionShapeElement(arrow, createDeck({ lang }));
      return e.geometry.kind === 'preset' ? e.geometry.preset : undefined;
    };
    expect(preset('en')).toBe('arrowRight');
    expect(preset('he')).toBe('arrowLeft');
    const deck = createDeck({ lang: 'en' });
    const first = motionShapeElement(arrow, deck);
    expect(motionShapeElement(arrow, deck, [first.frame]).frame).not.toEqual(first.frame);
  });
});

describe('the speed of an animation', () => {
  it('divides every time of the picture, and nothing else', () => {
    for (const piece of pieces) {
      const before = times(piece.markup);
      expect(before.length, piece.id).toBeGreaterThan(0);
      const twice = atSpeed(piece.markup, 2);
      expect(times(twice), piece.id).toEqual(before.map((s) => Math.round((s / 2) * 1000) / 1000));
      // Paths, colours and the rest are as they were.
      const strip = (m: string) =>
        m.replace(/\s(?:dur|begin|style)="[^"]*"/g, '').replace(/<style>[\s\S]*?<\/style>/g, '');
      expect(strip(twice), piece.id).toBe(strip(piece.markup));
    }
  });

  it('is said by the picture, which names its animation', () => {
    const orbit = pieces.find((p) => p.id === 'orbit')!;
    const element = motionElement(orbit, createDeck({ lang: 'en' }));
    expect(pieceOf(element)).toBe(orbit);
    expect(pieceSpeed(element.markup!)).toBe(1);
    const fast: SvgElement = { ...element, markup: pieceMarkup(orbit, 2.5) };
    expect(pieceOf(fast)).toBe(orbit);
    expect(pieceSpeed(fast.markup!)).toBe(2.5);
    // Drawn again from the animation itself, so speeds never add up.
    expect(pieceMarkup(orbit, 1)).toBe(orbit.markup);
    expect(times(pieceMarkup(orbit, 0.5))).toEqual(times(orbit.markup).map((s) => s * 2));
  });

  it('stays between a quarter and four times its own pace', () => {
    const orbit = pieces.find((p) => p.id === 'orbit')!;
    expect(pieceSpeed(pieceMarkup(orbit, 100))).toBe(PIECE_SPEEDS.max);
    expect(pieceSpeed(pieceMarkup(orbit, 0.01))).toBe(PIECE_SPEEDS.min);
    expect(markupAtSpeed(orbit.markup, 1)).toBe(orbit.markup);
  });

  it('finds an animation put on a slide before its picture named itself', () => {
    const orbit = pieces.find((p) => p.id === 'orbit')!;
    const frame = { x: 0, y: 0, w: 400, h: 400 };
    const old = createElement.svg({
      frame,
      name: 'animation-orbit',
      markup: orbit.markup.replace(/ data-slidr-motion="orbit"/, ''),
    });
    expect(pieceOf(old)).toBe(orbit);
    expect(
      pieceOf(createElement.svg({ frame, markup: '<svg viewBox="0 0 1 1"/>' })),
    ).toBeUndefined();
  });
});
