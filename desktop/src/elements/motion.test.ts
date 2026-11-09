// @vitest-environment happy-dom
import {
  CommandBus,
  CONTENT_LANGUAGES,
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
import { en } from './messages';
import { backgroundCommands, backgroundWith, motionElement, shownMotionBackground } from './motion';
import { backgroundCatalog, backgroundsOf, motionBackgrounds } from './motionBackgrounds';
import { GLINT, INK, inkOverrides } from './motionKit';
import {
  animationCatalog,
  animationsOf,
  MOTION_GROUPS,
  motionName,
  motionPictures,
  motionPieces,
  PIECE_ATTRIBUTE,
  type LinePiece,
} from './motionPieces';

/*
 * The animations and the backgrounds of Elements (ADR-127): pictures that move by themselves,
 * drawn in the colours that stand for the theme's, and what a click puts on a slide. That they
 * survive the renderer's cleaning and move in a real browser is `motion.browser.test.ts`. They
 * are the media library's (ADR-138): the catalog's checks are of the library as it is published.
 */

await Promise.all([animationCatalog.load(), backgroundCatalog.load()]);

const pieces = motionPieces();
/** The animations that are pictures; the others are lines (ADR-131). */
const pictures = motionPictures();
const lines = pieces.filter((p): p is LinePiece => p.kind === 'line');
const backgrounds = motionBackgrounds();
const all = [
  ...pictures.map((p) => ({ kind: 'animation', id: p.id, markup: p.markup, moves: true })),
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
  it('names every animation and background once, in every language of the app', () => {
    expect(pieces.length).toBeGreaterThan(0);
    expect(backgrounds.length).toBeGreaterThan(0);
    expect(new Set(pieces.map((p) => p.id)).size).toBe(pieces.length);
    expect(new Set(backgrounds.map((b) => b.id)).size).toBe(backgrounds.length);
    for (const item of [...pieces, ...backgrounds]) {
      expect(Object.keys(item.name), item.id).toEqual([...CONTENT_LANGUAGES]);
    }
    for (const piece of pieces) expect(MOTION_GROUPS).toContain(piece.group);
    // Every group has something in it.
    for (const group of MOTION_GROUPS) expect(pieces.some((p) => p.group === group)).toBe(true);
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
    for (const piece of pictures) {
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
    const drawn = pictures.find((p) => p.id === 'draw')!;
    const orbit = pictures.find((p) => p.id === 'orbit')!;
    expect(motionElement(drawn, rtl).flipH).toBe(true);
    expect(motionElement(orbit, rtl).flipH).toBeUndefined();
    // A line is not mirrored: it is drawn from its other end, as a new line is.
    const arrow = lines.find((p) => p.id === 'flowArrow')!;
    const line = motionElement(arrow, rtl);
    expect(line.flipH).toBeUndefined();
    expect(line.points).toEqual(arrow.line.points.map((p) => ({ x: arrow.size.w - p.x, y: p.y })));
  });

  it('steps aside from what stands in the middle already', () => {
    const deck = createDeck({ lang: 'en' });
    for (const piece of [pictures[0]!, lines[0]!]) {
      const first = motionElement(piece, deck);
      expect(motionElement(piece, deck, [first.frame]).frame).not.toEqual(first.frame);
    }
  });
});

describe('an animation that is a line (ADR-131)', () => {
  it('is the boxes on a path and the flowing connector', () => {
    expect(lines.map((p) => p.id)).toEqual(['conveyor', 'flowArrow']);
  });

  it.each(lines.map((piece) => [piece.id, piece] as const))(
    '%s lands as a line from end to end of its frame, in the theme colours, flowing',
    (_id, piece) => {
      const deck = createDeck({ lang: 'en' });
      const element = motionElement(piece, deck);
      expect(elementSchemas.line.safeParse(element).success).toBe(true);
      expect(element.name).toBe(`animation-${piece.id}`);
      expect(element.frame).toEqual({
        x: Math.round((1920 - piece.size.w) / 2),
        y: Math.round((1080 - piece.size.h) / 2),
        ...piece.size,
      });
      // Its points span its frame, which has no room of its own around them: the line is
      // what is selected, by its ends.
      const xs = element.points.map((p) => p.x);
      const ys = element.points.map((p) => p.y);
      expect([Math.min(...xs), Math.max(...xs)]).toEqual([0, piece.size.w]);
      expect([Math.min(...ys), Math.max(...ys)]).toEqual([0, piece.size.h]);
      expect(element.curve).toBe('curved');
      // The theme's colours, and dashes that something runs along.
      expect(element.stroke.color).toHaveProperty('token');
      if (element.flow?.color) expect(element.flow.color).toHaveProperty('token');
      expect(element.stroke.dash).toBe('dashed');
      expect(element.flow?.speed).toBeGreaterThan(0);
      // A copy of its own: changing it does not change the catalogue.
      element.points[0]!.x = 999;
      element.flow!.speed = 1;
      expect(piece.line.points[0]!.x).not.toBe(999);
      expect(piece.line.flow.speed).not.toBe(1);
    },
  );

  it('carries boxes on the path, and only dashes on the connector', () => {
    const conveyor = lines.find((p) => p.id === 'conveyor')!;
    expect(conveyor.line.flow).toMatchObject({ rider: 'box', count: 4 });
    expect(conveyor.line.startHead).toBe('none');
    expect(conveyor.line.endHead).toBe('none');
    const arrow = lines.find((p) => p.id === 'flowArrow')!;
    expect(arrow.line.flow.rider ?? 'none').toBe('none');
    expect(arrow.line.endHead).toBe('triangle');
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
    motionElement(pictures[0]!, createDeck({ lang: dir === 'rtl' ? 'he' : 'en' }));

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

describe('reading the catalogs of the library (ADR-138)', () => {
  const name = { he: 'גלים', en: 'Waves', fr: 'Vagues' };
  const picture = '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 40 20"><path/></svg>';
  const line = {
    points: [
      { x: 0, y: 10 },
      { x: 40, y: 10 },
    ],
    stroke: { color: { token: 'primary' }, width: 4, dash: 'dashed' },
    startHead: 'none',
    endHead: 'triangle',
    curve: 'straight',
    flow: { speed: 60 },
  };

  it('takes the backgrounds it can draw, in their order, each once', () => {
    const read = backgroundsOf({
      version: 1,
      backgrounds: [
        { id: 'b', name, animated: true, sided: false, markup: picture },
        { id: 'a', name, animated: false, sided: true, markup: picture },
        { id: 'b', name, animated: false, sided: false, markup: picture },
        { id: 'unnamed', name: { he: 'רק עברית' }, animated: true, sided: true, markup: picture },
        { id: 'not-a-picture', name, animated: true, sided: true, markup: '<div/>' },
        { id: 'no-flags', name, markup: picture },
      ],
      later: 'a field of a later library',
    });
    expect(read.map((b) => [b.id, b.animated, b.sided])).toEqual([
      ['b', true, false],
      ['a', false, true],
    ]);
    expect(backgroundsOf(undefined)).toEqual([]);
    expect(backgroundsOf({ backgrounds: 'none' })).toEqual([]);
  });

  it('takes pictures, lines and animated shapes, and names each picture by its animation', () => {
    const read = animationsOf({
      version: 1,
      animations: [
        { id: 'p', name, group: 'spin', size: { w: 40, h: 20 }, reads: false, markup: picture },
        { id: 'l', name, group: 'lines', size: { w: 40, h: 20 }, reads: true, line },
        {
          id: 'grouped',
          name,
          group: 'nowhere',
          size: { w: 1, h: 1 },
          reads: false,
          markup: picture,
        },
        { id: 'flat', name, group: 'spin', size: { w: 0, h: 20 }, reads: false, markup: picture },
        {
          id: 'bent',
          name,
          group: 'lines',
          size: { w: 40, h: 20 },
          reads: true,
          line: { ...line, points: [] },
        },
      ],
      shapes: [
        {
          id: 'ring',
          name,
          preset: 'ellipse',
          side: 260,
          look: 'dashed',
          ink: 'primary',
          ambient: { kind: 'spin', duration: 8000 },
        },
        {
          id: 'arrow',
          name,
          preset: 'arrowRight',
          side: 260,
          aspect: 2,
          look: 'fill',
          ink: 'accent',
          ambient: { kind: 'swing', duration: 2400 },
          reads: true,
        },
        {
          id: 'muddy',
          name,
          preset: 'ellipse',
          side: 260,
          look: 'fill',
          ink: 'text',
          ambient: { kind: 'spin', duration: 1 },
        },
        {
          id: 'still',
          name,
          preset: 'ellipse',
          side: 260,
          look: 'fill',
          ink: 'primary',
          ambient: { kind: 'wobble', duration: 1 },
        },
      ],
    });
    expect(read.pieces.map((p) => [p.id, p.kind])).toEqual([
      ['p', 'picture'],
      ['l', 'line'],
    ]);
    const [p] = read.pieces;
    expect(p?.kind === 'picture' && p.markup).toBe(
      picture.replace('<svg ', `<svg `).replace('">', `" ${PIECE_ATTRIBUTE}="p">`),
    );
    expect(read.shapes.map((s) => s.id)).toEqual(['ring', 'arrow']);
    expect(read.shapes[1]).toMatchObject({ aspect: 2, reads: true });
    expect(animationsOf(null)).toEqual({ pieces: [], shapes: [] });
  });

  it('names an item in the language asked, else in English', () => {
    const [background] = backgroundsOf({
      backgrounds: [{ id: 'b', name, animated: true, sided: false, markup: picture }],
    });
    expect(motionName(background!, 'fr-CA')).toBe('Vagues');
    expect(motionName(background!, 'he')).toBe('גלים');
    expect(motionName(background!, 'ja')).toBe('Waves');
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
