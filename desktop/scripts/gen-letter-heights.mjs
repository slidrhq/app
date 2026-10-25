/* global document, FontFace */
// Measures how tall the letters of each family of the media font catalog stand, in each script
// it draws, and writes packages/templates/src/letters.generated.ts. A template's cover sets its
// name so that its letters stand as tall as those of every other cover, whatever the family
// (`templateCover`): the size of a font says how big its em is, not how big its letters look.
// Run after `gen-builtin-fonts.mjs` changes the catalog:
//   node desktop/scripts/gen-letter-heights.mjs        (SLIDR_MEDIA_DIR names another copy)
import { chromium } from '@playwright/test';
import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const desktop = join(dirname(fileURLToPath(import.meta.url)), '..');
const media = process.env.SLIDR_MEDIA_DIR
  ? resolve(process.env.SLIDR_MEDIA_DIR)
  : resolve(desktop, '..', '..', 'Slidr-media');
const out = resolve(desktop, '..', 'packages', 'templates', 'src', 'letters.generated.ts');

/**
 * The letters each script is measured by: `letters`, whose height is the size the eye reads (the
 * body of Hebrew letters; for Latin, Cyrillic and Vietnamese halfway between the small letters
 * and the capitals); `top`, the tallest of its common letters; `bottom`, those that go below the
 * line. A measure is the mean of its letters, `top` and `bottom` their greatest.
 */
const SCRIPTS = {
  he: { letters: ['ב', 'ה', 'ם'], top: ['ה', 'ב'], bottom: ['ק', 'ן', 'ף', 'ץ'] },
  latin: { letters: ['x', 'H'], top: ['H', 'd', 'l'], bottom: ['g', 'p', 'y'] },
  vietnamese: { letters: ['x', 'H'], top: ['H', 'd', 'l'], bottom: ['g', 'p', 'y'] },
  cyrillic: { letters: ['х', 'Н'], top: ['Н', 'б'], bottom: ['р', 'у', 'д'] },
  arabic: { letters: ['ه', 'ا'], top: ['ا', 'ل'], bottom: ['ي', 'ر', 'و'] },
  devanagari: { letters: ['क', 'म'], top: ['क', 'म'], bottom: ['कु', 'कृ'] },
  japanese: { letters: ['国', 'あ'], top: ['国'], bottom: ['国', 'あ'] },
  korean: { letters: ['한', '국'], top: ['한'], bottom: ['국'] },
  chinese: { letters: ['国', '中'], top: ['国'], bottom: ['国'] },
};
/**
 * The weights letters are measured at: their height at the weights between is about the line
 * between these, a few percent apart in a family of many weights. The rest is measured at a
 * cover's usual weight.
 */
const LIGHT = 300;
const BOLD = 900;
const WEIGHT = 700;

const catalog = JSON.parse(readFileSync(join(media, 'fonts', 'catalog.json'), 'utf8'));
const families = new Map(catalog.families.map((entry) => [entry.family, entry]));

/** Whether a face's `unicode-range` holds every code point of the text. */
function covers(range, text) {
  if (!range) return true;
  const spans = range.split(',').map((part) => {
    const [from, to = from] = part.trim().slice(2).split('-');
    return [parseInt(from, 16), parseInt(to, 16)];
  });
  return [...text].every((char) => {
    const code = char.codePointAt(0);
    return spans.some(([from, to]) => code >= from && code <= to);
  });
}

/** The family that draws a script's letters for text set in `family`, as `familyForLetters`. */
function drawnBy(family, script) {
  const entry = families.get(family);
  if (!entry) return undefined;
  if (entry.scripts.includes(script)) return family;
  // Hebrew is the font pair's own: a family without it has no counterpart for it.
  return script === 'he' ? undefined : entry.counterparts?.[script];
}

const browser = await chromium.launch({ headless: true, channel: 'msedge' });
const metrics = {};
try {
  const page = await browser.newPage();
  await page.setContent('<!doctype html><html><body></body></html>');
  for (const entry of catalog.families) {
    for (const script of entry.scripts) {
      if (!SCRIPTS[script]) continue;
      const glyphs = SCRIPTS[script];
      const text = [...glyphs.letters, ...glyphs.top, ...glyphs.bottom].join('');
      // With the face that has a space: the first font of the family, whose ascent and descent
      // seat the line (CSS's "first available font").
      const faces = catalog.faces.filter(
        (face) =>
          face.family === entry.family &&
          face.style === 'normal' &&
          [...`${text} `].some((char) => covers(face.unicodeRange, char)),
      );
      if (faces.length === 0) continue;
      const files = faces.map((face) => ({
        weight: face.weight,
        unicodeRange: face.unicodeRange,
        data: readFileSync(join(media, face.path)).toString('base64'),
        // The file that draws the script's letters: its own ascent and descent seat them, and
        // those of a family's files are not always one another's.
        letters: covers(face.unicodeRange, glyphs.letters[0]),
      }));
      const measured = await page.evaluate(
        async ({ name, files, glyphs, weights }) => {
          for (const file of [...document.fonts]) document.fonts.delete(file);
          for (const { weight: w, unicodeRange, data, letters } of files) {
            const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
            const face = new FontFace(name, bytes, {
              weight: w,
              ...(unicodeRange ? { unicodeRange } : {}),
            });
            document.fonts.add(await face.load());
            // Once more, alone and for every letter, so that it is the font the canvas measures.
            if (letters) document.fonts.add(await new FontFace(`${name}-letters`, bytes).load());
          }
          // The ink of a letter, found in the pixels it paints: what the canvas measures of it is
          // rounded to a 64th of the size.
          const SIZE = 400;
          const [W, H, BASE] = [800, 800, 560];
          const canvas = Object.assign(document.createElement('canvas'), { width: W, height: H });
          const ctx = canvas.getContext('2d', { willReadFrequently: true });
          const at = (w) => (ctx.font = `${w} ${SIZE}px "${name}"`);
          const ink = (text) => {
            ctx.clearRect(0, 0, W, H);
            ctx.fillText(text, 200, BASE);
            const { data } = ctx.getImageData(0, 0, W, H);
            const inked = (y) => {
              for (let x = 0; x < W; x++) if (data[(y * W + x) * 4 + 3] > 127) return true;
              return false;
            };
            let top = 0;
            while (top < H && !inked(top)) top++;
            let bottom = H - 1;
            while (bottom > top && !inked(bottom)) bottom--;
            return { above: (BASE - top) / SIZE, below: (bottom + 1 - BASE) / SIZE };
          };
          const mean = (list) => list.reduce((sum, v) => sum + v, 0) / list.length;
          const letters = () => mean(glyphs.letters.map((c) => ink(c).above)) * 1000;
          at(weights.light);
          const light = letters();
          at(weights.bold);
          const bold = letters();
          ctx.font = `${weights.usual} ${SIZE}px "${name}-letters"`;
          const font = ctx.measureText(glyphs.letters[0]);
          at(weights.usual);
          return {
            light,
            bold,
            top: Math.max(...glyphs.top.map((c) => ink(c).above)) * 1000,
            bottom: Math.max(...glyphs.bottom.map((c) => ink(c).below)) * 1000,
            ascent: (font.fontBoundingBoxAscent / SIZE) * 1000,
            descent: (font.fontBoundingBoxDescent / SIZE) * 1000,
          };
        },
        {
          name: `m-${entry.family}`,
          files,
          glyphs,
          weights: { light: LIGHT, bold: BOLD, usual: WEIGHT },
        },
      );
      const round = (value) => Math.round(value) / 1000;
      (metrics[entry.family] ??= {})[script] = [
        round(measured.light),
        round(measured.bold),
        round(measured.top),
        round(measured.bottom),
        round(measured.ascent),
        round(measured.descent),
      ];
    }
  }
} finally {
  await browser.close();
}

// Each family's counterparts that the table measured, for the scripts it has no letters of.
const counterparts = {};
for (const entry of catalog.families) {
  for (const script of Object.keys(SCRIPTS)) {
    const other = drawnBy(entry.family, script);
    if (other && other !== entry.family && metrics[other]?.[script]) {
      (counterparts[entry.family] ??= {})[script] = other;
    }
  }
}

const lines = (table) =>
  Object.entries(table)
    .map(([family, value]) => `  ${JSON.stringify(family)}: ${JSON.stringify(value)},`)
    .join('\n');
const source = `// Generated by \`node desktop/scripts/gen-letter-heights.mjs\` from the fonts of the media
// library. Do not edit.

/**
 * How a family's letters stand in a script, at a size of 1: the height the eye reads as their
 * size, at weight ${LIGHT} and at ${BOLD}; at ${WEIGHT}, the top of the tallest of them and the
 * foot of those that go below the line (both from the line); and the font's ascent and
 * descent, which seat the line in its box.
 */
export type Letters = readonly [
  light: number,
  bold: number,
  top: number,
  bottom: number,
  ascent: number,
  descent: number,
];

/** The weights \`light\` and \`bold\` are measured at. */
export const LETTER_WEIGHTS = [${LIGHT}, ${BOLD}] as const;

/** Each family of the media library's fonts, by the scripts it has letters of. */
export const LETTERS: Record<string, Partial<Record<string, Letters>>> = {
${lines(metrics)}
};

/** The family that draws a script a family has no letters of (\`counterparts\` of the catalog). */
export const LETTERS_OF: Record<string, Partial<Record<string, string>>> = {
${lines(counterparts)}
};
`;
const prettier = await import('prettier');
const options = await prettier.resolveConfig(out);
writeFileSync(out, await prettier.format(source, { ...options, filepath: out }));
console.log(`Measured ${Object.keys(metrics).length} families into ${out}.`);
