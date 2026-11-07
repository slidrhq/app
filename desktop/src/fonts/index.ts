import { familyForLetters, type FontFamilyEntry } from '@slidr/model';
import { hebrewFaces, setFontCounterparts } from '@slidr/renderer';
import { builtinFonts, type BuiltinFace, type BuiltinFonts } from './builtinFonts.generated';

export { builtinFamilies, builtinFonts } from './builtinFonts.generated';
export { useUserFonts, type UserFont } from './userFonts';
export {
  loadSystemFonts,
  setSystemFontSource,
  useSystemFonts,
  type SystemFont,
  type SystemFontSource,
} from './systemFonts';

function faceRule(face: BuiltinFace): string {
  return [
    '@font-face {',
    `  font-family: "${face.family}";`,
    `  font-style: ${face.style};`,
    `  font-weight: ${face.weight};`,
    // `block` for a short moment rather than `swap`: a slide that swaps fonts after it is drawn
    // re-wraps its text, and thumbnails and captures would catch the wrong one.
    '  font-display: block;',
    `  src: url("${face.url}") format("woff2");`,
    face.unicodeRange ? `  unicode-range: ${face.unicodeRange};` : '',
    '}',
  ]
    .filter(Boolean)
    .join('\n');
}

const STYLE_ID = 'slidr-builtin-fonts';

/** The library's families by their name as CSS finds them, whatever its case. */
let families = new Map<string, FontFamilyEntry>();

/** Puts the faces of `fonts` in `doc`, in place of any put there before. */
function applyFaces(doc: Document, fonts: BuiltinFonts): void {
  families = new Map(fonts.families.map((entry) => [entry.family.toLowerCase(), entry]));
  // Told again, so the slides draw again with the counterparts that came.
  setFontCounterparts((family, lang) => {
    const entry = families.get(family.toLowerCase());
    return entry && familyForLetters(entry, lang);
  });
  let style = doc.getElementById(STYLE_ID);
  if (!style) {
    style = doc.createElement('style');
    style.id = STYLE_ID;
    doc.head.append(style);
  }
  style.textContent = [...fonts.faces, ...hebrewFaces([...fonts.faces])].map(faceRule).join('\n');
}

/** The pages whose fonts are registered, and what reading the catalog came to for them. */
const registered = new WeakMap<Document, Promise<void>>();

/**
 * Registers the built-in font library (SPEC appendix B) under the family names decks use, as soon
 * as its catalog has come: nothing waits for it, and text drawn before is drawn again in the right
 * face once the face loads. Nothing is downloaded until text uses a face: browsers load
 * `@font-face` files on demand, per `unicode-range` subset (RND-05). The Hebrew subsets are
 * registered again as Hebrew-only faces, which the renderer puts first in a font pair, so Hebrew
 * text gets the pair's Hebrew font even when the Latin one has Hebrew letters too (SPEC 5.5). And
 * the renderer is told the families' counterparts, so a deck in a language its theme's fonts have
 * no letters of draws them in the family of those letters closest to the theme's (ADR-105).
 *
 * Resolves once they are registered; a page that captures what it draws waits for it
 * (`fontsReady`).
 */
export function registerBuiltinFonts(doc: Document = document): Promise<void> {
  let done = registered.get(doc);
  if (!done) {
    done = builtinFonts.load().then((fonts) => applyFaces(doc, fonts));
    registered.set(doc, done);
    // A library that changes while the app runs brings its fonts again.
    builtinFonts.subscribe(() => applyFaces(doc, builtinFonts.get()));
  }
  return done;
}

/**
 * The built-in faces with addresses of their own, for a frame that has none to resolve them
 * against: the list fills as the catalog comes, and is read when a file is converted.
 */
export function absoluteBuiltinFaces(): readonly BuiltinFace[] {
  const faces: BuiltinFace[] = [];
  void builtinFonts.load().then((fonts) => {
    faces.push(
      ...fonts.faces.map((face) => ({ ...face, url: new URL(face.url, location.href).href })),
    );
  });
  return faces;
}

/**
 * Resolves once the fonts a rendered subtree uses have loaded, so a capture or a measurement sees
 * the final text (RND-05).
 */
export async function fontsReady(doc: Document = document): Promise<void> {
  await registered.get(doc);
  await doc.fonts.ready;
}
