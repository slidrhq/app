import { expect, test, type Page } from '@playwright/test';
import type * as Runtime from '../src/ai/runtime';
import type * as RequestHarness from './harness-request-page';
import type * as Setup from '../src/agent/harnessSetup';
import type * as Settings from '../src/settings';
import type {
  AgentClient,
  HarnessDescriptor,
  HarnessStatus,
  ModelOption,
} from '../src/agent/agent';
import { openApp } from './arrange-helpers';

test.beforeEach(async ({ page }) => {
  // Keep the actual Vite module URL, including its HMR version, for the shared runtime.
  await page.addInitScript(() => performance.setResourceTimingBufferSize(5000));
});

/** `models`: what every harness lists once connected; by default two without a version. */
async function fixtures(page: Page, models?: ModelOption[]) {
  await page.evaluate(async (listed) => {
    const runtimePath =
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .findLast((name) => /\/src\/ai\/runtime\.ts(?:\?|$)/.test(name)) ?? '/src/ai/runtime.ts';
    const setupPath = '/src/agent/harnessSetup.ts';
    const settingsPath = '/src/settings/index.ts';
    const { agentOf } = (await import(/* @vite-ignore */ runtimePath)) as typeof Runtime;
    const { HarnessSetup } = (await import(/* @vite-ignore */ setupPath)) as typeof Setup;
    const { setAgentSettings } = (await import(/* @vite-ignore */ settingsPath)) as typeof Settings;
    const agent = agentOf(window.slidr!);
    const capabilities = {
      streaming: true,
      resume: true,
      interrupt: true,
      imageInput: true,
      toolEndpoint: true,
      thinking: true,
    };
    const descriptors: HarnessDescriptor[] = [
      {
        id: 'claude-code',
        name: 'Claude Code',
        capabilities,
        models: [],
        defaultModel: null,
        effortLevels: [],
      },
      {
        id: 'codex-cli',
        name: 'Codex CLI',
        capabilities,
        models: [],
        defaultModel: null,
        effortLevels: [],
      },
      {
        id: 'copilot-cli',
        name: 'GitHub Copilot CLI',
        capabilities,
        models: [],
        defaultModel: null,
        effortLevels: [],
      },
      {
        id: 'gemini-cli',
        name: 'Gemini CLI',
        capabilities,
        models: [],
        defaultModel: null,
        effortLevels: [],
      },
      {
        id: 'grok-cli',
        name: 'Grok CLI',
        capabilities,
        models: [],
        defaultModel: null,
        effortLevels: [],
      },
    ];
    const states: Record<string, HarnessStatus['state']> = {
      'claude-code': 'ready',
      'codex-cli': 'ready',
      'copilot-cli': 'not_installed',
      'gemini-cli': 'not_installed',
      'grok-cli': 'not_logged_in',
    };
    descriptors.push({
      id: 'mock',
      name: 'Scripted mock',
      capabilities,
      models: [],
      defaultModel: null,
      effortLevels: [],
    });
    const client = {
      connect: (id: string) => {
        document.body.dataset.connectedHarness = id;
        return Promise.resolve({
          status: { state: states[id]!, version: '1.2.3', account: null, detail: null },
          harness: {
            ...descriptors.find((h) => h.id === id)!,
            models: listed ?? [
              { id: `${id}-reasoning`, label: 'Reasoning model', effortLevels: ['low', 'ultra'] },
              { id: `${id}-simple`, label: 'Simple model', effortLevels: [] },
            ],
          },
        });
      },
      install: (id: string) => {
        document.body.dataset.installedHarness = id;
        states[id] = 'not_logged_in';
        return Promise.resolve();
      },
      login: (id: string) => {
        document.body.dataset.loggedInHarness = id;
        states[id] = 'ready';
        return Promise.resolve();
      },
    } as AgentClient;
    agent.harnesses = () => Promise.resolve(descriptors);
    Object.assign(agent, { setup: new HarnessSetup(client, (id) => agent.harness(id)) });
    setAgentSettings({ harnessId: 'claude-code', model: undefined, effort: undefined });
  }, models);
  await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
  await page.locator('[data-settings-tab="agent"]').click();
  await expect(page.getByTestId('harness-connection')).toContainText(/Connected|מחובר/);
}

test('selection connects, installation needs approval, and sign-in loads models before choosing effort', async ({
  page,
}) => {
  await openApp(page, { lang: 'en' });
  await fixtures(page);
  await page.getByRole('combobox', { name: 'Harness', exact: true }).click();
  await page.getByRole('option', { name: 'GitHub Copilot CLI', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-connected-harness', 'copilot-cli');
  await expect(page.getByTestId('harness-connection')).toContainText('not installed');
  await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveCount(0);
  await expect(page.locator('body')).not.toHaveAttribute('data-installed-harness');
  await page.getByRole('button', { name: 'Install…', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('Windows App Installer');
  await page.getByRole('button', { name: 'Cancel', exact: true }).first().click();
  await expect(page.locator('body')).not.toHaveAttribute('data-installed-harness');
  await page.getByRole('button', { name: 'Install…', exact: true }).click();
  await page.getByRole('button', { name: 'Approve and install', exact: true }).click();
  await expect(page.getByTestId('harness-connection')).toContainText('Sign in to your account');
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toContainText(
    'Choose a model',
  );
  await page.getByRole('combobox', { name: 'Model', exact: true }).click();
  await page.getByRole('option', { name: 'Reasoning model', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Effort', exact: true })).toContainText(
    'Choose an effort',
  );
  await page.getByRole('combobox', { name: 'Effort', exact: true }).click();
  await expect(page.getByRole('option')).toHaveCount(2);
  await page.getByRole('option', { name: /ultra/i }).click();
  await page.getByRole('combobox', { name: 'Model', exact: true }).click();
  await page.getByRole('option', { name: 'Simple model', exact: true }).click();
  await expect(page.getByRole('combobox', { name: 'Effort', exact: true })).toHaveCount(0);
  await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
  await expect(page.getByTestId('model-picker')).toContainText('Simple model');
  await expect(page.getByTestId('model-picker')).toHaveAttribute('data-effort', '');
});

test('the first-time setup, Settings and the chat picker offer only the newest of each model', async ({
  page,
}) => {
  const efforts = ['low', 'high'];
  await openApp(page, { lang: 'en' });
  await fixtures(page, [
    { id: 'opus-5-5', label: 'Opus 5.5', effortLevels: efforts },
    { id: 'sonnet-5-5', label: 'Sonnet 5.5', effortLevels: efforts },
    { id: 'opus-5', label: 'Opus 5', effortLevels: efforts },
    { id: 'sonnet-4-8', label: 'Sonnet 4.8', effortLevels: efforts },
  ]);
  const newest = ['Opus 5.5', 'Sonnet 5.5'];
  const ai = page.getByTestId('activity-bar').locator('[data-panel="ai"]');
  const settings = async () => {
    await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
    await page.locator('[data-settings-tab="agent"]').click();
  };

  // First use: the chat asks for the agent, then its model.
  await ai.click();
  const setup = page.getByTestId('chat-setup');
  await setup.getByRole('radio', { name: 'Claude', exact: true }).check();
  await setup.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(setup.getByRole('radio')).toHaveCount(newest.length);
  for (const label of newest) await expect(setup.getByRole('radio', { name: label })).toBeVisible();
  await setup.getByRole('radio', { name: 'Opus 5.5' }).check();
  await setup.getByRole('button', { name: 'Continue', exact: true }).click();
  await setup.getByRole('radio', { name: 'High' }).check();
  await setup.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(setup).toHaveCount(0);

  // The conversation's own picker.
  const picker = page.getByTestId('model-picker');
  await expect(picker).toHaveAttribute('data-model', 'opus-5-5');
  await picker.click();
  const menu = page.getByRole('menu');
  await expect(menu.locator('[data-model]')).toHaveText(newest);
  await page.screenshot({ path: 'test-results/model-picker-newest-en.png' });
  await page.keyboard.press('Escape');

  // Settings.
  await settings();
  const model = page.getByRole('combobox', { name: 'Model', exact: true });
  await expect(model).toContainText('Opus 5.5');
  await model.click();
  await expect(page.getByRole('option')).toHaveText(newest);
  await page.getByRole('option', { name: 'Sonnet 5.5', exact: true }).click();
  await expect(model).toContainText('Sonnet 5.5');
  // The effort goes on with the next model, which has it.
  const effort = page.getByRole('combobox', { name: 'Effort', exact: true });
  await expect(effort).toContainText('High');

  // An older model chosen before gives way to the newest of its family, and is not listed.
  await page.evaluate(async () => {
    const path = '/src/settings/index.ts';
    const { setAgentSettings } = (await import(/* @vite-ignore */ path)) as typeof Settings;
    setAgentSettings({ model: 'opus-5', effort: 'high' });
  });
  await expect(model).toContainText('Opus 5.5');
  await expect(effort).toContainText('High');
  await model.click();
  await expect(page.getByRole('option')).toHaveText(newest);
  await page.screenshot({ path: 'test-results/settings-model-newest-en.png' });
  await page.keyboard.press('Escape');
  await ai.click();
  await expect(picker).toHaveAttribute('data-model', 'opus-5-5');
  await picker.click();
  await expect(menu.locator('[data-model]')).toHaveText(newest);
});

for (const lang of ['he', 'en'] as const) {
  test(`Settings shows what was chosen at once, and connects plainly only a harness never ready, in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    const word = (en: string, he: string) => (lang === 'he' ? he : en);
    await fixtures(page, [
      { id: 'opus-5-5', label: 'Opus 5.5', effortLevels: ['low', 'high'] },
      { id: 'sonnet-5-5', label: 'Sonnet 5.5', effortLevels: ['low', 'high'] },
    ]);
    const model = page.getByRole('combobox', { name: word('Model', 'מודל'), exact: true });
    const effort = page.getByRole('combobox', { name: word('Effort', 'רמת מאמץ'), exact: true });
    const high = word('High', 'גבוהה');
    await model.click();
    await page.getByRole('option', { name: 'Sonnet 5.5', exact: true }).click();
    await effort.click();
    await page.getByRole('option', { name: high, exact: true }).click();
    // From here a check answers only when the page says so: what shows meanwhile can be looked at.
    await page.evaluate(async () => {
      const path =
        performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .findLast((name) => /\/src\/ai\/runtime\.ts(?:\?|$)/.test(name)) ?? '/src/ai/runtime.ts';
      const { agentOf } = (await import(/* @vite-ignore */ path)) as typeof Runtime;
      const setup = agentOf(window.slidr!).setup;
      const client = (setup as unknown as { client: AgentClient }).client;
      const connect = client.connect!.bind(client);
      client.connect = async (id) => {
        await new Promise((resolve) =>
          document.addEventListener('release-check', resolve, { once: true }),
        );
        const connection = await connect(id);
        // The harness has a newer Sonnet since, and no longer lists the one chosen.
        return {
          ...connection,
          harness: {
            ...connection.harness,
            models: connection.harness.models.map((model) =>
              model.id === 'sonnet-5-5'
                ? { ...model, id: 'sonnet-5-6', label: 'Sonnet 5.6' }
                : model,
            ),
          },
        };
      };
    });
    const release = () => page.evaluate(() => document.dispatchEvent(new Event('release-check')));
    const connection = page.getByTestId('harness-connection');

    // What the fields show in every frame drawn while the panel is on screen, one value after
    // another, so that a blink is seen.
    await page.evaluate(
      (names) => {
        const shown: string[] = [];
        let last = '';
        Object.assign(window, { shownFields: shown });
        const look = () => {
          const fields = names.map((name) => document.querySelector(`[aria-label="${name}"]`));
          if (fields.every((field) => field && field.getBoundingClientRect().height > 0)) {
            const value = fields
              .map(
                (field) =>
                  `${field!.textContent}${field!.hasAttribute('disabled') ? ' (closed)' : ''}`,
              )
              .join(' | ');
            if (value !== last) shown.push(value);
            last = value;
          }
          requestAnimationFrame(look);
        };
        requestAnimationFrame(look);
      },
      [word('Model', 'מודל'), word('Effort', 'רמת מאמץ')],
    );
    const shown = () =>
      page.evaluate(() => (window as unknown as { shownFields: string[] }).shownFields.splice(0));

    // Opened again, the section checks the harness behind what it showed last, and says nothing
    // of it: there is no button to refresh, and no spinner.
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
    await expect(connection).toContainText(word('Connected', 'מחובר'));
    await expect(connection).not.toContainText(word('Connecting', 'מתחברים'));
    await expect(connection.getByRole('button')).toHaveCount(0);
    await expect(model).toContainText('Sonnet 5.5');
    await expect(effort).toContainText(high);
    await page.screenshot({ path: `test-results/settings-agent-checking-${lang}.png` });
    await release();
    await expect(model).toContainText('Sonnet 5.6');
    await expect(effort).toContainText(high);
    expect(await shown()).toEqual([`Sonnet 5.5 | ${high}`, `Sonnet 5.6 | ${high}`]);

    // Another harness, never ready before, says it is connecting; its fields wait in their place.
    await page.getByRole('combobox', { name: 'Harness', exact: true }).click();
    await page.getByRole('option', { name: 'Codex CLI', exact: true }).click();
    await expect(connection).toContainText(
      word('Connecting and loading available models', 'מתחברים וטוענים מודלים זמינים'),
    );
    await expect(model).toBeDisabled();
    await expect(page.getByTestId('settings-agent').locator('.skeleton')).toHaveCount(0);
    const defaults = page
      .getByText(word('Defaults for chats', 'ברירת המחדל של שיחות'), { exact: true })
      .locator('..');
    const before = await defaults.boundingBox();
    await page.screenshot({ path: `test-results/settings-agent-connecting-${lang}.png` });
    await release();
    await expect(model).toBeEnabled();
    await expect(effort).toBeDisabled();
    expect((await defaults.boundingBox())?.height).toBe(before?.height);
    const chooseModel = word('Choose a model', 'בחרו מודל');
    const chooseEffort = word('Choose an effort', 'בחרו רמת מאמץ');
    expect(await shown()).toEqual([
      `${chooseModel} (closed) | ${chooseEffort} (closed)`,
      `${chooseModel} | ${chooseEffort} (closed)`,
    ]);
    await page.screenshot({ path: `test-results/settings-agent-connected-${lang}.png` });

    // The harness of before comes back with what was chosen on it, in one frame: no placeholder,
    // and nothing closed, on the way.
    await page.getByRole('combobox', { name: 'Harness', exact: true }).click();
    await page.getByRole('option', { name: 'Claude Code', exact: true }).click();
    await expect(model).toContainText('Sonnet 5.6');
    await expect(effort).toContainText(high);
    await release();
    await page.waitForTimeout(300);
    expect(await shown()).toEqual([`Sonnet 5.6 | ${high}`]);
    // The text of a field changes at once: its colour is not eased from the value before.
    expect(await model.evaluate((field) => getComputedStyle(field).transitionProperty)).not.toMatch(
      /(^|[ ,])(color|all)([ ,]|$)/,
    );
  });
}

test('chat handles installation, sign-in and a model without effort', async ({ page }) => {
  await openApp(page, { lang: 'en' });
  await fixtures(page);
  await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
  const setup = page.getByTestId('chat-setup');
  await setup.getByRole('radio', { name: 'GitHub Copilot' }).check();
  await setup.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(setup).toContainText('Windows App Installer');
  await expect(page.locator('body')).not.toHaveAttribute('data-installed-harness');
  await setup.getByRole('button', { name: 'Approve and install' }).click();
  await setup.getByRole('button', { name: 'Sign in', exact: true }).click();
  await setup.getByRole('radio', { name: 'Simple model' }).check();
  await setup.getByRole('button', { name: 'Continue', exact: true }).click();
  await expect(setup).toHaveCount(0);
  await expect(page.getByTestId('model-picker')).toHaveAttribute(
    'data-model',
    'copilot-cli-simple',
  );
  await expect(page.getByTestId('model-picker')).toHaveAttribute('data-effort', '');
});

for (const lang of ['he', 'en'] as const) {
  test(`the chat's install and sign-in steps end in one row, their action last, in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    const setup = page.getByTestId('chat-setup');
    const word = (en: string, he: string) => (lang === 'he' ? he : en);
    await setup.getByRole('radio', { name: 'GitHub Copilot' }).check();
    await setup.getByRole('button', { name: word('Continue', 'המשך'), exact: true }).click();
    const back = word('Back', 'חזרה');
    const install = word('Approve and install', 'אישור והתקנה');
    await expect(setup.getByRole('button')).toHaveText([back, install]);
    await setup.screenshot({ path: `test-results/chat-setup-install-${lang}.png` });
    await setup.getByRole('button', { name: install, exact: true }).click();
    // Signing in checks the agent again by itself: there is nothing to try again.
    const signIn = word('Sign in', 'התחברות לחשבון');
    await expect(setup.getByRole('button')).toHaveText([back, signIn]);
    await setup.screenshot({ path: `test-results/chat-setup-sign-in-${lang}.png` });
  });
}

test('Gemini installs with npm once approved, and Grok signs in before its models load', async ({
  page,
}) => {
  await openApp(page, { lang: 'en' });
  await fixtures(page);
  const harness = page.getByRole('combobox', { name: 'Harness', exact: true });
  await harness.click();
  await page.getByRole('option', { name: 'Gemini CLI', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-connected-harness', 'gemini-cli');
  await expect(page.getByTestId('harness-connection')).toContainText('not installed');
  await page.getByRole('button', { name: 'Install…', exact: true }).click();
  await expect(page.getByRole('dialog')).toContainText('with npm');
  await expect(page.getByRole('dialog')).toContainText('Node.js');
  await page.getByRole('button', { name: 'Approve and install', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-installed-harness', 'gemini-cli');
  await expect(page.getByTestId('harness-connection')).toContainText('Sign in to your account');
  await harness.click();
  await page.getByRole('option', { name: 'Grok CLI', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-connected-harness', 'grok-cli');
  await expect(page.getByTestId('harness-connection')).toContainText('Sign in to your account');
  await expect(page.getByRole('combobox', { name: 'Model', exact: true })).toHaveCount(0);
  await page.getByRole('button', { name: 'Sign in', exact: true }).click();
  await expect(page.locator('body')).toHaveAttribute('data-logged-in-harness', 'grok-cli');
  await page.getByRole('combobox', { name: 'Model', exact: true }).click();
  await page.getByRole('option', { name: 'Simple model', exact: true }).click();
  await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
  await expect(page.getByTestId('model-picker')).toHaveAttribute('data-model', 'grok-cli-simple');
});

for (const lang of ['he', 'en'] as const) {
  test(`the chat offers Gemini and Grok beside the other harnesses in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    const setup = page.getByTestId('chat-setup');
    for (const name of ['Claude', 'Codex', 'GitHub Copilot', 'Gemini', 'Grok'])
      await expect(setup.getByRole('radio', { name, exact: true })).toBeVisible();
    await page.screenshot({ path: `test-results/harness-choice-${lang}.png` });
    await setup.getByRole('radio', { name: 'Gemini', exact: true }).check();
    await setup.getByRole('button', { name: lang === 'he' ? 'המשך' : 'Continue' }).click();
    await expect(setup).toContainText('npm');
    await expect(setup).toContainText('Node.js');
    await page.screenshot({ path: `test-results/harness-gemini-install-${lang}.png` });
  });
}

/** A chat service whose CLI answers its checks only when the test releases them. */
async function requestHarness(page: Page, outcome: RequestHarness.RequestOutcome) {
  await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
  await page.evaluate(async (result) => {
    const runtimePath =
      performance
        .getEntriesByType('resource')
        .map((entry) => entry.name)
        .findLast((name) => /\/src\/ai\/runtime\.ts(?:\?|$)/.test(name)) ?? '/src/ai/runtime.ts';
    const fixturePath = '/e2e/harness-request-page.ts';
    const { aiOf } = (await import(/* @vite-ignore */ runtimePath)) as typeof Runtime;
    const { installRequestHarness } = (await import(
      /* @vite-ignore */ fixturePath
    )) as typeof RequestHarness;
    await installRequestHarness(aiOf(window.slidr!), result);
  }, outcome);
}

for (const outcome of ['ready', 'not_logged_in', 'model_missing', 'error', 'list_error'] as const) {
  test(`saved chat checks only after a request: ${outcome}`, async ({ page }) => {
    await openApp(page, { lang: 'en' });
    await fixtures(page);
    await requestHarness(page, outcome);
    const ai = page.getByTestId('activity-bar').locator('[data-panel="ai"]');
    await ai.click();
    const input = page.getByTestId('chat-input');
    await expect(input).toBeVisible();
    await expect(page.getByTestId('model-picker')).toHaveAttribute(
      'data-model',
      'claude-code-reasoning',
    );
    await expect(page.getByTestId('model-picker')).toHaveAttribute('data-effort', 'ultra');
    await input.fill('Check when I ask');
    await expect(page.getByTestId('chat-setup')).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-harness-reads', '0');
    await expect(page.locator('body')).toHaveAttribute('data-connection-checks', '0');
    if (outcome === 'ready')
      await page.screenshot({ path: 'test-results/chat-saved-before-request-en.png' });
    // Reopening a configured chat also stays local, even without an in-memory connection.
    await page.getByTestId('activity-bar').locator('[data-panel="elements"]').click();
    await ai.click();
    await expect(input).toHaveValue('Check when I ask');
    await expect(page.locator('body')).toHaveAttribute('data-harness-reads', '0');
    await expect(page.locator('body')).toHaveAttribute('data-connection-checks', '0');
    await input.press('Enter');
    await expect(page.locator('body')).toHaveAttribute('data-harness-reads', '1');
    await expect(page.locator('body')).toHaveAttribute('data-connection-checks', '0');
    await page.evaluate(() => document.dispatchEvent(new Event('release-harnesses')));
    if (outcome !== 'list_error') {
      await expect(page.locator('body')).toHaveAttribute('data-connection-checks', '1');
      await expect(page.getByTestId('chat-setup')).toHaveCount(0);
      await page.evaluate(() => document.dispatchEvent(new Event('release-connection')));
    }
    const turn = page.getByTestId('chat-assistant');
    if (outcome === 'ready') {
      await expect(turn).toHaveAttribute('data-outcome', 'completed');
      await expect(turn).toContainText('Connected on request.');
      await expect(page.getByTestId('chat-setup')).toHaveCount(0);
      await expect(input).toBeVisible();
    } else {
      await expect(turn).toHaveAttribute('data-outcome', 'failed');
      await expect(page.getByTestId('chat-problem')).toBeVisible();
      if (outcome === 'not_logged_in')
        await expect(
          page.getByTestId('chat-problem').getByRole('button', { name: 'Sign in', exact: true }),
        ).toBeVisible();
      else if (outcome === 'model_missing')
        await expect(
          page.getByTestId('chat-setup').getByRole('radio', { name: 'Simple model' }),
        ).toBeVisible();
    }
  });
}

for (const lang of ['he', 'en'] as const) {
  test(`a signed-out agent put right in its card stays put right as the chat goes on in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await requestHarness(page, 'not_logged_in');
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    const input = page.getByTestId('chat-input');
    await input.fill(lang === 'he' ? 'שקף פתיחה לרבעון' : 'An opening slide for the quarter');
    await input.press('Enter');
    await page.evaluate(() => document.dispatchEvent(new Event('release-harnesses')));
    await expect(page.locator('body')).toHaveAttribute('data-connection-checks', '1');
    await page.evaluate(() => document.dispatchEvent(new Event('release-connection')));
    const turns = page.getByTestId('chat-assistant');
    const problem = turns.first().getByTestId('chat-problem');
    await expect(problem).toHaveAttribute('data-kind', 'not_logged_in');
    await expect(problem).not.toHaveAttribute('data-fixed');
    await problem
      .getByRole('button', { name: lang === 'he' ? 'התחברות לחשבון' : 'Sign in', exact: true })
      .click();
    await expect(problem).toHaveAttribute('data-fixed', 'true');
    await expect(problem).toContainText(lang === 'he' ? 'הסוכן מוכן' : 'The agent is ready');

    // Sending again does not bring the problem back to the card it was put right in.
    await input.fill(lang === 'he' ? 'שקף פתיחה לרבעון' : 'An opening slide for the quarter');
    await input.press('Enter');
    await expect(turns.nth(1)).toHaveAttribute('data-outcome', 'completed');
    await expect(turns.nth(1).getByTestId('chat-problem')).toHaveCount(0);
    await expect(problem).toHaveAttribute('data-fixed', 'true');
    await expect(problem).toContainText(lang === 'he' ? 'הסוכן מוכן' : 'The agent is ready');
    await expect(problem.getByRole('button')).toHaveCount(0);
    await page
      .getByTestId('chat')
      .screenshot({ path: `test-results/chat-problem-settled-${lang}.png` });
  });
}

for (const lang of ['he', 'en'] as const) {
  test(`another agent chosen in Settings mid-conversation is finished from its model, in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await requestHarness(page, 'ready');
    const ai = page.getByTestId('activity-bar').locator('[data-panel="ai"]');
    await ai.click();
    const input = page.getByTestId('chat-input');
    await input.fill(lang === 'he' ? 'שקף פתיחה לרבעון' : 'An opening slide for the quarter');
    await input.press('Enter');
    await page.evaluate(() => document.dispatchEvent(new Event('release-harnesses')));
    await page.evaluate(() => document.dispatchEvent(new Event('release-connection')));
    const turn = page.getByTestId('chat-assistant');
    await expect(turn).toHaveAttribute('data-outcome', 'completed');
    // Another agent, never given a model, chosen in Settings.
    await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
    await page.locator('[data-settings-tab="agent"]').click();
    await page.getByRole('combobox', { name: 'Harness', exact: true }).click();
    await page.getByRole('option', { name: 'Codex CLI', exact: true }).click();
    await ai.click();
    const setup = page.getByTestId('chat-setup');
    await expect(setup).toBeVisible();
    await expect(setup).toContainText(
      lang === 'he' ? 'בואו נשלים את ההגדרות' : 'Let’s finish setting up',
    );
    await expect(setup).not.toContainText(lang === 'he' ? 'ברוכים הבאים' : 'Welcome');
    await expect(turn).toContainText('Connected on request.');
    // The agent was chosen: the setup goes on from its model.
    await expect(setup.locator('[aria-current="step"]')).toContainText(
      lang === 'he' ? 'מודל' : 'Model',
    );
    await expect(setup.getByRole('radio', { name: 'Codex', exact: true })).toHaveCount(0);
    await setup.getByRole('radio', { name: 'Reasoning model' }).check();
    await setup.scrollIntoViewIfNeeded();
    await page
      .getByTestId('chat')
      .screenshot({ path: `test-results/chat-setup-midway-${lang}.png` });
    const next = () => setup.getByRole('button', { name: /^(Continue|המשך)$/ }).click();
    await next();
    await setup.getByRole('radio').last().check();
    await next();
    await expect(setup).toHaveCount(0);
    await expect(input).toBeVisible();
    await expect(turn).toContainText('Connected on request.');
  });

  test(`another agent chosen in Settings goes on from its model in a new chat, in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await page.getByRole('combobox', { name: 'Harness', exact: true }).click();
    await page.getByRole('option', { name: 'Codex CLI', exact: true }).click();
    await expect(page.locator('body')).toHaveAttribute('data-connected-harness', 'codex-cli');
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    const setup = page.getByTestId('chat-setup');
    await expect(setup.locator('[aria-current="step"]')).toContainText(
      lang === 'he' ? 'מודל' : 'Model',
    );
    await expect(setup).toContainText(
      lang === 'he' ? 'בואו נשלים את ההגדרות' : 'Let’s finish setting up',
    );
    await expect(setup.getByRole('radio', { name: 'Reasoning model' })).toBeVisible();
    await page.screenshot({ path: `test-results/chat-setup-from-settings-${lang}.png` });
    // Back still reaches the agent, with the one chosen in Settings marked.
    await setup.getByRole('button', { name: /^(Back|חזרה)$/ }).click();
    await expect(setup.getByRole('radio', { name: 'Codex', exact: true })).toBeChecked();
  });

  test(`configured chat reopens without loading or checking harnesses in ${lang}`, async ({
    page,
  }) => {
    await openApp(page, { lang });
    await fixtures(page);
    await page.evaluate(async () => {
      const path = '/src/settings/index.ts';
      const { setAgentSettings } = (await import(/* @vite-ignore */ path)) as typeof Settings;
      setAgentSettings({ model: 'claude-code-reasoning', effort: 'ultra' });
    });
    const ai = page.getByTestId('activity-bar').locator('[data-panel="ai"]');
    await ai.click();
    await expect(page.getByTestId('model-picker')).toHaveAttribute('data-effort', 'ultra');
    await page.getByTestId('chat-input').fill('Keep this draft');
    await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
    await page.locator('[data-settings-tab="agent"]').click();
    await expect(page.getByTestId('harness-connection')).toContainText(/Connected|מחובר/);
    await page.evaluate(async () => {
      const path =
        performance
          .getEntriesByType('resource')
          .map((entry) => entry.name)
          .findLast((name) => /\/src\/ai\/runtime\.ts(?:\?|$)/.test(name)) ?? '/src/ai/runtime.ts';
      const { agentOf } = (await import(/* @vite-ignore */ path)) as typeof Runtime;
      const agent = agentOf(window.slidr!);
      const harnesses = await agent.harnesses();
      const connect = agent.setup.connect.bind(agent.setup);
      agent.setup.connect = (...args) => {
        document.body.dataset.connectionCheck = 'called';
        return connect(...args);
      };
      const pending = new Promise<HarnessDescriptor[]>((resolve) => {
        document.addEventListener('release-harnesses', () => resolve(harnesses), { once: true });
      });
      agent.harnesses = () => {
        document.body.dataset.harnessCheck = 'waiting';
        return pending;
      };
      document.body.dataset.setupAppeared = 'false';
      new MutationObserver(() => {
        if (
          document.querySelector('[data-testid="chat-setup"], [data-testid="model-picker-setup"]')
        )
          document.body.dataset.setupAppeared = 'true';
      }).observe(document.body, { childList: true, subtree: true });
    });
    await ai.click();
    await expect(page.locator('body')).not.toHaveAttribute('data-harness-check');
    await expect(page.locator('body')).not.toHaveAttribute('data-connection-check');
    await expect(page.getByTestId('chat-input')).toHaveValue('Keep this draft');
    await expect(page.getByTestId('model-picker')).toHaveAttribute(
      'data-model',
      'claude-code-reasoning',
    );
    await expect(page.getByTestId('chat-setup')).toHaveCount(0);
    await expect(page.locator('body')).toHaveAttribute('data-setup-appeared', 'false');
    await page.screenshot({ path: `test-results/chat-configured-reopened-${lang}.png` });
    await page.evaluate(() => document.dispatchEvent(new Event('release-harnesses')));
    await expect(page.getByTestId('chat-input')).toHaveValue('Keep this draft');
    await expect(page.locator('body')).toHaveAttribute('data-setup-appeared', 'false');
  });

  test(`first-time setup stays in chat in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openApp(page, { lang });
    await fixtures(page);
    await page.evaluate(async () => {
      const path = '/src/settings/index.ts';
      const { setAgentSettings } = (await import(/* @vite-ignore */ path)) as typeof Settings;
      // A legacy/default Claude id must still start at the unselected service question.
      setAgentSettings({ harnessId: 'claude-code', model: undefined, effort: undefined });
      delete document.body.dataset.connectedHarness;
    });
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    const setup = page.getByTestId('chat-setup');
    await expect(setup).toBeVisible();
    await expect(setup).not.toContainText('CLI');
    await expect(setup.getByRole('radio', { checked: true })).toHaveCount(0);
    // The names of the agents and their models read left to right in Hebrew too; the efforts are
    // words of the page.
    const list = setup.getByRole('radiogroup');
    await expect(list).toHaveAttribute('dir', 'ltr');
    await expect(page.locator('body')).not.toHaveAttribute('data-connected-harness');
    await expect(setup).not.toContainText('Scripted mock');
    await expect(page.getByTestId('chat-input')).toHaveCount(0);
    await expect(setup).toContainText(lang === 'he' ? 'ברוכים הבאים' : 'Welcome');
    await page.screenshot({ path: `test-results/chat-setup-${lang}.png` });
    await setup.getByRole('radio', { name: 'Codex', exact: true }).check();
    await page.screenshot({ path: `test-results/chat-setup-selected-${lang}.png` });
    const next = () => setup.getByRole('button', { name: /^(Continue|המשך)$/ }).click();
    await next();
    const back = () => setup.getByRole('button', { name: /^(Back|חזרה)$/ }).click();
    await back();
    await expect(setup.getByRole('radio', { name: 'Codex', exact: true })).toBeChecked();
    await next();
    await setup.getByRole('radio', { name: 'Reasoning model' }).check();
    await expect(list).toHaveAttribute('dir', 'ltr');
    await page.screenshot({ path: `test-results/chat-setup-model-${lang}.png` });
    await next();
    await back();
    await expect(setup.getByRole('radio', { name: 'Reasoning model' })).toBeChecked();
    await next();
    await expect(setup.getByRole('radio')).toHaveCount(2);
    await expect(list).toHaveAttribute('dir', lang === 'he' ? 'rtl' : 'ltr');
    await page.screenshot({ path: `test-results/chat-setup-effort-${lang}.png` });
    await setup.getByRole('radio').last().check();
    await next();
    await expect(setup).toHaveCount(0);
    await expect(page.getByTestId('model-picker')).toHaveAttribute(
      'data-model',
      'codex-cli-reasoning',
    );
    await expect(page.getByTestId('model-picker')).toHaveAttribute('data-effort', 'ultra');
    await expect(page.getByTestId('chat-input')).toBeVisible();
    await page.getByTestId('activity-bar').locator('[data-panel="settings"]').click();
    await page.getByTestId('activity-bar').locator('[data-panel="ai"]').click();
    await expect(setup).toHaveCount(0);
  });

  test(`model selection is readable in ${lang}`, async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 768 });
    await openApp(page, { lang });
    await fixtures(page);
    const model = page.getByRole('combobox', { name: /^(Model|מודל)$/ });
    await model.click();
    await page.getByRole('option', { name: 'Reasoning model', exact: true }).click();
    const effort = page.getByRole('combobox', { name: /^(Effort|רמת מאמץ)$/ });
    await expect(effort).toBeVisible();
    await page.screenshot({ path: `test-results/harness-setup-${lang}.png` });
  });
}
