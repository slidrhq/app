import { createDeck, createElement, createSlide } from '@slidr/model';
import { describe, expect, it } from 'vitest';
import { exportHtml } from './exportHtml';

/*
 * The motion an element repeats (ADR-128) in an exported file: the file carries the keyframes
 * with the slide, and the element moves there as it did on the stage, under its rotation.
 */

describe('an element that repeats a motion, in an exported file', () => {
  it('moves there by the keyframes the slide carries', async () => {
    const deck = createDeck({ lang: 'en' });
    const hexagon = createElement.shape({
      id: 'e_hexagon',
      frame: { x: 800, y: 400, w: 300, h: 260 },
      rotation: 15,
      geometry: { kind: 'preset', preset: 'hexagon' },
      fill: { kind: 'solid', color: { token: 'primary' } },
      ambient: { kind: 'spin', duration: 5000, reverse: true },
    });
    const still = createElement.shape({ id: 'e_still', frame: { x: 0, y: 0, w: 100, h: 100 } });
    deck.slides = [createSlide({ elements: [hexagon] }), createSlide({ elements: [still] })];

    const { html } = await exportHtml(deck, { loadAsset: () => Promise.resolve(undefined) });
    // Once, on the slide that has such an element.
    expect(html.match(/@keyframes slidr-spin\{/g)).toHaveLength(1);

    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:absolute;left:0;top:0;width:960px;height:540px';
    const loaded = new Promise((resolve) =>
      frame.addEventListener('load', resolve, { once: true }),
    );
    frame.srcdoc = html;
    document.body.append(frame);
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const page = frame.contentDocument!;
      const box = page.querySelector<HTMLElement>('[data-element-id="e_hexagon"]')!;
      const moving = box.querySelector<HTMLElement>(':scope > [data-slidr-ambient]')!;
      expect(moving).not.toBeNull();
      const [animation] = moving.getAnimations();
      expect((animation as CSSAnimation).animationName).toBe('slidr-spin');
      expect(animation!.effect!.getTiming().duration).toBe(5000);
      expect(animation!.effect!.getTiming().direction).toBe('reverse');
      expect(animation!.playState).toBe('running');
      // The box keeps its own turn: the motion is inside it.
      expect(getComputedStyle(box).transform).not.toBe('none');
    } finally {
      frame.remove();
    }
  });
});

describe('a line that something runs along, in an exported file', () => {
  it('flows there, its riders on its path (ADR-131)', async () => {
    const deck = createDeck({ lang: 'en' });
    const line = createElement.line({
      id: 'e_conveyor',
      frame: { x: 400, y: 400, w: 600, h: 260 },
      points: [
        { x: 0, y: 260 },
        { x: 600, y: 0 },
      ],
      stroke: { color: { token: 'secondary' }, width: 4, dash: 'dashed', cap: 'round' },
      curve: 'curved',
      flow: { speed: 120, rider: 'box', count: 3, color: { token: 'text' } },
    });
    deck.slides = [createSlide({ elements: [line] })];

    const { html } = await exportHtml(deck, { loadAsset: () => Promise.resolve(undefined) });
    expect(html.match(/@keyframes slidr-flow\{/g)).toHaveLength(1);
    expect(html.match(/@keyframes slidr-ride\{/g)).toHaveLength(1);

    const frame = document.createElement('iframe');
    frame.style.cssText = 'position:absolute;left:0;top:0;width:960px;height:540px';
    const loaded = new Promise((resolve) =>
      frame.addEventListener('load', resolve, { once: true }),
    );
    frame.srcdoc = html;
    document.body.append(frame);
    await loaded;
    await new Promise((resolve) => setTimeout(resolve, 500));
    try {
      const page = frame.contentDocument!;
      const box = page.querySelector<HTMLElement>('[data-element-id="e_conveyor"]')!;
      const stroke = box.querySelector('svg > path')!;
      const [flow] = stroke.getAnimations() as CSSAnimation[];
      expect(flow?.animationName).toBe('slidr-flow');
      expect(flow?.playState).toBe('running');
      const riders = Array.from(box.querySelectorAll('[data-slidr-riders] > g'));
      expect(riders).toHaveLength(3);
      for (const rider of riders) {
        const [ride] = rider.getAnimations() as CSSAnimation[];
        expect(ride?.animationName).toBe('slidr-ride');
        expect(ride?.playState).toBe('running');
        expect(getComputedStyle(rider).offsetPath).toContain('path(');
      }
    } finally {
      frame.remove();
    }
  });
});
