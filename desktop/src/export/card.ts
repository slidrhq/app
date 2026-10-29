import type { ExportResult } from '@slidr/html-export';
import type { Deck } from '@slidr/model';
import type { PptxExportResult } from '@slidr/pptx';
import { createStore } from 'zustand/vanilla';
import { i18n } from '../i18n';
import { exportPptxTo } from '../pptx/exportPptx';
import { openPanel, PanelId, type Editor } from '../shell';
import {
  chooseDestination,
  exportFileName,
  exportTo,
  planExport,
  planMedia,
  type Destination,
  type ExportChoices,
} from './exportDeck';

/*
 * The export card of the AI chat (ADR-123): what it asks, what it has been told, and where the
 * export is, kept outside the component. The chat is drawn anew whenever its panel shows
 * something else for a moment, and an export that runs meanwhile still ends in its report.
 */

export type ExportFormat = 'html' | 'pptx';

/** The questions of the card, one after the other: the format, then what goes into the file. */
export type ExportStep = 'format' | 'content';

export type ExportPhase =
  | { at: 'choose'; step: ExportStep }
  | { at: 'working' }
  | {
      at: 'done';
      format: 'html';
      result: ExportResult;
      destination: Destination;
      seconds: number;
      /** The deck as it was exported: the report names its assets. */
      deck: Deck;
    }
  | {
      at: 'done';
      format: 'pptx';
      result: PptxExportResult;
      destination: Destination;
      seconds: number;
    }
  | { at: 'failed'; step: 'export' | 'media' | 'save'; message: string };

export interface ExportCardState {
  open: boolean;
  /** Counts the times the card was asked for: each brings it into view, the keyboard on it. */
  asked: number;
  /** The format of the last export stays, and the next one is offered in it. */
  format: ExportFormat;
  ranged: boolean;
  from: number;
  to: number;
  animations: boolean;
  /** Video and audio in a folder beside the HTML file rather than inside it (ADR-057). */
  mediaBeside: boolean;
  phase: ExportPhase;
}

/** The questions as they are when the card starts on an export. */
const fresh = (total: number) =>
  ({
    ranged: false,
    from: 1,
    to: Math.max(total, 1),
    animations: true,
    mediaBeside: false,
    phase: { at: 'choose', step: 'format' },
  }) satisfies Partial<ExportCardState>;

export const exportCard = createStore<ExportCardState>(() => ({
  open: false,
  asked: 0,
  format: 'html',
  ...fresh(1),
}));

export function setExportChoices(
  choices: Partial<Omit<ExportCardState, 'open' | 'asked' | 'phase'>>,
): void {
  exportCard.setState(choices);
}

export function setExportPhase(phase: ExportPhase): void {
  exportCard.setState({ phase });
}

/**
 * "Export…" of the File menu: the card in the AI chat, which the panel opens to. An export being
 * chosen or running goes on where it is; one that ended starts again, in the same format.
 */
export function showExportCard(editor: Editor): void {
  const now = exportCard.getState();
  const again = !now.open || now.phase.at === 'done' || now.phase.at === 'failed';
  exportCard.setState({
    open: true,
    asked: now.asked + 1,
    ...(again ? fresh(editor.bus.deck.slides.length) : {}),
  });
  openPanel(PanelId.ai);
}

/** Puts the card away, unless its export is running: the file is still being written. */
export function closeExportCard(): void {
  if (exportCard.getState().phase.at === 'working') return;
  exportCard.setState({ open: false });
}

/** What the card's choices make of a deck: the slides, the media, and how the file is made. */
export function exportPlan(deck: Deck, state: ExportCardState) {
  const range = state.ranged ? { from: state.from, to: state.to } : null;
  const plan = planExport(deck, range);
  // The video and audio of the slides that will be exported, and what they weigh (MED-05).
  // Where they go is HTML's choice: a PowerPoint file has them inside.
  const media = planMedia(deck, plan.slideIds);
  const beside =
    state.format === 'html' && media.assets.length > 0 && (state.mediaBeside || media.tooLarge);
  const choices: ExportChoices = {
    range,
    animations: state.animations,
    media: beside ? 'beside' : 'inside',
  };
  return { plan, media, beside, choices };
}

/**
 * The export the card was told: the deck as it is now, the file the save dialog names, and the
 * report or the failure. A cancelled save dialog leaves the questions as they were.
 */
export async function runExport(editor: Editor): Promise<void> {
  const state = exportCard.getState();
  if (state.phase.at !== 'choose') return;
  const deck = editor.bus.deck;
  const { format } = state;
  const { plan, choices } = exportPlan(deck, state);
  if (plan.slideIds.length === 0) return;
  const name = exportFileName(
    editor.file.getState().path,
    deck.meta.title,
    i18n.t('app.untitled', { ns: 'shell' }),
    format,
  );
  const filter =
    format === 'pptx' ? i18n.t('filter', { ns: 'pptx' }) : i18n.t('filter', { ns: 'export' });
  const destination = await chooseDestination(name, filter, format);
  if (!destination) return;
  setExportPhase({ at: 'working' });
  if (format === 'pptx') {
    const outcome = await exportPptxTo(editor, deck, choices, destination);
    setExportPhase(
      outcome.ok
        ? { at: 'done', format, ...outcome }
        : { at: 'failed', step: outcome.step, message: outcome.message },
    );
    return;
  }
  const outcome = await exportTo(editor, deck, choices, destination);
  setExportPhase(
    outcome.ok
      ? { at: 'done', format, deck, ...outcome }
      : { at: 'failed', step: outcome.step, message: outcome.message },
  );
}
