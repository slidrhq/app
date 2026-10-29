import { readFileSync } from 'node:fs';
import { pathToFileURL } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { FHD, LAPTOP, loadDeck, openApp, shot } from './runtime-app-helpers';

// The export card in the AI chat (WG9-T12, ADR-123): the File menu, the format, the choices of
// EXP-08 that mean something today, and the report. In a plain browser the file is a download; in
// the app it goes through the save dialog and the Rust command, which the Tauri run checks.

test.use({ viewport: FHD });

/** Adds a picture to the first slide, and an image whose file is not there. */
async function addPictures(page: Page) {
  await page.evaluate(async () => {
    const editor = window.slidr!;
    const canvas = new OffscreenCanvas(1200, 800);
    const context = canvas.getContext('2d')!;
    const gradient = context.createLinearGradient(0, 0, 1200, 800);
    gradient.addColorStop(0, 'royalblue');
    gradient.addColorStop(1, 'gold');
    context.fillStyle = gradient;
    context.fillRect(0, 0, 1200, 800);
    const blob = await canvas.convertToBlob({ type: 'image/png' });
    const asset = await editor.assets.import(
      new File([blob], 'sunrise.png', { type: 'image/png' }),
    );
    const image = (id: string, assetId: string, x: number) => ({
      id,
      type: 'image' as const,
      frame: { x, y: 620, w: 300, h: 200 },
      rotation: 0,
      opacity: 1,
      fit: 'cover' as const,
      assetId,
    });
    editor.bus.batch([
      { type: 'asset.add', asset },
      {
        type: 'asset.add',
        asset: {
          id: 'a_missing',
          file: 'a_missing.png',
          mime: 'image/png',
          kind: 'image',
          bytes: 10,
          origin: 'upload',
          name: 'lost.png',
        },
      },
      { type: 'element.add', slideId: 's_probe_a', element: image('e_sun', asset.id, 1000) },
      { type: 'element.add', slideId: 's_probe_a', element: image('e_lost', 'a_missing', 1400) },
    ]);
  });
}

/** Opens the export card from the File menu and goes on from the format, HTML, to its choices. */
async function openExport(page: Page, label = 'ייצוא') {
  await page.getByTestId('file-menu-trigger').click();
  await page.getByRole('menuitem', { name: `${label}…`, exact: true }).click();
  const card = page.getByTestId('export-card');
  await expect(card).toBeVisible();
  await expect(card).toHaveAttribute('data-step', 'format');
  await card.getByTestId('export-continue').click();
  await expect(card).toHaveAttribute('data-step', 'content');
  return card;
}

/** Runs the export of the open card and returns the file the browser downloaded. */
async function exported(page: Page) {
  const [download] = await Promise.all([
    page.waitForEvent('download'),
    page.getByTestId('export-run').click(),
  ]);
  // Under a name that ends in .html: the browser keeps a download under a name without one.
  const path = test.info().outputPath('exported.html');
  await download.saveAs(path);
  return { name: download.suggestedFilename(), path, html: readFileSync(path, 'utf8') };
}

test('exports the deck to one file, and reports what went into it', async ({ page, browser }) => {
  const errors: string[] = [];
  page.on('pageerror', (error) => errors.push(error.message));
  await openApp(page, { deck: 'probe' });
  await addPictures(page);
  const card = await openExport(page);
  // Each choice is a field of the design system, named by its label (ADR-060).
  await expect(card.getByRole('group', { name: 'שקפים' })).toBeVisible();
  await expect(card.getByRole('group', { name: 'אנימציות ומעברים' })).toBeVisible();
  // Four slides, one of them hidden.
  await expect(page.getByTestId('export-count')).toHaveText(
    'ייוצאו 3 שקפים. שקף מוסתר אחד לא ייכלל.',
  );
  const file = await exported(page);
  await expect(card).toHaveAttribute('data-phase', 'done');
  expect(file.name).toBe('Runtime probe.html');

  const report = page.getByTestId('export-report');
  await expect(report).toContainText('הקובץ ירד למחשב');
  await expect(report).toContainText('3 שקפים');
  // The picture went in smaller than it was; the one without a file is said to be missing.
  await expect(page.getByTestId('export-assets')).toContainText('sunrise.png');
  // (The file name sits in the sentence between two invisible marks that keep it left to right.)
  await expect(page.getByTestId('export-warnings')).toHaveText(
    /^הנכס .lost\.png. לא נקרא, והוא חסר בקובץ\.$/,
  );
  await expect(page.getByTestId('export-fonts')).toContainText('גופנים');
  await page.screenshot({ path: shot('export-report-light-he') });

  expect(file.html).toMatch(/^<!doctype html>/);
  expect(file.html).not.toMatch(/blob:|https?:\/\/localhost|asset\.localhost/);
  expect(file.html).toContain('data-slidr-fonts');

  // The file opens from the disk, plays, and asks nothing of the network.
  const context = await browser.newContext({ viewport: { width: 1280, height: 720 } });
  const shown = await context.newPage();
  const outside: string[] = [];
  shown.on('request', (request) => {
    if (!/^(file|data|blob|about):/.test(request.url())) outside.push(request.url());
  });
  await shown.goto(pathToFileURL(file.path).href);
  await shown.waitForSelector('html.slidr-ready');
  const doc = await shown.evaluate(async () => {
    await document.fonts.ready;
    return {
      slides: document.querySelectorAll('section.slide').length,
      timelines: document.querySelectorAll('section.slide[data-timeline]').length,
      fonts: Array.from(document.fonts).filter((f) => f.status === 'loaded').length,
      title: getComputedStyle(
        document.querySelector('[data-element-id="p_title"] h1, [data-element-id="p_title"] p')!,
      ).fontFamily,
    };
  });
  expect(doc.slides).toBe(3);
  expect(doc.timelines).toBe(2);
  expect(doc.fonts).toBeGreaterThan(0);
  expect(outside).toEqual([]);
  await shown.keyboard.press('ArrowRight');
  expect(
    await shown.evaluate(() => (window as { slidr?: { state: unknown } }).slidr?.state),
  ).toEqual({ slide: 0, step: 1 });
  await context.close();

  await card.getByRole('button', { name: 'סגירה' }).last().click();
  await expect(card).toHaveCount(0);
  await expect(page.getByTestId('stage-surface')).toBeFocused();
  expect(errors).toEqual([]);
});

test('the report says how many live charts went in, and what their library adds (ADR-048)', async ({
  page,
}) => {
  await openApp(page, { deck: 'charts-rtl' });
  const card = await openExport(page);
  const file = await exported(page);
  await expect(card).toHaveAttribute('data-phase', 'done');
  const charts = await page.evaluate(
    () =>
      window
        .slidr!.bus.deck.slides.filter((slide) => !slide.hidden)
        .flatMap((slide) => slide.elements)
        .filter((element) => element.type === 'chart').length,
  );
  expect(charts).toBeGreaterThan(1);
  expect(file.html).toContain('data-slidr-chart');
  const line = page.getByTestId('export-charts');
  await expect(line).toContainText(`${charts} גרפים חיים`);
  // The library is the one script a file has only with a chart in it: hundreds of kilobytes.
  await expect(line).toContainText(/\d+ kB|\d+(\.\d)? MB/);
  await page.screenshot({ path: shot('export-report-charts-light-he') });
  await card.getByRole('button', { name: 'סגירה' }).last().click();

  // A deck without a chart has no such line.
  await loadDeck(page, 'probe');
  await openExport(page);
  await exported(page);
  await expect(page.getByTestId('export-report')).toBeVisible();
  await expect(page.getByTestId('export-charts')).toHaveCount(0);
});

test('a range of slides, without animations', async ({ page }) => {
  await openApp(page, { deck: 'probe' });
  const card = await openExport(page);
  await card.getByRole('radio', { name: 'טווח' }).click();
  await card.getByRole('textbox', { name: 'משקף' }).fill('2');
  await card.getByRole('textbox', { name: 'משקף' }).press('Enter');
  await expect(page.getByTestId('export-count')).toHaveText(
    'ייוצאו 2 שקפים. שקף מוסתר אחד לא ייכלל.',
  );
  await card.getByRole('textbox', { name: 'עד שקף' }).fill('3');
  await card.getByRole('textbox', { name: 'עד שקף' }).press('Enter');
  await expect(page.getByTestId('export-count')).toHaveText(
    'ייוצא שקף אחד. שקף מוסתר אחד לא ייכלל.',
  );
  // Only the hidden slide: nothing to export.
  await card.getByRole('textbox', { name: 'משקף' }).fill('3');
  await card.getByRole('textbox', { name: 'משקף' }).press('Enter');
  await expect(page.getByTestId('export-count')).toHaveText('אין שקפים לייצא בטווח הזה.');
  await expect(page.getByTestId('export-run')).toBeDisabled();

  await card.getByRole('textbox', { name: 'משקף' }).fill('2');
  await card.getByRole('textbox', { name: 'משקף' }).press('Enter');
  await card.getByRole('textbox', { name: 'עד שקף' }).fill('4');
  await card.getByRole('textbox', { name: 'עד שקף' }).press('Enter');
  await card.getByRole('radio', { name: 'בלי' }).click();
  await expect(card).toContainText('כל שקף יוצג שלם');
  const file = await exported(page);
  await expect(card).toHaveAttribute('data-phase', 'done');
  const slides = Array.from(
    file.html.matchAll(/<section class="slide" data-slide="([^"]+)"/g),
    (m) => m[1],
  );
  expect(slides).toEqual(['s_probe_b', 's_probe_c']);
  expect(file.html).not.toMatch(/data-timeline=|data-transition=/);
  // Without pictures the report says so.
  await expect(page.getByTestId('export-report')).toContainText('אין בקובץ תמונות או מדיה.');

  // "Export again" starts at the format, with the choices as they were.
  await card.getByRole('button', { name: 'ייצוא נוסף' }).click();
  await expect(card).toHaveAttribute('data-step', 'format');
  await card.getByTestId('export-continue').click();
  await expect(card.getByRole('radio', { name: 'בלי' })).toHaveAttribute('aria-checked', 'true');
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
});

test('the card is the keyboard’s, and waits in the chat while another panel is shown', async ({
  page,
}) => {
  await openApp(page, { deck: 'probe' });
  await page.getByTestId('file-menu-trigger').click();
  await page.getByTestId('file-export').click();
  const card = page.getByTestId('export-card');
  // In the AI chat, with the keyboard on the format that is chosen: the arrows choose, Enter
  // goes on.
  await expect(page.locator('[data-testid="chat"] [data-testid="export-card"]')).toBeVisible();
  await expect(card.getByRole('radio', { name: 'דף HTML' })).toBeFocused();
  await expect(card.getByRole('radio', { name: 'דף HTML' })).toHaveAccessibleDescription(
    'קובץ אחד שמתנגן בכל דפדפן, גם בלי אינטרנט.',
  );
  // Held as a finger holds it: the list chooses the row the arrow moved to while it is down.
  await page.keyboard.press('ArrowDown', { delay: 50 });
  await expect(card).toHaveAttribute('data-format', 'pptx');
  await page.keyboard.press('Enter');
  await expect(card).toHaveAttribute('data-step', 'content');
  await expect(card.getByTestId('export-chosen')).toHaveText('מצגת PowerPoint');
  await expect(card.getByRole('radio', { name: 'כל המצגת' })).toBeFocused();

  // Another panel and back: the card is where it was, and nothing was sent to the agent.
  await page.locator('[data-testid="activity-bar"] button[data-panel="animations"]').click();
  await expect(card).toBeHidden();
  await page.locator('[data-testid="activity-bar"] button[data-panel="ai"]').click();
  await expect(card).toHaveAttribute('data-step', 'content');
  await expect(card).toHaveAttribute('data-format', 'pptx');
  await expect(page.getByTestId('chat-user')).toHaveCount(0);

  // Back goes to the format; Escape puts the card away and gives the keyboard to the slide.
  await card.getByTestId('export-back').click();
  await expect(card.getByRole('radio', { name: 'מצגת PowerPoint' })).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(card).toHaveCount(0);
  await expect(page.getByTestId('stage-surface')).toBeFocused();
  // Asked for again, it starts at the format, which is the one chosen last.
  await page.getByTestId('file-menu-trigger').click();
  await page.getByTestId('file-export').click();
  await expect(card).toHaveAttribute('data-step', 'format');
  await expect(card.getByRole('radio', { name: 'מצגת PowerPoint' })).toBeFocused();
});

for (const theme of ['light', 'dark'] as const) {
  for (const lang of ['he', 'en'] as const) {
    test(`the card: ${theme}, ${lang}`, async ({ page }) => {
      const errors: string[] = [];
      page.on('console', (message) => {
        if (message.type() === 'error') errors.push(message.text());
      });
      await openApp(page, { deck: 'probe', lang, theme });
      await addPictures(page);
      await page.getByTestId('file-menu-trigger').click();
      await page.getByTestId('file-export').click();
      await expect(page.getByTestId('export-card')).toBeVisible();
      await page.screenshot({ path: shot(`export-format-${theme}-${lang}`) });
      await page.keyboard.press('Escape');
      const card = await openExport(page, lang === 'he' ? 'ייצוא' : 'Export');
      await card.getByRole('radio').nth(1).click();
      await page.screenshot({ path: shot(`export-${theme}-${lang}`) });
      await exported(page);
      await expect(card).toHaveAttribute('data-phase', 'done');
      await page.screenshot({ path: shot(`export-report-${theme}-${lang}`) });
      expect(errors).toEqual([]);
    });
  }
}

test('the card at 1366x768', async ({ page }) => {
  await page.setViewportSize(LAPTOP);
  await openApp(page, { deck: 'probe' });
  await addPictures(page);
  const card = await openExport(page);
  await exported(page);
  await expect(card).toHaveAttribute('data-phase', 'done');
  await page.screenshot({ path: shot('export-report-light-he-1366') });
});
