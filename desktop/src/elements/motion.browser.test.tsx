import { createDeck, createSlide, type Deck, type Slide } from '@slidr/model';
import { SlideRenderer } from '@slidr/renderer';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { backgroundCommands, motionElement } from './motion';
import { motionBackgrounds } from './motionBackgrounds';
import { motionPictures, motionPieces, type LinePiece } from './motionPieces';

/*
 * The animations and the backgrounds of Elements (ADR-127) as the renderer draws them, in Edge:
 * the cleaning of a picture (`picture.ts`) keeps what makes them move, they move, and they are in
 * the theme's colours. What they are made of is `motion.test.ts`.
 */

let root: Root | undefined;
let host: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = host = undefined;
});

function draw(deck: Deck, slide: Slide): ShadowRoot {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  flushSync(() => root!.render(<SlideRenderer deck={deck} slide={slide} mode="present" />));
  const picture = host.querySelector('[data-slidr-svg]')?.shadowRoot;
  if (!picture) throw new Error('the picture was not drawn');
  return picture;
}

/** The picture held at `seconds`: its CSS animations and its SMIL timeline both. */
function at(picture: ShadowRoot, seconds: number): string {
  const svg = picture.querySelector('svg')!;
  svg.pauseAnimations();
  svg.setCurrentTime(seconds);
  for (const animation of picture.getAnimations()) {
    animation.pause();
    animation.currentTime = seconds * 1000;
  }
  // Where each part is and how it is painted: what a viewer sees change.
  return Array.from(svg.querySelectorAll('*'))
    .filter((el) => el instanceof SVGGraphicsElement)
    .map((el) => {
      const box = el.getBoundingClientRect();
      const style = getComputedStyle(el);
      return [
        box.x.toFixed(1),
        box.y.toFixed(1),
        box.width.toFixed(1),
        style.opacity,
        style.strokeDashoffset,
        el.getAttribute('d')?.length ?? '',
      ].join(',');
    })
    .join(';');
}

const SMIL = 'animate, animateMotion, animateTransform';

describe('an animation drawn on a slide', () => {
  it.each(motionPictures().map((piece) => [piece.id, piece] as const))(
    '%s keeps its motion through the cleaning, and moves',
    (_id, piece) => {
      const deck = createDeck({ lang: 'en' });
      const element = motionElement(piece, deck);
      const picture = draw(deck, createSlide({ elements: [element] }));
      const svg = picture.querySelector('svg')!;
      // Everything that moves it is still there.
      const source = new DOMParser().parseFromString(piece.markup, 'image/svg+xml');
      expect(svg.querySelectorAll(SMIL).length).toBe(source.querySelectorAll(SMIL).length);
      if (piece.markup.includes('@keyframes')) {
        expect(picture.querySelector('style')?.textContent).toContain('@keyframes');
        expect(picture.getAnimations().length).toBeGreaterThan(0);
      }
      expect(at(picture, 1)).not.toBe(at(picture, 2.3));
    },
  );

  it('paints in the colours of the theme', () => {
    const deck = createDeck({ lang: 'en' });
    deck.theme.colors.text = '#123456';
    deck.theme.colors.accent = '#e11d48';
    const orbit = motionPictures().find((piece) => piece.id === 'orbit')!;
    const picture = draw(deck, createSlide({ elements: [motionElement(orbit, deck)] }));
    // The dots that travel are hidden until SMIL shows them, and it does.
    at(picture, 1);
    const travelling = Array.from(
      picture.querySelectorAll('animateMotion'),
      (m) => m.parentElement!,
    );
    expect(travelling.length).toBe(3);
    for (const dot of travelling) expect(getComputedStyle(dot).opacity).toBe('1');
    const fills = Array.from(picture.querySelectorAll('circle'), (c) => getComputedStyle(c).fill);
    expect(fills).toContain('rgb(18, 52, 86)');
    expect(fills).toContain('rgb(225, 29, 72)');
    expect(fills).not.toContain('rgb(21, 33, 63)');
  });

  it('fills a frame far wider than its drawing with waves, from side to side', () => {
    const deck = createDeck({ lang: 'en' });
    const waves = motionPictures().find((piece) => piece.id === 'waves')!;
    // As wide as the slide and 60 high: 32 times as wide as high, the widest they are made for.
    const element = { ...motionElement(waves, deck), frame: { x: 0, y: 500, w: 1920, h: 60 } };
    const picture = draw(deck, createSlide({ elements: [element] }));
    const frame = (picture.host as HTMLElement).getBoundingClientRect();
    const lines = Array.from(picture.querySelectorAll('path'));
    expect(lines).toHaveLength(3);
    // Wherever each line is in its roll, it runs past both sides of the frame.
    for (const seconds of [0, 1.3, 2.5]) {
      at(picture, seconds);
      for (const line of lines) {
        const box = line.getBoundingClientRect();
        expect(box.left).toBeLessThan(frame.left);
        expect(box.right).toBeGreaterThan(frame.right);
      }
    }
    // It fades at the sides of the frame, over as much of its height as the drawing does (0.448
    // of 60), not over 16% of its width.
    const fade = getComputedStyle(picture.querySelector('svg')!).maskImage;
    expect(fade).toContain('min(16%, 26.88px)');
  });
});

describe('an animation that is a line (ADR-131)', () => {
  const lines = motionPieces().filter((piece): piece is LinePiece => piece.kind === 'line');

  it('is the boxes on a path and the flowing connector', () => {
    expect(lines.map((piece) => piece.id)).toEqual(['conveyor', 'flowArrow']);
  });

  it.each(lines.map((piece) => [piece.id, piece] as const))(
    '%s is drawn as a line whose dashes flow, with its riders on it',
    (_id, piece) => {
      const deck = createDeck({ lang: 'en' });
      deck.theme.colors.secondary = '#123456';
      const element = motionElement(piece, deck);
      host = document.createElement('div');
      document.body.append(host);
      root = createRoot(host);
      flushSync(() =>
        root!.render(
          <SlideRenderer deck={deck} slide={createSlide({ elements: [element] })} mode="present" />,
        ),
      );
      const box = host.querySelector(`[data-element-id="${element.id}"]`)!;
      // A line, not a picture: nothing of it is in a shadow root.
      expect(box.querySelector('[data-slidr-svg]')).toBeNull();
      const stroke = box.querySelector<SVGPathElement>('svg > path')!;
      expect(getComputedStyle(stroke).stroke).toBe('rgb(18, 52, 86)');
      const flows = stroke.getAnimations() as CSSAnimation[];
      expect(flows.map((animation) => animation.animationName)).toEqual(['slidr-flow']);
      const riders = Array.from(box.querySelectorAll('[data-slidr-riders] > g'));
      const { flow } = piece.line;
      expect(riders).toHaveLength(flow.rider && flow.rider !== 'none' ? (flow.count ?? 3) : 0);
      for (const rider of riders) {
        expect((rider.getAnimations()[0] as CSSAnimation).animationName).toBe('slidr-ride');
      }
    },
  );
});

describe('a background drawn behind a slide', () => {
  it.each(motionBackgrounds().map((background) => [background.id, background] as const))(
    '%s keeps its drawing through the cleaning, and moves if it should',
    (_id, background) => {
      const deck = createDeck({ lang: 'he' });
      const slide = createSlide({ id: 's1' });
      deck.slides.push(slide);
      const [command] = backgroundCommands(deck, ['s1'], background);
      if (command?.type !== 'slide.update') throw new Error('no background');
      const picture = draw(deck, { ...slide, background: command.patch.background! });
      const drawn = picture.querySelector('svg')!.getBoundingClientRect();
      expect([Math.round(drawn.width), Math.round(drawn.height)]).toEqual([1920, 1080]);
      if (background.animated) expect(at(picture, 1)).not.toBe(at(picture, 2.3));
      else expect(at(picture, 1)).toBe(at(picture, 2.3));
    },
  );
});
