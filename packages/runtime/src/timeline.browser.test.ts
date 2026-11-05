import { afterEach, expect, test } from 'vitest';
import { createTimeline } from './timeline';
import type { AnimationStep } from './types';

// A timeline with real Web Animations: what an element looks like while it waits for its
// entrance, and while it comes in. happy-dom computes no animated style, so the unit tests cannot
// see either.

afterEach(() => {
  document.body.innerHTML = '';
});

const size = { w: 1920, h: 1080 };

function step(init: Partial<AnimationStep>): AnimationStep {
  return {
    id: 'a_card',
    elementId: 'card',
    trigger: 'withPrevious',
    category: 'entrance',
    preset: 'fade',
    duration: 800,
    delay: 400,
    easing: 'linear',
    ...init,
  };
}

/**
 * A card at half opacity with a part that says `visibility: visible` of itself, as the copied
 * markup of an `html` element does; and the slide's own keyframes, in a layer as the renderer
 * writes a slide's `css`.
 */
function slide(): { root: HTMLElement; card: HTMLElement; part: HTMLElement } {
  document.body.innerHTML = `
    <div data-slide-id="s" dir="ltr" style="position:relative;width:1920px;height:1080px">
      <style>@layer { @keyframes kin { from { opacity: 0; transform: translateY(80px); } to { opacity: 1; transform: none; } } }</style>
      <div data-element-id="card" style="position:absolute;left:200px;top:200px;width:400px;height:300px;opacity:0.5;background:#246">
        <p id="part" style="visibility:visible;margin:0">Kept as html</p>
      </div>
    </div>`;
  return {
    root: document.querySelector('[data-slide-id]')!,
    card: document.querySelector('[data-element-id="card"]')!,
    part: document.querySelector('#part')!,
  };
}

const opacity = (el: Element) => Number(getComputedStyle(el).opacity);

test.each(['fade', 'css:kin'])(
  'an element waiting for its entrance shows nothing of itself, and comes in to its own opacity (%s)',
  async (preset) => {
    const { root, card, part } = slide();
    const timeline = createTimeline(root, [step({ preset })], {
      size,
      onWarn: (m) => expect.fail(m),
    });
    timeline.apply(0);
    // Hidden, and transparent too: the part that says it is visible does not show through.
    expect(getComputedStyle(card).visibility).toBe('hidden');
    expect(opacity(card)).toBe(0);
    const playing = timeline.play(0);
    const at = (ms: number) => {
      for (const animation of card.getAnimations()) {
        animation.pause();
        animation.currentTime = ms;
      }
    };
    at(200);
    expect(opacity(card)).toBe(0);
    expect(getComputedStyle(part).visibility).toBe('visible');
    // Half way through its 800 ms, from 0 to its own 0.5.
    at(800);
    expect(opacity(card)).toBeCloseTo(0.25, 2);
    at(1200);
    timeline.finish();
    await playing;
    expect(opacity(card)).toBe(0.5);
    expect(getComputedStyle(card).visibility).toBe('visible');
  },
);

/* ---------------------------------------------------------------- out of use and back */

const SHADOW = 'drop-shadow(rgb(0, 0, 0) 0px 4px 8px)';
const DISABLED = 'grayscale(1) opacity(0.4)';

/**
 * A card with a shadow, drawn in use or, as the renderer draws a `disabled` element, with the grey
 * at the end of its filter and the attribute that says so; and a text of two paragraphs.
 */
function useSlide(disabled: boolean): { root: HTMLElement; card: HTMLElement; text: HTMLElement } {
  const filter = disabled ? `${SHADOW} ${DISABLED}` : SHADOW;
  document.body.innerHTML = `
    <div data-slide-id="s" dir="ltr" style="position:relative;width:1920px;height:1080px">
      <div data-element-id="card" ${disabled ? 'data-slidr-disabled=""' : ''}
        style="position:absolute;left:200px;top:200px;width:400px;height:300px;background:#246;filter:${filter}"></div>
      <div data-element-id="text" style="position:absolute;left:800px;top:200px;width:600px">
        <p style="margin:0">First point</p>
        <p style="margin:0">Second point</p>
      </div>
    </div>`;
  return {
    root: document.querySelector('[data-slide-id]')!,
    card: document.querySelector('[data-element-id="card"]')!,
    text: document.querySelector('[data-element-id="text"]')!,
  };
}

const filterOf = (el: Element) => getComputedStyle(el).filter;

/** Every animation of the slide paused at `ms` from the start of the group. */
function seek(root: HTMLElement, ms: number): void {
  for (const animation of root.getAnimations({ subtree: true })) {
    animation.pause();
    animation.currentTime = ms;
  }
}

const switchStep = (preset: 'disable' | 'enable', init: Partial<AnimationStep> = {}) =>
  step({ id: `a_${preset}`, category: 'emphasis', preset, delay: 0, ...init });

test('disable greys an element out of use, and it stays so until the timeline goes back', async () => {
  const { root, card } = useSlide(false);
  const timeline = createTimeline(root, [switchStep('disable')], {
    size,
    onWarn: (m) => expect.fail(m),
  });
  timeline.apply(0);
  expect(filterOf(card)).toBe(SHADOW);
  const playing = timeline.play(0);
  // Half way: half grey, and faded half of the way to 0.4. The shadow stays under it.
  seek(root, 400);
  expect(filterOf(card)).toBe(`${SHADOW} grayscale(0.5) opacity(0.7)`);
  timeline.finish();
  await playing;
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
  // Back a step: as the renderer drew it, with nothing holding it.
  timeline.apply(0);
  expect(filterOf(card)).toBe(SHADOW);
  timeline.apply(1);
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
  timeline.clear();
  expect(filterOf(card)).toBe(SHADOW);
  expect(card.getAnimations()).toEqual([]);
});

test('enable brings an element drawn out of use back, from the look the renderer gave it', async () => {
  const { root, card } = useSlide(true);
  const timeline = createTimeline(root, [switchStep('enable', { trigger: 'onClick' })], {
    size,
    onWarn: (m) => expect.fail(m),
  });
  expect(timeline.clicks).toBe(1);
  timeline.apply(0);
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
  const playing = timeline.play(1);
  seek(root, 200);
  expect(filterOf(card)).toBe(`${SHADOW} grayscale(0.75) opacity(0.55)`);
  timeline.finish();
  await playing;
  expect(filterOf(card)).toBe(SHADOW);
  timeline.clear();
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
});

test('a step that leaves an element as it stands does not flash it the other way', async () => {
  const { root, card } = useSlide(true);
  const timeline = createTimeline(root, [switchStep('disable')], {
    size,
    onWarn: (m) => expect.fail(m),
  });
  timeline.apply(0);
  const playing = timeline.play(0);
  seek(root, 400);
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
  timeline.finish();
  await playing;
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
});

test('out of use and back again: each click takes it from where the one before left it', async () => {
  const { root, card } = useSlide(false);
  const timeline = createTimeline(
    root,
    [
      switchStep('disable', { trigger: 'onClick' }),
      switchStep('enable', { id: 'a_back', trigger: 'onClick' }),
    ],
    { size, onWarn: (m) => expect.fail(m) },
  );
  expect(timeline.clicks).toBe(2);
  // After the lead-in and both clicks: in use again, as drawn.
  timeline.apply(3);
  expect(filterOf(card)).toBe(SHADOW);
  timeline.apply(2);
  expect(filterOf(card)).toBe(`${SHADOW} ${DISABLED}`);
  const playing = timeline.play(2);
  seek(root, 400);
  expect(filterOf(card)).toBe(`${SHADOW} grayscale(0.5) opacity(0.7)`);
  timeline.finish();
  await playing;
  expect(filterOf(card)).toBe(SHADOW);
});

test('by paragraph, a click takes one paragraph out of use, and the ones before stay so', () => {
  const { root, text } = useSlide(false);
  const [first, second] = Array.from(text.querySelectorAll('p'));
  const timeline = createTimeline(
    root,
    [switchStep('disable', { elementId: 'text', trigger: 'onClick', textBy: 'paragraph' })],
    { size, onWarn: (m) => expect.fail(m) },
  );
  expect(timeline.clicks).toBe(2);
  timeline.apply(1);
  expect(filterOf(first!)).toBe('none');
  timeline.apply(2);
  expect(filterOf(first!)).toBe(DISABLED);
  expect(filterOf(second!)).toBe('none');
  expect(filterOf(text)).toBe('none');
  timeline.apply(3);
  expect(filterOf(first!)).toBe(DISABLED);
  expect(filterOf(second!)).toBe(DISABLED);
});

test('word by word, a step that takes a text out of use takes the whole of it', () => {
  const { root, text } = useSlide(false);
  const timeline = createTimeline(
    root,
    [switchStep('disable', { elementId: 'text', trigger: 'onClick', textBy: 'word' })],
    { size, onWarn: (m) => expect.fail(m) },
  );
  expect(timeline.clicks).toBe(1);
  timeline.apply(2);
  expect(filterOf(text)).toBe(DISABLED);
});
