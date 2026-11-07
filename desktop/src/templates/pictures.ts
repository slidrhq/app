/**
 * The pictures of the built-in templates' sample decks. The files are in the media library
 * (`images/templates`); the asset records come from `@slidr/templates/builtin`, where the
 * samples name them by id.
 */
import { mediaFilesNow, mediaUrl } from '@slidr/media-library';
import type { AssetMeta } from '@slidr/model';
import { pictures } from '@slidr/templates/builtin';

/** The pictures as assets of a deck, by id. */
export const pictureAssets: Record<string, AssetMeta> = Object.fromEntries(
  Object.values(pictures).map((picture) => [picture.id, picture]),
);

/**
 * Where a picture of the built-in samples loads from; undefined for any other asset, and for one
 * the library does not have, as far as its manifest is known.
 */
export function pictureUrl(asset: AssetMeta): string | undefined {
  const picture = pictureAssets[asset.id];
  if (!picture) return undefined;
  const path = `images/templates/${picture.name}`;
  return mediaFilesNow().has(path) ? mediaUrl(path) : undefined;
}
