import { setScreenSampler } from '@slidr/ui';
import { invoke, isTauri } from '@tauri-apps/api/core';

/**
 * The eyedropper of every colour picker (TXT-04, SHP-02). WebView2 has the browser's
 * `EyeDropper`, but not the part of the browser that shows it: `open()` rejects at once, as if
 * the user had cancelled, and the eyedropper did nothing. In the app the core takes the colour
 * instead (`screen_pick_color`); in a plain browser (the Vite page, Playwright) the browser's
 * own stays.
 */
export function installEyedropper(): void {
  if (isTauri()) setScreenSampler(() => invoke<string | null>('screen_pick_color'));
}
