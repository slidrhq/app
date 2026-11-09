import { fileURLToPath } from 'node:url';
import { expect, test, type Page } from '@playwright/test';
import { openApp as openDeckChat, outline, say as sayToDeck } from './aifinish-helpers';
import {
  addChart,
  addIcon,
  addShape,
  addTable,
  addTitle,
  cards,
  openApp,
  openTool,
  say,
} from './aitools-helpers';

/*
 * Screenshots for the design gate (PLAN 1.2) of what the `m8-finish` round added to the AI tools:
 * the cards the chat offers for a chart, a table, a shape and an icon (AIO-06 to AIO-08), and
 * the outline while it is edited in its card (AID-03). Both themes and both directions; written to
 * test-results/ai/ to be looked at, and nothing is compared.
 */

const out = (name: string) =>
  fileURLToPath(new URL(`../test-results/ai/${name}.png`, import.meta.url));

/** Every surface in light Hebrew and dark English; the two richest in the other two as well. */
const looks = [
  { theme: 'light', lang: 'he', all: true },
  { theme: 'dark', lang: 'en', all: true },
  { theme: 'dark', lang: 'he', all: false },
  { theme: 'light', lang: 'en', all: false },
] as const;

async function settle(page: Page) {
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(300);
}

for (const { theme, lang, all } of looks) {
  const name = `${theme}-${lang}`;
  /** Asks the chat, in the language of the window. */
  const ask = (page: Page, he: string, en: string) => say(page, lang === 'he' ? he : en);

  test(`the types offered for a chart ${name}`, async ({ page }) => {
    await openApp(page, { script: 'chart-actions', lang, theme });
    await addTitle(page, 'ההכנסות שלנו');
    await addChart(page);
    await openTool(page);
    await ask(page, 'הצע שלושה סוגי גרף', 'Suggest three chart types');
    await expect(cards(page)).toHaveCount(3);
    await cards(page).nth(0).hover();
    await expect(page.getByTestId('stage-preview')).toBeVisible();
    await settle(page);
    await page.screenshot({ path: out(`chart-types-${name}`) });
    if (!all) return;
    await ask(page, 'הצע ארבע כותרות לגרף', 'Suggest four titles for the chart');
    await expect(cards(page)).toHaveCount(4);
    await cards(page).nth(1).hover();
    await settle(page);
    await page.screenshot({ path: out(`chart-titles-${name}`) });
  });

  if (all) {
    test(`the looks offered for a table ${name}`, async ({ page }) => {
      await openApp(page, { script: 'table-actions', lang, theme });
      await addTitle(page, 'הלקוחות שלנו');
      await addTable(page);
      await openTool(page);
      await ask(page, 'הצע שלושה עיצובים לטבלה', 'Suggest three looks for the table');
      await expect(cards(page)).toHaveCount(3);
      await cards(page).nth(1).hover();
      await expect(page.getByTestId('stage-preview')).toBeVisible();
      await settle(page);
      await page.screenshot({ path: out(`table-looks-${name}`) });
    });
  }

  if (all) {
    test(`the cards of a shape ${name}`, async ({ page }) => {
      await openApp(page, { script: 'shape-actions', lang, theme });
      await addTitle(page, 'שלבי העבודה');
      await addShape(page);
      await openTool(page);
      await ask(page, 'הצע צורות אחרות', 'Suggest other shapes');
      await ask(page, 'צבע אותה לפי התבנית', 'Colour it by the template');
      await expect(cards(page)).toHaveCount(3);
      await cards(page).nth(0).hover();
      await expect(page.getByTestId('stage-preview')).toBeVisible();
      await settle(page);
      await page.screenshot({ path: out(`shape-colours-${name}`) });
    });

    test(`the icons offered in place of an icon ${name}`, async ({ page }) => {
      await openApp(page, { script: 'icon-actions', lang, theme });
      await addTitle(page, 'היעד שלנו');
      await addIcon(page);
      await openTool(page);
      await ask(page, 'הצע אייקונים מתאימים יותר', 'Suggest more fitting icons');
      await expect(cards(page)).toHaveCount(3);
      await cards(page).nth(1).hover();
      await expect(page.getByTestId('stage-preview')).toBeVisible();
      await settle(page);
      await page.screenshot({ path: out(`icon-replace-${name}`) });
    });
  }

  test(`the outline while it is edited in its card ${name}`, async ({ page }) => {
    await openDeckChat(page, { script: 'outline', lang, theme });
    await sayToDeck(page, 'מצגת על תוכנית העבודה שלנו לשנת 2027');
    await outline(page).getByTestId('outline-edit').click();
    await outline(page).getByTestId('outline-title').nth(1).fill('איפה אנחנו עומדים');
    await outline(page).getByTestId('outline-up').nth(3).click();
    await outline(page).getByTestId('outline-add').click();
    await settle(page);
    await page.screenshot({ path: out(`outline-editing-${name}`) });
    if (!all) return;
    await page.keyboard.insertText('מה מבקשים מההנהלה');
    await outline(page).getByTestId('outline-edit').click();
    await settle(page);
    await page.screenshot({ path: out(`outline-edited-${name}`) });
  });
}
