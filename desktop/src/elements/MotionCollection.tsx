import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import { createSlide, type Background, type Deck, type Slide } from '@slidr/model';
import { FittedSlide, STILL_AT } from '@slidr/renderer';
import { cx, Input, Tooltip } from '@slidr/ui';
import { Play, Search } from '@slidr/ui/icons';
import { searchTags } from '../media/icons/library';
import {
  searchIcons,
  withTags,
  wordsOf,
  type SearchWords,
  type Tags,
  type TagsOf,
} from '../media/icons/search';
import { tell, useDeck, useEditor, useSelection } from '../shell';
import { useMediaCatalog } from '../shell/useMedia';
import { NothingFound, Section, useLoaded } from './collections';
import { applyMotionBackground, insertMotion, insertMotionShape } from './insert';
import { backgroundSlide, pieceSlide, shapeSlide, shownMotionBackground } from './motion';
import { backgroundCatalog, motionBackgrounds, type MotionBackground } from './motionBackgrounds';
import {
  animationCatalog,
  MOTION_GROUPS,
  motionName,
  motionPieces,
  motionShapes,
  type MotionPiece,
} from './motionPieces';
import type { MotionShape } from './motionShapes';

/*
 * The animations and the backgrounds of Elements (ADR-127), as the media library has them
 * (ADR-138). Each tile is a small slide drawn by the renderer in the deck's own theme: the
 * animation on the slide's ground, or the slide's ground under the background's drawing, as a
 * click would leave it. A tile is still, at a moment that shows what it is, and moves while the
 * pointer or the keyboard is on it.
 */

/** The filter a background's tile draws its picture through (`strengthen`). */
const STRONGER = 'slidr-tile-stronger';

/**
 * A background's drawing made easier to see in its tile: its lines a few slide pixels wider and
 * its faint parts stronger. At a twelfth of the slide's size a line of two pixels is a fifth of
 * one, and the drawings of several backgrounds came out as the same empty tile. The slide itself
 * is drawn as it is.
 */
function strengthen(picture: SVGSVGElement) {
  if (picture.querySelector(`#${STRONGER}`)) return;
  const filter = document.createElementNS(SVG, 'filter');
  filter.id = STRONGER;
  filter.setAttribute('color-interpolation-filters', 'sRGB');
  const wider = document.createElementNS(SVG, 'feMorphology');
  wider.setAttribute('operator', 'dilate');
  wider.setAttribute('radius', '5');
  const transfer = document.createElementNS(SVG, 'feComponentTransfer');
  const alpha = document.createElementNS(SVG, 'feFuncA');
  // Faint parts gain the most: a power below one lifts low alphas and leaves high ones be.
  alpha.setAttribute('type', 'gamma');
  alpha.setAttribute('amplitude', '1');
  alpha.setAttribute('exponent', '.55');
  transfer.append(alpha);
  filter.append(wider, transfer);
  picture.prepend(filter);
  picture.style.filter = `url(#${STRONGER})`;
}

const SVG = 'http://www.w3.org/2000/svg';

/**
 * Plays the pictures drawn inside `box` while `playing`, and otherwise holds them at `STILL_AT`:
 * their CSS animations and their SMIL timeline both. Whoever asked the system for less motion
 * gets the still one only. With `stronger` the pictures are drawn easier to see (`strengthen`).
 */
function useMotionTile(playing: boolean, drawn: unknown, stronger: boolean) {
  const box = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const el = box.current;
    if (!el) return;
    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const play = playing && !still;
    const apply = () => {
      // What moves on the slide itself: the motion an element repeats (ADR-128), held where it
      // starts, at rest: a blinking dot at its brightest, a floating one in its place.
      for (const animation of el.getAnimations({ subtree: true })) {
        if (play) animation.play();
        else {
          animation.pause();
          animation.currentTime = 0;
        }
      }
      for (const host of Array.from(el.querySelectorAll('[data-slidr-svg]'))) {
        const root = host.shadowRoot;
        if (!root) continue;
        for (const animation of root.getAnimations()) {
          if (play) animation.play();
          else {
            animation.pause();
            animation.currentTime = STILL_AT * 1000;
          }
        }
        const picture = root.querySelector('svg');
        if (!(picture instanceof SVGSVGElement)) continue;
        if (stronger) strengthen(picture);
        if (play) picture.unpauseAnimations();
        else {
          picture.pauseAnimations();
          picture.setCurrentTime(STILL_AT);
        }
      }
    };
    apply();
    // The renderer may still be putting the pictures in place in this frame.
    const frame = requestAnimationFrame(apply);
    return () => cancelAnimationFrame(frame);
  }, [playing, drawn, stronger]);
  return box;
}

/** A deck of one slide in the open deck's theme, language and direction, for a tile to draw. */
function useTileDeck(): (slide: Slide) => Deck {
  const { bus } = useEditor();
  const theme = useDeck((s) => s.deck.theme);
  const lang = useDeck((s) => s.deck.meta.lang);
  const dir = useDeck((s) => s.deck.meta.dir);
  // Not the deck itself, whose identity changes with every edit: a tile needs only these.
  return useMemo(() => {
    const deck = bus.deck;
    const meta = { ...deck.meta, lang, dir };
    return (slide: Slide) => ({ ...deck, theme, meta, layouts: [], slides: [slide], assets: {} });
  }, [bus, theme, lang, dir]);
}

function MotionTile({
  label,
  deck,
  slide,
  pressed,
  animated = true,
  stronger = false,
  onClick,
  data,
}: {
  label: string;
  deck: Deck;
  slide: Slide;
  pressed?: boolean;
  animated?: boolean;
  /** A drawing of the whole slide, which its tile draws easier to see (`strengthen`). */
  stronger?: boolean;
  onClick: () => void;
  data: Record<`data-${string}`, string>;
}) {
  const [playing, setPlaying] = useState(false);
  const box = useMotionTile(playing, slide, stronger);
  return (
    <Tooltip content={label}>
      <button
        type="button"
        aria-label={label}
        aria-pressed={pressed}
        onClick={onClick}
        onPointerEnter={() => setPlaying(true)}
        onPointerLeave={() => setPlaying(false)}
        onFocus={() => setPlaying(true)}
        onBlur={() => setPlaying(false)}
        className="group flex min-w-0 cursor-default flex-col gap-1 rounded-control p-1 text-start transition-colors hover:bg-ui-hover active:bg-ui-pressed focus-visible:-outline-offset-2"
        {...data}
      >
        <span
          className={cx(
            'relative block w-full overflow-hidden rounded-small border border-ui-line transition-shadow group-hover:shadow-floating',
            pressed && 'outline-2 outline-offset-1 outline-ui-accent',
          )}
        >
          <div ref={box} aria-hidden>
            <FittedSlide deck={deck} slide={slide} mode="thumbnail" />
          </div>
          {animated && (
            <span className="absolute end-1 bottom-1 flex size-5 items-center justify-center rounded-full bg-ui-panel/85 text-ui-fg-muted shadow-sm transition-opacity group-hover:opacity-0 [&>svg]:size-3">
              <Play aria-hidden fill="currentColor" />
            </span>
          )}
        </span>
        <span className="truncate px-0.5 text-xs text-ui-fg-muted group-hover:text-ui-fg">
          {label}
        </span>
      </button>
    </Tooltip>
  );
}

function TileGrid({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      role="group"
      aria-label={label}
      className="grid grid-cols-2 gap-x-1 gap-y-1.5 @md:grid-cols-3"
    >
      {children}
    </div>
  );
}

/* ---------------------------------------------------------------- animations */

export function MotionGrid({ pieces }: { pieces: readonly MotionPiece[] }) {
  const { t, i18n } = useTranslation('elements');
  const editor = useEditor();
  const tileDeck = useTileDeck();
  const tiles = useMemo(() => {
    const deck = tileDeck(createSlide());
    return pieces.map((piece) => {
      const slide = pieceSlide(piece, deck);
      return { piece, slide, deck: tileDeck(slide) };
    });
  }, [pieces, tileDeck]);
  return (
    <TileGrid label={t('collection.animations')}>
      {tiles.map(({ piece, slide, deck }) => (
        <MotionTile
          key={piece.id}
          label={motionName(piece, i18n.language)}
          deck={deck}
          slide={slide}
          data={{ 'data-animation': piece.id }}
          onClick={() => {
            if (!insertMotion(editor, piece)) void tell(t('noSlide', { ns: 'media' }));
          }}
        />
      ))}
    </TileGrid>
  );
}

export function MotionShapeGrid({ shapes }: { shapes: readonly MotionShape[] }) {
  const { t, i18n } = useTranslation('elements');
  const editor = useEditor();
  const tileDeck = useTileDeck();
  const tiles = useMemo(() => {
    const deck = tileDeck(createSlide());
    return shapes.map((shape) => {
      const slide = shapeSlide(shape, deck);
      return { shape, slide, deck: tileDeck(slide) };
    });
  }, [shapes, tileDeck]);
  return (
    <TileGrid label={t('animatedShapes.title')}>
      {tiles.map(({ shape, slide, deck }) => (
        <MotionTile
          key={shape.id}
          label={motionName(shape, i18n.language)}
          deck={deck}
          slide={slide}
          data={{ 'data-motion-shape': shape.id }}
          onClick={() => {
            if (!insertMotionShape(editor, shape)) void tell(t('noSlide', { ns: 'media' }));
          }}
        />
      ))}
    </TileGrid>
  );
}

/**
 * What a collection of the library's shows while its catalog is on its way, and when the library
 * gave none: the catalog is read from the media library, and without it there is nothing to offer.
 */
function NotFromLibrary({ ready, testId }: { ready: boolean; testId: string }) {
  const { t } = useTranslation('elements');
  // On its way from the library: shown the moment it comes.
  if (!ready) return <div className="py-8" data-testid={testId} aria-busy />;
  return (
    <p className="py-8 text-center text-sm text-ui-fg-muted" data-testid={testId}>
      {t('loadFailed')}
    </p>
  );
}

/** Every animation by how it moves, and a search over their names. */
export function AnimationsCollection() {
  const { t } = useTranslation('elements');
  const [query, setQuery] = useState('');
  const index = useMotionIndex();
  const { pieces, shapes } = useMediaCatalog(animationCatalog);
  const found = useMemo(() => {
    if (!query.trim()) return undefined;
    const { pieces: foundPieces, shapes: foundShapes } = foundMotions(
      searchMotion(index, query, pieces.length + shapes.length).filter(
        (entry) => entry.kind !== 'background',
      ),
    );
    return { pieces: foundPieces, shapes: foundShapes };
  }, [index, pieces, shapes, query]);
  if (pieces.length + shapes.length === 0) {
    return <NotFromLibrary ready={animationCatalog.ready} testId="elements-animations" />;
  }
  return (
    <>
      <Input
        icon={Search}
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={t('animations.searchPlaceholder')}
        aria-label={t('animations.search')}
        data-testid="animations-query"
      />
      <p className="text-xs text-ui-fg-muted">{t('animations.hint')}</p>
      {found ? (
        found.pieces.length + found.shapes.length === 0 ? (
          <NothingFound />
        ) : (
          <>
            {found.shapes.length > 0 && <MotionShapeGrid shapes={found.shapes} />}
            {found.pieces.length > 0 && <MotionGrid pieces={found.pieces} />}
          </>
        )
      ) : (
        <>
          {shapes.length > 0 && (
            <Section title={t('animations.group.basic')} data-group="basic">
              <p className="text-xs text-ui-fg-muted">{t('animatedShapes.hint')}</p>
              <MotionShapeGrid shapes={shapes} />
            </Section>
          )}
          {MOTION_GROUPS.map((group) => {
            const inGroup = pieces.filter((piece) => piece.group === group);
            return (
              inGroup.length > 0 && (
                <Section key={group} title={t(`animations.group.${group}`)} data-group={group}>
                  <MotionGrid pieces={inGroup} />
                </Section>
              )
            );
          })}
        </>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- backgrounds */

/** The ground the current slide shows, which a background of Elements keeps under its drawing. */
function useShownGround(): Background {
  const slideId = useSelection((s) => s.currentSlideId);
  return useDeck((s) => {
    const { deck } = s;
    const slide = slideId ? deck.slides.find((one) => one.id === slideId) : undefined;
    const layout = slide?.layoutId ? deck.layouts.find((l) => l.id === slide.layoutId) : undefined;
    return slide?.background ?? layout?.background ?? deck.theme.background;
  });
}

export function BackgroundGrid({ backgrounds }: { backgrounds: readonly MotionBackground[] }) {
  const { t, i18n } = useTranslation('elements');
  const editor = useEditor();
  const tileDeck = useTileDeck();
  const ground = useShownGround();
  const slideId = useSelection((s) => s.currentSlideId);
  const shown = useDeck((s) => {
    const slide = slideId ? s.deck.slides.find((one) => one.id === slideId) : undefined;
    return slide ? shownMotionBackground(s.deck, slide) : undefined;
  });
  const tiles = useMemo(() => {
    const deck = tileDeck(createSlide());
    return backgrounds.map((background) => {
      const slide = backgroundSlide(background, deck, ground);
      return { background, slide, deck: tileDeck(slide) };
    });
  }, [backgrounds, tileDeck, ground]);
  return (
    <TileGrid label={t('collection.backgrounds')}>
      {tiles.map(({ background, slide, deck }) => (
        <MotionTile
          key={background.id}
          label={motionName(background, i18n.language)}
          deck={deck}
          slide={slide}
          animated={background.animated}
          stronger
          pressed={shown === background.id}
          data={{ 'data-background': background.id }}
          onClick={() => {
            if (!applyMotionBackground(editor, background))
              void tell(t('noSlide', { ns: 'media' }));
          }}
        />
      ))}
    </TileGrid>
  );
}

/** The backgrounds, those that move first. */
export function BackgroundsCollection() {
  const { t } = useTranslation('elements');
  const all = useMediaCatalog(backgroundCatalog);
  if (all.length === 0) {
    return <NotFromLibrary ready={backgroundCatalog.ready} testId="elements-backgrounds" />;
  }
  const moving = all.filter((b) => b.animated);
  const still = all.filter((b) => !b.animated);
  return (
    <>
      <p className="text-xs text-ui-fg-muted">{t('backgrounds.hint')}</p>
      {moving.length > 0 && (
        <Section title={t('backgrounds.animated')} data-group="animated">
          <BackgroundGrid backgrounds={moving} />
        </Section>
      )}
      {still.length > 0 && (
        <Section title={t('backgrounds.still')} data-group="still">
          <BackgroundGrid backgrounds={still} />
        </Section>
      )}
    </>
  );
}

/* ---------------------------------------------------------------- search */

/** An animation or a background as the search finds it. */
export interface FoundMotion extends SearchWords {
  kind: 'animation' | 'shape' | 'background';
  id: string;
  /** What it is called in the language of the interface. */
  name: string;
}

/** The library's search tags of the animations and of the backgrounds (ADR-108). */
const motionTags = () => Promise.all([searchTags('animations'), searchTags('backgrounds')]);

/**
 * Every animation and background with the words they are found by: their names in the language
 * of the interface, in Hebrew and in English, the names of their group and kind, and the search
 * tags the library gives them, an animated shape's under `shape:<id>`. Until the tags have come,
 * and without them, by the rest.
 */
export function useMotionIndex(): readonly FoundMotion[] {
  const { t, i18n } = useTranslation('elements');
  const { pieces, shapes } = useMediaCatalog(animationCatalog);
  const backgrounds = useMediaCatalog(backgroundCatalog);
  const loaded = useLoaded(motionTags);
  return useMemo(() => {
    const none: TagsOf = {};
    const [animationTags, backgroundTags] = loaded === 'failed' || !loaded ? [none, none] : loaded;
    const entry = (
      kind: FoundMotion['kind'],
      item: MotionPiece | MotionShape | MotionBackground,
      also: (lng: string) => string[],
      tags: Tags | undefined,
    ): FoundMotion => {
      const name = (lng: string) => motionName(item, lng);
      const hebrew = wordsOf(name('he'));
      const words: FoundMotion = {
        kind,
        id: item.id,
        name: name(i18n.language),
        filled: false,
        nameWords: [...new Set([...wordsOf(name('en')), ...wordsOf(name(i18n.language))])],
        tagWords: [],
        nameTerms: [hebrew.join(' ')],
        nameHebrew: hebrew,
        tagTerms: [],
        tagHebrew: [],
      };
      const own = withTags(words, tags);
      return withTags(own, { en: also('en'), he: also('he') });
    };
    const kindOf = (kind: 'animations' | 'backgrounds', lng: string) =>
      t(`collection.${kind}`, { lng });
    return [
      ...shapes.map((shape) =>
        entry(
          'shape',
          shape,
          (lng) => [
            kindOf('animations', lng),
            t('animatedShapes.title', { lng }),
            t('collection.shapes', { lng }),
            t(`motion.kind.${shape.ambient.kind}`, { lng }),
          ],
          animationTags[`shape:${shape.id}`],
        ),
      ),
      ...pieces.map((piece) =>
        entry(
          'animation',
          piece,
          (lng) => [kindOf('animations', lng), t(`animations.group.${piece.group}`, { lng })],
          animationTags[piece.id],
        ),
      ),
      ...backgrounds.map((background) =>
        entry(
          'background',
          background,
          (lng) => [
            kindOf('backgrounds', lng),
            ...(background.animated ? [t('backgrounds.animated', { lng })] : []),
          ],
          backgroundTags[background.id],
        ),
      ),
    ];
  }, [t, i18n.language, pieces, shapes, backgrounds, loaded]);
}

/** The animations and backgrounds that match every word of a query, best first. */
export function searchMotion(index: readonly FoundMotion[], query: string, count: number) {
  return searchIcons(index, query, { count });
}

/** What a search found, as the animations and the backgrounds it names. */
export function foundMotions(found: readonly FoundMotion[]) {
  const ids = new Set(found.map((entry) => `${entry.kind}:${entry.id}`));
  return {
    shapes: motionShapes().filter((shape) => ids.has(`shape:${shape.id}`)),
    pieces: motionPieces().filter((piece) => ids.has(`animation:${piece.id}`)),
    backgrounds: motionBackgrounds().filter((b) => ids.has(`background:${b.id}`)),
  };
}
