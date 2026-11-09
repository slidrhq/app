import { expect, test, type Page } from '@playwright/test';
import {
  addBody,
  addTitle,
  cards,
  chat,
  collectErrors,
  focusChip,
  gallery,
  input,
  onStage,
  openApp,
  openTool,
  panel,
  say,
  select,
  TITLE,
} from './aitools-helpers';

/*
 * The AI chat in the shell (WG11-T04, T06, T07, T10; ADR-072), against the scripted mock agent:
 * one AI tool with no duplicate chat buttons, one conversation whatever is selected, the chip
 * that says what the next message is about (words selected in a text among them), and the
 * status bar while the agent works.
 */

/** A Tool Panel that is not the AI chat, to leave it for. */
const leave = (page: Page) =>
  page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();

/** Selects words of the text being edited, as a drag of the mouse would. */
async function selectWords(page: Page, words: string): Promise<void> {
  await page.evaluate((wanted) => {
    const root = document.querySelector('[data-text-editor]')!;
    const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
    for (let node = walker.nextNode(); node; node = walker.nextNode()) {
      const at = node.textContent!.indexOf(wanted);
      if (at < 0) continue;
      const range = document.createRange();
      range.setStart(node, at);
      range.setEnd(node, at + wanted.length);
      const selection = window.getSelection()!;
      selection.removeAllRanges();
      selection.addRange(range);
      return;
    }
    throw new Error(`"${wanted}" is not in the text being edited`);
  }, words);
}

test('one AI tool, with no duplicate chat buttons in the editor', async ({ page }) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'text-variations' });
  await addBody(page, 'להשיק את העורך החדש');
  await addTitle(page);
  await select(page, []);
  const bar = page.getByTestId('activity-bar');

  // The Activity Bar has one AI tool (SPEC 4.2), and no panel of ready-made actions beside it.
  await expect(bar.locator('[data-panel^="ai"]')).toHaveCount(1);
  await expect(bar.locator('[data-panel="actions"]')).toHaveCount(0);
  await expect(panel(page).getByRole('heading', { level: 2 })).toHaveText("צ'אט AI");
  await leave(page);
  await expect(panel(page)).toHaveCount(0);
  await bar.locator('[data-panel="ai"]').click();
  await expect(panel(page)).toBeVisible();

  // Ctrl+1 (SPEC appendix A).
  await leave(page);
  await page.getByTestId('stage-surface').focus();
  await page.keyboard.press('Control+1');
  await expect(panel(page)).toBeVisible();

  // The creation and context toolbars have no duplicate chat buttons.
  await expect(
    page.getByTestId('top-tools-b').getByRole('button', { name: "צ'אט AI" }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId('top-tools-b').getByRole('button', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await leave(page);
  await page.getByTestId('stage-surface').focus();
  await page.keyboard.press('Control+l');
  await expect(input(page)).toBeFocused();
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'slide');
  await expect(focusChip(page)).toContainText('שקף 1');

  // Selecting an object updates the same chat, without adding a button to either toolbar.
  await select(page, ['e_title']);
  await expect(
    page.getByTestId('top-tools-b').getByRole('button', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await expect(
    page.getByTestId('selection-toolbar').getByRole('button', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'object');
  await expect(focusChip(page)).toContainText(TITLE);

  // Right-click menus select their target; the chat picks it up directly.
  await onStage(page, 'e_body').click({ button: 'right' });
  await expect(
    page.getByTestId('stage-menu').getByRole('menuitem', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(focusChip(page)).toContainText('להשיק את העורך החדש');

  // A right click on the slide itself clears the selection: the chat is about the slide.
  await page.getByTestId('stage-frame').click({ button: 'right', position: { x: 40, y: 600 } });
  await expect(
    page.getByTestId('stage-menu').getByRole('menuitem', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'slide');

  // The Filmstrip's menu has no chat entry either.
  await page.getByTestId('filmstrip').getByRole('option').first().click({ button: 'right' });
  await expect(
    page.getByTestId('slide-menu').getByRole('menuitem', { name: /שאלו את ה-AI/ }),
  ).toHaveCount(0);
  await page.keyboard.press('Escape');
  await expect(panel(page)).toBeVisible();
  expect(errors).toEqual([]);
});

test('one conversation whatever is selected, and a chip that says what a message is about', async ({
  page,
}) => {
  await openApp(page, { script: 'slide-redesign' });
  await addTitle(page, 'שלושת היעדים של 2027');
  await select(page, []);
  await openTool(page, 'chat');
  await expect(chat(page)).toContainText('מה נבנה?');
  // The openings and the field are about what the user has in front of them: a slide with content.
  await expect(page.getByTestId('chat-suggestions')).toHaveAttribute('data-for', 'slide');
  await expect(input(page)).toHaveAttribute('placeholder', 'מה לשנות בשקף הזה?');
  await say(page, 'עצב מחדש את השקף');
  await expect(cards(page)).toHaveCount(3);
  const thread = (await chat(page).getAttribute('data-thread'))!;
  const [first] = await page.evaluate(() => window.slidr!.bus.deck.slides.map((s) => s.id));

  // Another slide: the same conversation. The options were for the first slide, and wait there.
  await page.evaluate(() => {
    const { bus, selection } = window.slidr!;
    bus.dispatch({ type: 'slide.add', slide: { id: 's_second', elements: [], timeline: [] } });
    selection.getState().setCurrentSlide('s_second');
  });
  await expect(focusChip(page)).toContainText('שקף 2');
  await expect(chat(page)).toHaveAttribute('data-thread', thread);
  await expect(page.getByTestId('chat-user')).toHaveText('עצב מחדש את השקף');
  await expect(gallery(page)).toHaveCount(0);
  await page.evaluate((id) => window.slidr!.selection.getState().setCurrentSlide(id), first!);
  await expect(cards(page)).toHaveCount(3);

  // Selecting an object changes what the next message is about, not the conversation.
  await select(page, ['e_title']);
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'object');
  await expect(input(page)).toHaveAttribute('placeholder', 'מה לשנות במה שבחרתם?');
  await expect(chat(page)).toHaveAttribute('data-thread', thread);
  // With nothing selected, it is about the slide again.
  await select(page, []);
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'slide');
});

test('words selected in a text are what the next message is about (ADR-072)', async ({ page }) => {
  const errors = collectErrors(page);
  await openApp(page, { script: 'text-variations' });
  await addTitle(page, 'עוזר AI מציע לנציגים תשובות בזמן אמת');
  await openTool(page, 'chat');

  // The user edits the title and selects some of its words, then goes to the chat to write.
  await onStage(page, 'e_title').dblclick();
  await expect(page.locator('[data-text-editor]')).toBeFocused();
  await selectWords(page, 'תשובות בזמן אמת');
  await input(page).click();
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'text');
  await expect(focusChip(page)).toContainText('טקסט נבחר');
  await expect(focusChip(page)).toContainText('“תשובות בזמן אמת”');
  await expect(input(page)).toHaveAttribute('placeholder', 'מה לעשות עם הטקסט שבחרתם?');
  // The text is still being edited, and its selection is still drawn on the slide.
  await expect(page.locator('[data-blurred-selection]')).toHaveText('תשובות בזמן אמת');

  // The agent learns of the words with the message, and from selection_get within the turn.
  const turn = await say(page, 'ניסוחים אחרים');
  const read = turn.locator('[data-testid="tool-chip"][data-tool="selection_get"]');
  await read.getByRole('button', { name: 'פרטים' }).click();
  await expect(read).toContainText('"textSelection"');
  await expect(read).toContainText('תשובות בזמן אמת');
  // The options are for the element the words are in.
  await expect(cards(page)).toHaveCount(4);

  // Leaving the text: the chat is about the element again.
  await page.keyboard.press('Escape');
  await onStage(page, 'e_title').click();
  await expect(focusChip(page)).toHaveAttribute('data-focus', 'object');
  expect(errors).toEqual([]);
});

test('the status bar says what the agent is doing', async ({ page }) => {
  await openApp(page, { script: 'text-variations', speed: 1 });
  await addTitle(page);
  const status = page.getByTestId('status-agent');
  await expect(status).toHaveAttribute('data-state', 'idle');
  await expect(status).toHaveText('הסוכן לא פעיל');

  await openTool(page, 'chat');
  await input(page).fill('ניסוחים אחרים');
  await input(page).press('Enter');
  await expect(status).toHaveAttribute('data-state', 'working');
  await expect(status).toContainText('הסוכן עובד');

  await expect(status).toHaveAttribute('data-state', 'idle', { timeout: 15_000 });
});
