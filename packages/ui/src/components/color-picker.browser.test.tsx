import { flushSync } from 'react-dom';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ColorPicker, setScreenSampler, type ColorPickerLabels } from './color-picker';
import { UiProvider } from './provider';

/*
 * The eyedropper of the colour picker: it takes its colour from the sampler the app gives
 * (`setScreenSampler`), since WebView2's own `EyeDropper` rejects at once and did nothing.
 */

const LABELS: ColorPickerLabels = {
  area: 'Colour',
  hue: 'Hue',
  alpha: 'Opacity',
  hex: 'Hex code',
  eyedropper: 'Eyedropper',
  none: 'No colour',
  recent: 'Recent',
};

let root: Root | undefined;
let host: HTMLElement | undefined;

afterEach(() => {
  root?.unmount();
  host?.remove();
  root = host = undefined;
  setScreenSampler(null);
});

function render(onChange: (hex: string) => void, onGestureEnd = () => undefined) {
  host = document.body.appendChild(document.createElement('div'));
  root = createRoot(host);
  flushSync(() =>
    root?.render(
      <UiProvider dir="ltr">
        <ColorPicker
          value="#eaf0ff"
          labels={LABELS}
          onChange={onChange}
          onGestureEnd={onGestureEnd}
        />
      </UiProvider>,
    ),
  );
  return {
    eyedropper: () => host?.querySelector<HTMLButtonElement>('button[aria-label="Eyedropper"]'),
    hex: () => host?.querySelector<HTMLInputElement>('input[aria-label="Hex code"]')?.value,
  };
}

describe('the eyedropper', () => {
  it('takes the colour the sampler gives, as one gesture', async () => {
    setScreenSampler(() => Promise.resolve('#336699'));
    const onChange = vi.fn();
    const onGestureEnd = vi.fn();
    const picker = render(onChange, onGestureEnd);

    picker.eyedropper()?.click();

    await vi.waitFor(() => expect(onChange).toHaveBeenCalledWith('#336699'));
    expect(onGestureEnd).toHaveBeenCalledTimes(1);
    await vi.waitFor(() => expect(picker.hex()).toBe('336699'));
  });

  it('changes nothing when the user cancels', async () => {
    const sampler = vi.fn(() => Promise.resolve(null));
    setScreenSampler(sampler);
    const onChange = vi.fn();
    const picker = render(onChange);

    picker.eyedropper()?.click();

    await vi.waitFor(() => expect(sampler).toHaveBeenCalledTimes(1));
    await Promise.resolve();
    expect(onChange).not.toHaveBeenCalled();
    expect(picker.hex()).toBe('EAF0FF');
  });

  it('is not offered without a sampler', () => {
    setScreenSampler(null);
    const picker = render(vi.fn());
    expect(picker.eyedropper()).toBeNull();
  });
});
