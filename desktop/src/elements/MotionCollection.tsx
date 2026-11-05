import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react';
import { useTranslation } from 'react-i18next';
import {
  createSlide,
  type Background,
  type Deck,
  type LineElement,
  type Slide,
} from '@slidr/model';
import { FittedSlide, STILL_AT } from '@slidr/renderer';
import { cx, Input, Tooltip } from '@slidr/ui';
import { Play, Search } from '@slidr/ui/icons';
import { searchIcons, withTags, wordsOf, type SearchWords } from '../media/icons/search';
import { tell, useDeck, useEditor, useSelection } from '../shell';
import { NothingFound, Section } from './collections';
import { applyMotionBackground, insertMotion, insertMotionShape } from './insert';
import { backgroundDrawing, backgroundWith, motionElement, shownMotionBackground } from './motion';
import { motionBackgrounds, type MotionBackground } from './motionBackgrounds';
import { MOTION_GROUPS, motionPieces, type MotionPiece } from './motionPieces';
import { MOTION_SHAPES, motionShapeElement, type MotionShape } from './motionShapes';

/*
 * The animations and the backgrounds of Elements (ADR-127). Each tile is a small slide drawn by
 * the renderer in the deck's own theme: the animation on the slide's ground, or the slide's
 * ground under the background's drawing, as a click would leave it. A tile is still, at a moment
 * that shows what it is, and moves while the pointer or the keyboard is on it.
 */

/** The longest side of an animation on its tile's slide, as a share of the slide's height. */
const PIECE_HEIGHT = 0.84;

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

/**
 * A line of an animation (ADR-131) drawn `scale` times as large: its points, its width and the
 * pace of what runs along it, so that it looks and moves on its tile as on a slide of its size.
 */
function scaledLine(line: LineElement, scale: number): LineElement {
  const { flow } = line;
  return {
    ...line,
    points: line.points.map((p) => ({ x: p.x * scale, y: p.y * scale })),
    stroke: { ...line.stroke, width: line.stroke.width * scale },
    ...(flow
      ? {
          flow: {
            ...flow,
            speed: flow.speed * scale,
            ...(flow.size === undefined ? {} : { size: flow.size * scale }),
          },
        }
      : {}),
  };
}

/** The slide an animation's tile draws: the piece, large, in the middle of the theme's ground. */
function pieceSlide(piece: MotionPiece, deck: Deck): Slide {
  const element = motionElement(piece, deck);
  const scale = (deck.size.h * PIECE_HEIGHT) / Math.max(piece.size.h, piece.size.w * 0.56);
  const [w, h] = [piece.size.w * scale, piece.size.h * scale];
  const frame = { x: (deck.size.w - w) / 2, y: (deck.size.h - h) / 2, w, h };
  const id = `motion_${piece.id}`;
  return createSlide({
    id: `s_motion_${piece.id}`,
    background: { fill: { kind: 'solid', color: { token: 'bg' } } },
    elements: [
      element.type === 'line'
        ? { ...scaledLine(element, scale), id, frame }
        : { ...element, id, frame },
    ],
  });
}

export function MotionGrid({ pieces }: { pieces: readonly MotionPiece[] }) {
  const { t } = useTranslation('elements');
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
          label={t(`animations.name.${piece.id}`)}
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

/** The longest side of an animated shape on its tile's slide, as a share of the slide's height. */
const SHAPE_HEIGHT = 0.6;

/** The slide an animated shape's tile draws: the shape, large, in the middle of the theme's ground. */
function shapeSlide(shape: MotionShape, deck: Deck): Slide {
  const element = motionShapeElement(shape, deck);
  const { w: ew, h: eh } = element.frame;
  // Room around it for what it does: a float rises, a beat grows, a swing leans.
  const scale = (deck.size.h * SHAPE_HEIGHT) / Math.max(eh, ew * 0.56);
  const [w, h] = [ew * scale, eh * scale];
  const ambient =
    shape.ambient.kind === 'float'
      ? { ...shape.ambient, amount: (shape.ambient.amount ?? 16) * scale }
      : shape.ambient;
  return createSlide({
    id: `s_motion_shape_${shape.id}`,
    background: { fill: { kind: 'solid', color: { token: 'bg' } } },
    elements: [
      {
        ...element,
        id: `motion_shape_${shape.id}`,
        frame: { x: (deck.size.w - w) / 2, y: (deck.size.h - h) / 2, w, h },
        ambient,
        // Its outline as thick on the tile as on a slide of its own size.
        ...(element.stroke
          ? { stroke: { ...element.stroke, width: element.stroke.width * scale } }
          : {}),
      },
    ],
  });
}

export function MotionShapeGrid({ shapes }: { shapes: readonly MotionShape[] }) {
  const { t } = useTranslation('elements');
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
          label={t(`animatedShapes.name.${shape.id}`)}
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

/** Every animation by how it moves, and a search over their names. */
export function AnimationsCollection() {
  const { t } = useTranslation('elements');
  const [query, setQuery] = useState('');
  const index = useMotionIndex();
  const pieces = motionPieces();
  const found = useMemo(() => {
    if (!query.trim()) return undefined;
    const { pieces: foundPieces, shapes } = foundMotions(
      searchMotion(index, query, pieces.length + MOTION_SHAPES.length).filter(
        (entry) => entry.kind !== 'background',
      ),
    );
    return { pieces: foundPieces, shapes };
  }, [index, pieces, query]);
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
          <Section title={t('animations.group.basic')} data-group="basic">
            <p className="text-xs text-ui-fg-muted">{t('animatedShapes.hint')}</p>
            <MotionShapeGrid shapes={MOTION_SHAPES} />
          </Section>
          {MOTION_GROUPS.map((group) => (
            <Section key={group} title={t(`animations.group.${group}`)} data-group={group}>
              <MotionGrid pieces={pieces.filter((piece) => piece.group === group)} />
            </Section>
          ))}
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
  const { t } = useTranslation('elements');
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
      const slide = createSlide({
        id: `s_background_${background.id}`,
        background: backgroundWith(ground, {
          ...backgroundDrawing(background, deck),
          id: `background_${background.id}`,
        }),
      });
      return { background, slide, deck: tileDeck(slide) };
    });
  }, [backgrounds, tileDeck, ground]);
  return (
    <TileGrid label={t('collection.backgrounds')}>
      {tiles.map(({ background, slide, deck }) => (
        <MotionTile
          key={background.id}
          label={t(`backgrounds.name.${background.id}`)}
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
  const all = motionBackgrounds();
  return (
    <>
      <p className="text-xs text-ui-fg-muted">{t('backgrounds.hint')}</p>
      <Section title={t('backgrounds.animated')} data-group="animated">
        <BackgroundGrid backgrounds={all.filter((b) => b.animated)} />
      </Section>
      <Section title={t('backgrounds.still')} data-group="still">
        <BackgroundGrid backgrounds={all.filter((b) => !b.animated)} />
      </Section>
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

/**
 * Every animation and background with the words they are found by: their names in the language
 * of the interface, in Hebrew and in English, and the names of their group and kind.
 */
export function useMotionIndex(): readonly FoundMotion[] {
  const { t, i18n } = useTranslation('elements');
  return useMemo(() => {
    const entry = (
      kind: FoundMotion['kind'],
      id: string,
      key: string,
      also: (lng: string) => string[],
    ): FoundMotion => {
      const name = (lng: string) => t(key, { lng });
      const hebrew = wordsOf(name('he'));
      const words: FoundMotion = {
        kind,
        id,
        name: name(i18n.language),
        filled: false,
        nameWords: [...new Set([...wordsOf(name('en')), ...wordsOf(name(i18n.language))])],
        tagWords: [],
        nameTerms: [hebrew.join(' ')],
        nameHebrew: hebrew,
        tagTerms: [],
        tagHebrew: [],
      };
      return withTags(words, { en: also('en'), he: also('he') });
    };
    const kindOf = (kind: 'animations' | 'backgrounds', lng: string) =>
      t(`collection.${kind}`, { lng });
    return [
      ...MOTION_SHAPES.map((shape) =>
        entry('shape', shape.id, `animatedShapes.name.${shape.id}`, (lng) => [
          kindOf('animations', lng),
          t('animatedShapes.title', { lng }),
          t('collection.shapes', { lng }),
          t(`motion.kind.${shape.ambient.kind}`, { lng }),
        ]),
      ),
      ...motionPieces().map((piece) =>
        entry('animation', piece.id, `animations.name.${piece.id}`, (lng) => [
          kindOf('animations', lng),
          t(`animations.group.${piece.group}`, { lng }),
        ]),
      ),
      ...motionBackgrounds().map((background) =>
        entry('background', background.id, `backgrounds.name.${background.id}`, (lng) => [
          kindOf('backgrounds', lng),
          ...(background.animated ? [t('backgrounds.animated', { lng })] : []),
        ]),
      ),
    ];
  }, [t, i18n.language]);
}

/** The animations and backgrounds that match every word of a query, best first. */
export function searchMotion(index: readonly FoundMotion[], query: string, count: number) {
  return searchIcons(index, query, { count });
}

/** What a search found, as the animations and the backgrounds it names. */
export function foundMotions(found: readonly FoundMotion[]) {
  const ids = new Set(found.map((entry) => `${entry.kind}:${entry.id}`));
  return {
    shapes: MOTION_SHAPES.filter((shape) => ids.has(`shape:${shape.id}`)),
    pieces: motionPieces().filter((piece) => ids.has(`animation:${piece.id}`)),
    backgrounds: motionBackgrounds().filter((b) => ids.has(`background:${b.id}`)),
  };
}
