import type { Background, Color, Command, Deck, Fill, Slide, SvgElement } from '@slidr/model';
import { markupAtSpeed, pieceSpeed } from '../elements/motion';
import { motionBackgrounds, type MotionBackground } from '../elements/motionBackgrounds';

/*
 * The slide background (SLD-03): what a slide shows, and the commands of "apply to all slides".
 * Pure, so it is tested without a DOM.
 */

const same = (a: unknown, b: unknown) => JSON.stringify(a) === JSON.stringify(b);

function layoutBackground(deck: Deck, slide: Slide): Background | undefined {
  return slide.layoutId ? deck.layouts.find((l) => l.id === slide.layoutId)?.background : undefined;
}

/** What a slide shows without a background of its own: its layout's, or else the theme's. */
export function inheritedBackground(deck: Deck, slide: Slide): Background {
  return layoutBackground(deck, slide) ?? deck.theme.background;
}

/** The background a slide shows, as the renderer resolves it. */
export function shownBackground(deck: Deck, slide: Slide): Background {
  return slide.background ?? inheritedBackground(deck, slide);
}

/**
 * The background with another fill. Blur and dim are for photos (the schema says so), so they go
 * when the fill is no longer an image; the overlay stays.
 */
export function withFill(background: Background, fill: Fill): Background {
  if (fill.kind === 'image') return { ...background, fill };
  const { blur: _blur, dim: _dim, ...rest } = background;
  return { ...rest, fill };
}

/**
 * The background without its drawing (ADR-125): what a slide takes to keep the ground it shows
 * and lose the drawing on it. A background without one is given back as it is.
 */
export function withoutDrawing(background: Background): Background {
  if (!background.elements) return background;
  const { elements: _elements, ...rest } = background;
  return rest;
}

/*
 * The drawing of a background, as the Background tool sets it (ADR-129): the colours of its
 * pictures, how fast a background of Elements moves, and how strong the drawing is. Each gives
 * the background back with its drawing changed, and the rest of it as it was.
 */

/** A background as far as its drawing goes. */
type Drawing = Pick<Background, 'elements'>;

/** The pictures of a background's drawing: its `svg` elements that carry their markup. */
export function drawingPictures(background: Drawing): SvgElement[] {
  return (background.elements ?? []).filter(
    (element): element is SvgElement => element.type === 'svg' && Boolean(element.markup),
  );
}

/** The background with each picture of its drawing changed; one `change` gives nothing for stays. */
function withPictures(
  background: Background,
  change: (picture: SvgElement) => Partial<SvgElement> | undefined,
): Background {
  if (!background.elements) return background;
  return {
    ...background,
    elements: background.elements.map((element) => {
      if (element.type !== 'svg' || !element.markup) return element;
      const patch = change(element);
      return patch ? { ...element, ...patch } : element;
    }),
  };
}

/** A colour as `colorOverrides` keys are compared: trimmed, in lower case. */
const keyOf = (colour: string) => colour.trim().toLowerCase();

/**
 * The colours of a drawing that its pictures replace (`colorOverrides`), each once, in the order
 * they are first given: for a background of Elements, the colours that stand for the theme's.
 */
export function drawingColours(background: Drawing): string[] {
  const colours = drawingPictures(background).flatMap((picture) =>
    Object.keys(picture.colorOverrides ?? {}).map(keyOf),
  );
  return [...new Set(colours)];
}

/** What a colour of the drawing is drawn in: its first picture's replacement, else itself. */
export function drawingColour(background: Drawing, colour: string): Color {
  for (const picture of drawingPictures(background)) {
    const entry = Object.entries(picture.colorOverrides ?? {}).find(
      ([key]) => keyOf(key) === colour,
    );
    if (entry) return entry[1];
  }
  return { value: colour };
}

/**
 * The background with a colour of its drawing drawn in `color`, in every picture that replaces
 * that colour or draws in it, under the key the renderer finds it by.
 */
export function withDrawingColour(
  background: Background,
  colour: string,
  color: Color,
): Background {
  const key = keyOf(colour);
  return withPictures(background, (picture) => {
    const overrides = Object.entries(picture.colorOverrides ?? {});
    const replaces = overrides.some(([k]) => keyOf(k) === key);
    if (!replaces && !picture.markup!.toLowerCase().includes(`"${key}"`)) return undefined;
    const rest = Object.fromEntries(overrides.filter(([k]) => keyOf(k) !== key));
    return { colorOverrides: { ...rest, [key]: color } };
  });
}

/**
 * The background of Elements that moves a picture is (ADR-127), by the name the picture was
 * given when the background was applied.
 */
function movingBackgroundOf(picture: SvgElement): MotionBackground | undefined {
  const id = picture.name?.startsWith('background-')
    ? picture.name.slice('background-'.length)
    : undefined;
  return id ? motionBackgrounds().find((one) => one.id === id && one.animated) : undefined;
}

/**
 * How fast the drawing moves, as a share of its own pace (1 as it was drawn). Undefined when no
 * picture of it is a background of Elements that moves: only those are drawn again at a speed.
 */
export function drawingSpeed(background: Drawing): number | undefined {
  const picture = drawingPictures(background).find((one) => movingBackgroundOf(one));
  return picture ? pieceSpeed(picture.markup!) : undefined;
}

/**
 * The background with its drawing moving at `speed`. Each background of Elements in it is drawn
 * again from the collection's picture at its own pace (`markupAtSpeed`), never from the picture
 * on the slide, whose times are already divided by its speed. So it also takes the collection's
 * drawing as it is now. Its colours, mirror and opacity are fields of the element, and stay.
 */
export function withDrawingSpeed(background: Background, speed: number): Background {
  return withPictures(background, (picture) => {
    const source = movingBackgroundOf(picture);
    return source ? { markup: markupAtSpeed(source.markup, speed) } : undefined;
  });
}

/** How strong the drawing is drawn: its first element's opacity. Undefined without a drawing. */
export function drawingOpacity(background: Drawing): number | undefined {
  return background.elements?.[0]?.opacity;
}

/** The background with every element of its drawing at `opacity`. */
export function withDrawingOpacity(background: Background, opacity: number): Background {
  if (!background.elements) return background;
  return {
    ...background,
    elements: background.elements.map((element) => ({ ...element, opacity })),
  };
}

/** Sets or clears blur / dim: zero is stored as absent. */
export function withAdjust(
  background: Background,
  change: { blur?: number; dim?: number },
): Background {
  const next: Background = { ...background, ...change };
  if (!next.blur) delete next.blur;
  if (!next.dim) delete next.dim;
  return next;
}

/** Which of the theme's variants a background is, if any. */
export function variantIndex(deck: Deck, background: Background | undefined): number {
  if (!background) return -1;
  return deck.theme.backgroundVariants.findIndex((variant) => same(variant, background));
}

/**
 * "Apply to all slides": the background the given slide shows becomes the theme's, so slides
 * added later get it too, and every slide's own background is dropped. A slide whose layout has
 * a background of its own is given the background explicitly, since the layout would win over the
 * theme. One batch: one undo step. Empty when every slide already shows it.
 */
export function applyToAllCommands(deck: Deck, slideId: string): Command[] {
  const source = deck.slides.find((s) => s.id === slideId);
  if (!source) return [];
  const background = shownBackground(deck, source);
  const commands: Command[] = [];
  if (!same(deck.theme.background, background)) {
    commands.push({ type: 'theme.update', patch: { background } });
  }
  for (const slide of deck.slides) {
    const wanted = layoutBackground(deck, slide) ? background : undefined;
    if (same(slide.background, wanted)) continue;
    commands.push({
      type: 'slide.update',
      slideId: slide.id,
      patch: { background: wanted ?? null },
    });
  }
  return commands;
}
