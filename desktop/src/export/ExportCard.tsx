import type { ExportResult } from '@slidr/html-export';
import type { Deck } from '@slidr/model';
import {
  Button,
  ChoiceList,
  cx,
  Field,
  Icon,
  IconButton,
  NumberField,
  ScrollArea,
  Spinner,
} from '@slidr/ui';
import {
  Check,
  CircleAlert,
  CircleCheck,
  Globe,
  Presentation,
  Share,
  TriangleAlert,
  X,
} from '@slidr/ui/icons';
import type { TFunction } from 'i18next';
import { useEffect, useId, useRef, type RefObject } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { PptxExportReport } from '../pptx/PptxExportReport';
import { focusStage, useDeck, useEditor } from '../shell';
import {
  closeExportCard,
  exportCard,
  exportPlan,
  runExport,
  setExportChoices,
  setExportPhase,
  type ExportFormat,
} from './card';
import { fontFamilyName, formatBytes, ltr, type Destination, type MediaPlan } from './exportDeck';
import { warningText } from './warnings';

/*
 * The export card (ADR-123; WG9-T12, SPEC 12): "Export…" of the File menu asks its questions in
 * the AI chat, a step at a time as the chat's own setup asks for the agent, and sends nothing to
 * the agent. First the format, an HTML page or a PowerPoint presentation (ADR-108); then which
 * slides, with or without animations, and for HTML where its video and audio go; then where to
 * save, and what went into the file: its size, its assets and fonts, and what could not be
 * exported as it is in the deck. The card is not modal: it counts the deck as it is, and the
 * export takes the deck as it is when it starts.
 */

const STEPS = ['format', 'content', 'save'] as const;

/** A count in words: one string for one, another for more (see `messages.ts`). */
const counted = (t: TFunction<'export'>, key: string, n: number): string =>
  n === 1 ? t(`${key}One`) : t(`${key}Many`, { n });

/** The last time the card was asked for that it answered: a card drawn again keeps its place. */
let answered = 0;

/**
 * The keyboard on the card: when it is asked for, it comes into view with the keyboard on its
 * first answer, and every step it goes on to takes the keyboard there again. A card that is drawn
 * again because its panel came back leaves the keyboard where it is.
 */
function useKeyboard(card: RefObject<HTMLElement | null>, asked: number, where: string) {
  const before = useRef(where);
  useEffect(() => {
    const element = card.current;
    const moved = before.current !== where;
    before.current = where;
    if (!element || (asked === answered && !moved)) return;
    const asking = asked !== answered;
    // A frame later: the File menu the card was asked from holds the keyboard until it has closed,
    // which is after the card is drawn.
    const frame = requestAnimationFrame(() => {
      answered = asked;
      if (asking) element.scrollIntoView({ block: 'nearest' });
      const first = element.querySelector<HTMLElement>(
        '[role="radio"][data-state="checked"], [data-autofocus]',
      );
      (first ?? element).focus();
    });
    return () => cancelAnimationFrame(frame);
  }, [card, asked, where]);
}

/** The mark of a format in its row: the web's globe for a page, a screen for a presentation. */
function FormatMark({ format }: { format: ExportFormat }) {
  return (
    <span
      className={cx(
        'flex size-7 items-center justify-center rounded-small',
        format === 'html'
          ? 'bg-ui-tool-teal text-ui-tool-teal-fg'
          : 'bg-ui-tool-orange text-ui-tool-orange-fg',
      )}
    >
      <Icon icon={format === 'html' ? Globe : Presentation} className="size-4" />
    </span>
  );
}

export function ExportCard() {
  const { t } = useTranslation('export');
  const { t: tp } = useTranslation('pptx');
  const editor = useEditor();
  const state = useStore(exportCard);
  const deck = useDeck((s) => s.deck);
  const total = deck.slides.length;
  const { plan, media, beside } = exportPlan(deck, state);
  // An HTML page is one file only while its video and audio go inside it (ADR-057).
  const htmlBeside = media.assets.length > 0 && (state.mediaBeside || media.tooLarge);
  const { phase, format } = state;
  const id = useId();
  const card = useRef<HTMLElement>(null);
  const step = phase.at === 'choose' ? phase.step : 'save';
  useKeyboard(card, state.asked, phase.at === 'choose' ? phase.step : phase.at);

  const close = () => {
    closeExportCard();
    focusStage();
  };
  const formatName = (of: ExportFormat) => (of === 'pptx' ? tp('filter') : t('filter'));

  const steps = (
    <ol aria-label={t('steps')} className="flex items-center gap-2 text-xs">
      {STEPS.map((item, index) => {
        const current = item === step;
        // A step is behind once the card went past it, and the last one once the file is there.
        const past = index < STEPS.indexOf(step) || phase.at === 'done';
        return (
          <li
            key={item}
            aria-current={current ? 'step' : undefined}
            className={cx(
              'flex flex-1 items-center gap-1.5',
              current ? 'font-medium text-ui-accent-fg' : 'text-ui-fg-muted',
            )}
          >
            <span
              className={cx(
                'flex size-5 shrink-0 items-center justify-center rounded-full text-2xs',
                current
                  ? 'bg-ui-accent text-ui-on-accent'
                  : past
                    ? 'bg-ui-accent-soft text-ui-accent-fg'
                    : 'bg-ui-field',
              )}
            >
              {past ? <Icon icon={Check} className="size-3" /> : index + 1}
            </span>
            {item === 'format'
              ? t('format')
              : item === 'content'
                ? t('stepContent')
                : t('stepSave')}
          </li>
        );
      })}
    </ol>
  );

  let body;
  if (phase.at === 'choose' && phase.step === 'format') {
    body = (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          setExportPhase({ at: 'choose', step: 'content' });
        }}
      >
        <fieldset className="min-w-0">
          <legend id={`${id}-format`} className="mb-2 text-sm font-medium">
            {t('formatQuestion')}
          </legend>
          <ChoiceList
            aria-labelledby={`${id}-format`}
            value={format}
            onValueChange={(chosen) => setExportChoices({ format: chosen })}
            options={[
              {
                value: 'html',
                label: t('filter'),
                description: htmlBeside ? t('descriptionBeside') : t('description'),
                start: <FormatMark format="html" />,
              },
              {
                value: 'pptx',
                label: tp('filter'),
                description: tp('export.description'),
                start: <FormatMark format="pptx" />,
              },
            ]}
          />
        </fieldset>
        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={close}>
            {t('cancel')}
          </Button>
          <Button variant="primary" type="submit" data-testid="export-continue">
            {t('continue')}
          </Button>
        </div>
      </form>
    );
  } else if (phase.at === 'choose') {
    body = (
      <form
        className="flex flex-col gap-4"
        onSubmit={(event) => {
          event.preventDefault();
          if (plan.slideIds.length > 0) void runExport(editor);
        }}
      >
        {/* The answer of the step before, as the chat shows what was said. */}
        <p
          data-testid="export-chosen"
          className="flex items-center gap-2.5 rounded-control bg-ui-field px-2.5 py-2"
        >
          <FormatMark format={format} />
          <span className="font-medium">{formatName(format)}</span>
        </p>
        <fieldset className="flex min-w-0 flex-col gap-2">
          <legend id={`${id}-slides`} className="mb-2 text-sm font-medium">
            {t('slides.label')}
          </legend>
          <ChoiceList
            aria-labelledby={`${id}-slides`}
            value={state.ranged ? 'range' : 'all'}
            onValueChange={(mode) => setExportChoices({ ranged: mode === 'range' })}
            options={[
              { value: 'all', label: t('slides.all') },
              { value: 'range', label: t('slides.range') },
            ]}
          />
          {state.ranged && (
            // Enter in a field commits its number, and does not send the form: the export starts
            // from its button, or from Enter on a choice.
            <div
              className="flex items-center gap-2"
              onKeyDown={(event) => {
                if (event.key === 'Enter') event.preventDefault();
              }}
            >
              <span>{t('slides.from')}</span>
              <NumberField
                aria-label={t('slides.from')}
                className="w-16"
                value={state.from}
                min={1}
                max={total}
                onValueChange={(from) => setExportChoices({ from })}
              />
              <span>{t('slides.to')}</span>
              <NumberField
                aria-label={t('slides.to')}
                className="w-16"
                value={state.to}
                min={1}
                max={total}
                onValueChange={(to) => setExportChoices({ to })}
              />
            </div>
          )}
          <p data-testid="export-count" className="text-xs text-ui-fg-muted">
            {plan.slideIds.length === 0
              ? t('slides.none')
              : [
                  counted(t, 'slides.count', plan.slideIds.length),
                  ...(plan.hidden > 0 ? [counted(t, 'slides.hidden', plan.hidden)] : []),
                ].join(' ')}
          </p>
        </fieldset>
        <fieldset className="min-w-0">
          <legend id={`${id}-animations`} className="mb-2 text-sm font-medium">
            {t('animations.label')}
          </legend>
          <ChoiceList
            aria-labelledby={`${id}-animations`}
            value={state.animations ? 'with' : 'without'}
            onValueChange={(mode) => setExportChoices({ animations: mode === 'with' })}
            options={[
              {
                value: 'with',
                label: t('animations.with'),
                description: t('animations.withHint'),
              },
              {
                value: 'without',
                label: t('animations.without'),
                description: t('animations.withoutHint'),
              },
            ]}
          />
        </fieldset>
        {format === 'html' && media.assets.length > 0 && (
          <MediaChoice media={media} beside={beside} />
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            data-testid="export-back"
            onClick={() => setExportPhase({ at: 'choose', step: 'format' })}
          >
            {t('back')}
          </Button>
          <Button
            variant="primary"
            type="submit"
            icon={Share}
            data-testid="export-run"
            disabled={plan.slideIds.length === 0}
          >
            {t('export')}
          </Button>
        </div>
      </form>
    );
  } else if (phase.at === 'working') {
    body = (
      <div role="status" className="flex items-center gap-2 py-2 text-ui-fg-muted">
        <Spinner />
        {format === 'pptx' ? tp('export.working') : t('working')}
      </div>
    );
  } else {
    body = (
      <>
        {phase.at === 'failed' ? (
          <div role="alert" className="flex items-start gap-2">
            <Icon icon={CircleAlert} className="mt-0.5 text-ui-danger-fg" />
            <div className="flex min-w-0 flex-col gap-1">
              <span className="font-medium">
                {phase.step === 'save'
                  ? t('failed.save')
                  : phase.step === 'media'
                    ? t('failed.media')
                    : t('failed.title')}
              </span>
              <span className="break-words text-ui-fg-muted">{phase.message}</span>
            </div>
          </div>
        ) : phase.format === 'pptx' ? (
          <PptxExportReport {...phase} />
        ) : (
          <Report {...phase} />
        )}
        <div className="flex justify-end gap-2">
          <Button
            variant="ghost"
            data-autofocus={phase.at === 'failed' || undefined}
            // A failed export is tried again as it was; another export starts at the format.
            onClick={() =>
              setExportPhase({ at: 'choose', step: phase.at === 'failed' ? 'content' : 'format' })
            }
          >
            {t('again')}
          </Button>
          <Button
            variant={phase.at === 'done' ? 'primary' : 'ghost'}
            data-autofocus={phase.at === 'done' || undefined}
            onClick={close}
          >
            {t('close')}
          </Button>
        </div>
      </>
    );
  }

  return (
    <section
      ref={card}
      tabIndex={-1}
      aria-labelledby={`${id}-title`}
      aria-describedby={`${id}-intro`}
      data-testid="export-card"
      data-format={format}
      data-phase={phase.at}
      data-step={step}
      onKeyDown={(event) => {
        if (event.key !== 'Escape' || phase.at === 'working') return;
        event.stopPropagation();
        close();
      }}
      className="flex flex-col gap-4 rounded-panel border border-ui-line bg-ui-raised p-4 text-sm text-ui-fg outline-none"
    >
      <div className="flex items-start gap-3">
        <span className="flex size-10 shrink-0 items-center justify-center rounded-control bg-ui-accent-soft text-ui-accent-fg">
          <Icon icon={Share} />
        </span>
        <div className="flex min-w-0 flex-1 flex-col gap-0.5 leading-6">
          <p id={`${id}-title`} className="font-semibold">
            {t('title')}
          </p>
          <p id={`${id}-intro`} className="text-ui-fg-muted">
            {t('intro')}
          </p>
        </div>
        {phase.at !== 'working' && (
          <IconButton
            icon={X}
            size="sm"
            label={t('close')}
            data-testid="export-close"
            className="-me-1.5 -mt-1 shrink-0"
            onClick={close}
          />
        )}
      </div>
      {steps}
      {body}
    </section>
  );
}

/**
 * Where the video and audio of the deck go (MED-05, EXP-08): inside the file, which stays one
 * file and grows by all of them, or in a folder beside it. Shown only for a deck that has any.
 * The size is said before the export, with a warning when it is large; media too large for one
 * file can only go beside it.
 */
function MediaChoice({ media, beside }: { media: MediaPlan; beside: boolean }) {
  const { t } = useTranslation('export');
  const id = useId();
  const count = counted(t, 'media.count', media.assets.length);
  const hint = beside
    ? media.tooLarge
      ? t('media.tooLarge', { count, size: ltr(formatBytes(media.bytes)) })
      : t('media.besideHint', { count, size: ltr(formatBytes(media.bytes)) })
    : media.large
      ? t('media.large', { count, size: ltr(formatBytes(media.inFile)) })
      : t('media.insideHint', { count, size: ltr(formatBytes(media.inFile)) });
  const warns = media.tooLarge || (!beside && media.large);
  return (
    <fieldset className="flex min-w-0 flex-col gap-2">
      <legend id={`${id}-media`} className="mb-2 text-sm font-medium">
        {t('media.label')}
      </legend>
      <ChoiceList
        aria-labelledby={`${id}-media`}
        value={beside ? 'beside' : 'inside'}
        onValueChange={(where) => setExportChoices({ mediaBeside: where === 'beside' })}
        options={[
          { value: 'inside', label: t('media.inside'), disabled: media.tooLarge },
          { value: 'beside', label: t('media.beside') },
        ]}
      />
      <p
        data-testid="export-media"
        data-warning={warns}
        role={warns ? 'status' : undefined}
        className="flex items-start gap-2 text-xs text-ui-fg-muted"
      >
        {warns && <Icon icon={TriangleAlert} className="mt-0.5 shrink-0 text-ui-warning-fg" />}
        <span>{hint}</span>
      </p>
    </fieldset>
  );
}

/** What went into the file. */
function Report({
  result,
  destination,
  seconds,
  deck,
}: {
  result: ExportResult;
  destination: Destination;
  seconds: number;
  deck: Deck;
}) {
  const { t } = useTranslation('export');
  const assets = deck.assets;
  const fonts = result.fonts;
  const fontBytes = fonts.reduce((sum, font) => sum + font.bytes, 0);
  const fontOriginal = fonts.reduce((sum, font) => sum + font.originalBytes, 0);
  const where = destination.kind === 'file' ? destination.path : destination.name;
  // Video and audio that are in the folder beside the file are listed apart from what is in it.
  const inFile = result.assets.filter((asset) => asset.file === undefined);
  const besideFile = result.assets.filter((asset) => asset.file !== undefined);
  const nameOf = (id: string) => assets[id]?.name ?? assets[id]?.file ?? id;

  return (
    <div data-testid="export-report" className="flex flex-col gap-4">
      <div className="flex items-start gap-2">
        <Icon icon={CircleCheck} className="mt-0.5 text-ui-success-fg" />
        <div className="flex min-w-0 flex-col gap-0.5">
          <span className="font-medium">
            {destination.kind === 'file' ? t('done.saved') : t('done.downloaded')}
          </span>
          {/* A path reads left to right in every language. */}
          <span dir="ltr" className="truncate text-start text-xs text-ui-fg-muted">
            {where}
          </span>
          <span data-testid="export-summary" className="flex gap-1.5 text-xs text-ui-fg-muted">
            <bdi>{counted(t, 'done.slides', result.slides)}</bdi>·
            <bdi dir="ltr">{formatBytes(result.bytes)}</bdi>·
            <bdi>{t('done.seconds', { n: seconds.toFixed(1) })}</bdi>
          </span>
        </div>
      </div>
      <ScrollArea viewportClassName="max-h-72">
        <div className="flex flex-col gap-4 pe-3">
          {result.warnings.length > 0 && (
            <Field label={t('done.warnings')}>
              <ul data-testid="export-warnings" className="flex flex-col gap-1">
                {result.warnings.map((warning, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <Icon icon={TriangleAlert} className="mt-0.5 text-ui-warning-fg" />
                    <span className="min-w-0 break-words">{warningText(t, warning)}</span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
          {besideFile.length > 0 && result.mediaFolder !== undefined && (
            <Field label={t('done.media')}>
              <span data-testid="export-media-folder">
                {destination.kind === 'file'
                  ? t('done.mediaFolder', { folder: ltr(result.mediaFolder) })
                  : t('done.mediaDownloaded', { folder: ltr(result.mediaFolder) })}
              </span>
              <ul data-testid="export-media-files" className="flex flex-col gap-1">
                {besideFile.map((asset) => (
                  <li key={asset.id} className="flex items-center gap-3">
                    <span className="flex min-w-0 flex-1">
                      <span dir="auto" className="truncate">
                        {nameOf(asset.id)}
                      </span>
                    </span>
                    <span dir="ltr" className="w-16 text-end tabular-nums">
                      {formatBytes(asset.originalBytes)}
                    </span>
                  </li>
                ))}
              </ul>
            </Field>
          )}
          <Field label={t('done.assets')}>
            {inFile.length === 0 ? (
              <span className="text-ui-fg-muted">{t('done.noAssets')}</span>
            ) : (
              <ul data-testid="export-assets" className="flex flex-col gap-1">
                <li className="flex items-center gap-3 text-xs text-ui-fg-muted">
                  <span className="min-w-0 flex-1">{t('done.asset')}</span>
                  <span className="w-16 text-end">{t('done.original')}</span>
                  <span className="w-16 text-end">{t('done.embedded')}</span>
                </li>
                {inFile.map((asset) => (
                  <li key={asset.id} className="flex items-center gap-3">
                    <span className="flex min-w-0 flex-1 items-baseline gap-1.5">
                      <span dir="auto" className="truncate">
                        {nameOf(asset.id)}
                      </span>
                      {asset.width !== undefined && asset.height !== undefined && (
                        <span dir="ltr" className="shrink-0 text-xs text-ui-fg-muted">
                          {asset.width}×{asset.height}
                        </span>
                      )}
                    </span>
                    <span dir="ltr" className="w-16 text-end text-ui-fg-muted tabular-nums">
                      {formatBytes(asset.originalBytes)}
                    </span>
                    <span dir="ltr" className="w-16 text-end tabular-nums">
                      {formatBytes(asset.bytes)}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Field>
          {result.charts.count > 0 && (
            <Field label={t('done.charts')}>
              <span data-testid="export-charts">
                {result.charts.count === 1
                  ? t('done.chartsOne', { size: ltr(formatBytes(result.charts.bytes)) })
                  : t('done.chartsMany', {
                      n: result.charts.count,
                      size: ltr(formatBytes(result.charts.bytes)),
                    })}
              </span>
            </Field>
          )}
          <Field label={t('done.fonts')}>
            {fonts.length === 0 ? (
              <span className="text-ui-fg-muted">{t('done.noFonts')}</span>
            ) : (
              <>
                <span data-testid="export-fonts">
                  {fonts.length === 1
                    ? t('done.fontsOne', {
                        size: ltr(formatBytes(fontBytes)),
                        original: ltr(formatBytes(fontOriginal)),
                      })
                    : t('done.fontsMany', {
                        n: fonts.length,
                        size: ltr(formatBytes(fontBytes)),
                        original: ltr(formatBytes(fontOriginal)),
                      })}
                </span>
                <span className="text-xs text-ui-fg-muted">
                  <bdi dir="ltr">
                    {Array.from(new Set(fonts.map((font) => fontFamilyName(font.family)))).join(
                      ' · ',
                    )}
                  </bdi>
                </span>
              </>
            )}
          </Field>
        </div>
      </ScrollArea>
    </div>
  );
}
