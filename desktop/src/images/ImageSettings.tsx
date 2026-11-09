import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Button, cx, SegmentedControl, Skeleton } from '@slidr/ui';
import { useStore } from 'zustand';
import { agentOf } from '../ai/runtime';
import {
  InstallDialog,
  KeyField,
  refreshSettings,
  SettingsGroup,
  SettingsItem,
  StatusPill,
  updateSection,
  useSection,
  useSettings,
  type StatusTone,
} from '../settings';
import { useEditor } from '../shell/editor';
import { imagesOf } from './appImages';
import {
  chooseDefaultProvider,
  type ImageProviderDescriptor,
  type ImageProviderStatus,
} from './images';

/** The values of `images.quality` in the settings; the core falls back to `medium`. */
const QUALITIES = ['low', 'medium', 'high', 'auto'] as const;
type Quality = (typeof QUALITIES)[number];

/**
 * What a provider's state is called: the probe's answer, read with whether its key is stored.
 * `not_chosen` is the state of no provider: none is chosen yet (ADR-140).
 */
export type ProviderStateLabel =
  | 'not_chosen'
  | 'checking'
  | 'ready'
  | 'not_installed'
  | 'not_logged_in'
  | 'needs_key'
  | 'key_rejected'
  | 'unavailable';

/**
 * A provider that needs a key says `not_logged_in` both when there is none and when the service
 * turned the key down; whether a key is stored tells the two apart.
 */
export function providerStateLabel(
  provider: ImageProviderDescriptor,
  status: ImageProviderStatus | undefined,
  keyStored: boolean,
): ProviderStateLabel {
  if (provider.key && !keyStored) return 'needs_key';
  if (!status) return 'checking';
  if (status.state === 'not_logged_in' && provider.key) return 'key_rejected';
  return status.state;
}

const stateTone: Record<ProviderStateLabel, StatusTone> = {
  not_chosen: 'warning',
  checking: 'neutral',
  ready: 'success',
  not_installed: 'warning',
  not_logged_in: 'warning',
  needs_key: 'warning',
  key_rejected: 'danger',
  unavailable: 'danger',
};

/**
 * The image providers, which one is chosen and what each can do now, and how to choose one and
 * set up the CLI of one that runs on an agent's. Settings -> Media and the chat's image step
 * (ADR-140) show the same state.
 */
export function useImageProviders() {
  const { t } = useTranslation('images');
  const { client } = imagesOf(useEditor());
  const keys = useSettings((state) => state.keys);
  const revision = useSettings((state) => state.revision);
  const [providers, setProviders] = useState<ImageProviderDescriptor[] | null>(null);
  const [chosen, setChosen] = useState<string | null>(null);
  const [statuses, setStatuses] = useState<Record<string, ImageProviderStatus>>({});
  const [error, setError] = useState<string | null>(null);
  const agent = agentOf(useEditor());
  const setups = useStore(agent.setup.store);
  // What went wrong in the last install or sign-in of a provider's CLI, by provider.
  const [setupErrors, setSetupErrors] = useState<Record<string, string | undefined>>({});
  const [probes, setProbes] = useState(0);

  useEffect(() => {
    let current = true;
    Promise.all([client.providers(), client.defaultProvider()])
      .then(([list, id]) => {
        if (!current) return;
        setProviders(list);
        setChosen(id);
      })
      .catch(() => current && setError(t('settings.listFailed')));
    return () => {
      current = false;
    };
  }, [client, t]);

  // A provider is asked again whenever a key or a setting changes: a key that was just saved
  // may work, and one that was removed no longer does.
  useEffect(() => {
    if (!providers) return;
    let current = true;
    for (const provider of providers) {
      void client
        .probe(provider.id)
        .then((status) => current && setStatuses((all) => ({ ...all, [provider.id]: status })))
        .catch(() => undefined);
    }
    return () => {
      current = false;
    };
  }, [client, providers, revision, probes]);

  /** The provider's state, read with whether its key is stored. */
  const stateOf = (provider: ImageProviderDescriptor) =>
    providerStateLabel(
      provider,
      statuses[provider.id],
      provider.key ? !!keys[provider.key] : false,
    );

  /** The install or sign-in of the provider's CLI, while it runs. */
  const busyOf = (provider: ImageProviderDescriptor) => {
    const setup = provider.harness ? setups[provider.harness] : undefined;
    return setup?.busy === 'installing' || setup?.busy === 'signingIn' ? setup.busy : undefined;
  };

  /** What the app can do for the provider: install its CLI, or sign it in. */
  const actionOf = (provider: ImageProviderDescriptor): 'install' | 'login' | undefined => {
    if (!provider.harness || busyOf(provider)) return undefined;
    const label = stateOf(provider);
    return label === 'not_installed' ? 'install' : label === 'not_logged_in' ? 'login' : undefined;
  };

  // A provider that runs on an agent CLI is installed and signed in through that harness's setup,
  // the one the agent settings use; then it is asked again.
  const setUp = async (provider: ImageProviderDescriptor, action: 'install' | 'login') => {
    const harness = provider.harness;
    if (!harness) return;
    setSetupErrors((all) => ({ ...all, [provider.id]: undefined }));
    await agent.setup.run(harness, action);
    const failed = agent.setup.store.getState()[harness]?.error;
    setSetupErrors((all) => ({ ...all, [provider.id]: failed }));
    setProbes((count) => count + 1);
  };

  /** Whether the provider is the one chosen now. */
  const choose = async (id: string) => {
    if (id === chosen) return true;
    const before = chosen;
    setChosen(id);
    setError(null);
    if (await chooseDefaultProvider(client, id, refreshSettings)) return true;
    // Only a choice the core did not take is taken back, and not over one made since.
    setChosen((now) => (now === id ? before : now));
    setError(t('settings.chooseFailed'));
    return false;
  };

  return {
    providers,
    chosen,
    selected: providers?.find((provider) => provider.id === chosen),
    statuses,
    error,
    /** What went wrong in the last install or sign-in of the provider's CLI, unless it runs now. */
    setupErrorOf: (provider: ImageProviderDescriptor) =>
      busyOf(provider) ? undefined : setupErrors[provider.id],
    stateOf,
    busyOf,
    actionOf,
    setUp,
    choose,
    /** Asks every provider again what it can do. */
    recheck: () => setProbes((count) => count + 1),
  };
}

/**
 * The image providers in the settings screen (GEN-01, GEN-03): which one makes the images, the
 * key of one that needs a key, and the quality of one that takes it. The choice is what
 * `image_generate` uses when a job names no provider, the agent's jobs included. Until the user
 * (or the organization) chooses, none is marked (ADR-140). The chat's setup asks the same
 * question in a list of its own (`ChatSetup`).
 */
export function ImageSettings() {
  const { t } = useTranslation('images');
  const quality = useSection('images').quality;
  const images = useImageProviders();
  const { providers, chosen, statuses, error, selected } = images;
  const [confirmInstall, setConfirmInstall] = useState<ImageProviderDescriptor>();

  if (!providers) {
    return error ? (
      <p role="alert" className="text-sm text-ui-danger-fg">
        {error}
      </p>
    ) : (
      <Skeleton className="h-24 w-full rounded-panel" />
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-ui-fg-muted">{t('settings.hint')}</p>
      <SettingsGroup title={t('settings.providers')}>
        <div
          role="radiogroup"
          aria-label={t('settings.providers')}
          className="flex flex-col divide-y divide-ui-line"
          data-testid="image-providers"
        >
          {providers.map((provider) => {
            const active = provider.id === chosen;
            const status = statuses[provider.id];
            const label = images.stateOf(provider);
            const busy = images.busyOf(provider);
            // The app can install the CLI of a provider that runs on one, and sign it in.
            const action = images.actionOf(provider);
            const setupError = images.setupErrorOf(provider);
            return (
              <div
                key={provider.id}
                className={cx(
                  'flex flex-col transition-colors',
                  active ? 'bg-ui-accent-soft' : 'hover:bg-ui-hover',
                )}
              >
                <button
                  type="button"
                  role="radio"
                  aria-checked={active}
                  data-provider={provider.id}
                  data-state={label}
                  onClick={() => void images.choose(provider.id)}
                  className={cx(
                    'flex cursor-default items-start gap-3 px-3 py-3 text-start transition-colors focus-visible:-outline-offset-2',
                    !active && 'active:bg-ui-pressed',
                  )}
                >
                  <span
                    aria-hidden
                    className={cx(
                      'mt-0.5 inline-flex size-4 shrink-0 items-center justify-center rounded-full border transition-colors',
                      active ? 'border-ui-accent bg-ui-accent' : 'border-ui-fg-subtle bg-ui-panel',
                    )}
                  >
                    {active && <span className="size-1.5 rounded-full bg-ui-on-accent" />}
                  </span>
                  <span className="flex min-w-0 flex-1 flex-col gap-1">
                    <span className="flex min-w-0 items-center gap-2">
                      <span className="min-w-0 flex-1 truncate text-sm font-medium text-ui-fg">
                        {provider.name}
                      </span>
                      {busy ? (
                        <StatusPill tone="neutral">{t('setup.busy')}</StatusPill>
                      ) : (
                        <StatusPill tone={stateTone[label]}>{t(`state.${label}`)}</StatusPill>
                      )}
                    </span>
                    <span className="text-xs text-ui-fg-muted">
                      {t(provider.key ? 'cost.key' : 'cost.signIn')}
                      {' · '}
                      {t(`edit.${provider.capabilities.edit}`)}
                    </span>
                    {label === 'ready' && status?.account && !provider.key && (
                      <span className="text-xs text-ui-fg-muted">
                        {t('account', { account: status.account })}
                      </span>
                    )}
                    {busy || action ? (
                      // The app's own words: it is the app that installs the CLI or signs it in.
                      <span className="text-xs text-ui-fg-muted" aria-live="polite">
                        {t(
                          `setup.${busy ?? (action === 'install' ? 'not_installed' : 'not_logged_in')}`,
                        )}
                      </span>
                    ) : (
                      label !== 'ready' &&
                      label !== 'checking' &&
                      label !== 'needs_key' &&
                      status?.detail && (
                        // The provider's own guidance, in English: what to install, how to sign in.
                        <span className="text-xs text-ui-fg-muted">
                          <bdi>{status.detail}</bdi>
                        </span>
                      )
                    )}
                    {setupError && (
                      <span
                        role="alert"
                        className="break-words text-xs text-ui-danger-fg"
                        dir="auto"
                      >
                        {setupError}
                      </span>
                    )}
                  </span>
                </button>
                {action && (
                  // Beside the radio, not in it: a button cannot hold another one.
                  <div className="flex flex-wrap gap-2 ps-10 pe-3 pb-3">
                    <Button
                      size="sm"
                      variant={active ? 'primary' : 'secondary'}
                      onClick={() =>
                        action === 'install'
                          ? setConfirmInstall(provider)
                          : void images.setUp(provider, 'login')
                      }
                    >
                      {t(action === 'install' ? 'setup.install' : 'setup.signIn')}
                    </Button>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </SettingsGroup>
      {error && (
        <p role="alert" className="px-1 text-xs text-ui-danger-fg">
          {error}
        </p>
      )}
      <InstallDialog
        name={confirmInstall?.name}
        open={!!confirmInstall}
        onClose={() => setConfirmInstall(undefined)}
        onApprove={() => confirmInstall && void images.setUp(confirmInstall, 'install')}
      />
      {selected?.key && (
        <SettingsGroup title={t('settings.forProvider', { name: selected.name })}>
          <SettingsItem>
            <KeyField name={selected.key} />
          </SettingsItem>
        </SettingsGroup>
      )}
      {selected?.capabilities.quality && (
        // A choice that shows itself, as the theme's and the language's do, needs no card; at
        // the width of the tab its four words fit in the narrowest panel.
        <div className="flex flex-col gap-2">
          <h4 className="px-1 text-xs font-semibold text-ui-fg-muted">{t('settings.quality')}</h4>
          <SegmentedControl<Quality>
            aria-label={t('settings.quality')}
            fill
            value={QUALITIES.find((value) => value === quality) ?? 'medium'}
            onValueChange={(next) => void updateSection('images', { quality: next })}
            options={QUALITIES.map((value) => ({ value, label: t(`quality.${value}`) }))}
          />
          <p className="px-1 text-xs text-ui-fg-muted">{t('settings.qualityHint')}</p>
        </div>
      )}
    </div>
  );
}
