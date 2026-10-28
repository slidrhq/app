import { invoke, isTauri } from '@tauri-apps/api/core';
import { create } from 'zustand';

/*
 * The organization's settings of the app (ADR-117): what it offers, and what it starts with.
 * Slidr Library publishes them into the media library (its README, "System settings"), and the
 * Rust core reads them when the app first starts, keeps them, and reads them again only when the
 * app starts as another version (`src-tauri/src/system_settings.rs`).
 *
 * The core holds to them what it runs: the agents it offers, the organization's own among them,
 * and web access; the image providers and the photo libraries. This page holds the interface to
 * them: the languages it offers and starts in, the marks of the organization's agents, the agent
 * a first setup starts from, and the switch of web access.
 */

/** What is offered of one kind, and the one the app starts with. None offered: every one. */
export interface Offer {
  offered?: string[];
  default?: string;
}

export type WebAccess = 'on' | 'off' | 'blocked';

/** An agent of the organization's own, as far as the interface shows it. */
export interface CustomAgent {
  id: string;
  name: string;
  /** One or two characters on its mark; without them, a terminal. */
  glyph?: string;
  /** A tint of the design system's tools: `orange`, `green`, `blue`, `violet`, `teal`, `pink`, `rose`. */
  tone?: string;
  /** How the app installs its CLI; without it, the organization does. */
  install?: { winget: string; source?: string } | { npm: string };
}

export interface SystemPolicy {
  agents: Offer & { custom: CustomAgent[]; webAccess?: WebAccess };
  languages: Offer;
  images: Offer;
  stock: Offer;
}

const store = create<{ policy: SystemPolicy | null }>(() => ({ policy: null }));

let loading: Promise<SystemPolicy | null> | null = null;

/**
 * Reads the settings from the core, once. The core answers once its read of this start is over:
 * at once from what it kept, or when it has read the library. A plain browser page has none.
 */
export function loadSystemSettings(): Promise<SystemPolicy | null> {
  loading ??= (
    isTauri() ? invoke<SystemPolicy | null>('system_settings_read') : Promise.resolve(null)
  )
    .catch((error: unknown) => {
      console.error("The organization's settings could not be read", error);
      return null;
    })
    .then((policy) => {
      store.setState({ policy });
      return policy;
    });
  return loading;
}

/** The settings, once read; none before, or when the organization set none. */
export const systemPolicy = (): SystemPolicy | null => store.getState().policy;

/** The settings, for a component, which is drawn again once they are read. */
export const useSystemPolicy = (): SystemPolicy | null => store((state) => state.policy);

/** Settings of their own, for the tests. */
export function setSystemPolicy(policy: SystemPolicy | null): void {
  store.setState({ policy });
  loading = Promise.resolve(policy);
}

/** The organization never lets the agent search or read the web. */
export const webBlocked = (policy = systemPolicy()): boolean =>
  policy?.agents.webAccess === 'blocked';

/** Whether web access is on where the user chose nothing: on, unless the organization says off. */
export const webDefault = (policy = systemPolicy()): boolean =>
  policy?.agents.webAccess !== 'off' && !webBlocked(policy);

/** Whether the agent may search and read the web: the user's choice, else the default. */
export const webAccessOf = (chosen: boolean | undefined, policy = systemPolicy()): boolean =>
  !webBlocked(policy) && (chosen ?? webDefault(policy));

/** The organization's own agent of this id. */
export const customAgent = (id: string, policy = systemPolicy()): CustomAgent | undefined =>
  policy?.agents.custom.find((agent) => agent.id === id);

/** The agent a first setup starts from: the organization's default. */
export const defaultAgent = (policy = systemPolicy()): string | undefined => policy?.agents.default;
