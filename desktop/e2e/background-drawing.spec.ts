import { expect, test, type Page } from '@playwright/test';
import type { SvgElement } from '@slidr/model';
import { currentSlide, openApp, pageProblems, row, steps, undo } from './objects-helpers';

/*
 * The drawing of a background from Elements, as the Background tool sets it (ADR-129): the colours
 * it is drawn in, how fast it moves and how strong it is. Nothing selects it on the stage, so the
 * tool is where it is set.
 */

test.afterEach(({ page }) => {
  expect(pageProblems(page)).toEqual([]);
});

const drawingOf = async (page: Page) =>
  (await currentSlide(page)).background?.elements?.[0] as SvgElement | undefined;

/** The times of the SMIL animations the stage draws for the background's picture. */
const drawnTimes = (page: Page) =>
  page
    .getByTestId('stage-frame')
    .locator('[data-slidr-svg]')
    .first()
    .evaluate((host) =>
      Array.from(host.shadowRoot!.querySelectorAll('animate'), (a) => a.getAttribute('dur')),
    );

test('the drawing of a background: its colours, its speed and its opacity', async ({ page }) => {
  await openApp(page, { lang: 'en' });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.locator('[data-collection="backgrounds"]').click();
  await panel.locator('[data-collection-view="backgrounds"] [data-background="waves"]').click();
  await expect.poll(async () => (await drawingOf(page))?.name).toBe('background-waves');
  const asDrawn = await drawnTimes(page);

  await row(page).getByRole('button', { name: 'Background', exact: true }).click();
  const drawing = page.getByTestId('background-editor').getByTestId('background-drawing');
  // The two colours the waves are drawn in, which stand for the theme's primary and accent.
  await expect(drawing.locator('[data-colour]')).toHaveCount(2);
  await expect(drawing.getByRole('textbox', { name: 'Motion speed' })).toHaveValue('100');
  await expect(drawing.getByRole('textbox', { name: 'Drawing opacity' })).toHaveValue('100');
  await page
    .getByTestId('background-editor')
    .screenshot({ path: 'test-results/background-drawing/tool-en.png' });

  // A colour from the theme: stored as its token, so the drawing follows the template.
  await drawing.getByRole('button', { name: 'Drawing colour 2' }).click();
  await page.getByRole('button', { name: 'Primary', exact: true }).click();
  await expect
    .poll(async () => Object.values((await drawingOf(page))?.colorOverrides ?? {}))
    .toEqual([{ token: 'primary' }, { token: 'primary' }]);
  await page.keyboard.press('Escape');

  // Twice as fast: every time of the picture halved, on the stage too, in one undo step.
  const speed = drawing.getByRole('textbox', { name: 'Motion speed' });
  await speed.fill('200');
  expect(await steps(page, () => speed.press('Enter'))).toBe(1);
  expect((await drawingOf(page))?.markup).toContain('data-slidr-speed="2"');
  await expect
    .poll(() => drawnTimes(page))
    .toEqual(asDrawn.map((dur) => `${Math.round((parseFloat(dur!) / 2) * 1000) / 1000}s`));

  const opacity = drawing.getByRole('textbox', { name: 'Drawing opacity' });
  await opacity.fill('40');
  expect(await steps(page, () => opacity.press('Enter'))).toBe(1);
  expect((await drawingOf(page))?.opacity).toBe(0.4);
  await page
    .getByTestId('background-editor')
    .screenshot({ path: 'test-results/background-drawing/tool-en-changed.png' });
  await page.keyboard.press('Escape');
  await page.screenshot({ path: 'test-results/background-drawing/stage-en.png' });

  // Undo takes back the opacity, then the speed.
  await undo(page);
  await undo(page);
  expect((await drawingOf(page))?.markup).not.toContain('data-slidr-speed');
  await expect.poll(() => drawnTimes(page)).toEqual(asDrawn);
});

test('a still background has no speed to set, in Hebrew', async ({ page }) => {
  await openApp(page, { lang: 'he' });
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  const panel = page.getByTestId('elements-panel');
  await panel.locator('[data-collection="backgrounds"]').click();
  await panel.locator('[data-collection-view="backgrounds"] [data-background="arcs"]').click();
  await expect.poll(async () => (await drawingOf(page))?.name).toBe('background-arcs');
  await row(page).getByRole('button', { name: 'רקע', exact: true }).click();
  const drawing = page.getByTestId('background-editor').getByTestId('background-drawing');
  await expect(drawing.getByRole('textbox', { name: 'אטימות הציור' })).toBeVisible();
  await expect(drawing.getByRole('textbox', { name: 'מהירות התנועה' })).toHaveCount(0);
  await expect(drawing.locator('[data-colour]')).toHaveCount(3);
  await page
    .getByTestId('background-editor')
    .screenshot({ path: 'test-results/background-drawing/tool-he.png' });
});
