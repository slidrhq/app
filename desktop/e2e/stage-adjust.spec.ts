import { expect, test, type Page } from '@playwright/test';
import { openApp, select, undoSteps } from './arrange-helpers';

// The adjustment handles of shapes (ADR-133): the thickness of a ring, the head and shaft of an
// arrow, set by a drag on the Stage's dev page, and by the keyboard from the menu in the app.

interface Point {
  x: number;
  y: number;
}

const surface = (page: Page) => page.getByTestId('stage-surface');
const adjustHandle = (page: Page, i: number) =>
  surface(page).locator(`[data-adjust-handle="${i}"]`);

/** The values a shape has, as the deck holds them. */
const adjustOf = (page: Page, id: string) =>
  page.evaluate((elementId) => {
    for (const s of window.slidr!.bus.deck.slides) {
      const e = s.elements.find((x) => x.id === elementId);
      if (e?.type === 'shape' && e.geometry.kind === 'preset') return e.geometry.adjust;
    }
    throw new Error(`no shape ${elementId}`);
  }, id);

/** The zoom of the Stage, and the ways between slide pixels and the screen. */
async function stage(page: Page) {
  const frame = (await page.getByTestId('stage-frame').boundingBox())!;
  const scale = frame.width / 1920;
  return {
    scale,
    at: (p: Point) => ({ x: frame.x + p.x * scale, y: frame.y + p.y * scale }),
    from: (p: Point) => ({ x: (p.x - frame.x) / scale, y: (p.y - frame.y) / scale }),
  };
}

async function centerOf(page: Page, i: number): Promise<Point> {
  const rect = (await adjustHandle(page, i).boundingBox())!;
  return { x: rect.x + rect.width / 2, y: rect.y + rect.height / 2 };
}

async function drag(page: Page, from: Point, to: Point, beforeUp?: () => Promise<void>) {
  await page.mouse.move(from.x, from.y);
  await page.mouse.down();
  const n = 8;
  for (let i = 1; i <= n; i++) {
    await page.mouse.move(from.x + ((to.x - from.x) * i) / n, from.y + ((to.y - from.y) * i) / n);
    await page.waitForTimeout(20);
  }
  await beforeUp?.();
  await page.mouse.up();
}

test.describe('on the Stage', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/dev/stage.html?deck=stage&slide=4');
    await surface(page).locator('[data-element-id="e_ring"]').waitFor();
    await page.evaluate(() => document.fonts.ready);
  });

  test('a ring has a handle on its inner edge, and dragging it sets the thickness', async ({
    page,
  }) => {
    const { at, from } = await stage(page);
    // The ring itself, not its hole.
    const press = at({ x: 230, y: 380 });
    await page.mouse.click(press.x, press.y);
    await expect(adjustHandle(page, 0)).toHaveCount(1);
    await expect(adjustHandle(page, 1)).toHaveCount(0);
    // A quarter of 360 in from the left edge, at the height of the middle.
    const handle = from(await centerOf(page, 0));
    expect(handle.x).toBeCloseTo(290, -1);
    expect(handle.y).toBeCloseTo(380, -1);

    const before = await undoSteps(page);
    // Out towards the edge, and off the handle's row: it follows along its way only.
    await drag(page, await centerOf(page, 0), at({ x: 260, y: 340 }));
    const [thickness] = (await adjustOf(page, 'e_ring')) ?? [];
    expect(thickness).toBeCloseTo(60 / 360, 2);
    expect(await undoSteps(page)).toBe(before + 1);
    const moved = from(await centerOf(page, 0));
    expect(moved.x).toBeCloseTo(260, -1);
    expect(moved.y).toBeCloseTo(380, -1);
  });

  test('a rectangle has no adjustment handle', async ({ page }) => {
    const { at } = await stage(page);
    const press = at({ x: 440, y: 820 });
    await page.mouse.click(press.x, press.y);
    await expect(surface(page).locator('[data-handle="se"]')).toHaveCount(1);
    await expect(surface(page).locator('[data-adjust-handle]')).toHaveCount(0);
  });

  test("an arrow's head and shaft each have a handle, and each sets its own value", async ({
    page,
  }) => {
    const { at, from } = await stage(page);
    const press = at({ x: 900, y: 380 });
    await page.mouse.click(press.x, press.y);
    await expect(surface(page).locator('[data-adjust-handle]')).toHaveCount(2);
    // The head is half the height long: its base at 1280 - 120, the shaft a quarter in.
    expect(from(await centerOf(page, 0)).x).toBeCloseTo(1160, -1);
    expect(from(await centerOf(page, 0)).y).toBeCloseTo(320, -1);
    expect(from(await centerOf(page, 1)).y).toBeCloseTo(260, -1);

    await drag(page, await centerOf(page, 1), at({ x: 1100, y: 230 }));
    const adjust = (await adjustOf(page, 'e_arrow')) ?? [];
    expect(adjust[0]).toBe(0.5);
    expect(adjust[1]).toBeCloseTo(180 / 240, 2);

    // The shaft, thinner: its edge comes down to 30 above the middle (380), 60 of the 240 high.
    await drag(page, await centerOf(page, 0), at({ x: 1100, y: 350 }));
    const after = (await adjustOf(page, 'e_arrow')) ?? [];
    expect(after[0]).toBeCloseTo(60 / 240, 2);
    expect(after[1]).toBe(adjust[1]);
  });

  test('a turned and mirrored ring keeps its handle on its inner edge', async ({ page }) => {
    const { at, from } = await stage(page);
    const center = { x: 1580, y: 780 };
    const press = at({ x: center.x, y: center.y - 150 });
    await page.mouse.click(press.x, press.y);
    const handle = from(await centerOf(page, 0));
    const dx = handle.x - center.x;
    const dy = handle.y - center.y;
    expect(Math.hypot(dx, dy)).toBeCloseTo(90, -1);
    // In towards the middle: a thicker ring.
    const towards = { x: center.x + (dx / 90) * 60, y: center.y + (dy / 90) * 60 };
    await drag(page, await centerOf(page, 0), at(towards));
    const [thickness] = (await adjustOf(page, 'e_ring_turned')) ?? [];
    expect(thickness).toBeCloseTo(120 / 360, 2);
  });

  test('Escape during a drag leaves the shape as it was', async ({ page }) => {
    const { at } = await stage(page);
    const press = at({ x: 230, y: 380 });
    await page.mouse.click(press.x, press.y);
    const before = await undoSteps(page);
    await drag(page, await centerOf(page, 0), at({ x: 330, y: 380 }), () =>
      page.keyboard.press('Escape'),
    );
    expect(await adjustOf(page, 'e_ring')).toBeUndefined();
    expect(await undoSteps(page)).toBe(before);
  });
});

test.describe('in the app, by the keyboard', () => {
  test.beforeEach(async ({ page }) => {
    await openApp(page, { lang: 'en' });
    await page.evaluate(() => {
      const editor = window.slidr!;
      const slideId = editor.selection.getState().currentSlideId!;
      editor.bus.batch(
        [
          {
            type: 'element.add' as const,
            slideId,
            element: {
              id: 'e_ring',
              type: 'shape' as const,
              frame: { x: 400, y: 200, w: 360, h: 360 },
              rotation: 0,
              opacity: 1,
              geometry: { kind: 'preset' as const, preset: 'donut' },
              fill: { kind: 'solid' as const, color: { token: 'primary' as const } },
            },
          },
        ],
        { label: 'Add' },
      );
    });
    await select(page, ['e_ring']);
  });

  test('the menu goes into the handles; the arrows move one, Escape leaves', async ({ page }) => {
    const ring = page.getByTestId('stage-frame').locator('[data-element-id="e_ring"]');
    const box = (await ring.boundingBox())!;
    await ring.click({ button: 'right', position: { x: box.width * 0.08, y: box.height / 2 } });
    const menu = page.getByTestId('stage-menu');
    await expect(menu).toBeVisible();
    await menu.getByRole('menuitem').filter({ hasText: 'Adjust shape' }).click();

    const status = page.getByTestId('stage-keyboard');
    await expect(status).toHaveText('Adjustment handle 1 of 1. The arrows move it.');
    await expect(adjustHandle(page, 0)).toHaveAttribute('data-active', 'true');

    const before = await undoSteps(page);
    // Out from the middle: a ring three pixels thinner, then thirty thicker, in one burst of
    // presses and so in one step (STG-08).
    const keys = ['ArrowLeft', 'ArrowLeft', 'ArrowLeft'];
    for (const key of [...keys, 'Shift+ArrowRight', 'Shift+ArrowRight', 'Shift+ArrowRight'])
      await page.keyboard.press(key);
    expect((await adjustOf(page, 'e_ring'))?.[0]).toBeCloseTo(117 / 360, 3);
    expect(await undoSteps(page)).toBe(before + 1);
    // Up and down run across the handle's way: the ring stays as it is.
    await page.keyboard.press('ArrowUp');
    await page.keyboard.press('ArrowDown');
    expect((await adjustOf(page, 'e_ring'))?.[0]).toBeCloseTo(117 / 360, 3);
    expect(await undoSteps(page)).toBe(before + 1);

    await page.keyboard.press('Escape');
    await expect(status).toHaveText('');
    await expect(adjustHandle(page, 0)).not.toHaveAttribute('data-active');
    expect(
      await page.evaluate(() => window.slidr!.selection.getState().selectedElementIds),
    ).toEqual(['e_ring']);
  });
});
