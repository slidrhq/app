import '@fontsource-variable/inter';
import '@fontsource-variable/heebo';
import './app.css';
import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { refreshMediaLibrary } from '@slidr/media-library';
import { isTauri } from '@tauri-apps/api/core';
import { listen } from '@tauri-apps/api/event';
import { App } from './App';
import { installEyedropper } from './controls/screenColor';
import { tauriStorage } from './document/tauriStorage';
import { cardSetCatalog } from './elements/cardSets';
import { designPictures } from './elements/designAssets';
import { frameThumbIndex } from './elements/frameThumbs';
import { backgroundCatalog } from './elements/motionBackgrounds';
import { animationCatalog } from './elements/motionPieces';
import { shapeCatalog } from './objects/shapes';
import { registerBuiltinFonts } from './fonts';
import { currentLanguage, languageReady, offerLanguages } from './i18n';
import { shareScriptNonce } from './scriptNonce';
import { loadSystemSettings } from './settings/systemSettings';
import { createEditor, type Editor } from './shell/editor';
import { startDocument } from './shell/fileActions';
import './shell/plugins';
import { RootErrorBoundary } from './shell/RootErrorBoundary';
import { syncTheme } from './shell/store';
import { prefetchWhenIdle } from './shell/useMedia';

reportUncaughtErrors();
syncTheme();
blockNativeContextMenu();
// The scripts of an `html` object run in their frame only with the nonce of this load (ADR-066).
shareScriptNonce();
// The fonts decks are set in (ADR-009): without them the Stage draws every slide in a fallback
// font, while the capture window, which registers them, shows the agent the real one.
const fontsRegistered = registerBuiltinFonts();
// The colour pickers' eyedropper, from the core: WebView2's own does nothing.
installEyedropper();

const editor = createEditor({
  lang: currentLanguage(),
  // In a plain browser (the Vite page, Playwright) there is no Tauri core and so no files.
  storage: isTauri() ? tauriStorage : null,
});
void startDocument(editor);
// The organization's settings (ADR-117): the languages it offers, and the one it starts in. The
// UI started in what the last start was told; without settings every language is offered again.
void loadSystemSettings().then((policy) =>
  offerLanguages(policy?.languages.offered, policy?.languages.default),
);
// The media library is never waited for (docs/media-library.md): the catalogs of Elements are
// read while the app is idle, after it has started, and each panel reads its own if it is opened
// first. The core answers from what it kept, and says when the library changed meanwhile.
// The fonts first: every slide is drawn in them, and on a slow network the rest would hold them up.
void fontsRegistered.then(() =>
  prefetchWhenIdle([
    shapeCatalog,
    animationCatalog,
    cardSetCatalog,
    designPictures,
    frameThumbIndex,
    backgroundCatalog,
  ]),
);
if (isTauri()) void listen('media-library-changed', refreshMediaLibrary);

declare global {
  interface Window {
    /** The editor, for the devtools console and for E2E tests. Development builds only. */
    slidr?: Editor;
  }
}
if (import.meta.env.DEV) window.slidr = editor;

const root = document.getElementById('root');
if (!root) throw new Error('#root is missing from index.html');

// The UI draws once the strings of its language are there: at once for Hebrew and English, else a
// file of the app. A render that throws shows a screen that says so, and the window still opens.
void languageReady.then(() =>
  createRoot(root).render(
    <StrictMode>
      <RootErrorBoundary>
        <App editor={editor} />
      </RootErrorBoundary>
    </StrictMode>,
  ),
);

/**
 * Says to the console an error that nothing caught, with where it came from: a render's goes to
 * the boundary, these are the rest (an event handler, a timer, a promise nobody waited for). They
 * are not swallowed.
 */
function reportUncaughtErrors(): void {
  window.addEventListener('error', (event) => {
    const where = event.filename ? ` at ${event.filename}:${event.lineno}:${event.colno}` : '';
    console.error(`Uncaught error${where}`, event.error ?? event.message);
  });
  window.addEventListener('unhandledrejection', (event) => {
    console.error('Unhandled promise rejection', event.reason);
  });
}

/**
 * The webview's own right-click menu (Back, Reload, Inspect) is an OS control (SPEC 4.0, rule 7).
 * Text fields keep theirs for now; in development Shift+right-click still opens it, for Inspect.
 */
function blockNativeContextMenu(): void {
  window.addEventListener('contextmenu', (event) => {
    const target = event.target instanceof HTMLElement ? event.target : null;
    if (target?.closest('input, textarea, [contenteditable="true"]')) return;
    if (import.meta.env.DEV && event.shiftKey) return;
    event.preventDefault();
  });
}
