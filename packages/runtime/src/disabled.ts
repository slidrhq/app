/**
 * The look of an element shown as out of use (`disabled`, SPEC 5.2): grey, and faded to a share of
 * its opacity. The renderer draws it as a filter at the end of the element's box's own and marks
 * the box with an attribute (`packages/renderer/src/disabled.ts`, `DISABLED_LOOK` in
 * `@slidr/model`). The runtime depends on nothing, so it repeats them here; a test in
 * `@slidr/html-export` holds the two together.
 *
 * The `disable` and `enable` emphasis animations take a part there and back in a show, and it stays
 * so until another step changes it (see `timeline.ts`). Both are a filter, as the look is: an
 * animation of the same functions, from one share to another, moves smoothly between them.
 */

/** On the box of an element that the renderer drew as out of use. */
export const DISABLED_ATTRIBUTE = 'data-slidr-disabled';

export const DISABLED_GRAYSCALE = 1;
export const DISABLED_OPACITY = 0.4;

const round = (n: number): number => Math.round(n * 1000) / 1000;

/** The filter of a part `share` of the way to the look of one out of use: 0 in use, 1 out of use. */
export function disabledFilter(share: number): string {
  const s = Math.min(1, Math.max(0, share));
  return `grayscale(${round(s * DISABLED_GRAYSCALE)}) opacity(${round(1 - s * (1 - DISABLED_OPACITY))})`;
}

/** What the renderer writes: `grayscale(1) opacity(0.4)`. */
export const DISABLED_FILTER = disabledFilter(1);

/** Whether the renderer drew a part as out of use. */
export function drawnDisabled(node: Element): boolean {
  return node.hasAttribute(DISABLED_ATTRIBUTE);
}

/** Two filters one after the other; empty for none. */
export function joinFilters(...filters: readonly string[]): string {
  return filters
    .map((filter) => filter.trim())
    .filter((filter) => filter && filter !== 'none')
    .join(' ');
}

/** `grayscale(1) opacity(0.4)` at the end of a filter, however the browser writes the numbers. */
const AT_THE_END = /\s*grayscale\(\s*(?:1|100%)\s*\)\s*opacity\(\s*(?:0?\.4|40%)\s*\)\s*$/;

/**
 * A filter without the look of one out of use at its end: how a part that shows it would look in
 * use. A filter that does not end with it is returned as it is.
 */
export function withoutDisabled(filter: string): string {
  const own = filter.trim();
  return own === 'none' ? '' : own.replace(AT_THE_END, '');
}
