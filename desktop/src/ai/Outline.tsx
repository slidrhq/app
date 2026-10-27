import { useEffect, useMemo, useRef, type KeyboardEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { Archetype } from '@slidr/model';
import type { OutlineSlide } from '@slidr/prompts';
import { Button, Icon, IconButton, Input } from '@slidr/ui';
import {
  ArrowDown,
  ArrowUp,
  Check,
  ListOrdered,
  Pencil,
  Plus,
  RotateCcw,
  Trash2,
} from '@slidr/ui/icons';
import type { ChatThread } from '../agent/agentService';
import type { ToolPart } from '../agent/transcript';
import { currentLanguage, englishName } from '../i18n';
import { actionLabel } from './actionLabels';
import { useKept } from './kept';
import {
  added,
  approval,
  approvedAfter,
  draftOf,
  isEdited,
  moved,
  outlineOf,
  removed,
  retitled,
  slidesOf,
  type DraftSlide,
} from './outlineDraft';

/*
 * The outline of a deck before it is built (AID-03, WG11-T05). The agent shows it with
 * `outline_propose` and ends its turn; the chat draws the call as a card, and at the end of the
 * latest turn, after whatever the agent said about it, puts the answers that need no typing.
 * While the card waits, the user can make the outline their own in it: reword a title, move a
 * slide, take one out, add one. Approving sends a message that carries the outline as the card
 * holds it, and the deck is built in the turn that answers it. Turning it down sends nothing: the
 * deck and the conversation stay as they are, and the user may still type what they want instead.
 */

/**
 * What the card and its answer share, kept by the call for as long as the window is open: what
 * the user made of the outline, whether the card is being edited, and whether it was turned down.
 * The chat is drawn anew whenever its panel shows something else for a moment, and none of it is
 * lost with it.
 */
function useOutline(part: ToolPart, entryId: string) {
  const key = `outline:${entryId}:${part.id}`;
  const proposed = useMemo(() => outlineOf(part.input), [part.input]);
  const initial = useMemo(() => draftOf(proposed.slides), [proposed]);
  const [draft, setDraft] = useKept<DraftSlide[]>(`${key}:draft`, initial);
  const [editing, setEditing] = useKept(`${key}:editing`, false);
  const [rejected, setRejected] = useKept(`${key}:rejected`, false);
  return {
    proposed,
    draft,
    setDraft,
    editing,
    setEditing,
    rejected,
    setRejected,
    edited: isEdited(draft, proposed.slides),
    toBuild: slidesOf(draft),
  };
}

/** A control of a row, for the keyboard to stay on after the row moved or went. */
type Control = 'title' | 'up' | 'down' | 'remove';

export function OutlineCard({
  part,
  entryId,
  thread,
  open,
}: {
  part: ToolPart;
  /** The entry the call belongs to: what the outline is remembered by. */
  entryId: string;
  thread: ChatThread;
  /** The outline waits for an answer: it is the last thing in the chat, and no turn runs. */
  open: boolean;
}) {
  const { t } = useTranslation(['ai', 'templates']);
  const { proposed, draft, setDraft, editing, setEditing, rejected, edited, toBuild } = useOutline(
    part,
    entryId,
  );
  const entries = useStore(thread.store, (state) => state.entries);
  const approved = useMemo(() => approvedAfter(entries, entryId), [entries, entryId]);
  const waiting = open && !rejected;
  const kind = (archetype: string | undefined) =>
    archetype && Archetype.safeParse(archetype).success
      ? t(`templates:archetype.${archetype as Archetype}`)
      : (archetype ?? '');
  const about = (slide: OutlineSlide) =>
    [kind(slide.archetype), slide.note].filter(Boolean).join(' · ');

  const list = useRef<HTMLOListElement>(null);
  /** Where the keyboard goes once the rows are drawn again: a row that moves is another node. */
  const focusNext = useRef<{ row: number; control: Control } | null>(null);
  useEffect(() => {
    const next = focusNext.current;
    if (!next) return;
    focusNext.current = null;
    list.current
      ?.querySelector<HTMLElement>(`[data-row="${next.row}"] [data-control="${next.control}"]`)
      ?.focus();
  });

  const move = (index: number, by: -1 | 1, from: Control) => {
    const to = index + by;
    if (to < 0 || to >= draft.length) return;
    // The button that reached an end is off there: the keyboard takes the one that still moves.
    const atEnd = to === 0 || to === draft.length - 1;
    const control = from !== 'title' && atEnd ? (by < 0 ? 'down' : 'up') : from;
    focusNext.current = { row: draft[index]!.key, control };
    setDraft(moved(draft, index, by));
  };
  const remove = (index: number) => {
    const neighbour = draft[index + 1] ?? draft[index - 1];
    if (neighbour) focusNext.current = { row: neighbour.key, control: 'remove' };
    setDraft(removed(draft, index));
  };
  const add = () => {
    const next = added(draft);
    focusNext.current = { row: next.at(-1)!.key, control: 'title' };
    setDraft(next);
  };
  const onTitleKey = (event: KeyboardEvent<HTMLInputElement>, index: number) => {
    // Alt with an arrow moves the slide, as it moves a step in the list of animations.
    if (!event.altKey || (event.key !== 'ArrowUp' && event.key !== 'ArrowDown')) return;
    event.preventDefault();
    move(index, event.key === 'ArrowUp' ? -1 : 1, 'title');
  };

  // While it waits, the card shows what the user made of the outline; once it is answered, what
  // was approved, which the approval itself holds.
  const shown = waiting ? toBuild : (approved ?? proposed.slides);
  const rows = waiting && editing ? draft : null;

  return (
    <section
      aria-label={t('ai:outline.title')}
      data-testid="outline"
      data-state={rejected ? 'rejected' : open ? 'open' : 'answered'}
      data-edited={(waiting && edited) || undefined}
      className="flex flex-col gap-2 rounded-panel border border-ui-line p-3"
    >
      <div className="flex items-start gap-2">
        <Icon icon={ListOrdered} className="mt-0.5 text-ui-fg-muted" />
        <div className="flex min-w-0 flex-col">
          <p dir="auto" className="text-start text-sm font-medium text-ui-fg">
            {proposed.title ?? t('ai:outline.title')}
          </p>
          <p className="text-xs text-ui-fg-muted">
            {t('ai:outline.count', { count: shown.length })}
          </p>
        </div>
        {/* Editing is about what the card holds, so it is the card's: the answer is the turn's. */}
        {waiting && (
          <Button
            variant="ghost"
            size="sm"
            icon={editing ? Check : Pencil}
            aria-pressed={editing}
            data-testid="outline-edit"
            className="-me-1.5 -mt-1 ms-auto shrink-0"
            onClick={() => setEditing(!editing)}
          >
            {editing ? t('ai:outline.done') : t('ai:outline.edit')}
          </Button>
        )}
      </div>
      {rows ? (
        <ol ref={list} className="flex flex-col gap-2">
          {rows.map((slide, index) => (
            <li
              key={slide.key}
              data-testid="outline-slide"
              data-row={slide.key}
              className="flex items-start gap-1.5"
            >
              <span className="flex h-control w-5 shrink-0 items-center justify-end text-xs text-ui-fg-muted">
                {index + 1}
              </span>
              <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                <Input
                  dir="auto"
                  value={slide.title}
                  aria-label={t('ai:outline.slideTitle', { n: index + 1 })}
                  placeholder={t('ai:outline.newTitle')}
                  data-control="title"
                  data-testid="outline-title"
                  onChange={(event) => setDraft(retitled(draft, index, event.target.value))}
                  onKeyDown={(event) => onTitleKey(event, index)}
                />
                {about(slide) && (
                  <span dir="auto" className="px-0.5 text-start text-xs text-ui-fg-muted">
                    {about(slide)}
                  </span>
                )}
              </div>
              <div className="flex h-control shrink-0 items-center">
                <IconButton
                  icon={ArrowUp}
                  size="sm"
                  label={t('ai:outline.up', { n: index + 1 })}
                  disabled={index === 0}
                  data-control="up"
                  data-testid="outline-up"
                  onClick={() => move(index, -1, 'up')}
                />
                <IconButton
                  icon={ArrowDown}
                  size="sm"
                  label={t('ai:outline.down', { n: index + 1 })}
                  disabled={index === rows.length - 1}
                  data-control="down"
                  data-testid="outline-down"
                  onClick={() => move(index, 1, 'down')}
                />
                <IconButton
                  icon={Trash2}
                  size="sm"
                  label={t('ai:outline.remove', { n: index + 1 })}
                  data-control="remove"
                  data-testid="outline-remove"
                  onClick={() => remove(index)}
                />
              </div>
            </li>
          ))}
        </ol>
      ) : (
        <ol className="flex flex-col gap-1.5">
          {shown.map((slide, index) => (
            <li key={index} data-testid="outline-slide" className="flex items-baseline gap-2">
              <span className="w-5 shrink-0 text-end text-xs text-ui-fg-muted">{index + 1}</span>
              <div className="flex min-w-0 flex-1 flex-col">
                <span dir="auto" className="text-start text-sm text-ui-fg">
                  {slide.title}
                </span>
                <span dir="auto" className="text-start text-xs text-ui-fg-muted">
                  {about(slide)}
                </span>
              </div>
            </li>
          ))}
        </ol>
      )}
      {rows && (
        <div className="flex flex-wrap items-center gap-1">
          <Button variant="ghost" size="sm" icon={Plus} data-testid="outline-add" onClick={add}>
            {t('ai:outline.add')}
          </Button>
          {edited && (
            <Button
              variant="ghost"
              size="sm"
              icon={RotateCcw}
              data-testid="outline-reset"
              onClick={() => setDraft(draftOf(proposed.slides))}
            >
              {t('ai:outline.reset')}
            </Button>
          )}
        </div>
      )}
    </section>
  );
}

/**
 * The answers to an outline that need no typing, at the end of its turn: after the card, and
 * after what the agent said about it, which is where the question is asked. Once it was turned
 * down, the place says so.
 */
export function OutlineAnswer({
  part,
  entryId,
  thread,
  open,
}: {
  part: ToolPart;
  entryId: string;
  thread: ChatThread;
  /** The outline waits for an answer: it is the last thing in the chat, and no turn runs. */
  open: boolean;
}) {
  const { t } = useTranslation('ai');
  const { edited, toBuild, rejected, setRejected } = useOutline(part, entryId);

  if (rejected) {
    return (
      <p role="status" data-testid="outline-answer" className="text-xs text-ui-fg-muted">
        {t('outline.rejected')}
      </p>
    );
  }
  if (!open) return null;

  const approve = () => {
    if (toBuild.length === 0) return;
    const { message, action } = approval(toBuild, edited, englishName(currentLanguage()));
    void thread.send(message, { action, label: actionLabel(t, action) });
  };

  return (
    <div
      role="group"
      aria-label={t('outline.title')}
      data-testid="outline-answer"
      className="flex flex-col gap-1.5"
    >
      {(edited || toBuild.length === 0) && (
        <p role="status" data-testid="outline-edited" className="text-xs text-ui-fg">
          {toBuild.length === 0 ? t('outline.empty') : t('outline.edited')}
        </p>
      )}
      <div className="flex flex-wrap items-center gap-2">
        <Button
          variant="primary"
          size="sm"
          disabled={toBuild.length === 0}
          data-testid="outline-approve"
          onClick={approve}
        >
          {t('outline.approve')}
        </Button>
        <Button
          variant="ghost"
          size="sm"
          data-testid="outline-reject"
          onClick={() => setRejected(true)}
        >
          {t('outline.reject')}
        </Button>
      </div>
      <p className="text-xs text-ui-fg-muted">{t('outline.hint')}</p>
    </div>
  );
}
