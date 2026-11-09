import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { Button } from '@slidr/ui';
import { signsInWithoutWindow } from '../agent/harnessLook';
import { useEditor } from '../shell';
import { agentOf } from './runtime';

/**
 * Cancel, beside the words that ask the user to finish signing in, while the CLI of `harness`
 * signs in without a window of its own: there is no terminal to close, so the app calls it off.
 * Nothing shows for a sign-in in a terminal, or when none runs.
 */
export function CancelSignIn({ harness, size }: { harness: string | undefined; size?: 'sm' }) {
  const { t } = useTranslation('ai');
  const { setup } = agentOf(useEditor());
  const signingIn = useStore(setup.store, (states) =>
    harness ? states[harness]?.busy === 'signingIn' : false,
  );
  if (!harness || !signingIn || !signsInWithoutWindow(harness)) return null;
  return (
    <Button
      variant="ghost"
      {...(size ? { size } : {})}
      onClick={() => void setup.cancelLogin(harness).catch(() => undefined)}
    >
      {t('setup.cancelSignIn')}
    </Button>
  );
}
