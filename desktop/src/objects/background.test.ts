import {
  CommandBus,
  createBaseTheme,
  createDeck,
  createElement,
  createSlide,
  type Background,
  type Layout,
  type SvgElement,
} from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { backgroundDrawing, markupAtSpeed, pieceSpeed } from '../elements/motion';
import { backgroundCatalog, motionBackgrounds } from '../elements/motionBackgrounds';
import { INK } from '../elements/motionKit';
import {
  applyToAllCommands,
  drawingColour,
  drawingColours,
  drawingOpacity,
  drawingSpeed,
  inheritedBackground,
  shownBackground,
  variantIndex,
  withAdjust,
  withDrawingColour,
  withDrawingOpacity,
  withDrawingSpeed,
  withFill,
  withoutDrawing,
} from './background';

const photo: Background = {
  fill: { kind: 'image', assetId: 'a1', fit: 'cover' },
  blur: 12,
  dim: 0.4,
  overlay: { kind: 'solid', color: { value: 'black', alpha: 0.2 } },
};
const accent: Background = { fill: { kind: 'solid', color: { token: 'accent' } } };
const dark: Layout = {
  id: 'l_dark',
  name: 'Dark',
  archetype: 'section',
  background: { fill: { kind: 'solid', color: { token: 'text' } } },
  placeholders: [],
  decorations: [],
};

function deckOf(...slides: Parameters<typeof createSlide>[0][]) {
  return createDeck({
    layouts: [dark],
    slides: slides.map((slide, i) => createSlide({ id: `s${i + 1}`, ...slide })),
  });
}

describe('what a slide shows', () => {
  it('is its own background, then its layout, then the theme', () => {
    const deck = deckOf({}, { layoutId: 'l_dark' }, { layoutId: 'l_dark', background: accent });
    const [plain, laidOut, own] = deck.slides;
    expect(shownBackground(deck, plain!)).toBe(deck.theme.background);
    expect(shownBackground(deck, laidOut!)).toBe(dark.background);
    expect(shownBackground(deck, own!)).toBe(accent);
    expect(inheritedBackground(deck, own!)).toBe(dark.background);
  });

  it('recognises a variant of the theme', () => {
    // A theme with two variants, as a template has, or a plain deck the user gave a second one.
    const surface: Background = { fill: { kind: 'solid', color: { token: 'surface' } } };
    const deck = createDeck({
      theme: { ...createBaseTheme(), backgroundVariants: [surface, photo] },
      slides: [createSlide({ id: 's1' })],
    });
    expect(variantIndex(deck, surface)).toBe(0);
    expect(variantIndex(deck, { ...photo })).toBe(1);
    // A variant is the whole background: the same picture without its veil is not it.
    expect(variantIndex(deck, { fill: photo.fill })).toBe(-1);
    expect(variantIndex(deck, accent)).toBe(-1);
    expect(variantIndex(deck, undefined)).toBe(-1);
  });
});

describe('editing a background', () => {
  it('drops blur and dim with the photo, and keeps the overlay', () => {
    const solid = withFill(photo, { kind: 'solid', color: { token: 'bg' } });
    expect(solid).toEqual({
      fill: { kind: 'solid', color: { token: 'bg' } },
      overlay: photo.overlay,
    });
    const other = withFill(photo, { kind: 'image', assetId: 'a2', fit: 'contain' });
    expect(other).toMatchObject({ blur: 12, dim: 0.4 });
    expect(other.fill).toMatchObject({ assetId: 'a2' });
  });

  it('stores no blur and no dim as absent', () => {
    expect(withAdjust(photo, { blur: 0 })).not.toHaveProperty('blur');
    expect(withAdjust(photo, { blur: 0 })).toHaveProperty('dim', 0.4);
    expect(withAdjust(photo, { dim: 0 })).not.toHaveProperty('dim');
    expect(withAdjust(accent, { blur: 20, dim: 0.5 })).toEqual({ ...accent, blur: 20, dim: 0.5 });
  });

  it('keeps the drawing of a background under a new fill, and takes it away alone (ADR-125)', () => {
    const bar = createElement.shape({ id: 'e_bar', frame: { x: 40, y: 100, w: 300, h: 12 } });
    const drawn: Background = { ...photo, elements: [bar] };
    expect(withFill(drawn, accent.fill).elements).toEqual([bar]);
    expect(withoutDrawing(drawn)).toEqual(photo);
    expect(withoutDrawing(accent)).toBe(accent);
  });
});

describe('apply to all slides', () => {
  it('makes the background the theme background and drops what the other slides had', () => {
    const deck = deckOf({ background: accent }, {}, { background: photo });
    const bus = new CommandBus(deck, { validate: true });
    bus.batch(applyToAllCommands(bus.deck, 's1'));

    expect(bus.deck.theme.background).toEqual(accent);
    for (const slide of bus.deck.slides) {
      expect(slide, slide.id).not.toHaveProperty('background');
      expect(shownBackground(bus.deck, slide)).toEqual(accent);
    }
    // A slide added afterwards shows it too.
    bus.dispatch({ type: 'slide.add', slide: createSlide({ id: 's9' }) });
    expect(shownBackground(bus.deck, bus.deck.slides.at(-1)!)).toEqual(accent);

    // One batch is one undo step: everything comes back at once.
    expect(bus.undoStack).toHaveLength(2);
    bus.undo();
    bus.undo();
    expect(bus.deck).toEqual(deck);
  });

  it('gives the background explicitly to a slide whose layout has its own', () => {
    const deck = deckOf({ background: accent }, { layoutId: 'l_dark' });
    const bus = new CommandBus(deck, { validate: true });
    bus.batch(applyToAllCommands(bus.deck, 's1'));
    expect(bus.deck.slides[1]?.background).toEqual(accent);
    expect(shownBackground(bus.deck, bus.deck.slides[1]!)).toEqual(accent);
  });

  it('spreads the theme background from a slide that has none of its own', () => {
    const deck = deckOf({}, { background: accent });
    const commands = applyToAllCommands(deck, 's1');
    // The theme already has it: only the other slide changes.
    expect(commands).toEqual([
      { type: 'slide.update', slideId: 's2', patch: { background: null } },
    ]);
  });

  it('has nothing to do when every slide already shows it', () => {
    expect(applyToAllCommands(deckOf({}, {}), 's1')).toEqual([]);
    expect(applyToAllCommands(deckOf({}), 'missing')).toEqual([]);
    const deck = deckOf({ background: accent }, {});
    const bus = new CommandBus(deck);
    bus.batch(applyToAllCommands(bus.deck, 's1'));
    expect(applyToAllCommands(bus.deck, 's1')).toEqual([]);
  });
});

// The backgrounds of Elements are the media library's (ADR-138), as it is published.
await backgroundCatalog.load();

describe('the drawing of a background (ADR-129)', () => {
  const deck = createDeck({ lang: 'he' });
  const of = (id: string): Background => {
    const source = motionBackgrounds().find((one) => one.id === id)!;
    return { ...accent, elements: [backgroundDrawing(source, deck)] };
  };
  const picture = (background: Background) => background.elements![0] as SvgElement;
  const waves = of('waves');

  it('lists the colours that stand for the theme, and what they are drawn in', () => {
    expect(drawingColours(waves)).toEqual([INK.primary, INK.accent]);
    expect(drawingColour(waves, INK.accent)).toEqual({ token: 'accent' });
    expect(drawingColours(accent)).toEqual([]);
  });

  it('draws a colour in another, and keeps the rest of the background', () => {
    const red = { value: '#e11d48' };
    const next = withDrawingColour(waves, INK.accent.toUpperCase(), red);
    expect(drawingColour(next, INK.accent)).toEqual(red);
    expect(drawingColour(next, INK.primary)).toEqual({ token: 'primary' });
    expect(picture(next).colorOverrides).toEqual({
      [INK.primary]: { token: 'primary' },
      [INK.accent]: red,
    });
    expect(next.fill).toBe(waves.fill);
    expect(picture(next).markup).toBe(picture(waves).markup);
    // The background it was made from is as it was: one undo step gives it back.
    expect(drawingColour(waves, INK.accent)).toEqual({ token: 'accent' });
  });

  it('moves at a speed, drawn again from the collection each time', () => {
    expect(drawingSpeed(waves)).toBe(1);
    const fast = withDrawingSpeed(waves, 2);
    expect(drawingSpeed(fast)).toBe(2);
    const source = motionBackgrounds().find((one) => one.id === 'waves')!.markup;
    expect(picture(fast).markup).toBe(markupAtSpeed(source, 2));
    // From 2 to 0.5 is from the collection's pace, not from the picture already sped up.
    const slow = withDrawingSpeed(fast, 0.5);
    expect(picture(slow).markup).toBe(markupAtSpeed(source, 0.5));
    expect(pieceSpeed(picture(slow).markup!)).toBe(0.5);
    expect(picture(withDrawingSpeed(slow, 1)).markup).toBe(source);
    // Its colours and its mirror are the element's, and stay.
    expect(picture(fast).colorOverrides).toEqual(picture(waves).colorOverrides);
    expect(picture(fast).flipH).toBe(picture(waves).flipH);
  });

  it('has no speed when nothing in it moves', () => {
    expect(drawingSpeed(of('dots'))).toBeUndefined();
    const dots = of('dots');
    expect(withDrawingSpeed(dots, 2)).toEqual(dots);
    expect(drawingSpeed(accent)).toBeUndefined();
  });

  it('is drawn at an opacity', () => {
    expect(drawingOpacity(waves)).toBe(1);
    expect(drawingOpacity(withDrawingOpacity(waves, 0.4))).toBe(0.4);
    expect(drawingOpacity(accent)).toBeUndefined();
    expect(withDrawingOpacity(accent, 0.4)).toBe(accent);
  });

  it('goes on a slide in one step, which undo takes back', () => {
    const bus = new CommandBus(deckOf({ background: waves }));
    const next = withDrawingSpeed(withDrawingOpacity(waves, 0.5), 3);
    bus.dispatch({ type: 'slide.update', slideId: 's1', patch: { background: next } });
    expect(drawingSpeed(bus.deck.slides[0]!.background!)).toBe(3);
    bus.undo();
    expect(bus.deck.slides[0]!.background).toEqual(waves);
  });
});
