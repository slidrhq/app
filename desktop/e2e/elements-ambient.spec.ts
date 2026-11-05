import { expect, test, type Page } from '@playwright/test';
import type { ShapeElement, SvgElement } from '@slidr/model';
import { onStage, openApp, pageProblems, selected, undo, undoDepth } from './objects-helpers';

/*
 * The motion an element repeats (ADR-128): the animated shapes of Elements, in the Shapes
 * collection and first among the animations, land as plain shapes that move on the stage; row B's
 * Motion tool sets the motion of any element, its speed, rhythm, way and reach, and the speed of
 * an animation of ADR-127.
 */

test.afterEach(({ page }) => {
  expect(pageProblems(page)).toEqual([]);
});

async function openShapes(page: Page) {
  await openApp(page, { lang: 'en' });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.locator('[data-collection="shapes"]').click();
  return panel;
}

/** The CSS animation of the box that moves an element on the stage, as the browser runs it. */
async function ambientOf(page: Page, elementId: string) {
  return onStage(page, elementId)
    .locator('[data-slidr-ambient]')
    .evaluate((box) =>
      box.getAnimations().map((a) => ({
        name: (a as CSSAnimation).animationName,
        duration: Number(a.effect!.getTiming().duration),
        state: a.playState,
      })),
    );
}

/** Row B's Motion tool, opened. */
async function openMotion(page: Page) {
  await page.getByRole('button', { name: 'Motion', exact: true }).click();
  const tool = page.getByTestId('motion-tool');
  await expect(tool).toBeVisible();
  return tool;
}

test('an animated shape of the Shapes collection is a shape that turns on the stage', async ({
  page,
}) => {
  const panel = await openShapes(page);
  const group = panel.getByTestId('elements-motion-shapes');
  await expect(group.locator('[data-motion-shape]')).toHaveCount(10);
  await page
    .getByTestId('tool-panel')
    .screenshot({ path: 'test-results/elements/animated-shapes-en.png' });

  const before = await undoDepth(page);
  await group.locator('[data-motion-shape="hexagon"]').click();
  const hexagon = await selected<ShapeElement>(page);
  expect(hexagon.type).toBe('shape');
  expect(hexagon.geometry).toMatchObject({ kind: 'preset', preset: 'hexagon' });
  expect(hexagon.fill).toEqual({ kind: 'solid', color: { token: 'primary' } });
  expect(hexagon.ambient).toEqual({ kind: 'spin', duration: 6000 });
  expect(await undoDepth(page)).toBe(before + 1);
  expect(await ambientOf(page, hexagon.id)).toEqual([
    { name: 'slidr-spin', duration: 6000, state: 'running' },
  ]);

  // The way to every other animation.
  await panel.getByTestId('elements-more-animations').click();
  const view = panel.locator('[data-collection-view="animations"]');
  await expect(view.locator('section[data-group="basic"] [data-motion-shape]')).toHaveCount(10);
});

test('the Motion tool sets the speed, rhythm, way and reach of any element', async ({ page }) => {
  const panel = await openShapes(page);
  // A plain shape of the library, which does not move.
  await panel.locator('[data-preset="ellipse"]').click();
  const circle = await selected<ShapeElement>(page);
  expect(circle.ambient).toBeUndefined();

  let tool = await openMotion(page);
  await tool.locator('[data-motion-kind="spin"]').click();
  expect((await selected(page)).ambient).toEqual({ kind: 'spin', duration: 6000 });
  await tool.getByRole('radio', { name: 'Fast' }).click();
  await tool.getByRole('radio', { name: 'With pauses' }).click();
  await tool.getByRole('radio', { name: 'Counterclockwise' }).click();
  expect((await selected(page)).ambient).toEqual({
    kind: 'spin',
    duration: 3000,
    rhythm: 'pause',
    reverse: true,
  });
  expect(await ambientOf(page, circle.id)).toEqual([
    { name: 'slidr-spin-pause', duration: 3000, state: 'running' },
  ]);
  await page.screenshot({ path: 'test-results/elements/motion-tool-en.png' });

  // A float, by its own round, and as high as the slider says.
  await tool.locator('[data-motion-kind="float"]').click();
  expect((await selected(page)).ambient).toEqual({ kind: 'float', duration: 3000 });
  const height = tool.getByRole('textbox', { name: 'Float height' });
  await height.fill('40');
  await height.press('Enter');
  expect((await selected(page)).ambient).toMatchObject({ kind: 'float', amount: 40 });

  // None: it stands still again, and undo brings the float back.
  await tool.locator('[data-motion-kind="none"]').click();
  expect((await selected(page)).ambient).toBeUndefined();
  await expect(onStage(page, circle.id).locator('[data-slidr-ambient]')).toHaveCount(0);
  await page.keyboard.press('Escape');
  await undo(page);
  expect((await selected(page)).ambient).toMatchObject({ kind: 'float', amount: 40 });

  // An animation of Elements has a speed of its own, besides.
  await panel.getByRole('button', { name: /back/i }).first().click();
  await panel.locator('[data-collection="animations"]').click();
  await panel.locator('[data-animation="orbit"]').click();
  const orbit = await selected<SvgElement>(page);
  tool = await openMotion(page);
  const speed = tool.getByRole('textbox', { name: 'Animation speed' });
  await expect(speed).toHaveValue('1');
  await speed.fill('2');
  await speed.press('Enter');
  const fast = await selected<SvgElement>(page);
  expect(fast.id).toBe(orbit.id);
  expect(fast.markup).toContain('data-slidr-speed="2"');
  expect(fast.colorOverrides).toEqual(orbit.colorOverrides);
});

test('in Hebrew, the animated shapes lead the animations, and the tool reads from the right', async ({
  page,
}) => {
  await openApp(page, { lang: 'he' });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.locator('[data-collection="animations"]').click();
  const basic = panel.locator('section[data-group="basic"]');
  await expect(basic.getByRole('button', { name: 'משושה מסתובב' })).toBeVisible();
  await page
    .getByTestId('tool-panel')
    .screenshot({ path: 'test-results/elements/animated-shapes-he.png' });

  // The arrow points the way the deck reads.
  await basic.locator('[data-motion-shape="arrow"]').click();
  const arrow = await selected<ShapeElement>(page);
  expect(arrow.geometry).toMatchObject({ preset: 'arrowLeft' });
  expect(arrow.ambient).toMatchObject({ kind: 'swing', rhythm: 'pause' });
  await page.getByRole('button', { name: 'תנועה', exact: true }).click();
  const tool = page.getByTestId('motion-tool');
  await expect(tool.getByRole('radio', { name: 'עם הפסקה' })).toHaveAttribute(
    'aria-checked',
    'true',
  );
  await expect(tool.getByRole('textbox', { name: 'זווית הנדנוד' })).toHaveValue('10');
  await page.screenshot({ path: 'test-results/elements/motion-tool-he.png' });
});

test('a shape that turns stands still while its text is edited', async ({ page }) => {
  const panel = await openShapes(page);
  await panel.getByTestId('elements-motion-shapes').locator('[data-motion-shape="square"]').click();
  const square = await selected<ShapeElement>(page);
  expect(await ambientOf(page, square.id)).toHaveLength(1);
  await onStage(page, square.id).dblclick();
  await expect.poll(() => ambientOf(page, square.id)).toEqual([]);
  await page.keyboard.type('Go');
  await page.keyboard.press('Escape');
  await expect.poll(async () => (await ambientOf(page, square.id)).length).toBe(1);
});
