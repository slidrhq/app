import { useEffect, useMemo } from 'react';
import { useStore } from 'zustand';
import { library } from './app';
import type { LibraryEntry } from './library';

/**
 * The templates of the library, built-in first, for a panel that lists them: the built-in ones
 * are read from the media library when it is first drawn, if the app has not read them yet, and
 * it is drawn again when they come and when the personal ones are read.
 */
export function useLibraryEntries(): LibraryEntry[] {
  const builtIn = useStore(library.state, (s) => s.builtIn);
  const personal = useStore(library.state, (s) => s.personal);
  useEffect(() => {
    void library.loadBuiltIn();
  }, []);
  // eslint-disable-next-line react-hooks/exhaustive-deps -- the entries are made of both
  return useMemo(() => library.entries(), [builtIn, personal]);
}
