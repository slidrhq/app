import { createDeck, createElement, createSlide, type Deck, type Slide } from '@slidr/model';
import { Activity } from 'react';
import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it } from 'vitest';
import type { RenderMode } from './context';
import { SlideRenderer } from './SlideRenderer';
import { STILL_AT, STILL_ATTRIBUTE } from './still';

/*
 * A thumbnail holds still what moves by itself (ADR-134), in Edge, with real animations: a
 * picture's SMIL and its CSS animations, and the motion an element repeats. The stage and a show
 * still move, and a host can play a thumbnail on purpose, as a tile of Elements does.
 */

let root: Root | undefined;
let host: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = host = undefined;
});

/** A picture that turns by CSS and travels by SMIL. */
const MOVING =
  '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100">' +
  '<style>.t{animation:t 2s linear infinite}@keyframes t{to{transform:rotate(1turn)}}</style>' +
  '<rect class="t" width="10" height="10"/>' +
  '<circle r="4"><animateMotion dur="3s" repeatCount="indefinite" path="M0 0L100 100"/></circle>' +
  '</svg>';

function movingSlide(): Slide {
  return createSlide({
    id: 's_moving',
    elements: [
      createElement.svg({ id: 'e_picture', frame: { x: 0, y: 0, w: 400, h: 400 }, markup: MOVING }),
      createElement.shape({
        id: 'e_turning',
        frame: { x: 600, y: 100, w: 200, h: 200 },
        geometry: { kind: 'preset', preset: 'hexagon' },
        ambient: { kind: 'spin', duration: 4000 },
      }),
    ],
  });
}

function draw(mode: RenderMode, slide = movingSlide(), deck: Deck = createDeck({ lang: 'en' })) {
  host = document.createElement('div');
  document.body.append(host);
  root = createRoot(host);
  flushSync(() => root!.render(<SlideRenderer deck={deck} slide={slide} mode={mode} />));
}

const picture = () => host!.querySelector('[data-slidr-svg]')!.shadowRoot!;
const turning = () =>
  host!.querySelector('[data-element-id="e_turning"] [data-slidr-ambient]')!.getAnimations()[0]!;

describe('a slide drawn as a thumbnail', () => {
  it('holds its pictures at a moment that shows them, and its elements at rest', () => {
    draw('thumbnail');
    const svg = picture().querySelector('svg')!;
    expect(svg.animationsPaused()).toBe(true);
    expect(svg.getCurrentTime()).toBeCloseTo(STILL_AT, 3);
    const css = picture().getAnimations();
    expect(css).toHaveLength(1);
    expect(css[0]!.playState).toBe('paused');
    expect(css[0]!.currentTime).toBe(STILL_AT * 1000);
    expect(turning().playState).toBe('paused');
    expect(turning().currentTime).toBe(0);
  });

  it('moves on the stage and in a show', () => {
    for (const mode of ['edit', 'present'] as const) {
      draw(mode);
      expect(picture().querySelector('svg')!.animationsPaused()).toBe(false);
      expect(picture().getAnimations()[0]!.playState).toBe('running');
      expect(turning().playState).toBe('running');
      expect(host!.querySelector(`[${STILL_ATTRIBUTE}]`)).toBeNull();
      root!.unmount();
      host!.remove();
    }
    root = host = undefined;
  });

  it('holds them again when it is shown again, where CSS animations start over', () => {
    host = document.createElement('div');
    document.body.append(host);
    root = createRoot(host);
    const deck = createDeck({ lang: 'en' });
    const slide = movingSlide();
    const show = (mode: 'visible' | 'hidden') =>
      flushSync(() =>
        root!.render(
          <Activity mode={mode}>
            <SlideRenderer deck={deck} slide={slide} mode="thumbnail" />
          </Activity>,
        ),
      );
    show('visible');
    show('hidden');
    // Hidden, the picture has no CSS animation at all: shown again, it gets new ones.
    expect(picture().getAnimations()).toHaveLength(0);
    show('visible');
    const css = picture().getAnimations();
    expect(css).toHaveLength(1);
    expect(css[0]!.playState).toBe('paused');
    expect(css[0]!.currentTime).toBe(STILL_AT * 1000);
    expect(turning().playState).toBe('paused');
  });

  it('plays when its host plays it', () => {
    draw('thumbnail');
    const svg = picture().querySelector('svg')!;
    svg.unpauseAnimations();
    for (const animation of picture().getAnimations()) animation.play();
    turning().play();
    expect(svg.animationsPaused()).toBe(false);
    expect(picture().getAnimations()[0]!.playState).toBe('running');
    expect(turning().playState).toBe('running');
  });

  it('writes the rule that holds its elements only where something moves', () => {
    draw('thumbnail', createSlide({ id: 's_still' }));
    expect(host!.querySelector(`.slidr-slide[${STILL_ATTRIBUTE}]`)).not.toBeNull();
    expect(host!.querySelector('style[data-slidr-still]')).toBeNull();
    root!.unmount();
    host!.remove();
    draw('thumbnail');
    expect(host!.querySelectorAll('style[data-slidr-still]')).toHaveLength(1);
  });
});
