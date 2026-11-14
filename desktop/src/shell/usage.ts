import { invoke, isTauri } from '@tauri-apps/api/core';

/*
 * The count of installations and of starts (ADR-142, `src-tauri/src/usage.rs`). The page tells
 * the core that it has started, and in which language; the core sends that, with the random id
 * of the installation, unless the user turned it off in Settings (the `usage` section) or the
 * organization did. A plain browser page (the Vite page, Playwright) sends nothing.
 */

/** The section of the settings that holds the user's choice: `{ send: false }` when off. */
export const USAGE_SECTION = 'usage';

/** Says that this start began, in `language`. The core sends it once a run, in the background. */
export function startUsage(language: string): void {
  if (!isTauri()) return;
  invoke('usage_start', { language }).catch(() => undefined);
}

/** Whether the organization turned the count off for this installation. */
export async function usageBlocked(): Promise<boolean> {
  if (!isTauri()) return false;
  try {
    return (await invoke<{ blocked: boolean }>('usage_status')).blocked;
  } catch {
    return false;
  }
}
