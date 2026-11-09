import { describe, expect, it, vi } from 'vitest';
import {
  ImageError,
  NOT_CHOSEN,
  type ImageErrorKind,
  type ImageProviderDescriptor,
  type ImageProviderState,
} from '../images/images';
import type { AgentImageService } from '../images/imageService';
import {
  chosenProviderMissing,
  createImageSetup,
  finishImageSetup,
  isSetupFailure,
  putOffImageSetup,
  watchImageSetup,
} from './imageSetup';

/*
 * The image step of the chat's setup (ADR-140): a job of the agent that meets a provider that
 * cannot run has the chat ask for one; any other failure, and a job that made its images, do not.
 */

const made = { asset: { id: 'a' }, preview: { base64: '', width: 1, height: 1 } };

function service(failure?: ImageError) {
  const run = vi.fn(() => (failure ? Promise.reject(failure) : Promise.resolve([made])));
  return {
    generate: run,
    edit: run,
    process: vi.fn(),
    describe: vi.fn(),
    cancel: vi.fn(() => Promise.resolve()),
  } as unknown as AgentImageService;
}

const generate = (images: AgentImageService) =>
  images.generate({ prompt: 'a barn', count: 1, aspect: '4:3' });

describe('the image step', () => {
  it('is asked for by a job that met no provider, or one that could not run', async () => {
    for (const kind of ['unknown_provider', 'not_installed', 'not_logged_in'] as const) {
      const setup = createImageSetup();
      putOffImageSetup(setup);
      const failure = new ImageError(kind, kind === 'unknown_provider' ? NOT_CHOSEN : kind);
      const images = watchImageSetup(service(failure), setup);
      // The agent still reads the failure: the step only follows it.
      await expect(generate(images)).rejects.toBe(failure);
      expect(setup.getState()).toEqual({ trouble: true, later: false, missing: false });
    }
    const setup = createImageSetup();
    await expect(
      watchImageSetup(service(new ImageError('not_installed', 'x')), setup).edit({
        assetId: 'a',
        instruction: 'make it night',
        count: 1,
      }),
    ).rejects.toMatchObject({ kind: 'not_installed' });
    expect(setup.getState().trouble).toBe(true);
  });

  it('is not asked for by a job that made its images, or failed in another way', async () => {
    const setup = createImageSetup();
    expect(await generate(watchImageSetup(service(), setup))).toEqual([made]);
    const others: ImageErrorKind[] = ['quota', 'timeout', 'cancelled', 'generation_failed'];
    for (const kind of others) {
      await expect(
        generate(watchImageSetup(service(new ImageError(kind, kind)), setup)),
      ).rejects.toMatchObject({ kind });
    }
    expect(setup.getState()).toEqual({ trouble: false, later: false, missing: false });
    expect(isSetupFailure(new Error('not an image error'))).toBe(false);
  });

  it('ends when finished, and waits for the next job when put off', () => {
    const setup = createImageSetup();
    setup.setState({ trouble: true, missing: true });
    putOffImageSetup(setup);
    expect(setup.getState()).toEqual({ trouble: false, later: true, missing: false });
    setup.setState({ trouble: true, later: false, missing: true });
    finishImageSetup(setup);
    expect(setup.getState()).toEqual({ trouble: false, later: false, missing: false });
  });
});

describe('the provider chosen', () => {
  const capabilities = {
    edit: 'regenerate' as const,
    mask: false,
    transparent: false,
    maxParallel: 1,
    quality: false,
  };
  const PROVIDERS: ImageProviderDescriptor[] = [
    { id: 'cli', name: 'An agent CLI', capabilities, harness: 'codex-cli' },
    { id: 'api', name: 'A web API', capabilities, key: 'openai-api' },
  ];
  const client = (chosen: string | null, state: ImageProviderState) => ({
    defaultProvider: vi.fn(() => Promise.resolve(chosen)),
    providers: vi.fn(() => Promise.resolve(PROVIDERS)),
    probe: vi.fn(() => Promise.resolve({ state, version: null, account: null, detail: null })),
  });

  it('is missing when it runs on an agent CLI that is not installed or not signed in', async () => {
    expect(await chosenProviderMissing(client('cli', 'not_installed'))).toBe(true);
    expect(await chosenProviderMissing(client('cli', 'not_logged_in'))).toBe(true);
    expect(await chosenProviderMissing(client('cli', 'ready'))).toBe(false);
    // A CLI that answers but fails is not one to install or sign in.
    expect(await chosenProviderMissing(client('cli', 'unavailable'))).toBe(false);
  });

  it('is not asked when none is chosen, or when it runs with a key', async () => {
    const none = client(null, 'not_installed');
    expect(await chosenProviderMissing(none)).toBe(false);
    const keyed = client('api', 'not_logged_in');
    expect(await chosenProviderMissing(keyed)).toBe(false);
    expect(none.probe).not.toHaveBeenCalled();
    expect(keyed.probe).not.toHaveBeenCalled();
  });
});
