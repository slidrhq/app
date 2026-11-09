import { expect, test, type Page } from '@playwright/test';
import type { ChartElement, TableElement } from '@slidr/model';
import {
  addChart,
  addTable,
  addTitle,
  cards,
  cellTexts,
  chartDrawn,
  chat,
  chips,
  collectErrors,
  currentSlide,
  element,
  gallery,
  openApp,
  openTool,
  panel,
  REGIONS,
  REVENUE,
  say,
  select,
  turns,
  undoDepth,
} from './aitools-helpers';

/*
 * What the AI chat does for a chart and for a table (WG11-T12; AIO-07, AIO-08), against the
 * scripted mock agent: what is a choice is offered as cards that are tried on the Stage and
 * applied as one undo step, and what is an edit is the agent's turn in the one AI chat (ADR-072).
 */

const undo = (page: Page) => page.evaluate(() => window.slidr!.bus.undo());
const chart = (page: Page) => element<ChartElement>(page, 'e_chart');
const table = (page: Page) => element<TableElement>(page, 'e_table');

test('a chart: types are offered as pictures, tried on the Stage, and a pick is one undo step', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'chart-actions' });
  await addTitle(page, 'ההכנסות שלנו');
  await addChart(page);
  await openTool(page);
  await say(page, 'הצע שלושה סוגי גרף שמתאימים לנתונים');

  // Three cards, each the chart as the option would leave it, side by side.
  await expect(gallery(page)).toHaveAttribute('data-kind', 'chart');
  await expect(gallery(page)).toContainText('שלושה סוגים שמתאימים לנתונים');
  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).first()).toContainText('קו: המגמה לאורך השנים');
  // A card is named by its label alone: its picture holds every word of the chart.
  await expect(cards(page).first()).toHaveAccessibleName('קו: המגמה לאורך השנים');
  for (const index of [0, 1, 2]) {
    await expect(cards(page).nth(index)).toHaveAttribute('data-state', 'ready');
    await expect(cards(page).nth(index).locator('[data-slidr-chart-box] svg')).toBeVisible();
  }
  const [first, second] = await Promise.all([
    cards(page).nth(0).boundingBox(),
    cards(page).nth(1).boundingBox(),
  ]);
  expect(Math.abs(first!.y - second!.y)).toBeLessThan(2);
  // The picture is the chart itself, not its slide: about as wide as the card.
  const picture = await cards(page).nth(0).locator('[data-slidr-chart-box]').boundingBox();
  expect(picture!.width).toBeGreaterThan(first!.width * 0.75);

  // A hover shows the type on the Stage, and changes nothing.
  const depth = await undoDepth(page);
  await cards(page).nth(0).hover();
  await expect(page.getByTestId('stage-preview')).toBeVisible();
  await expect.poll(async () => (await chartDrawn(page)).type).toBe('line');
  expect((await chart(page)).chartType).toBe('column');
  expect(await undoDepth(page)).toBe(depth);
  await page.mouse.move(5, 5);
  await expect(page.getByTestId('stage-preview')).toHaveCount(0);
  await expect.poll(async () => (await chartDrawn(page)).type).toBe('column');

  // A click applies it: one undo step, which keeps the data.
  await cards(page).nth(2).click();
  expect(await chart(page)).toMatchObject({ chartType: 'bar', data: REVENUE });
  expect((await chart(page)).options.labels).toBe(true);
  expect(await undoDepth(page)).toBe(depth + 1);
  await expect(cards(page).nth(2)).toHaveAttribute('data-picked', 'true');
  await undo(page);
  expect((await chart(page)).chartType).toBe('column');
  expect((await chart(page)).options.labels).toBe(false);
  await expect(cards(page).nth(2)).not.toHaveAttribute('data-picked', 'true');
  expect(errors).toEqual([]);
});

test('a chart: titles are offered as words, and a pasted text fills the data in one turn', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'chart-actions' });
  await addTitle(page, 'ההכנסות שלנו');
  await addChart(page);
  await openTool(page);
  await say(page, 'הצע שלושה סוגי גרף שמתאימים לנתונים');

  // The second turn of the script offers titles: cards of words, one under another.
  await say(page, 'הצע ארבע כותרות לגרף, עם התובנה');
  await expect(cards(page)).toHaveCount(4);
  await expect(cards(page).nth(0)).toContainText('ההכנסות הוכפלו בתוך שנתיים');
  await expect(cards(page).nth(0)).toContainText('המגמה');
  await expect(cards(page).locator('[data-slidr-chart-box]')).toHaveCount(0);
  const [first, second] = await Promise.all([
    cards(page).nth(0).boundingBox(),
    cards(page).nth(1).boundingBox(),
  ]);
  expect(second!.y).toBeGreaterThan(first!.y + first!.height - 1);
  // The insight itself is in the reply.
  await expect(turns(page).nth(1)).toContainText('התובנה: ההכנסות יותר מהוכפלו');
  // The types offered before are a step back (AIO-09).
  await expect(page.getByTestId('gallery-place')).toContainText('2 / 2');

  await cards(page).nth(1).hover();
  await expect.poll(async () => (await chartDrawn(page)).title).toBe('מ-120 ל-260 בשנתיים');
  expect((await chart(page)).options.title).toBeUndefined();
  const depth = await undoDepth(page);
  await cards(page).nth(0).click();
  expect((await chart(page)).options.title).toBe('ההכנסות הוכפלו בתוך שנתיים');
  expect(await chart(page)).toMatchObject({ chartType: 'column', data: REVENUE });
  expect(await undoDepth(page)).toBe(depth + 1);

  // Filling from a text pasted in the chat: the turn is one undo step.
  const pasted = 'לקוחות לפי אזור: צפון 340, מרכז 520, דרום 210, ירושלים 180. בשנה הבאה נצמח.';
  const turn = await say(page, `מלא את הגרף מהטקסט הזה: ${pasted}`);
  await expect(chips(page).filter({ hasText: 'עדכון גרף' })).toHaveCount(1);
  expect((await chart(page)).data).toEqual({
    categories: ['צפון', 'מרכז', 'דרום', 'ירושלים'],
    series: [{ name: 'לקוחות', values: [340, 520, 210, 180] }],
  });
  expect((await chart(page)).options.title).toBe('המרכז מוביל במספר הלקוחות');
  expect(await undoDepth(page)).toBe(depth + 2);
  await turn.getByTestId('undo-turn').click();
  expect(await chart(page)).toMatchObject({ data: REVENUE });
  expect((await chart(page)).options.title).toBe('ההכנסות הוכפלו בתוך שנתיים');
  expect(errors).toEqual([]);
});

test('a table: looks are offered as pictures, and a pasted text fills the cells', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'table-actions' });
  await addTitle(page, 'הלקוחות שלנו');
  await addTable(page);
  await openTool(page);

  await say(page, 'הצע שלושה עיצובים לטבלה');
  await expect(gallery(page)).toHaveAttribute('data-kind', 'table');
  await expect(cards(page)).toHaveCount(3);
  await expect(cards(page).nth(0)).toContainText('קווים: נקי וקל');
  // Each card draws the table itself in the look it offers.
  await expect(cards(page).nth(0).locator('table')).toBeVisible();
  await expect(cards(page).nth(0).locator('table')).toContainText('מרכז');

  const before = await table(page);
  const depth = await undoDepth(page);
  await cards(page).nth(1).hover();
  await expect(page.getByTestId('stage-preview')).toBeVisible();
  expect((await table(page)).style).toEqual(before.style);
  await cards(page).nth(0).click();
  expect((await table(page)).style).toEqual({
    styleId: 'lines',
    headerRow: true,
    bandedRows: false,
    firstColumn: true,
  });
  expect(await cellTexts(page)).toEqual(REGIONS);
  expect(await undoDepth(page)).toBe(depth + 1);
  await undo(page);
  expect((await table(page)).style).toEqual(before.style);

  // Filling from a text pasted in the chat is the agent's turn: the table grows a column, as one
  // undo step.
  const turn = await say(
    page,
    'מלא את הטבלה מהטקסט הזה: צפון 340 (+12%), מרכז 520 (+8%), דרום 210 (+21%)',
  );
  expect(await cellTexts(page)).toEqual([
    ['אזור', 'לקוחות', 'שינוי'],
    ['צפון', '340', '+12%'],
    ['מרכז', '520', '+8%'],
    ['דרום', '210', '+21%'],
  ]);
  expect((await table(page)).frame).toEqual(before.frame);
  await turn.getByTestId('undo-turn').click();
  expect(await cellTexts(page)).toEqual(REGIONS);
  expect(errors).toEqual([]);
});

test('a table: its insight and its chart change the slide, as turns of the AI chat', async ({
  page,
}) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'table-on-slide' });
  await addTitle(page, 'הלקוחות שלנו');
  await addTable(page);
  await openTool(page);

  // The insight.
  const depth = await undoDepth(page);
  await say(page, 'סכם את הטבלה בתובנה');
  await expect(panel(page)).toBeVisible();
  await expect(chat(page)).toHaveAttribute('data-scope', 'deck');
  const insight = (await currentSlide(page)).elements.find((e) => e.id === 'e_insight1');
  expect(insight?.type).toBe('text');
  expect((await currentSlide(page)).elements.map((e) => e.id)).toContain('e_table');
  // The whole turn is one undo step.
  expect(await undoDepth(page)).toBe(depth + 1);

  // Into a chart: the same way, and the chart takes the table's place.
  await select(page, ['e_table']);
  await say(page, 'הפוך את הטבלה לגרף');
  const after = (await currentSlide(page)).elements;
  expect(after.map((e) => e.type)).toEqual(['text', 'text', 'chart']);
  expect(after.find((e) => e.type === 'chart')).toMatchObject({
    chartType: 'column',
    data: {
      categories: ['צפון', 'מרכז', 'דרום'],
      series: [{ name: 'לקוחות', values: [340, 520, 210] }],
    },
  });
  expect(await undoDepth(page)).toBe(depth + 2);
  // Undoing the turn brings the table back and takes the chart away.
  await turns(page).nth(1).getByTestId('undo-turn').click();
  expect((await currentSlide(page)).elements.map((e) => e.id)).toEqual([
    'e_title',
    'e_table',
    'e_insight1',
  ]);
  expect(errors).toEqual([]);
});

test('the options of a chart in English', async ({ page }) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'chart-actions', lang: 'en' });
  await addChart(page);
  await openTool(page);
  await say(page, 'Suggest three chart types that fit the data');
  await expect(gallery(page)).toHaveAttribute('aria-label', 'Pick an option for the chart');
  expect(errors).toEqual([]);
});
