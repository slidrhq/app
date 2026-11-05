import { createDeck, createSlide, type Deck, type Element, type SvgElement } from '@slidr/model';
import { SlideRenderer } from '@slidr/renderer';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import { motionElement, pieceMarkup } from './motion';
import { motionPictures } from './motionPieces';
import { MOTION_SHAPES, motionShapeElement } from './motionShapes';

/*
 * ADR-128 in Edge: an animated shape moves on a slide by its motion, and an animation of
 * Elements at another speed runs its parts in as much less time. What they are made of is
 * `ambient.test.ts`.
 */

let root: Root | undefined;
let host: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = host = undefined;
});

function draw(deck: Deck, elements: Element[]): HTMLElement {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  flushSync(() =>
    root!.render(<SlideRenderer deck={deck} slide={createSlide({ elements })} mode="present" />),
  );
  return host;
}

/** How the moving box of an element looks at `ms` into its motion. */
function lookAt(box: HTMLElement, ms: number): string {
  for (const animation of box.getAnimations()) {
    animation.pause();
    animation.currentTime = ms;
  }
  const style = getComputedStyle(box);
  // To a thousandth: a turn a hair's breadth from its start is where it started.
  const transform = style.transform === 'none' ? 'matrix(1, 0, 0, 1, 0, 0)' : style.transform;
  const rounded = transform.replace(/-?[\d.]+(?:e-?\d+)?/g, (n) => {
    const value = Math.round(Number(n) * 1000) / 1000;
    return String(Object.is(value, -0) ? 0 : value);
  });
  return `${rounded}|${Number(style.opacity).toFixed(3)}`;
}

describe('an animated shape drawn on a slide', () => {
  it.each(MOTION_SHAPES.map((shape) => [shape.id, shape] as const))(
    '%s moves by its motion',
    (_id, shape) => {
      const deck = createDeck({ lang: 'en' });
      const element = motionShapeElement(shape, deck);
      const slide = draw(deck, [element]);
      const moving = slide.querySelector<HTMLElement>(
        `[data-element-id="${element.id}"] > [data-slidr-ambient]`,
      )!;
      expect(moving).not.toBeNull();
      const [animation, ...more] = moving.getAnimations();
      expect(more).toHaveLength(0);
      expect(animation!.playState).toBe('running');
      expect(animation!.effect!.getTiming().duration).toBe(shape.ambient.duration);
      // Early in its round it has moved (a swing that pauses has swung out by an eighth); at
      // the end of a round it is back where it started.
      expect(lookAt(moving, shape.ambient.duration * 0.15)).not.toBe(lookAt(moving, 0));
      expect(lookAt(moving, shape.ambient.duration - 0.01)).toBe(lookAt(moving, 0));
    },
  );
});

describe('an animation of Elements at another speed', () => {
  it('runs every part of its stylesheet in half the time at twice the speed', () => {
    const deck = createDeck({ lang: 'en' });
    const orbit = motionPictures().find((piece) => piece.id === 'orbit')!;
    const durations = (element: SvgElement) => {
      const slide = draw(deck, [element]);
      const picture = slide.querySelector('[data-slidr-svg]')!.shadowRoot!;
      const found = picture
        .getAnimations()
        .map((animation) => Number(animation.effect!.getTiming().duration))
        .sort((a, b) => a - b);
      root!.unmount();
      host!.remove();
      root = host = undefined;
      return found;
    };
    const element = motionElement(orbit, deck);
    const own = durations(element);
    expect(own.length).toBeGreaterThan(0);
    const fast = durations({ ...element, markup: pieceMarkup(orbit, 2) });
    expect(fast).toEqual(own.map((ms) => ms / 2));
  });
});
