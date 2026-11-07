import type { Deck } from '@slidr/model';
import { FittedSlide } from '@slidr/renderer';
import { cx, Icon, IconButton, Input } from '@slidr/ui';
import { Check, Pencil, RefreshCw, Trash2 } from '@slidr/ui/icons';
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useStore } from 'zustand';
import { useLanguage } from '../i18n';
import { ask, useDeck, useEditor } from '../shell';
import { renameTemplate, updateTemplate } from './actions';
import { library } from './app';
import { useLibraryEntries } from './useLibrary';
import { coverAsset, libraryCover } from './covers';
import type { LibraryEntry } from './library';
import { templateName, templateTagline } from './names';
import { madeOpening, readyOpening, readyPreview, type TemplatePreview } from './previews';
import { useLike } from './PreviewGrid';
import { showTemplateSlides, templateSlides } from './TemplateSlides';
import { useTemplatesIn } from './written';

/*
 * The Templates panel (WG7-T09 and the wiring of T04; THM-04, THM-05, THM-08): the library with
 * the default for new decks, where pressing the picture of a template spreads the slides that
 * show it over the Stage (`./TemplateSlides`). The picture is the opening slide of the
 * template's sample, under it the template's name. The design of the open deck, its colours,
 * fonts and the rest, is in the deck's properties, from the File menu (`./DeckProperties`).
 */

/**
 * The opening slide of a template's sample once it is ready (`readyOpening`); null for a
 * template without one, undefined while it is made.
 */
function useOpening(entry: LibraryEntry, like: Deck): TemplatePreview | null | undefined {
  const [ready, setReady] = useState<{
    entry: LibraryEntry;
    like: Deck;
    opening: TemplatePreview | null;
  }>();
  useEffect(() => {
    let gone = false;
    void readyOpening(entry, like).then((opening) => {
      if (!gone) setReady({ entry, like, opening });
    });
    return () => {
      gone = true;
    };
  }, [entry, like]);
  return ready?.entry === entry && ready.like === like ? ready.opening : madeOpening(entry, like);
}

/**
 * Where a clause of a sentence ends, in the scripts of the app's languages: a comma (Arabic,
 * Chinese and Japanese ones too), a colon, a semicolon, a full stop, a dash between words.
 */
const CLAUSE_END = /[,،、，:：;；。]|\.(?=\s)|\s[–—](?=\s)/gu;

/**
 * The fewest words the start of a sentence is shown with alone: "A globe", the first of a list
 * ("A globe, routes and postage stamps"), says nothing by itself.
 */
const FEWEST_WORDS = 3;

const words = new Intl.Segmenter(undefined, { granularity: 'word' });
const wordsIn = (text: string) => [...words.segment(text)].filter((s) => s.isWordLike).length;

let measuring: CanvasRenderingContext2D | null | undefined;

/**
 * The sentence that says what a template feels like, on one line: as much of it as the line
 * holds, up to where one of its clauses ends, so that what is shown is whole and does not stop
 * in the middle of a phrase. A sentence with no such end that fits ends in an ellipsis.
 */
function Tagline({ text }: { text: string }) {
  const ref = useRef<HTMLSpanElement>(null);
  const [shown, setShown] = useState(text);
  useLayoutEffect(() => {
    const element = ref.current;
    if (!element) return;
    // The sentence up to the end of each clause, shortest first, and the whole of it last.
    const ends = [...text.matchAll(CLAUSE_END)].map((end) => text.slice(0, end.index).trimEnd());
    const choices = [...ends.filter((end) => wordsIn(end) >= FEWEST_WORDS), text];
    let live = true;
    const fit = () => {
      const width = element.getBoundingClientRect().width;
      measuring ??= document.createElement('canvas').getContext('2d');
      // A panel drawn ahead is hidden and not laid out: it is fitted once it is shown.
      if (!live || width === 0 || !measuring) return;
      const style = getComputedStyle(element);
      measuring.font = `${style.fontStyle} ${style.fontWeight} ${style.fontSize} ${style.fontFamily}`;
      let fitting = choices[0]!;
      for (const choice of choices)
        if (measuring.measureText(choice).width <= width) fitting = choice;
      setShown(fitting);
    };
    fit();
    const observer = new ResizeObserver(fit);
    observer.observe(element);
    void document.fonts.ready.then(fit);
    return () => {
      live = false;
      observer.disconnect();
    };
  }, [text]);
  return (
    <span ref={ref} title={text} className="min-w-0 flex-1 truncate text-xs text-ui-fg-muted">
      {shown}
    </span>
  );
}

function TemplateCard({
  entry,
  current,
  open,
  onToggle,
}: {
  entry: LibraryEntry;
  current: boolean;
  /** The slides that show the template are spread over the Stage. */
  open: boolean;
  onToggle: () => void;
}) {
  const { t, i18n } = useTranslation('templates');
  const editor = useEditor();
  // The cover is in the UI language and its direction, whatever the open deck is in, and an edit
  // of the deck does not draw the cards again.
  const like = useLike();
  const { template, personal } = entry;
  const { theme } = template;
  const [busy, setBusy] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const name = templateName(theme, i18n.language);
  const tagline = templateTagline(theme, i18n.language);
  const cover = libraryCover(template, like);
  const opening = useOpening(entry, like);
  // The same picture while the slide on it stays: a card drawn again for its ring or its mark
  // does not draw its slide again. It fits the card by itself, so it is drawn with the panel
  // ahead of time; its photograph is decoded with it, so the card does not appear first without
  // it. The cover, with the template's name on it, while there is no opening to show.
  const picture = useMemo(
    () => (
      <span aria-hidden className="block">
        <FittedSlide
          deck={opening ? opening.deck : cover.deck}
          slide={opening ? opening.deck.slides[0]! : cover.slide}
          mode="thumbnail"
          resolveAsset={opening ? opening.resolveAsset : coverAsset}
          decoding="sync"
        />
      </span>
    ),
    [cover, opening],
  );

  const remove = async () => {
    const answer = await ask({
      title: t('panel.removeTitle', { name: theme.name }),
      body: t('panel.removeBody'),
      actions: [
        { id: 'cancel', label: t('panel.cancel'), variant: 'ghost' },
        { id: 'remove', label: t('panel.removeConfirm'), variant: 'danger' },
      ],
      cancelId: 'cancel',
    });
    if (answer === 'remove') await library.remove(theme.id);
  };
  const rename = async (name: string) => {
    setRenaming(false);
    await renameTemplate(library, theme.id, name);
  };
  const update = async () => {
    const answer = await ask({
      title: t('panel.updateTitle', { name: theme.name }),
      body: t('panel.updateBody'),
      actions: [
        { id: 'cancel', label: t('panel.cancel'), variant: 'ghost' },
        { id: 'update', label: t('panel.updateConfirm'), variant: 'primary' },
      ],
      cancelId: 'cancel',
    });
    if (answer !== 'update') return;
    setBusy(true);
    try {
      await updateTemplate(editor, library, theme.id, t('undo.save'));
    } finally {
      setBusy(false);
    }
  };

  return (
    <article
      data-template={theme.id}
      data-current={current || undefined}
      className="flex min-w-0 flex-col gap-1"
    >
      {/* A picture of the cover, which opens the slides that show the template, where it is
          applied. A screen reader is told what the button does, not the words of the picture. */}
      <button
        type="button"
        aria-expanded={open}
        aria-label={t('panel.preview', { name })}
        data-testid="template-cover"
        // The slides it opens are made while it is pointed at, so they are there when it is pressed.
        onPointerEnter={() => void readyPreview(entry, like)}
        onFocus={() => void readyPreview(entry, like)}
        onClick={onToggle}
        className={cx(
          'relative block cursor-default overflow-hidden rounded-inset shadow-slide transition-shadow hover:shadow-raised',
          (open || current) && 'ring-2 ring-ui-accent',
        )}
      >
        {current && (
          // The template of the open deck.
          <span
            aria-hidden
            className="absolute end-1.5 top-1.5 z-10 flex size-5 items-center justify-center rounded-full bg-ui-accent text-ui-on-accent"
          >
            <Icon icon={Check} />
          </span>
        )}
        {picture}
      </button>
      {renaming ? (
        <Input
          aria-label={t('panel.renameField')}
          defaultValue={theme.name}
          dir="auto"
          autoFocus
          onBlur={(event) => void rename(event.target.value)}
          onKeyDown={(event) => {
            if (event.key === 'Enter') event.currentTarget.blur();
            if (event.key === 'Escape') setRenaming(false);
          }}
        />
      ) : (
        <div className="flex min-w-0 items-center gap-2 px-0.5">
          {/* The template's name, and the sentence that says what a built-in one feels like. */}
          <div className="flex min-w-0 flex-1 items-baseline gap-1.5">
            <span dir="auto" className="max-w-full shrink-0 truncate text-sm font-semibold">
              {name}
            </span>
            {tagline && <Tagline text={tagline} />}
          </div>
          {personal && (
            // A personal template is the user's own: its name, what it holds, and whether it stays.
            <div className="flex shrink-0 items-center gap-1" data-testid="template-actions">
              <IconButton
                icon={Pencil}
                size="sm"
                label={t('panel.rename')}
                onClick={() => setRenaming(true)}
              />
              <IconButton
                icon={RefreshCw}
                size="sm"
                label={t('panel.update')}
                disabled={busy}
                onClick={() => void update()}
              />
              <IconButton
                icon={Trash2}
                size="sm"
                label={t('panel.remove')}
                onClick={() => void remove()}
              />
            </div>
          )}
        </div>
      )}
    </article>
  );
}

function Library() {
  const { t } = useTranslation('templates');
  const loaded = useStore(library.state, (s) => s.loaded);
  const themeId = useDeck((s) => s.deck.theme.id);
  /** The template whose slides are spread over the Stage, by id. */
  const open = useStore(templateSlides, (s) => s.id);
  // The slides are opened from here: they do not stay when the panel is gone.
  useEffect(() => () => showTemplateSlides(null), []);
  const all = useLibraryEntries();
  // Only the templates written in the UI language. The slides of one the language was switched
  // away from, spread as it was switched, are closed.
  const { entries, pending } = useTemplatesIn(all, useLanguage());
  const gone = open !== null && !pending && !entries.some((e) => e.template.theme.id === open);
  useEffect(() => {
    if (gone) showTemplateSlides(null);
  }, [gone]);
  // The library is all the panel holds, so it has no heading of its own: the panel's title names it.
  return (
    <div className="flex flex-col gap-3">
      {/* One card to a row, as wide as the panel: the opening slide on it can be read. */}
      <div className="grid grid-cols-1 gap-4" data-testid="template-library">
        {entries.map((entry) => {
          const { id } = entry.template.theme;
          return (
            <TemplateCard
              key={id}
              entry={entry}
              current={id === themeId}
              open={id === open}
              onToggle={() => showTemplateSlides(id === open ? null : id)}
            />
          );
        })}
      </div>
      {!loaded && <p className="text-xs text-ui-fg-muted">{t('panel.loading')}</p>}
    </div>
  );
}

export function TemplatesPanel() {
  return (
    <div className="@container flex flex-col gap-6 px-4 pt-3 pb-6" data-testid="templates-panel">
      <Library />
    </div>
  );
}
