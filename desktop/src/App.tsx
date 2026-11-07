import { useEffect } from 'react';
import { useStore } from 'zustand';
import { languageOf, loadLanguage } from './i18n';
import { EditorProvider, type Editor } from './shell/editor';
import { showMainWindow } from './shell/mainWindow';
import { Shell } from './shell/Shell';

export function App({ editor }: { editor: Editor }) {
  // The main window starts hidden so Windows never displays an empty WebView2 surface.
  // A passive effect runs after React has committed the full shell to the DOM.
  useEffect(() => showMainWindow(), []);

  // Some words are said in the language of the open deck and not of the UI (the hint of an empty
  // placeholder, the names of a template's layouts): its strings are loaded when the deck is.
  const deckLang = useStore(editor.deck, (state) => state.deck.meta.lang);
  useEffect(() => {
    const language = languageOf(deckLang);
    if (language) void loadLanguage(language);
  }, [deckLang]);

  return (
    <EditorProvider editor={editor}>
      <Shell />
    </EditorProvider>
  );
}
