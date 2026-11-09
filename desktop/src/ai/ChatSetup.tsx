import { useEffect, useId, useState, type ReactNode } from 'react';
import { useStore } from 'zustand';
import { useTranslation } from 'react-i18next';
import { Button, ChoiceList, Icon, Skeleton, cx } from '@slidr/ui';
import { Ai, Check, Image as ImageIcon, KeyRound, Terminal } from '@slidr/ui/icons';
import type { HarnessDescriptor } from '../agent/agent';
import type { ChatProblem } from '../agent/transcript';
import { latestModels, modelEfforts, selectionIssue } from '../agent/harnessSetup';
import {
  harnessLook,
  harnessName,
  installedByOrganization,
  installDescription,
  signsInWithoutWindow,
} from '../agent/harnessLook';
import { imagesOf } from '../images/appImages';
import type { ImageProviderDescriptor } from '../images/images';
import { useImageProviders } from '../images/ImageSettings';
import {
  chooseHarness,
  chosenHarness,
  KeyField,
  setAgentSettings,
  useAgentSettings,
  useSection,
} from '../settings';
import { defaultAgent, defaultImageProvider } from '../settings/systemSettings';
import { useEditor } from '../shell';
import { chosenProviderMissing, finishImageSetup, putOffImageSetup } from './imageSetup';
import { CancelSignIn } from './CancelSignIn';
import { agentOf, aiOf } from './runtime';

/**
 * The agent's steps, in order. Who makes the images is set up apart from them (ADR-140): after
 * them, under one line that sums up the agent chosen, or on its own.
 */
const STEPS = ['harness', 'model', 'effort'] as const;
type Step = (typeof STEPS)[number] | 'images';

export function useChatSetup(problem?: ChatProblem) {
  const editor = useEditor();
  const agent = agentOf(editor);
  const { imageSetup } = aiOf(editor);
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
  const agentNeeded = !mock && (missingChoices || reselecting || repair);
  // Who makes the images is the last step (ADR-140). It follows the agent's whenever the agent
  // was set up here, and is asked on its own while no provider is chosen, or while the one chosen
  // runs on an agent's CLI that is not installed or not signed in (unless put off), and when a
  // job of the agent met a provider that could not run. The scripted agent asks nothing.
  const imageClient = imagesOf(editor).client;
  const imageChoice = useSection('images').defaultProvider;
  const imagesChosen = typeof imageChoice === 'string' || !!defaultImageProvider();
  const imageTrouble = useStore(imageSetup, (state) => state.trouble);
  const imagesLater = useStore(imageSetup, (state) => state.later);
  const imagesMissing = useStore(imageSetup, (state) => state.missing);
  // The provider chosen is asked whether it can run, as the media panel asks it, whenever the
  // chat opens and whenever another is chosen; what it said is kept for the window.
  useEffect(() => {
    if (mock) return;
    let current = true;
    chosenProviderMissing(imageClient).then(
      (missing) => current && imageSetup.setState({ missing }),
      () => undefined,
    );
    return () => {
      current = false;
    };
  }, [imageClient, imageSetup, mock, imageChoice]);
  const [afterAgent, setAfterAgent] = useState(false);
  const asked =
    !mock &&
    !agentNeeded &&
    (afterAgent || imageTrouble || (!imagesLater && (!imagesChosen || imagesMissing)));
  // Once asked, the step stays until it is finished or put off: a provider is chosen as it is
  // clicked, and one that still needs a key or a sign-in is chosen but not ready.
  const [imagesOpen, setImagesOpen] = useState(false);
  if (asked && !imagesOpen) setImagesOpen(true);
  const images = !mock && !agentNeeded && (asked || imagesOpen);
  const needed = agentNeeded || images;
  useEffect(() => {
    if (!agentNeeded) return;
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
  }, [agent, attempt, agentNeeded]);
  // Chosen before this setup: in Settings, or in a setup of an earlier run.
  const chosenBefore =
    !!descriptor && confirmedHarness !== descriptor.id && chosenHarness() === descriptor.id;
  const chosen = chosenBefore || (!!descriptor && confirmedHarness === descriptor.id);
  // Asked for from a problem in the conversation: the agent is chosen again, here.
  const choosingHarness = reselecting || !descriptor || (!settings.model && !chosen);
  useEffect(() => {
    // Going on from the model of an agent chosen is an explicit request to load its models.
    if (agentNeeded && descriptor && !mock && !choosingHarness && chosen)
      void agent.setup.connect(descriptor.id).catch(() => undefined);
  }, [agent, agentNeeded, descriptor, mock, choosingHarness, chosen]);
  const checking = agentNeeded && !harnesses && !failed && !descriptor;
  return {
    agent,
    settings,
    harnesses,
    descriptor,
    state,
    checking,
    needed,
    /** Only the image step is left: the agent is set up. */
    images,
    /** A job of the agent met an image provider that could not run. */
    imageTrouble,
    /** The provider chosen runs on an agent's CLI that is not installed or not signed in. */
    imagesMissing,
    /** The agent was set up here, so the image step follows it. */
    afterAgent,
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
    /** A question of the agent's was answered here: the image step comes after them. */
    answered: () => setAfterAgent(true),
    finishImages: () => {
      setAfterAgent(false);
      setImagesOpen(false);
      finishImageSetup(imageSetup);
    },
    putOffImages: () => {
      setAfterAgent(false);
      setImagesOpen(false);
      putOffImageSetup(imageSetup);
    },
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
  // The agent the organization starts its people on is chosen to begin with (ADR-117).
  const [choice, setChoice] = useState(() => defaultAgent() ?? '');
  const formId = useId();
  const [editingHarness, setEditingHarness] = useState(false);
  const connection = state?.connection;
  const harness = connection?.harness;
  const status = connection?.status.state;
  const model = harness?.models.find((item) => item.id === settings.model);
  const step: Step = setup.images
    ? 'images'
    : setup.choosingHarness || editingHarness
      ? 'harness'
      : !model
        ? 'model'
        : 'effort';
  const efforts = harness ? modelEfforts(harness, settings.model) : [];
  const options =
    step === 'harness'
      ? (harnesses ?? [])
          .filter((h) => h.id !== 'mock')
          .map((h) => ({ id: h.id, label: harnessName(h) }))
      : step === 'model'
        ? latestModels(harness?.models ?? [])
        : step === 'effort'
          ? efforts.map((id) => ({ id, label: t(`picker.efforts.${id}`, { defaultValue: id }) }))
          : [];
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
  // An agent the organization installs itself is not installed from here: it is checked again
  // once the organization has.
  const byOrganization = !!descriptor && installedByOrganization(descriptor.id);
  const awaitingInstall = byOrganization && status === 'not_installed';
  const canRetry = !state?.busy && (listFailed || (ofAgent && (unavailable || awaitingInstall)));
  const action =
    ofAgent && !state?.busy
      ? status === 'not_installed'
        ? byOrganization
          ? undefined
          : 'install'
        : status === 'not_logged_in'
          ? 'login'
          : undefined
      : undefined;
  const actions = (!showForm && back) || canRetry || action;
  if (step === 'images') {
    // After the agent's steps, the head stays theirs, the welcome or the finish, and says nothing
    // of the images: the line that sums up the agent comes under it, and the images after that.
    // Asked on its own, it is the images' own, with their mark, so a provider named as an agent
    // is (Codex) is not taken for the agent; and it says why when the provider chosen is not
    // ready, or a job of the agent could not make its images.
    const greeting = welcome && setup.afterAgent;
    const alone = !setup.afterAgent;
    const effort =
      settings.effort && efforts.includes(settings.effort)
        ? t(`picker.efforts.${settings.effort}`, { defaultValue: settings.effort })
        : undefined;
    return (
      <section className="flex flex-col gap-5 px-4 py-5" data-testid="chat-setup" data-step={step}>
        <SetupHead
          icon={alone ? ImageIcon : Ai}
          title={greeting ? 'setup.welcome' : alone ? 'setup.imagesFinish' : 'setup.finish'}
          intro={
            greeting
              ? 'setup.intro'
              : alone && setup.imageTrouble
                ? 'setup.imagesTrouble'
                : alone && setup.imagesMissing
                  ? 'setup.imagesMissing'
                  : 'setup.finishIntro'
          }
        />
        {/* In place of the agent's steps, once they were answered here: their answers in a line. */}
        {setup.afterAgent && descriptor && (
          <AgentSummary
            harness={descriptor}
            parts={[harnessName(descriptor), model?.label ?? settings.model, effort]}
          />
        )}
        <ImageStep
          setup={setup}
          back={
            // Back to the agent's last question, when the agent was set up here.
            setup.afterAgent &&
            harness && (
              <Button
                variant="ghost"
                onClick={() => {
                  if (efforts.length > 0) {
                    setChoice(settings.effort ?? '');
                    setAgentSettings({ effort: undefined });
                  } else {
                    setChoice(settings.model ?? '');
                    setAgentSettings({ model: undefined, effort: undefined });
                  }
                }}
              >
                {t('setup.back')}
              </Button>
            )
          }
        />
      </section>
    );
  }
  return (
    <section className="flex flex-col gap-5 px-4 py-5" data-testid="chat-setup" data-step={step}>
      <SetupHead
        title={welcome ? 'setup.welcome' : 'setup.finish'}
        intro={welcome ? 'setup.intro' : 'setup.finishIntro'}
      />
      <Steps step={step} />
      {!harnesses && !failed && <Skeleton className="h-24 w-full" />}
      {listFailed && <p role="alert">{t('setup.unavailable')}</p>}
      {showForm && (
        <form
          className="flex flex-col gap-4"
          onSubmit={(event) => {
            event.preventDefault();
            if (!options.some((option) => option.id === choice)) return;
            setup.answered();
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
                ...(step === 'harness' ? { start: <HarnessMark id={option.id} /> } : {}),
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
              {state?.busy === 'signingIn' && signsInWithoutWindow(descriptor.id) && (
                <div className="flex justify-end gap-2">
                  <CancelSignIn harness={descriptor.id} />
                </div>
              )}
              {action === 'install' && (
                <p>
                  {t(`setup.${installDescription(descriptor.id)}`, {
                    name: harnessName(descriptor),
                  })}
                </p>
              )}
              {action === 'login' && <p>{t('setup.signInDescription')}</p>}
              {awaitingInstall && !state?.busy && (
                <p>{t('settings:agent.askAdmin', { name: harnessName(descriptor) })}</p>
              )}
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

/** The welcome or the finish, the same over the agent's steps and the images. */
function SetupHead({
  icon = Ai,
  title,
  intro,
}: {
  /** The agent's mark, or the images' when they are asked for on their own. */
  icon?: typeof Ai;
  title: string;
  intro: string;
}) {
  const { t } = useTranslation('ai');
  return (
    <div className="flex flex-col items-start gap-3">
      <span className="flex size-10 items-center justify-center rounded-control bg-ui-accent-soft text-ui-accent-fg">
        <Icon icon={icon} />
      </span>
      <div className="text-sm leading-6">
        <p className="font-semibold text-ui-fg">{t(title)}</p>
        <p className="mt-1 text-ui-fg-muted">{t(intro)}</p>
      </div>
    </div>
  );
}

/** Where the setup of the agent is among its steps. */
function Steps({ step }: { step: Step }) {
  const { t } = useTranslation('ai');
  return (
    // Each step as wide as its name: in equal parts the longer names were cut short.
    <ol aria-label={t('setup.steps')} className="flex items-center justify-between gap-2 text-xs">
      {STEPS.map((item, index) => (
        <li
          key={item}
          aria-current={item === step ? 'step' : undefined}
          className={cx(
            'flex min-w-0 items-center gap-1.5',
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
          <span className="truncate">{t(`setup.steps_${item}`)}</span>
        </li>
      ))}
    </ol>
  );
}

/** The mark of an agent, as in the list of the agents. */
function HarnessMark({ id }: { id: string }) {
  const look = harnessLook(id);
  return (
    <span
      className={cx(
        'flex size-6 shrink-0 items-center justify-center rounded-small font-mono text-2xs font-semibold',
        look?.tone ?? 'bg-ui-tool-violet text-ui-tool-violet-fg',
      )}
    >
      {look?.glyph ?? <Icon icon={Terminal} className="size-3.5" />}
    </span>
  );
}

/**
 * The mark of an image provider: its agent's, for one that runs on an agent's CLI; a key, for
 * one that calls a service with the user's key; a picture, for any other.
 */
function ProviderMark({ provider }: { provider: ImageProviderDescriptor }) {
  if (provider.harness) return <HarnessMark id={provider.harness} />;
  return (
    <span className="flex size-6 shrink-0 items-center justify-center rounded-small bg-ui-field text-ui-fg-muted">
      <Icon icon={provider.key ? KeyRound : ImageIcon} className="size-3.5" />
    </span>
  );
}

/**
 * The agent set up in the steps before, in one line, as its row was in their lists: its mark, and
 * its name, model and effort, product names that read left to right.
 */
function AgentSummary({
  harness,
  parts,
}: {
  harness: HarnessDescriptor;
  parts: (string | undefined)[];
}) {
  const { t } = useTranslation('ai');
  return (
    <div
      dir="ltr"
      className="flex min-h-10 items-center gap-2.5 rounded-control bg-ui-field px-2.5 py-1.5 text-sm text-ui-fg"
      data-testid="chat-setup-agent"
    >
      <HarnessMark id={harness.id} />
      {/* Wrapped, not cut short: a word of the page cut at its start reads as another word. */}
      <p className="min-w-0 flex-1 break-words">
        <span className="sr-only">{t('setup.agentChosen')} </span>
        {parts
          .filter((part): part is string => !!part)
          .map((part, index) => (
            <span key={index}>
              {index > 0 && <span className="text-ui-fg-muted"> · </span>}
              <bdi>{part}</bdi>
            </span>
          ))}
      </p>
      <Icon icon={Check} className="shrink-0 text-ui-success-fg" />
    </div>
  );
}

/**
 * Who makes the images (ADR-140), asked as the agent's steps ask: one list of the providers, a
 * row each with its mark, and Continue. Continue chooses the provider marked, as in Settings; one
 * that is ready ends the setup, and one that is not leads, as an agent does, to what it needs:
 * its CLI installed or signed in, or its key. The setup ends once it is ready. Asked on its own
 * because the provider chosen lacks its CLI or its sign-in, it opens at what that provider needs,
 * as the agent's setup does. Not now leaves it, and the chat asks again when a job of the agent
 * needs it. Its quality stays in Settings.
 */
function ImageStep({ setup, back }: { setup: ReturnType<typeof useChatSetup>; back: ReactNode }) {
  const { t } = useTranslation('ai');
  const { t: ti } = useTranslation('images');
  const formId = useId();
  const images = useImageProviders();
  const { providers, selected, error } = images;
  // The row marked: the provider chosen before, until another is clicked.
  const [choice, setChoice] = useState<string>();
  const value = choice ?? images.chosen ?? '';
  // Continue chose a provider that still needs something before it can make images, or the one
  // chosen before was found to need it.
  const [settingUp, setSettingUp] = useState(() => setup.imagesMissing && !setup.afterAgent);
  const state = selected ? images.stateOf(selected) : 'not_chosen';
  const { finishImages } = setup;
  // As the agent's steps go on once it is set up, the setup ends once its provider is ready.
  useEffect(() => {
    if (settingUp && state === 'ready') finishImages();
  }, [settingUp, state, finishImages]);

  if (settingUp && selected) {
    const busy = images.busyOf(selected);
    const action = images.actionOf(selected);
    const setupError = images.setupErrorOf(selected);
    // The provider's own name, as its row in the list has it: not the agent's, which may be the
    // same CLI under a shorter name.
    const name = selected.name;
    const detail =
      state === 'unavailable' || state === 'key_rejected'
        ? (images.statuses[selected.id]?.detail ?? ti(`state.${state}`))
        : undefined;
    return (
      <div className="flex flex-col gap-4 text-sm" data-testid="chat-setup-images">
        <div className="flex flex-col gap-4" aria-live="polite">
          {busy && <p>{t(`setup.${busy}`)}</p>}
          {busy === 'signingIn' && signsInWithoutWindow(selected.harness) && (
            <div className="flex justify-end gap-2">
              <CancelSignIn harness={selected.harness} />
            </div>
          )}
          {action === 'install' && (
            <p>{t(`setup.${installDescription(selected.harness)}`, { name })}</p>
          )}
          {action === 'login' && <p>{t('setup.imagesSignIn', { name })}</p>}
          {state === 'checking' && <p>{ti('state.checking')}</p>}
          {detail && (
            <p role="alert">
              <bdi>{detail}</bdi>
            </p>
          )}
          {setupError && (
            <p role="alert" dir="auto" className="break-words text-ui-danger-fg">
              {setupError}
            </p>
          )}
        </div>
        {selected.key && (state === 'needs_key' || state === 'key_rejected') && (
          <KeyField name={selected.key} quiet />
        )}
        {/* One row, as under the agent's: Back first, the step's own action last. */}
        {!busy && (
          <div className="flex justify-end gap-2">
            <Button variant="ghost" onClick={() => setSettingUp(false)}>
              {t('setup.back')}
            </Button>
            {/* The step may have come without being asked for: it can be put off from here too. */}
            <Button variant="ghost" onClick={setup.putOffImages}>
              {t('setup.notNow')}
            </Button>
            {state === 'unavailable' && (
              <Button variant="ghost" onClick={images.recheck}>
                {t('setup.retry')}
              </Button>
            )}
            {action && (
              <Button variant="primary" onClick={() => void images.setUp(selected, action)}>
                {t(action === 'install' ? 'setup.install' : 'setup.signIn')}
              </Button>
            )}
          </div>
        )}
      </div>
    );
  }

  return (
    <form
      className="flex flex-col gap-4"
      data-testid="chat-setup-images"
      onSubmit={(event) => {
        event.preventDefault();
        const provider = providers?.find((item) => item.id === value);
        if (!provider) return;
        void images.choose(provider.id).then((chosen) => {
          if (!chosen) return;
          if (images.stateOf(provider) === 'ready') finishImages();
          else setSettingUp(true);
        });
      }}
    >
      <fieldset className="min-w-0">
        <legend id={`${formId}-legend`} className="text-sm font-medium">
          {t('setup.images')}
        </legend>
        <p id={`${formId}-hint`} className="mt-1 mb-2 text-xs text-ui-fg-muted">
          {t('setup.imagesHint')}
        </p>
        {providers ? (
          <ChoiceList
            aria-labelledby={`${formId}-legend`}
            aria-describedby={`${formId}-hint`}
            // The providers are English names of products, as the agents are.
            dir="ltr"
            value={value}
            onValueChange={setChoice}
            options={providers.map((provider) => ({
              value: provider.id,
              label: provider.name,
              start: <ProviderMark provider={provider} />,
            }))}
          />
        ) : (
          !error && <Skeleton className="h-24 w-full" />
        )}
      </fieldset>
      {error && (
        <p role="alert" className="text-sm text-ui-danger-fg">
          {error}
        </p>
      )}
      <div className="flex justify-end gap-2">
        {back}
        <Button variant="ghost" onClick={setup.putOffImages}>
          {t('setup.notNow')}
        </Button>
        <Button
          variant="primary"
          type="submit"
          disabled={!providers?.some((provider) => provider.id === value)}
        >
          {t('setup.continue')}
        </Button>
      </div>
    </form>
  );
}
