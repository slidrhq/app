// @vitest-environment happy-dom
import {
  CommandBus,
  createDeck,
  createElement,
  createSlide,
  elementSchemas,
  type Background,
  type Layout,
  type SvgElement,
} from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { languages } from '../i18n';
import { en, he } from './messages';
import { backgroundCommands, backgroundWith, motionElement, shownMotionBackground } from './motion';
import { motionBackgrounds } from './motionBackgrounds';
import { GLINT, INK, inkOverrides } from './motionKit';
import { MOTION_GROUPS, motionPieces } from './motionPieces';

/*
 * The animations and the backgrounds of Elements (ADR-127): pictures that move by themselves,
 * drawn in the colours that stand for the theme's, and what a click puts on a slide. That they
 * survive the renderer's cleaning and move in a real browser is `motion.browser.test.ts`.
 */

const pieces = motionPieces();
const backgrounds = motionBackgrounds();
const all = [
  ...pieces.map((p) => ({ kind: 'animation', id: p.id, markup: p.markup, moves: true })),
  ...backgrounds.map((b) => ({
    kind: 'background',
    id: b.id,
    markup: b.markup,
    moves: b.animated,
  })),
];

const MOVES = /@keyframes|<animate(Motion|Transform)?\b/;
const inks = new Set<string>([...Object.values(INK), GLINT]);

describe('the catalog', () => {
  it('names every animation and background once, in Hebrew and in English', () => {
    expect(new Set(pieces.map((p) => p.id)).size).toBe(pieces.length);
    expect(new Set(backgrounds.map((b) => b.id)).size).toBe(backgrounds.length);
    for (const piece of pieces) {
      expect(MOTION_GROUPS).toContain(piece.group);
      expect(he.animations.name).toHaveProperty(piece.id);
      expect(en.animations.name).toHaveProperty(piece.id);
    }
    for (const background of backgrounds) {
      expect(he.backgrounds.name).toHaveProperty(background.id);
      expect(en.backgrounds.name).toHaveProperty(background.id);
    }
    // Every group has something in it, and the names are as many as the pieces.
    for (const group of MOTION_GROUPS) expect(pieces.some((p) => p.group === group)).toBe(true);
    expect(Object.keys(he.animations.name)).toHaveLength(pieces.length);
    expect(Object.keys(he.backgrounds.name)).toHaveLength(backgrounds.length);
  });

  it('offers the four motions of the reference deck as backgrounds', () => {
    // Slides 1, 2, 4 and 6 of tests/import/מצגת רפרנס.html draw these on a canvas.
    for (const id of ['flow', 'waves', 'converge', 'orbit']) {
      expect(backgrounds.find((b) => b.id === id)?.animated).toBe(true);
    }
  });

  it.each(all)('$kind $id is one picture with its own units', ({ kind, id, markup }) => {
    expect(markup.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ')).toBe(true);
    expect(markup.endsWith('</svg>')).toBe(true);
    expect(markup.match(/<svg\b/g)).toHaveLength(1);
    const [, w, h] = /viewBox="0 0 ([\d.]+) ([\d.]+)"/.exec(markup) ?? [];
    if (kind === 'background') expect([w, h]).toEqual(['1920', '1080']);
    else {
      const piece = pieces.find((p) => p.id === id)!;
      expect([Number(w), Number(h)]).toEqual([piece.size.w, piece.size.h]);
    }
    // Nothing a picture may not hold, and no number the markup could not write.
    expect(markup).not.toMatch(/<script|<foreignObject|javascript:|NaN|Infinity|undefined/i);
  });

  it.each(all)(
    '$kind $id moves when it should, and is not too large',
    ({ kind, markup, moves }) => {
      expect(MOVES.test(markup)).toBe(moves);
      // A background is in the file of every slide that takes it.
      expect(markup.length).toBeLessThan(kind === 'background' ? 48_000 : 16_000);
    },
  );

  it.each(all)('$kind $id hides what only a path places, where SMIL does not run', ({ markup }) => {
    // PowerPoint draws the SVG of an exported picture without SMIL: a dot that only its path
    // places would stand in the corner there.
    const motions = markup.match(/<animateMotion\b/g)?.length ?? 0;
    expect(markup.match(/ opacity="0"><animateMotion\b/g)?.length ?? 0).toBe(motions);
  });

  it.each(all)('$kind $id paints only in the colours that stand for the theme', ({ markup }) => {
    const painted = [...markup.matchAll(/(?:fill|stroke|stop-color)="(#[0-9a-f]{3,8})"/gi)].map(
      (m) => m[1]!.toLowerCase(),
    );
    expect(painted.length).toBeGreaterThan(0);
    for (const colour of painted) expect(inks).toContain(colour);
    // A colour named in CSS would not follow the theme.
    expect(markup).not.toMatch(/<style>[^<]*#[0-9a-f]{3,8}/i);
  });
});

describe('an animation on a slide', () => {
  it('is an svg element in the middle of the slide, in the theme colours it uses', () => {
    const deck = createDeck({ lang: 'en' });
    for (const piece of pieces) {
      const element = motionElement(piece, deck);
      expect(elementSchemas.svg.safeParse(element).success).toBe(true);
      expect(element.frame).toEqual({
        x: Math.round((1920 - piece.size.w) / 2),
        y: Math.round((1080 - piece.size.h) / 2),
        ...piece.size,
      });
      expect(element.markup).toBe(piece.markup);
      const overrides = element.colorOverrides ?? {};
      expect(Object.keys(overrides).length).toBeGreaterThan(0);
      for (const [hex, colour] of Object.entries(overrides)) {
        expect(piece.markup).toContain(`"${hex}"`);
        expect(colour).toEqual({ token: Object.entries(INK).find(([, v]) => v === hex)![0] });
      }
      expect(element.flipH).toBeUndefined();
    }
  });

  it('runs from side to side in the reading direction of the deck', () => {
    const rtl = createDeck({ lang: 'he' });
    expect(rtl.meta.dir).toBe('rtl');
    const arrow = pieces.find((p) => p.id === 'flowArrow')!;
    const orbit = pieces.find((p) => p.id === 'orbit')!;
    expect(motionElement(arrow, rtl).flipH).toBe(true);
    expect(motionElement(orbit, rtl).flipH).toBeUndefined();
  });

  it('steps aside from what stands in the middle already', () => {
    const deck = createDeck({ lang: 'en' });
    const piece = pieces[0]!;
    const first = motionElement(piece, deck);
    expect(motionElement(piece, deck, [first.frame]).frame).not.toEqual(first.frame);
  });
});

describe('a background on a slide', () => {
  const waves = backgrounds.find((b) => b.id === 'waves')!;
  const network = backgrounds.find((b) => b.id === 'network')!;
  const photo: Background = {
    fill: { kind: 'image', assetId: 'a1', fit: 'cover' },
    blur: 8,
    dim: 0.3,
    overlay: { kind: 'solid', color: { value: 'black', alpha: 0.2 } },
  };
  const gradient: Background = {
    fill: {
      kind: 'linear',
      angle: 90,
      stops: [
        { color: { token: 'bg' }, at: 0 },
        { color: { token: 'surface' }, at: 1 },
      ],
    },
    overlay: { kind: 'solid', color: { token: 'primary', alpha: 0.05 } },
    elements: [createElement.svg({ frame: { x: 0, y: 0, w: 10, h: 10 }, markup: '<svg/>' })],
  };
  const drawing = (dir: 'rtl' | 'ltr') =>
    motionElement(pieces[0]!, createDeck({ lang: dir === 'rtl' ? 'he' : 'en' }));

  it('keeps the ground of the slide and takes the place of its drawing', () => {
    const mine = drawing('ltr');
    const next = backgroundWith(gradient, mine);
    expect(next.fill).toBe(gradient.fill);
    expect(next.overlay).toBe(gradient.overlay);
    expect(next.elements).toEqual([mine]);
  });

  it('puts a photograph aside for the theme ground, with its blur, dimming and veil', () => {
    expect(backgroundWith(photo, drawing('ltr'))).toEqual({
      fill: { kind: 'solid', color: { token: 'bg' } },
      elements: [expect.objectContaining({ type: 'svg' })],
    });
  });

  it('goes on the current slide and every other one selected, each with its own drawing', () => {
    const dark: Layout = {
      id: 'l_dark',
      name: 'Dark',
      archetype: 'section',
      background: { fill: { kind: 'solid', color: { token: 'text' } } },
      placeholders: [],
      decorations: [],
    };
    const deck = createDeck({
      lang: 'en',
      layouts: [dark],
      slides: [
        createSlide({ id: 's1' }),
        createSlide({ id: 's2', layoutId: 'l_dark' }),
        createSlide({ id: 's3', background: photo }),
      ],
    });
    const bus = new CommandBus(deck, { validate: true });
    bus.batch(backgroundCommands(bus.deck, ['s1', 's2', 's3', 'gone'], waves));
    expect(bus.undoStack).toHaveLength(1);
    const [s1, s2, s3] = bus.deck.slides;
    expect(s1!.background?.fill).toEqual(deck.theme.background.fill);
    expect(s2!.background?.fill).toEqual(dark.background!.fill);
    expect(s3!.background?.fill).toEqual({ kind: 'solid', color: { token: 'bg' } });
    const drawings = [s1, s2, s3].map((slide) => slide!.background!.elements![0] as SvgElement);
    expect(new Set(drawings.map((d) => d.id)).size).toBe(3);
    for (const d of drawings) {
      expect(d.frame).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
      expect(d.markup).toBe(waves.markup);
      expect(d.colorOverrides).toEqual(inkOverrides(waves.markup));
    }
    for (const slide of bus.deck.slides)
      expect(shownMotionBackground(bus.deck, slide)).toBe('waves');
    bus.undo();
    expect(bus.deck.slides.map((slide) => slide.background)).toEqual(
      deck.slides.map((slide) => slide.background),
    );
  });

  it('stands away from where the text starts', () => {
    const [ltr, rtl] = [createDeck({ lang: 'en' }), createDeck({ lang: 'he' })];
    const on = (deck: typeof ltr, background: typeof waves) =>
      backgroundCommands(deck, [deck.slides[0]?.id ?? ''], background);
    for (const deck of [ltr, rtl]) deck.slides.push(createSlide({ id: 's1' }));
    const flipOf = (deck: typeof ltr, background: typeof waves) => {
      const [command] = on(deck, background);
      const patch = command?.type === 'slide.update' ? command.patch.background : undefined;
      return (patch?.elements?.[0] as SvgElement | undefined)?.flipH;
    };
    // A drawing beside the text is on the left of a slide that reads from the right.
    expect(flipOf(rtl, waves)).toBeUndefined();
    expect(flipOf(ltr, waves)).toBe(true);
    // One that covers the slide stays as it is.
    expect(flipOf(ltr, network)).toBeUndefined();
  });
});

describe('the strings', () => {
  it('are in every language of the interface', () => {
    // `translations.test.ts` checks every key; this one that the new ones are there to check.
    expect(languages).toContain('ja');
    // The animated shapes of ADR-128 come first, as a group of their own.
    expect(Object.keys(en.animations.group)).toEqual(['basic', ...MOTION_GROUPS]);
  });
});
