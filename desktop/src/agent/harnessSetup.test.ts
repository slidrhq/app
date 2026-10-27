import { describe, expect, it, vi } from 'vitest';
import { createScriptedAgent } from './scriptedAgent';
import {
  availableChoice,
  HarnessSetup,
  latestModels,
  modelEfforts,
  selectionIssue,
  storedConnections,
} from './harnessSetup';
import type { HarnessConnection, HarnessDescriptor, HarnessStatus } from './agent';

const harness: HarnessDescriptor = {
  id: 'codex-cli',
  name: 'Codex CLI',
  defaultModel: null,
  effortLevels: ['wrong'],
  capabilities: {
    streaming: true,
    resume: true,
    interrupt: true,
    imageInput: true,
    toolEndpoint: true,
    thinking: true,
  },
  models: [
    { id: 'a', label: 'A', effortLevels: ['low', 'ultra'] },
    { id: 'b', label: 'B', effortLevels: [] },
  ],
};
const ready: HarnessStatus = { state: 'ready', version: '1', account: null, detail: null };

describe('harness setup', () => {
  it('offers only the newest version of each model family', () => {
    const labels = (names: string[]) =>
      latestModels(names.map((label) => ({ label }))).map((model) => model.label);
    expect(
      labels(['Opus 5.5', 'Fable 5.1', 'Haiku 4.5', 'Sonnet 5', 'Opus 5', 'Fable 5', 'Opus 4.10']),
    ).toEqual(['Opus 5.5', 'Fable 5.1', 'Haiku 4.5', 'Sonnet 5']);
    expect(labels(['GPT-5 Codex', 'GPT-5.2', 'GPT-5.1 Codex', 'GPT-5'])).toEqual([
      'GPT-5.2',
      'GPT-5.1 Codex',
    ]);
    expect(labels(['Reasoning model', 'Simple model'])).toEqual([
      'Reasoning model',
      'Simple model',
    ]);
  });

  it('keeps delayed connections for different harnesses separate and shares an in-flight request', async () => {
    const { client } = createScriptedAgent({});
    let finish!: (connection: HarnessConnection) => void;
    const connect = (client.connect = vi.fn((id: string) =>
      id === 'codex-cli'
        ? new Promise<HarnessConnection>((resolve) => {
            finish = resolve;
          })
        : Promise.resolve({ harness: { ...harness, id }, status: ready }),
    ));
    const setup = new HarnessSetup(client, () => Promise.resolve(harness));
    const first = setup.connect('codex-cli');
    const same = setup.connect('codex-cli');
    await setup.connect('copilot-cli');
    finish({ harness, status: ready });
    await Promise.all([first, same]);
    expect(connect).toHaveBeenCalledTimes(2);
    expect(setup.store.getState()['copilot-cli']?.connection?.harness.id).toBe('copilot-cli');
    expect(setup.store.getState()['codex-cli']?.connection?.harness.id).toBe('codex-cli');
  });

  it('does not install on a failed check, and reconnects after explicit install and sign-in', async () => {
    const { client } = createScriptedAgent({});
    let state: HarnessStatus['state'] = 'not_installed';
    const connect = (client.connect = vi.fn(() =>
      Promise.resolve({ harness, status: { ...ready, state } }),
    ));
    const install = (client.install = vi.fn(() => {
      state = 'not_logged_in';
      return Promise.resolve();
    }));
    client.login = vi.fn(() => {
      state = 'ready';
      return Promise.resolve();
    });
    const setup = new HarnessSetup(client, () => Promise.resolve(harness));
    await setup.connect(harness.id);
    expect(install).not.toHaveBeenCalled();
    await setup.run(harness.id, 'install');
    expect(setup.store.getState()[harness.id]?.connection?.status.state).toBe('not_logged_in');
    await setup.run(harness.id, 'login');
    expect(setup.store.getState()[harness.id]?.connection?.status.state).toBe('ready');
    expect(connect).toHaveBeenCalledTimes(3);
  });

  it('surfaces errors and permits retry without installing anything', async () => {
    const { client } = createScriptedAgent({});
    client.connect = vi
      .fn()
      .mockRejectedValueOnce(new Error('offline'))
      .mockResolvedValue({ harness, status: ready });
    const setup = new HarnessSetup(client, () => Promise.resolve(harness));
    await expect(setup.connect(harness.id)).rejects.toThrow('offline');
    expect(setup.store.getState()[harness.id]?.error).toBe('offline');
    await setup.connect(harness.id, true);
    expect(setup.store.getState()[harness.id]?.error).toBeUndefined();
  });

  it('a remounted settings panel waits for an active installation before checking again', async () => {
    const { client } = createScriptedAgent({});
    const connect = (client.connect = vi.fn(() => Promise.resolve({ harness, status: ready })));
    let finish!: () => void;
    const install = (client.install = vi.fn(
      () =>
        new Promise<void>((resolve) => {
          finish = resolve;
        }),
    ));
    const setup = new HarnessSetup(client, () => Promise.resolve(harness));
    const installing = setup.run(harness.id, 'install');
    const reconnecting = setup.connect(harness.id, true);
    await setup.run(harness.id, 'install');
    expect(install).toHaveBeenCalledTimes(1);
    expect(connect).not.toHaveBeenCalled();
    expect(setup.store.getState()[harness.id]?.busy).toBe('installing');
    finish();
    await Promise.all([installing, reconnecting]);
    expect(setup.store.getState()[harness.id]?.connection?.status.state).toBe('ready');
  });

  it('keeps a ready connection shown while it is checked again, and connects a new one plainly', async () => {
    const { client } = createScriptedAgent({});
    let finish!: (connection: HarnessConnection) => void;
    client.connect = vi.fn(
      () =>
        new Promise<HarnessConnection>((resolve) => {
          finish = resolve;
        }),
    );
    const setup = new HarnessSetup(client, () => Promise.resolve(harness));
    const first = setup.connect(harness.id);
    expect(setup.store.getState()[harness.id]).toEqual({ busy: 'connecting' });
    finish({ harness, status: ready });
    await first;
    const again = setup.connect(harness.id, true);
    expect(setup.store.getState()[harness.id]).toEqual({
      connection: { harness, status: ready },
      checking: true,
    });
    const newer = { ...harness, models: [{ id: 'c', label: 'C' }] };
    finish({ harness: newer, status: ready });
    await again;
    expect(setup.store.getState()[harness.id]).toEqual({
      connection: { harness: newer, status: ready },
    });
  });

  it('shows the ready connections of the last run at once, checks them again, and keeps them', async () => {
    const { client } = createScriptedAgent({});
    const signedOut = { ...ready, state: 'not_logged_in' as const };
    const connect = (client.connect = vi.fn((id: string) =>
      Promise.resolve({
        harness: { ...harness, id },
        status: id === 'grok-cli' ? signedOut : ready,
      }),
    ));
    const write = vi.fn();
    const kept = { harness, status: ready };
    const setup = new HarnessSetup(client, () => Promise.resolve(harness), {
      read: () => ({ [harness.id]: kept }),
      write,
    });
    expect(setup.store.getState()[harness.id]).toEqual({ connection: kept });
    // Kept from before is not checked in this run: asked for, it is checked, and shown meanwhile.
    const checked = setup.connect(harness.id);
    expect(setup.store.getState()[harness.id]?.checking).toBe(true);
    await checked;
    await setup.connect(harness.id);
    expect(connect).toHaveBeenCalledTimes(1);
    await setup.connect('grok-cli');
    expect(write).toHaveBeenLastCalledWith({ [harness.id]: kept });
  });

  it('reads back only connections of the shape it keeps', () => {
    const store = new Map<string, string>();
    vi.stubGlobal('localStorage', {
      getItem: (key: string) => store.get(key) ?? null,
      setItem: (key: string, value: string) => store.set(key, value),
    });
    try {
      const cache = storedConnections('slidr.harnesses');
      expect(cache.read()).toEqual({});
      const kept = { harness, status: ready };
      cache.write({ [harness.id]: kept });
      expect(cache.read()).toEqual({ [harness.id]: kept });
      store.set(
        'slidr.harnesses',
        JSON.stringify({ [harness.id]: kept, other: kept, old: { harness: { id: 'old' } } }),
      );
      expect(cache.read()).toEqual({ [harness.id]: kept });
      store.set('slidr.harnesses', '{not json');
      expect(cache.read()).toEqual({});
    } finally {
      vi.unstubAllGlobals();
    }
  });

  it('keeps a choice to the list: the newest of its family, or else the first model and effort', () => {
    const efforts = ['low', 'high'];
    const listed: HarnessDescriptor = {
      ...harness,
      models: [
        { id: 'opus-5-5', label: 'Opus 5.5', effortLevels: efforts },
        { id: 'sonnet-5-5', label: 'Sonnet 5.5', effortLevels: ['medium'] },
        { id: 'sonnet-5', label: 'Sonnet 5', effortLevels: efforts },
        { id: 'plain', label: 'Plain model', effortLevels: [] },
      ],
    };
    // Kept as it is.
    expect(availableChoice(listed, 'opus-5-5', 'high')).toEqual({
      model: 'opus-5-5',
      effort: 'high',
    });
    // A newer version of the model takes its place; an effort it lacks gives way to its first.
    expect(availableChoice(listed, 'sonnet-5', 'high')).toEqual({
      model: 'sonnet-5-5',
      effort: 'medium',
    });
    // Gone from the list: the newest of the family it was named in, or else the first model.
    expect(availableChoice(listed, 'sonnet-4-8', 'low', 'Sonnet 4.8')).toEqual({
      model: 'sonnet-5-5',
      effort: 'medium',
    });
    expect(availableChoice(listed, 'haiku-4', 'high', 'Haiku 4')).toEqual({
      model: 'opus-5-5',
      effort: 'high',
    });
    expect(availableChoice(listed, 'gone', 'max')).toEqual({ model: 'opus-5-5', effort: 'low' });
    // A model without efforts has none.
    expect(availableChoice(listed, 'plain', 'high')).toEqual({ model: 'plain', effort: undefined });
    // What was not chosen is still the user's to choose; a list without models changes nothing.
    expect(availableChoice(listed)).toEqual({ model: undefined, effort: undefined });
    expect(availableChoice(listed, 'opus-5', undefined, 'Opus 5')).toEqual({
      model: 'opus-5-5',
      effort: undefined,
    });
    expect(availableChoice({ ...harness, models: [] }, 'a', 'low')).toEqual({
      model: 'a',
      effort: 'low',
    });
  });

  it('requires explicit available models and efforts, including models with no effort setting', () => {
    expect(selectionIssue(harness)).toBeTruthy();
    expect(selectionIssue(harness, 'a')).toBeTruthy();
    expect(selectionIssue(harness, 'a', 'max')).toBeTruthy();
    expect(selectionIssue(harness, 'a', 'ultra')).toBeUndefined();
    expect(selectionIssue(harness, 'b')).toBeUndefined();
    expect(selectionIssue(harness, 'b', 'low')).toBeTruthy();
    expect(modelEfforts(harness, 'b')).toEqual([]);
  });
});
