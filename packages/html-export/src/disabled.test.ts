import { DISABLED_LOOK } from '@slidr/model';
import {
  DISABLED_ATTRIBUTE as RENDERER_ATTRIBUTE,
  DISABLED_FILTER as RENDERER_FILTER,
} from '@slidr/renderer';
import {
  DISABLED_ATTRIBUTE,
  DISABLED_FILTER,
  DISABLED_GRAYSCALE,
  DISABLED_OPACITY,
} from '@slidr/runtime';
import { describe, expect, it } from 'vitest';

describe('an element shown as out of use, in an exported file', () => {
  it('holds the runtime, the renderer and the model to one look', () => {
    // The runtime depends on nothing and repeats them; this package has all three. The runtime
    // finds what the renderer drew by the attribute, and takes the filter off the end of the box's.
    expect(DISABLED_ATTRIBUTE).toBe(RENDERER_ATTRIBUTE);
    expect(DISABLED_FILTER).toBe(RENDERER_FILTER);
    expect(DISABLED_GRAYSCALE).toBe(DISABLED_LOOK.grayscale);
    expect(DISABLED_OPACITY).toBe(DISABLED_LOOK.opacity);
  });
});
