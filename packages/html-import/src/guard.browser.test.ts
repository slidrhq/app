/**
 * Does the fidelity guard catch real errors? Its thresholds let rendering noise through; this
 * checks the other side (ADR-005). A slide is converted, then damaged the ways a converter
 * bug could damage it, and the guard has to reject every damaged copy.
 */
import { createDeck, type Color, type Element as ModelElement } from '@slidr/model';
import { beforeAll, describe, expect, it } from 'vitest';
import { page } from 'vitest/browser';
import type { Item, Proposal } from './convert';
import { parseColor, toHex } from './css';
import { startConversion, type Conversion } from './engine';
import * as fixtures from './fixtures';
import { loadHtml } from './service';
import { foreignFrame, testHost, testImage } from './testing';

type Damage = (proposal: Proposal) => void | 'skip';

const texts = (p: Proposal) => p.items.filter((i) => i.element.type === 'text');
const firstText = (p: Proposal) => texts(p)[0];
/** The text with the most lines: the one a narrower box re-wraps. */
const wrapped = (p: Proposal) =>
  texts(p).reduce<Item | undefined>(
    (best, i) => ((i.lines?.length ?? 0) > (best?.lines?.length ?? 1) ? i : best),
    undefined,
  );
const firstOf = (p: Proposal, ...types: ModelElement['type'][]) =>
  p.items.find((i) => types.includes(i.element.type));

/** Ten steps of 255 away from the nearer end, per channel: a colour a little off. */
function nudge(color: Color): Color {
  const rgba = parseColor('value' in color ? color.value : '#000000');
  if (!rgba) return color;
  const shift = (v: number) => (v > 128 ? v - 10 : v + 10);
  return { value: toHex({ ...rgba, r: shift(rgba.r), g: shift(rgba.g), b: shift(rgba.b) }) };
}

function runsOf(item: Item | undefined) {
  return item?.element.type === 'text'
    ? item.element.content.paragraphs.flatMap((p) => p.runs)
    : [];
}

const DAMAGES: [string, Damage][] = [
  [
    'text colour a little off',
    (p) => {
      for (const run of runsOf(firstText(p)))
        run.marks = { ...run.marks, color: nudge(run.marks?.color ?? { value: '#000000' }) };
    },
  ],
  [
    'text weight 400 <-> 700',
    (p) => {
      for (const run of runsOf(firstText(p)))
        run.marks = { ...run.marks, weight: (run.marks?.weight ?? 700) >= 600 ? 400 : 700 };
    },
  ],
  [
    'text 4% larger',
    (p) => {
      for (const run of runsOf(firstText(p))) {
        if (!run.marks?.size) return 'skip';
        run.marks = { ...run.marks, size: run.marks.size * 1.04 };
      }
    },
  ],
  [
    'text moved 3px down',
    (p) => {
      const item = firstText(p);
      if (!item) return 'skip';
      item.element.frame = { ...item.element.frame, y: item.element.frame.y + 3 * p.space.k };
    },
  ],
  [
    'text box 12% narrower (re-wraps)',
    (p) => {
      const item = wrapped(p);
      if (!item || item.element.type !== 'text') return 'skip';
      item.element.frame = { ...item.element.frame, w: item.element.frame.w * 0.88 };
    },
  ],
  [
    'one text element missing',
    (p) => {
      const item = firstText(p);
      if (!item) return 'skip';
      p.items.splice(p.items.indexOf(item), 1);
    },
  ],
  [
    'last character of a text dropped',
    (p) => {
      const runs = runsOf(wrapped(p) ?? firstText(p));
      const last = runs[runs.length - 1];
      if (!last) return 'skip';
      last.text = last.text.slice(0, -1);
    },
  ],
  [
    'box moved 4px right',
    (p) => {
      const item = firstOf(p, 'shape', 'image');
      if (!item) return 'skip';
      item.element.frame = { ...item.element.frame, x: item.element.frame.x + 4 * p.space.k };
    },
  ],
  [
    'box fill a little off',
    (p) => {
      const e = firstOf(p, 'shape')?.element;
      if (e?.type !== 'shape' || e.fill.kind !== 'solid') return 'skip';
      e.fill = { kind: 'solid', color: nudge(e.fill.color) };
    },
  ],
  [
    'box shadow removed',
    (p) => {
      const e = p.items.find((i) => i.element.effects?.shadow)?.element;
      if (!e?.effects) return 'skip';
      const { shadow: _shadow, ...rest } = e.effects;
      e.effects = rest;
    },
  ],
  [
    'corner radius removed',
    (p) => {
      const e = p.items.find((i) => i.element.effects?.radius)?.element;
      if (!e?.effects) return 'skip';
      const { radius: _radius, ...rest } = e.effects;
      e.effects = rest;
    },
  ],
  [
    'image missing',
    (p) => {
      const item = firstOf(p, 'image');
      if (!item) return 'skip';
      p.items.splice(p.items.indexOf(item), 1);
    },
  ],
  [
    'background colour a little off',
    (p) => {
      const fill = p.background?.fill;
      if (fill?.kind !== 'solid') return 'skip';
      p.background = { fill: { kind: 'solid', color: nudge(fill.color) } };
    },
  ],
];

/** Damages the proposal in every way, judging after each, and restores it in between. */
async function injectErrors(
  conversion: Conversion,
): Promise<{ caught: string[]; missed: string[] }> {
  const { proposal } = conversion;
  const caught: string[] = [];
  const missed: string[] = [];
  for (const [name, damage] of DAMAGES) {
    const items = [...proposal.items];
    const elements = items.map((i) => structuredClone(i.element));
    const background = proposal.background;
    if (damage(proposal) !== 'skip') {
      // `fit: false`: a moved text box is an error to catch here, not a box to move back.
      const verdict = await conversion.judge({ fit: false });
      (verdict.faithful ? missed : caught).push(name);
    }
    proposal.items = items;
    items.forEach((item, i) => (item.element = elements[i]!));
    if (background) proposal.background = background;
    else delete proposal.background;
  }
  return { caught, missed };
}

describe('the guard against injected errors', () => {
  const host = testHost();
  let png = '';

  beforeAll(async () => {
    await page.viewport(1920, 1080);
    png = testImage(640, 400);
  });

  it('catches every error on a slide written at 1920', async () => {
    const deck = createDeck({ lang: 'en' });
    const loaded = await loadHtml(fixtures.guarded(png), deck, host, deck.size);
    const conversion = await startConversion(loaded.root, {
      deck,
      host,
      foreign: false,
      behind: 'slide',
    });
    try {
      const report = await conversion.guard();
      expect(report).toMatchObject({ faithful: true, fallbacks: [], exact: true });
      const { caught, missed } = await injectErrors(conversion);
      console.log(
        `guard, slide at 1920: caught ${caught.length} of ${caught.length + missed.length}; missed: ${missed.join(', ') || 'none'}`,
      );
      expect(missed).toEqual([]);
      expect(caught).toHaveLength(DAMAGES.length);
      // The undamaged slide is still accepted afterwards.
      expect((await conversion.judge({ fit: false })).faithful).toBe(true);
    } finally {
      conversion.dispose();
      loaded.dispose();
    }
  });

  it('catches every error on a page of another size, compared in its own units', async () => {
    const deck = createDeck({ lang: 'he' });
    const frame = await foreignFrame(fixtures.foreignPage, { w: 1400, h: 800 });
    const conversion = await startConversion(frame.document.querySelector('section')!, {
      deck,
      host,
      foreign: true,
      behind: 'page',
    });
    try {
      const report = await conversion.guard();
      expect(report).toMatchObject({ faithful: true, exact: true });
      const { caught, missed } = await injectErrors(conversion);
      console.log(
        `guard, 1280x720 page (k = 1.5): caught ${caught.length} of ${caught.length + missed.length}; missed: ${missed.join(', ') || 'none'}`,
      );
      expect(missed).toEqual([]);
    } finally {
      conversion.dispose();
      frame.dispose();
    }
  });

  it('catches most errors on a source that is shown through a scale', async () => {
    const deck = createDeck({ lang: 'en' });
    const frame = await foreignFrame(fixtures.scaledPage, { w: 1400, h: 800 });
    const conversion = await startConversion(frame.document.querySelector('.stage')!, {
      deck,
      host,
      foreign: true,
      behind: 'page',
    });
    try {
      const report = await conversion.guard();
      expect(report.faithful).toBe(true);
      // Such a source cannot be compared exactly (ADR-005), and the report says so.
      expect(report.exact).toBe(false);
      const { caught, missed } = await injectErrors(conversion);
      console.log(
        `guard, source scaled to 0.9: caught ${caught.length} of ${caught.length + missed.length}; missed: ${missed.join(', ') || 'none'}`,
      );
      expect(caught.length).toBeGreaterThanOrEqual(
        Math.ceil((caught.length + missed.length) * 0.5),
      );
    } finally {
      conversion.dispose();
      frame.dispose();
    }
  });
});

/** Glints of many colours, softened as a lens does, on a dark ground: the fine detail of a photo. */
function glinting(width: number, height: number): OffscreenCanvas {
  let seed = 7;
  const random = () => {
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const canvas = new OffscreenCanvas(width, height);
  const ctx = canvas.getContext('2d')!;
  ctx.fillStyle = '#3a0d2a';
  ctx.fillRect(0, 0, width, height);
  ctx.filter = 'blur(1px)';
  for (let i = 0; i < 60_000; i++) {
    ctx.fillStyle = `hsl(${Math.floor(random() * 360)} 90% ${45 + Math.floor(random() * 50)}%)`;
    ctx.fillRect(random() * width, random() * height, 1 + random() * 3, 1 + random() * 3);
  }
  return canvas;
}

/**
 * The picture at half its size, by the canvas's best filter, and mirrored on request. `dx` moves
 * it that much to the left, and it is drawn as much wider, so that it still fills its box.
 */
async function halved(picture: OffscreenCanvas, dx: number, mirrored = false): Promise<string> {
  const canvas = new OffscreenCanvas(picture.width / 2, picture.height / 2);
  const ctx = canvas.getContext('2d')!;
  ctx.imageSmoothingQuality = 'high';
  if (mirrored) ctx.setTransform(-1, 0, 0, 1, canvas.width, 0);
  ctx.drawImage(picture, -dx, 0, canvas.width + 2 * dx, canvas.height);
  return URL.createObjectURL(await canvas.convertToBlob({ type: 'image/png' }));
}

describe('the guard on a photo the browser resamples', () => {
  it('takes the photo however it was resampled, and still not another photo', async () => {
    const deck = createDeck({ lang: 'en' });
    deck.assets.photo = {
      id: 'photo',
      file: 'photo.png',
      mime: 'image/png',
      kind: 'image',
      origin: 'ai',
      bytes: 0,
      width: 940,
      height: 1672,
    };
    const photo = glinting(940, 1672);
    const full = URL.createObjectURL(await photo.convertToBlob({ type: 'image/png' }));
    // The source draws the photo at half its size, which this browser does as the mean of every
    // four pixels. The slide is handed it already halved another way and a quarter pixel over:
    // what another of the browser's ways of drawing it comes to.
    const other = await halved(photo, 0.25);
    const mirrored = await halved(photo, 0, true);
    let url = full;
    const base = testHost();
    const host = { ...base, resolveAsset: () => url };
    const html = `<div style="position:relative;width:1920px;height:1080px;background:#ffffff">
      <img data-asset="photo" style="position:absolute;left:144px;top:72px;width:470px;height:836px;object-fit:cover;border-radius:24px">
    </div>`;
    const loaded = await loadHtml(html, deck, host, deck.size);
    url = other;
    const conversion = await startConversion(loaded.root, {
      deck,
      host,
      foreign: false,
      behind: 'slide',
    });
    try {
      const item = conversion.proposal.items.find((i) => i.element.type === 'image')!;
      expect(item.resampled).toBe(true);
      expect((await conversion.judge({ fit: false })).faithful).toBe(true);
      // Held to the strict threshold, the same photo would be another one.
      item.resampled = false;
      expect((await conversion.judge({ fit: false })).faithful).toBe(false);
      item.resampled = true;

      const frame = item.element.frame;
      item.element.frame = { ...frame, x: frame.x + 4 };
      expect((await conversion.judge({ fit: false })).faithful).toBe(false);
      item.element.frame = frame;
      const effects = item.element.effects;
      expect(effects?.radius).toBe(24);
      delete item.element.effects;
      expect((await conversion.judge({ fit: false })).faithful).toBe(false);
      item.element.effects = effects;
      url = mirrored;
      expect((await conversion.judge({ fit: false })).faithful).toBe(false);
    } finally {
      conversion.dispose();
      loaded.dispose();
      for (const made of [full, other, mirrored]) URL.revokeObjectURL(made);
    }
  });
});
