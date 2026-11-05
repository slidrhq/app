import { createElement, findSlide, type Frame, type ImageElement } from '@slidr/model';
import { i18n } from '../i18n';
import { centredFrame } from '../objects/shapes';
import type { Target } from '../objects/target';
import { focusStage, type Editor } from '../shell';
import { newCardSet, type CardSetId, type Reading } from './cardSets';
import { framedElement, frameSizeOn, loadFrames, reframe, type PhotoFrame } from './frames';
import { backgroundCommands, motionElement } from './motion';
import type { MotionBackground } from './motionBackgrounds';
import type { MotionPiece } from './motionPieces';
import { motionShapeElement, type MotionShape } from './motionShapes';
import { rememberSticker, type RecentSticker } from './recent';

/** The side of a new graphic or emoji on the slide, in slide pixels. */
const SIDE = 260;

/**
 * Places a graphic or an emoji on the current slide, as a self-contained vector drawing whose
 * colours can be changed, and remembers it for the first screen of Elements. One undo step.
 */
export function insertSticker(editor: Editor, sticker: RecentSticker): boolean {
  const slideId = editor.selection.getState().currentSlideId;
  if (!slideId) return false;
  const taken: Frame[] = findSlide(editor.bus.deck, slideId)?.elements.map((e) => e.frame) ?? [];
  const element = createElement.svg({
    frame: centredFrame({ w: SIDE, h: SIDE }, editor.bus.deck.size, taken),
    markup: sticker.markup,
    name: sticker.id,
  });
  editor.bus.dispatch(
    { type: 'element.add', slideId, element },
    { label: i18n.t('elements:history.insert') },
  );
  editor.selection.getState().selectElements([element.id]);
  rememberSticker(sticker);
  focusStage();
  return true;
}

/**
 * Places a photo frame on the current slide: a picture with no photograph yet, cut and
 * decorated as the frame says, with its stickers and its caption when it has them, in `lang`,
 * the language it was shown in. It ends selected, so the photograph chosen next can go into it.
 * One undo step.
 */
export function insertFrame(editor: Editor, frame: PhotoFrame, lang: string): boolean {
  const slideId = editor.selection.getState().currentSlideId;
  if (!slideId) return false;
  const { deck } = editor.bus;
  const taken: Frame[] = findSlide(deck, slideId)?.elements.map((e) => e.frame) ?? [];
  const box = centredFrame(frameSizeOn(frame, deck.size), deck.size, taken);
  const element = framedElement(frame, box, lang);
  editor.bus.dispatch(
    { type: 'element.add', slideId, element },
    { label: i18n.t('elements:history.frame') },
  );
  editor.selection.getState().selectElements([element.id]);
  focusStage();
  return true;
}

/**
 * Places a card set in the middle of the current slide, in the reading it was shown in: its
 * words, and its cards starting on that side. It ends selected, so that a card can be added to
 * it from row B at once. One undo step.
 */
export function insertCardSet(editor: Editor, id: CardSetId, reading: Reading): boolean {
  const slideId = editor.selection.getState().currentSlideId;
  if (!slideId) return false;
  const { deck } = editor.bus;
  const taken: Frame[] = findSlide(deck, slideId)?.elements.map((e) => e.frame) ?? [];
  const set = newCardSet(id, reading);
  const element = { ...set, frame: centredFrame(set.frame, deck.size, taken) };
  editor.bus.dispatch(
    { type: 'element.add', slideId, element },
    { label: i18n.t('elements:history.cards') },
  );
  editor.selection.getState().selectElements([element.id]);
  focusStage();
  return true;
}

/**
 * Puts a picture of the slide in a frame: the photograph, its crop and its adjustments stay,
 * and the picture takes the frame's outline, artwork and proportions, and what the frame puts
 * beside it (`reframe`), in `lang`, the language it was shown in. One undo step.
 */
export async function framePicture(
  editor: Editor,
  picture: Target<ImageElement>,
  frame: PhotoFrame,
  lang: string,
): Promise<void> {
  // The frames are loaded: the one that was clicked is one of them.
  const all = await loadFrames();
  const slide = findSlide(editor.bus.deck, picture.slideId);
  if (!slide) return;
  const { command, select } = reframe(slide, picture.element, frame, lang, all);
  editor.bus.dispatch(command, { label: i18n.t('elements:history.reframe') });
  editor.selection.getState().selectElements([select]);
  focusStage();
}

/**
 * Places an animation of Elements in the middle of the current slide: a picture that moves by
 * itself, in the theme's colours, which moves, resizes and turns as any other object. It ends
 * selected. One undo step.
 */
export function insertMotion(editor: Editor, piece: MotionPiece): boolean {
  const slideId = editor.selection.getState().currentSlideId;
  if (!slideId) return false;
  const { deck } = editor.bus;
  const taken: Frame[] = findSlide(deck, slideId)?.elements.map((e) => e.frame) ?? [];
  const element = motionElement(piece, deck, taken);
  editor.bus.dispatch(
    { type: 'element.add', slideId, element },
    { label: i18n.t('elements:history.animation') },
  );
  editor.selection.getState().selectElements([element.id]);
  focusStage();
  return true;
}

/**
 * Places an animated shape of Elements in the middle of the current slide (ADR-128): a shape of
 * the library, in the theme's colours, that repeats its motion. It ends selected, so its motion
 * and its look can be changed in row B at once. One undo step.
 */
export function insertMotionShape(editor: Editor, shape: MotionShape): boolean {
  const slideId = editor.selection.getState().currentSlideId;
  if (!slideId) return false;
  const { deck } = editor.bus;
  const taken: Frame[] = findSlide(deck, slideId)?.elements.map((e) => e.frame) ?? [];
  const element = motionShapeElement(shape, deck, taken);
  editor.bus.dispatch(
    { type: 'element.add', slideId, element },
    { label: i18n.t('elements:history.animation') },
  );
  editor.selection.getState().selectElements([element.id]);
  focusStage();
  return true;
}

/**
 * Gives the current slide a background of Elements, and with it every other slide selected in
 * the filmstrip: the ground the slide shows, under the background's drawing. One undo step.
 */
export function applyMotionBackground(editor: Editor, background: MotionBackground): boolean {
  const { currentSlideId, selectedSlideIds } = editor.selection.getState();
  if (!currentSlideId) return false;
  const slideIds = selectedSlideIds.includes(currentSlideId) ? selectedSlideIds : [currentSlideId];
  const commands = backgroundCommands(editor.bus.deck, slideIds, background);
  if (commands.length === 0) return false;
  editor.bus.batch(commands, { label: i18n.t('elements:history.background') });
  return true;
}
