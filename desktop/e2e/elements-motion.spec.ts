import { expect, test, type Page } from '@playwright/test';
import type { LineElement, SvgElement } from '@slidr/model';
import {
  currentSlide,
  deck,
  onStage,
  openApp,
  pageProblems,
  selected,
  undo,
  undoDepth,
} from './objects-helpers';

/*
 * The animations and the backgrounds of Elements (ADR-127): pictures that move by themselves.
 * An animation lands on the slide as an object of its own, which moves, resizes and turns as any
 * other; a background goes behind the slide, its drawing over the slide's ground. Their tiles are
 * small slides in the deck's theme, still until the pointer is on them.
 */

test.afterEach(({ page }) => {
  expect(pageProblems(page)).toEqual([]);
});

async function openCollection(page: Page, id: 'animations' | 'backgrounds', lang: 'he' | 'en') {
  await openApp(page, { lang });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.locator(`[data-collection="${id}"]`).click();
  await expect(panel.locator(`[data-collection-view="${id}"]`)).toBeVisible();
  return panel;
}

/** What moves a picture on the stage: its CSS animations, and its SMIL timeline running. */
async function motionOf(page: Page, elementId: string) {
  return onStage(page, elementId)
    .locator('[data-slidr-svg]')
    .evaluate((host) => {
      const root = host.shadowRoot!;
      const svg = root.querySelector('svg')!;
      return {
        css: root.getAnimations().length,
        smil: svg.querySelectorAll('animate, animateMotion, animateTransform').length,
        paused: svg.animationsPaused(),
      };
    });
}

test('an animation lands in the middle of the slide, selected, and moves there', async ({
  page,
}) => {
  const panel = await openCollection(page, 'animations', 'en');
  const view = panel.locator('[data-collection-view="animations"]');
  // The animated shapes of ADR-128, then the five groups of pictures.
  await expect(view.locator('section[data-group]')).toHaveCount(6);
  await expect(view.locator('[data-animation]')).toHaveCount(18);
  await expect(view.getByRole('button', { name: 'Orbit', exact: true })).toBeVisible();
  await page
    .getByTestId('tool-panel')
    .screenshot({ path: 'test-results/elements/animations-en.png' });

  const before = await undoDepth(page);
  await view.locator('[data-animation="orbit"]').click();
  const element = await selected<SvgElement>(page);
  expect(element.type).toBe('svg');
  expect(element.name).toBe('animation-orbit');
  expect(element.colorOverrides).toMatchObject({ '#15213f': { token: 'text' } });
  expect(element.frame.x + element.frame.w / 2).toBeCloseTo(960, 0);
  expect(element.frame.y + element.frame.h / 2).toBeCloseTo(540, 0);
  expect(await undoDepth(page)).toBe(before + 1);
  // It moves on the stage: its stylesheet turns the rings, and SMIL takes the dots round.
  const motion = await motionOf(page, element.id);
  expect(motion.css).toBeGreaterThan(0);
  expect(motion.smil).toBeGreaterThan(0);
  expect(motion.paused).toBe(false);

  // A connector is a line (ADR-131), and runs in the reading direction of the deck: from its
  // right end in one that reads from the right, as a new line is.
  await view.locator('[data-animation="flowArrow"]').click();
  const arrow = await selected<LineElement>(page);
  expect(arrow.type).toBe('line');
  expect(arrow.name).toBe('animation-flowArrow');
  const rtl = (await deck(page)).meta.dir === 'rtl';
  const [from, to] = [arrow.points[0]!, arrow.points.at(-1)!];
  expect(rtl ? from.x > to.x : from.x < to.x).toBe(true);
  // Beside the first one, not on it.
  expect(arrow.frame).not.toEqual(element.frame);

  await undo(page);
  await undo(page);
  expect((await currentSlide(page)).elements.some((e) => e.name?.startsWith('animation-'))).toBe(
    false,
  );
});

test('boxes on a path are a line: its ends are dragged, and the boxes ride it', async ({
  page,
}) => {
  const panel = await openCollection(page, 'animations', 'en');
  const view = panel.locator('[data-collection-view="animations"]');
  const before = await undoDepth(page);
  await view.locator('[data-animation="conveyor"]').click();
  const conveyor = await selected<LineElement>(page);
  expect(conveyor).toMatchObject({
    type: 'line',
    name: 'animation-conveyor',
    curve: 'curved',
    flow: { rider: 'box', count: 4 },
  });
  expect(await undoDepth(page)).toBe(before + 1);

  // Selected as a line is: a handle on each end, and no box with handles to resize it by,
  // only the handle that turns it, as any line has.
  const surface = page.getByTestId('stage-surface');
  await expect(surface.locator('[data-line-point]')).toHaveCount(2);
  await expect(surface.locator('[data-handle]:not([data-handle="rotate"])')).toHaveCount(0);

  // Its dashes flow and four boxes ride it, on the stage.
  const running = await onStage(page, conveyor.id).evaluate((box) => ({
    dashes: box
      .querySelector('svg > path')!
      .getAnimations()
      .map((a) => (a as CSSAnimation).animationName),
    riders: Array.from(box.querySelectorAll('[data-slidr-riders] > g'), (rider) =>
      rider.getAnimations().map((a) => a.playState),
    ),
  }));
  expect(running.dashes).toEqual(['slidr-flow']);
  expect(running.riders).toEqual([['running'], ['running'], ['running'], ['running']]);
  await page.screenshot({ path: 'test-results/elements/conveyor-line-en.png' });

  // Its end, dragged out, makes the line longer; the boxes go the longer way.
  const end = surface.locator('[data-line-point="1"]');
  const at = (await end.boundingBox())!;
  await page.mouse.move(at.x + at.width / 2, at.y + at.height / 2);
  await page.mouse.down();
  await page.mouse.move(at.x + at.width / 2 + 120, at.y + at.height / 2 - 60, { steps: 6 });
  await page.mouse.up();
  const longer = await selected<LineElement>(page);
  expect(longer.id).toBe(conveyor.id);
  expect(longer.frame.w).toBeGreaterThan(conveyor.frame.w + 100);
  expect(longer.frame.h).toBeGreaterThan(conveyor.frame.h + 40);
  expect(longer.points).toHaveLength(2);
  expect(longer.flow).toEqual(conveyor.flow);
  await expect(surface.locator('[data-line-point]')).toHaveCount(2);

  // Row B's Motion tool changes what rides it: dots, then nothing but the dashes.
  await page.getByRole('button', { name: 'Motion', exact: true }).click();
  const tool = page.getByTestId('motion-tool');
  await expect(tool.locator('[data-flow="box"]')).toHaveAttribute('aria-pressed', 'true');
  await page.screenshot({ path: 'test-results/elements/conveyor-motion-tool-en.png' });
  await tool.locator('[data-flow="dot"]').click();
  expect((await selected<LineElement>(page)).flow?.rider).toBe('dot');
  await tool.locator('[data-flow="dashes"]').click();
  expect((await selected<LineElement>(page)).flow?.rider).toBeUndefined();
  await expect(onStage(page, conveyor.id).locator('[data-slidr-riders]')).toHaveCount(0);
  await tool.locator('[data-flow="none"]').click();
  expect((await selected<LineElement>(page)).flow).toBeUndefined();
  await undo(page);
  expect((await selected<LineElement>(page)).flow).toMatchObject({ speed: conveyor.flow!.speed });
});

test('an animation tile is still, and moves while the pointer is on it', async ({ page }) => {
  const panel = await openCollection(page, 'animations', 'he');
  // The app opens with motion off for the other tests: this one is about motion.
  await page.emulateMedia({ reducedMotion: 'no-preference' });
  const tile = panel.locator('[data-animation="atom"]');
  const paused = () =>
    tile
      .locator('[data-slidr-svg]')
      .evaluate((host) => host.shadowRoot!.querySelector('svg')!.animationsPaused());
  await expect.poll(paused).toBe(true);
  await tile.hover();
  await expect.poll(paused).toBe(false);
  await panel.getByTestId('animations-query').hover();
  await expect.poll(paused).toBe(true);
  await page
    .getByTestId('tool-panel')
    .screenshot({ path: 'test-results/elements/animations-he.png' });
});

test('a background goes behind the slide over its ground, and the Background tool sees it', async ({
  page,
}) => {
  const panel = await openCollection(page, 'backgrounds', 'he');
  const view = panel.locator('[data-collection-view="backgrounds"]');
  await expect(view.locator('[data-background]')).toHaveCount(11);
  await expect(view.locator('section[data-group="animated"] [data-background]')).toHaveCount(8);
  await page
    .getByTestId('tool-panel')
    .screenshot({ path: 'test-results/elements/backgrounds-he.png' });

  const ground = (await currentSlide(page)).background;
  const before = await undoDepth(page);
  await view.locator('[data-background="waves"]').click();
  await expect
    .poll(async () => (await currentSlide(page)).background?.elements?.[0]?.name)
    .toBe('background-waves');
  const background = (await currentSlide(page)).background!;
  const drawing = background.elements![0] as SvgElement;
  expect(drawing.frame).toEqual({ x: 0, y: 0, w: 1920, h: 1080 });
  // Beside the text: on the left, as drawn, in a deck that reads from the right.
  expect(drawing.flipH).toBe((await deck(page)).meta.dir === 'ltr' ? true : undefined);
  expect(await undoDepth(page)).toBe(before + 1);
  await expect(view.locator('[data-background="waves"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(view.locator('[data-background="flow"]')).toHaveAttribute('aria-pressed', 'false');
  // Drawn behind the slide, and moving there: nothing on the stage selects it.
  const stage = page.getByTestId('stage-frame');
  await expect(stage.locator('[data-slidr-svg]').first()).toBeAttached();
  const smil = await stage
    .locator('[data-slidr-svg]')
    .first()
    .evaluate((host) => host.shadowRoot!.querySelectorAll('animate').length);
  expect(smil).toBe(7);
  await page.screenshot({ path: 'test-results/elements/backgrounds-on-stage-he.png' });

  // Another one takes its place; undo gives back the slide's ground as it was.
  await view.locator('[data-background="orbit"]').click();
  await expect
    .poll(async () => (await currentSlide(page)).background?.elements?.map((e) => e.name))
    .toEqual(['background-orbit']);
  await undo(page);
  await undo(page);
  expect((await currentSlide(page)).background).toEqual(ground);
});

test('one search on the first screen finds animations and backgrounds too', async ({ page }) => {
  await openApp(page, { lang: 'he' });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.getByTestId('elements-query').fill('גלים');
  const found = panel.getByTestId('elements-found');
  // The search waits for every collection of the media library; the animations come after them.
  await expect(found).toBeVisible({ timeout: 30_000 });
  await found.locator('[data-group="animations"]').scrollIntoViewIfNeeded();
  await expect(found.locator('[data-group="animations"] [data-animation="waves"]')).toBeVisible();
  await expect(found.locator('[data-group="backgrounds"] [data-background="waves"]')).toBeVisible();
  await panel.getByTestId('elements-query').fill('orbit');
  await expect(found.locator('[data-animation="orbit"]')).toBeVisible();
  await expect(found.locator('[data-background="orbit"]')).toBeVisible();
});
