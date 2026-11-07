import { Button } from '@slidr/ui';
import { Component, useEffect, type ErrorInfo, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { showMainWindow } from './mainWindow';

interface State {
  failed: boolean;
  error: unknown;
}

/**
 * The app's last resort: a render that throws, and that nothing below caught, shows a screen that
 * says the app failed and offers to reload it, in place of an empty window or none at all. The
 * error is said to the console with the components it was thrown in.
 */
export class RootErrorBoundary extends Component<{ children: ReactNode }, State> {
  override state: State = { failed: false, error: undefined };

  static getDerivedStateFromError(error: unknown): State {
    return { failed: true, error };
  }

  override componentDidCatch(error: unknown, info: ErrorInfo): void {
    console.error('The app failed to draw', error, info.componentStack);
  }

  override render(): ReactNode {
    return this.state.failed ? <CrashScreen error={this.state.error} /> : this.props.children;
  }
}

/** What the user sees when the app failed: what happened, a way back, and the error itself. */
function CrashScreen({ error }: { error: unknown }) {
  const { t } = useTranslation();
  // The window is shown after the first render, which may be this one.
  useEffect(() => showMainWindow(), []);
  const detail = error instanceof Error ? (error.stack ?? error.message) : String(error);
  return (
    <main
      role="alert"
      className="flex h-screen flex-col items-center justify-center gap-4 bg-ui-chrome p-8 text-center text-ui-fg"
    >
      <h1 className="text-lg font-semibold">{t('crash.title')}</h1>
      <p className="max-w-md text-sm text-ui-fg-muted">{t('crash.body')}</p>
      <Button variant="primary" onClick={() => window.location.reload()}>
        {t('crash.reload')}
      </Button>
      <details className="max-w-2xl text-start text-xs text-ui-fg-muted">
        <summary className="cursor-default">{t('crash.details')}</summary>
        <pre dir="ltr" className="mt-2 max-h-60 overflow-auto whitespace-pre-wrap">
          {detail}
        </pre>
      </details>
    </main>
  );
}
