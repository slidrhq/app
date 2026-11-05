import { describe, expect, it } from 'vitest';
import { DISABLED_FILTER, disabledFilter, joinFilters, withoutDisabled } from './disabled';

describe('the look of a part out of use', () => {
  it('is grey and faded, and moves there by shares', () => {
    expect(DISABLED_FILTER).toBe('grayscale(1) opacity(0.4)');
    expect(disabledFilter(0)).toBe('grayscale(0) opacity(1)');
    expect(disabledFilter(0.5)).toBe('grayscale(0.5) opacity(0.7)');
    expect(disabledFilter(2)).toBe(DISABLED_FILTER);
  });

  it('comes off the end of a filter, however the browser writes it', () => {
    const shadow = 'drop-shadow(rgb(0, 0, 0) 0px 4px 8px)';
    expect(withoutDisabled(`${shadow} grayscale(1) opacity(0.4)`)).toBe(shadow);
    expect(withoutDisabled('grayscale(100%) opacity(40%)')).toBe('');
    expect(withoutDisabled('grayscale(1) opacity(.4)')).toBe('');
    expect(withoutDisabled('none')).toBe('');
    // Not at the end, or not this look: the filter is what it is.
    expect(withoutDisabled(`grayscale(1) opacity(0.4) ${shadow}`)).toBe(
      `grayscale(1) opacity(0.4) ${shadow}`,
    );
    expect(withoutDisabled('grayscale(1)')).toBe('grayscale(1)');
  });

  it('joins filters, leaving out the ones that are none', () => {
    expect(joinFilters('', 'none', ' blur(2px) ', 'grayscale(1)')).toBe('blur(2px) grayscale(1)');
    expect(joinFilters()).toBe('');
  });
});
