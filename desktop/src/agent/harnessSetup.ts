import { createStore, type StoreApi } from 'zustand/vanilla';
import type { AgentClient, HarnessConnection, HarnessDescriptor, ModelOption } from './agent';

export interface ConnectionState {
  busy?: 'connecting' | 'installing' | 'signingIn';
  connection?: HarnessConnection;
  /**
   * The harness is checked again behind the connection it last answered with, which stays
   * shown, its models and efforts in place, until the check answers.
   */
  checking?: boolean;
  error?: string;
}

/**
 * Where the connections of the ready harnesses are kept from one run of the app to the next:
 * what was chosen shows at once, by the names the harness gives it, while the harness is
 * checked again (`storedConnections`).
 */
export interface ConnectionCache {
  read(): Record<string, HarnessConnection>;
  write(connections: Record<string, HarnessConnection>): void;
}

/** Shared by Settings, the chat picker and session startup. One connection per CLI at a time. */
export class HarnessSetup {
  readonly store: StoreApi<Record<string, ConnectionState>>;
  #pending = new Map<string, Promise<HarnessConnection>>();
  #actions = new Map<string, Promise<void>>();
  /** The harnesses whose connection came from the cache and was not checked in this run. */
  #unchecked: Set<string>;

  constructor(
    private client: AgentClient,
    private descriptor: (id: string) => Promise<HarnessDescriptor>,
    private cache?: ConnectionCache,
  ) {
    const kept = cache?.read() ?? {};
    this.#unchecked = new Set(Object.keys(kept));
    this.store = createStore<Record<string, ConnectionState>>(() =>
      Object.fromEntries(Object.entries(kept).map(([id, connection]) => [id, { connection }])),
    );
  }

  async connect(id: string, refresh = false): Promise<HarnessConnection> {
    const action = this.#actions.get(id);
    if (action) await action;
    return this.#connect(id, refresh);
  }

  async #connect(id: string, refresh = false): Promise<HarnessConnection> {
    const pending = this.#pending.get(id);
    if (pending) return pending;
    const known = this.store.getState()[id]?.connection;
    if (known && !refresh && !this.#unchecked.has(id)) return known;
    // A harness that was ready stays shown as it was while it is checked again, so its models
    // and efforts do not leave the screen and come back: only one never found ready says it is
    // connecting.
    this.#set(
      id,
      known?.status.state === 'ready'
        ? { connection: known, checking: true }
        : { busy: 'connecting' },
    );
    const task = (async () => {
      try {
        const connection = this.client.connect
          ? await this.client.connect(id)
          : { harness: await this.descriptor(id), status: await this.client.probe(id) };
        this.#set(id, { connection });
        return connection;
      } catch (error) {
        this.#set(id, { error: error instanceof Error ? error.message : String(error) });
        throw error;
      } finally {
        this.#pending.delete(id);
        this.#unchecked.delete(id);
        this.#keep();
      }
    })();
    this.#pending.set(id, task);
    return task;
  }

  /** The caller must obtain installation approval before invoking this action. */
  async run(id: string, action: 'install' | 'login'): Promise<void> {
    if (this.store.getState()[id]?.busy) return;
    const task = this.#run(id, action);
    this.#actions.set(id, task);
    try {
      await task;
    } finally {
      this.#actions.delete(id);
    }
  }

  async #run(id: string, action: 'install' | 'login'): Promise<void> {
    const before = this.store.getState()[id];
    this.#set(id, {
      ...before,
      error: undefined,
      busy: action === 'install' ? 'installing' : 'signingIn',
    });
    try {
      const operation = this.client[action]?.bind(this.client);
      if (!operation) throw new Error('CLI setup is available in the desktop app.');
      await operation(id);
      await this.#connect(id, true);
    } catch (error) {
      this.#set(id, { ...before, error: error instanceof Error ? error.message : String(error) });
    }
  }

  #set(id: string, state: ConnectionState): void {
    this.store.setState({ [id]: state });
  }

  /** Keeps the connections of the harnesses that are ready, for the next run. */
  #keep(): void {
    if (!this.cache) return;
    const ready = Object.entries(this.store.getState()).flatMap(([id, { connection }]) =>
      connection?.status.state === 'ready' ? [[id, connection] as const] : [],
    );
    this.cache.write(Object.fromEntries(ready));
  }
}

/** A cache in the window's `localStorage`, under `key`. Without storage it keeps nothing. */
export function storedConnections(key: string): ConnectionCache {
  return {
    read() {
      try {
        const value: unknown = JSON.parse(localStorage.getItem(key) ?? 'null');
        if (typeof value !== 'object' || value === null) return {};
        // Only what still has the shape this version reads: an update may change the contract.
        return Object.fromEntries(
          Object.entries(value).filter(([id, connection]) => isKept(id, connection)),
        );
      } catch {
        return {};
      }
    },
    write(connections) {
      try {
        localStorage.setItem(key, JSON.stringify(connections));
      } catch {
        // Not kept: the next run connects again.
      }
    },
  };
}

function isKept(id: string, value: unknown): boolean {
  const connection = value as Partial<HarnessConnection> | null;
  const harness = connection?.harness;
  return (
    connection?.status?.state === 'ready' &&
    harness?.id === id &&
    typeof harness.name === 'string' &&
    typeof harness.capabilities === 'object' &&
    harness.capabilities !== null &&
    Array.isArray(harness.effortLevels) &&
    Array.isArray(harness.models) &&
    harness.models.every(
      (model: Partial<ModelOption> | null) =>
        typeof model?.id === 'string' && typeof model.label === 'string',
    )
  );
}

export function modelEfforts(harness: HarnessDescriptor, modelId?: string): string[] {
  const model = harness.models.find((model) => model.id === modelId);
  return model ? (model.effortLevels ?? harness.effortLevels) : [];
}

/** A model's family and version, by its label. A label without a version is its own family. */
function modelVersion(label: string): { family: string; parts: number[] } {
  const version = /\d+(?:\.\d+)*/.exec(label);
  if (!version) return { family: label, parts: [] };
  const rest = label.slice(0, version.index) + ' ' + label.slice(version.index + version[0].length);
  return {
    family: rest
      .toLowerCase()
      .replace(/[^\p{L}\p{N}]+/gu, ' ')
      .trim(),
    parts: version[0].split('.').map(Number),
  };
}

/**
 * The newest version of each model family ("Opus 5.5" hides "Opus 5" and "Opus 4.8"), in the
 * order the harness listed them. A label without a version number is its own family. These are
 * the models every choice offers: the chat's first-time setup, Settings and a conversation's
 * own picker.
 */
export function latestModels<T extends { label: string }>(models: T[]): T[] {
  const newer = (a: number[], b: number[]) => {
    for (let i = 0; i < Math.max(a.length, b.length); i++)
      if ((a[i] ?? 0) !== (b[i] ?? 0)) return (a[i] ?? 0) > (b[i] ?? 0);
    return false;
  };
  const best = new Map<string, { model: T; parts: number[] }>();
  for (const model of models) {
    const { family, parts } = modelVersion(model.label);
    const current = best.get(family);
    if (!current || newer(parts, current.parts)) best.set(family, { model, parts });
  }
  const kept = new Set([...best.values()].map((entry) => entry.model));
  return models.filter((model) => kept.has(model));
}

/**
 * What a choice comes to once the harness has listed its models, as Settings keeps it: the model
 * chosen, or the newest of its family when the list has a newer one. A model the list no longer
 * has is followed by the newest of the family `label` (its name in an earlier list) belongs to,
 * or else by the first model offered. The effort chosen where the model has it, or else its
 * first; none for a model without efforts. What was not chosen is still the user's to choose,
 * and a list without models changes nothing.
 */
export function availableChoice(
  harness: HarnessDescriptor,
  model?: string,
  effort?: string,
  label?: string,
): { model: string | undefined; effort: string | undefined } {
  const offered = latestModels(harness.models);
  if (model === undefined || offered.length === 0) return { model, effort };
  const named = harness.models.find((option) => option.id === model)?.label ?? label;
  const family = named === undefined ? undefined : modelVersion(named).family;
  const chosen =
    offered.find((option) => modelVersion(option.label).family === family) ?? offered[0]!;
  const efforts = modelEfforts(harness, chosen.id);
  return {
    model: chosen.id,
    effort: effort === undefined || efforts.includes(effort) ? effort : efforts[0],
  };
}

export function selectionIssue(
  harness: HarnessDescriptor,
  model?: string,
  effort?: string,
): string | undefined {
  if (harness.id === 'mock') return;
  if (!model || !harness.models.some((option) => option.id === model))
    return 'Choose an available model in Settings.';
  const efforts = modelEfforts(harness, model);
  if (efforts.length && (!effort || !efforts.includes(effort)))
    return 'Choose a supported effort for this model in Settings.';
  if (!efforts.length && effort)
    return 'This model has no effort setting. Choose the model again in Settings.';
}
