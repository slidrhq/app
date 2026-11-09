/**
 * The image step of the chat's setup (ADR-139): who makes the images is chosen in the chat,
 * right after the agent. The chat asks when no provider is chosen, after the agent was set up in
 * it, and when an image job of the agent met a provider that could not run. This store holds what
 * the chat cannot read from the settings: that a job met such a provider, and that the user put
 * the step off. One per editing window, like the agent.
 */
import { createStore, type StoreApi } from 'zustand/vanilla';
import { ImageError, type ImageErrorKind } from '../images/images';
import type { AgentImageService } from '../images/imageService';

export interface ImageSetup {
  /** An image job of the agent failed on the provider itself since the step last ended. */
  trouble: boolean;
  /** The user put the step off ("Not now"): with no provider chosen, it waits for a job. */
  later: boolean;
}

/** The failures that choosing a provider, or finishing its connection, puts right. */
const SETUP_KINDS: readonly ImageErrorKind[] = [
  // None chosen, or the one chosen is no longer offered.
  'unknown_provider',
  'not_installed',
  // Signed out, or a provider with a key without one, or with one the service turned down.
  'not_logged_in',
];

export function createImageSetup(): StoreApi<ImageSetup> {
  return createStore<ImageSetup>(() => ({ trouble: false, later: false }));
}

/** Whether `error` is one the image step puts right. */
export const isSetupFailure = (error: unknown): boolean =>
  error instanceof ImageError && SETUP_KINDS.includes(error.kind);

/**
 * The agent's image service, telling `setup` of a job that failed on the provider itself. A job
 * fails as a whole only when none of its images was made, so one image that failed among others
 * that were made is no reason to ask.
 */
export function watchImageSetup(
  service: AgentImageService,
  setup: StoreApi<ImageSetup>,
): AgentImageService {
  const watch = <T>(work: Promise<T>): Promise<T> =>
    work.catch((error: unknown) => {
      if (isSetupFailure(error)) setup.setState({ trouble: true, later: false });
      throw error;
    });
  return {
    ...service,
    generate: (input) => watch(service.generate(input)),
    edit: (input) => watch(service.edit(input)),
  };
}

/** The step is done: a provider is chosen and ready. */
export const finishImageSetup = (setup: StoreApi<ImageSetup>) =>
  setup.setState({ trouble: false, later: false });

/** The step is put off until a job meets the provider again. */
export const putOffImageSetup = (setup: StoreApi<ImageSetup>) =>
  setup.setState({ trouble: false, later: true });
