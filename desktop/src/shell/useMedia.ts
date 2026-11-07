/**
 * The media library as the panels draw it. Nothing of the library is waited for when the app
 * starts (docs/media-library.md): a catalog is read the first time it is wanted, or while the app
 * is idle, and what draws it draws again when it comes.
 */
import { mediaEpoch, subscribeMedia, type MediaCatalog } from '@slidr/media-library';
import { useSyncExternalStore } from 'react';

/**
 * Draws the component again whenever something of the media library comes: the manifest (and so
 * which files there are), or any catalog. For a component that asks the library synchronously.
 */
export function useMediaLibrary(): number {
  return useSyncExternalStore(subscribeMedia, mediaEpoch);
}

/** A catalog of the media library, read when it is first drawn, and drawn again when it comes. */
export function useMediaCatalog<T>(catalog: MediaCatalog<T>): T {
  return useSyncExternalStore(catalog.subscribe, catalog.get);
}

/**
 * Reads `catalogs` one after another while the app is idle, after it has started: a panel opened
 * later finds its catalog at hand, and the start pays nothing for it.
 */
export function prefetchWhenIdle(catalogs: readonly MediaCatalog<unknown>[]): void {
  const idle = (next: () => void) =>
    typeof requestIdleCallback === 'function'
      ? requestIdleCallback(next, { timeout: 5000 })
      : setTimeout(next, 200);
  let at = 0;
  const step = () => {
    const catalog = catalogs[at++];
    if (catalog) void catalog.load().then(() => idle(step));
  };
  idle(step);
}
