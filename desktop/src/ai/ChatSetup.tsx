import { useEffect, useId, useState } from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { Button, ChoiceList, Icon, Skeleton, cx } from '@slidr/ui';
import { Ai, Terminal } from '@slidr/ui/icons';
import type { HarnessDescriptor } from '../agent/agent';
import type { ChatProblem } from '../agent/transcript';
import { latestModels, modelEfforts, selectionIssue } from '../agent/harnessSetup';
import { harnessLook, harnessName, installsWithNpm } from '../agent/harnessLook';
import { chooseHarness, chosenHarness, setAgentSettings, useAgentSettings } from '../settings';
import { useEditor } from '../shell';
import { agentOf } from './runtime';

export function useChatSetup(problem?: ChatProblem) {
  const agent = agentOf(useEditor());
  const settings = useAgentSettings();
  const [harnesses, setHarnesses] = useState<HarnessDescriptor[]>();
  const [failed, setFailed] = useState(false);
  const [attempt, setAttempt] = useState(0);
  // An old/default harness id alone is not a completed user choice; one chosen here or in
  // Settings is (`chosenHarness`), and the setup goes on from its model.
  const [confirmedHarness, setConfirmedHarness] = useState<string>();
  const state = useStore(agent.setup.store, (states) =>
    settings.harnessId ? states[settings.harnessId] : undefined,
  );
  const connection = state?.connection;
  const descriptor = harnesses
    ? harnesses.find((h) => h.id === settings.harnessId)
    : connection?.harness;
  const mock =
    settings.harnessId === 'mock' ||
    (!settings.harnessId && harnesses?.length === 1 && harnesses[0]?.id === 'mock');
  const [reselecting, setReselecting] = useState(false);
  // Saved choices are enough to open the chat. Live status and model validation matter only
  // after a request has failed; opening the panel never starts a connection check.
  const missingChoices =
    !settings.harnessId ||
    !settings.model ||
    (!!connection &&
      modelEfforts(connection.harness, settings.model).length > 0 &&
      !settings.effort);
  const repair =
    !!problem &&
    (!!state?.error ||
      (problem.kind === 'unknown_harness' && !descriptor) ||
      (!!connection &&
        (connection.status.state !== 'ready' ||
          !!selectionIssue(connection.harness, settings.model, settings.effort))));
  const needed = !mock && (missingChoices || reselecting || repair);
  useEffect(() => {
    if (!needed) return;
    let current = true;
    agent.harnesses().then(
      (found) => {
        if (current) {
          setHarnesses(found);
          setFailed(false);
        }
      },
      () => {
        if (current) setFailed(true);
      },
    );
    return () => {
      current = false;
    };
  }, [agent, attempt, needed]);
  // Chosen before this setup: in Settings, or in a setup of an earlier run.
  const chosenBefore =
    !!descriptor && confirmedHarness !== descriptor.id && chosenHarness() === descriptor.id;
  const chosen = chosenBefore || (!!descriptor && confirmedHarness === descriptor.id);
  // Asked for from a problem in the conversation: the agent is chosen again, here.
  const choosingHarness = reselecting || !descriptor || (!settings.model && !chosen);
  useEffect(() => {
    // Going on from the model of an agent chosen is an explicit request to load its models.
    if (needed && descriptor && !mock && !choosingHarness && chosen)
      void agent.setup.connect(descriptor.id).catch(() => undefined);
  }, [agent, needed, descriptor, mock, choosingHarness, chosen]);
  const checking = needed && !harnesses && !failed && !descriptor;
  return {
    agent,
    settings,
    harnesses,
    descriptor,
    state,
    checking,
    needed,
    failed,
    choosingHarness,
    chosenBefore,
    reselecting,
    reselect: setReselecting,
    confirmHarness: (id: string) => {
      setConfirmedHarness(id);
      setReselecting(false);
    },
    retry: () => setAttempt((value) => value + 1),
  };
}

/** Setup is local conversation UI; it never sends a prompt or starts an agent session. */
export function ChatSetup({
  setup,
  midway = false,
}: {
  setup: ReturnType<typeof useChatSetup>;
  /** Shown under a conversation that has begun. */
  midway?: boolean;
}) {
  const { t } = useTranslation('ai');
  const { agent, settings, harnesses, descriptor, state, failed } = setup;
  // The welcome is for a setup that starts at the agent. Under a conversation, or going on from
  // the model of an agent chosen before (another agent chosen in Settings comes without a model
  // or an effort), it is a setup to finish, and stays one whatever its questions are answered.
  const [finishing, setFinishing] = useState(midway);
  if (!finishing && (midway || setup.chosenBefore)) setFinishing(true);
  const welcome = !finishing;
  const [choice, setChoice] = useState('');
  const formId = useId();
  const [editingHarness, setEditingHarness] = useState(false);
  const connection = state?.connection;
  const harness = connection?.harness;
  const status = connection?.status.state;
  const model = harness?.models.find((item) => item.id === settings.model);
  const step = setup.choosingHarness || editingHarness ? 'harness' : !model ? 'model' : 'effort';
  const efforts = harness ? modelEfforts(harness, settings.model) : [];
  const options =
    step === 'harness'
      ? (harnesses ?? [])
          .filter((h) => h.id !== 'mock')
          .map((h) => ({ id: h.id, label: harnessName(h) }))
      : step === 'model'
        ? latestModels(harness?.models ?? [])
        : efforts.map((id) => ({ id, label: t(`picker.efforts.${id}`, { defaultValue: id }) }));
  const showOptions = step === 'harness' || (status === 'ready' && !state?.busy && !state?.error);
  const showForm = showOptions && options.length > 0;
  // Back reopens the previous question with the earlier answer still marked.
  const back = descriptor && step !== 'harness' && !state?.busy && (
    <Button
      variant="ghost"
      onClick={() => {
        if (step === 'effort') {
          setChoice(settings.model ?? '');
          setup.confirmHarness(descriptor.id);
          setAgentSettings({ model: undefined, effort: undefined });
        } else {
          setChoice(descriptor.id);
          setEditingHarness(true);
        }
      }}
    >
      {t('setup.back')}
    </Button>
  );
  const retry = () =>
    descriptor
      ? void agent.setup.connect(descriptor.id, true).catch(() => undefined)
      : setup.retry();
  const ofAgent = !!descriptor && step !== 'harness';
  const listFailed = failed || harnesses?.length === 0;
  const unavailable =
    !!state?.error || status === 'unavailable' || (status === 'ready' && !harness?.models.length);
  // Installing and signing in check the agent again when they finish: Try again is offered only
  // for a check that failed, never beside the step still to take.
  const canRetry = !state?.busy && (listFailed || (ofAgent && unavailable));
  const action =
    ofAgent && !state?.busy
      ? status === 'not_installed'
        ? 'install'
        : status === 'not_logged_in'
          ? 'login'
          : undefined
      : undefined;
  const actions = (!showForm && back) || canRetry || action;
  return (
    <section className="flex flex-col gap-5 px-4 py-5" data-testid="chat-setup">
      <div className="flex flex-col items-start gap-3">
        <span className="flex size-10 items-center justify-center rounded-control bg-ui-accent-soft text-ui-accent-fg">
          <Icon icon={Ai} />
        </span>
        <div className="text-sm leading-6">
          <p className="font-semibold text-ui-fg">
            {t(welcome ? 'setup.welcome' : 'setup.finish')}
          </p>
          <p className="mt-1 text-ui-fg-muted">
            {t(welcome ? 'setup.intro' : 'setup.finishIntro')}
          </p>
        </div>
      </div>
      <ol aria-label={t('setup.steps')} className="flex items-center gap-2 text-xs">
        {(['harness', 'model', 'effort'] as const).map((item, index) => (
          <li
            key={item}
            aria-current={item === step ? 'step' : undefined}
            className={cx(
              'flex flex-1 items-center gap-1.5',
              item === step ? 'font-medium text-ui-accent-fg' : 'text-ui-fg-muted',
            )}
          >
            <span
              className={cx(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-2xs',
                item === step ? 'bg-ui-accent text-ui-on-accent' : 'bg-ui-field',
              )}
            >
              {index + 1}
            </span>
            {t(`setup.steps_${item}`)}
          </li>
        ))}
      </ol>
      {!harnesses && !failed && <Skeleton className="h-24 w-full" />}
      {listFailed && <p role="alert">{t('setup.unavailable')}</p>}
      {showForm && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!options.some((option) => option.id === choice)) return;
            if (step === 'harness') {
              chooseHarness(choice);
              setup.confirmHarness(choice);
              setAgentSettings({ harnessId: choice, model: undefined, effort: undefined });
              setEditingHarness(false);
            } else if (step === 'model') setAgentSettings({ model: choice, effort: undefined });
            else setAgentSettings({ effort: choice });
            setChoice('');
          }}
        >
          <fieldset className="min-w-0">
            <legend id={`${formId}-legend`} className="mb-2 text-sm font-medium">
              {t(`setup.${step}`)}
            </legend>
            {/* One grouped list, not a card per option: the rows stay compact in the narrow panel. */}
            <ChoiceList
              aria-labelledby={`${formId}-legend`}
              // The agents and their models are English names of products: their rows read left to
              // right in every language, the agent's mark first. The efforts are words of the page.
              dir={step === 'effort' ? undefined : 'ltr'}
              value={choice}
              onValueChange={setChoice}
              options={options.map((option) => ({
                value: option.id,
                label: option.label,
                ...(step === 'harness'
                  ? {
                      start: (
                        <span
                          className={cx(
                            'flex size-6 shrink-0 items-center justify-center rounded-small font-mono text-2xs font-semibold',
                            harnessLook(option.id)?.tone ??
                              'bg-ui-tool-violet text-ui-tool-violet-fg',
                          )}
                        >
                          {harnessLook(option.id)?.glyph ?? (
                            <Icon icon={Terminal} className="size-3.5" />
                          )}
                        </span>
                      ),
                    }
                  : {}),
              }))}
            />
          </fieldset>
          <div className="flex justify-end gap-2">
            {back}
            {setup.reselecting && (
              <Button variant="ghost" onClick={() => setup.reselect(false)}>
                {t('turn.cancel')}
              </Button>
            )}
            <Button
              variant="primary"
              type="submit"
              disabled={!options.some((option) => option.id === choice)}
            >
              {t('setup.continue')}
            </Button>
          </div>
        </form>
      )}
      {(ofAgent || actions) && (
        <div className="flex flex-col gap-4 text-sm" aria-live="polite">
          {descriptor && ofAgent && (
            <>
              {state?.busy && <p>{t(`setup.${state.busy}`)}</p>}
              {action === 'install' && (
                <p>
                  {t(
                    installsWithNpm(descriptor.id)
                      ? 'setup.installDescriptionNpm'
                      : 'setup.installDescription',
                    { name: harnessName(descriptor) },
                  )}
                </p>
              )}
              {action === 'login' && <p>{t('setup.signInDescription')}</p>}
              {unavailable && <p role="alert">{t('setup.unavailable')}</p>}
            </>
          )}
          {/* One row, as under the questions: Back first, the step's own action last. */}
          {actions && (
            <div className="flex justify-end gap-2">
              {!showForm && back}
              {canRetry && (
                <Button variant="ghost" onClick={retry}>
                  {t('setup.retry')}
                </Button>
              )}
              {descriptor && action && (
                <Button
                  variant="primary"
                  onClick={() => void agent.setup.run(descriptor.id, action)}
                >
                  {t(action === 'install' ? 'setup.install' : 'setup.signIn')}
                </Button>
              )}
            </div>
          )}
        </div>
      )}
    </section>
  );
}
