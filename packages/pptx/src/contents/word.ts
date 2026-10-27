import type { PackageReader } from '../import/package';
import { attr, child, children, descendants, intAttr, textOf, type XmlElement } from '../xml';
import { branch, clean, graphicText, joinBlocks, table, type Block, type Pictures } from './common';

/*
 * A Word document as Markdown: its paragraphs in order, headings by their outline level, lists
 * with the numbers Word shows, tables, a text box after the paragraph it stands in, links,
 * equations, footnotes, the page header, and the pictures where they are. What was deleted with
 * tracked changes is left out and what was inserted is in, as Word shows the document.
 */

/** What a paragraph is building: its text, and what stands in it but reads after it. */
interface Inline {
  text: string;
  after: Block[];
}

interface Style {
  basedOn?: string;
  /** How many hashes its heading takes, from its name or its outline level. */
  heading?: number;
  numId?: string;
  ilvl?: number;
}

interface Level {
  format: string;
  /** What the number reads, `%1.%2.`, with a level's number for each `%n`. */
  text: string;
  start: number;
}

/** Hashes of a heading: the title one, a heading of outline level n (from 0) n + 2, at most 6. */
const hashes = (outline: number) => Math.min(6, outline + 2);

async function readStyles(pkg: PackageReader, main: string): Promise<Map<string, Style>> {
  const styles = new Map<string, Style>();
  const rel = await pkg.rel(main, 'styles');
  const xml = rel && !rel.external ? await pkg.xml(rel.target) : undefined;
  for (const style of children(xml, 'w:style')) {
    const id = attr(style, 'w:styleId');
    if (!id || attr(style, 'w:type') !== 'paragraph') continue;
    // A built-in style is named in English whatever the language of Word that wrote it.
    const name = (attr(child(style, 'w:name'), 'w:val') ?? '').toLowerCase();
    const pPr = child(style, 'w:pPr');
    const outline = intAttr(child(pPr, 'w:outlineLvl'), 'w:val');
    const numbered = /^heading ([1-9])$/.exec(name);
    const numPr = child(pPr, 'w:numPr');
    styles.set(id, {
      basedOn: attr(child(style, 'w:basedOn'), 'w:val'),
      heading:
        name === 'title'
          ? 1
          : numbered
            ? hashes(Number(numbered[1]) - 1)
            : outline !== undefined && outline < 9
              ? hashes(outline)
              : undefined,
      numId: attr(child(numPr, 'w:numId'), 'w:val'),
      ilvl: intAttr(child(numPr, 'w:ilvl'), 'w:val'),
    });
  }
  return styles;
}

function readLevel(lvl: XmlElement): Level {
  return {
    format: attr(child(lvl, 'w:numFmt'), 'w:val') ?? 'decimal',
    text: attr(child(lvl, 'w:lvlText'), 'w:val') ?? '',
    start: intAttr(child(lvl, 'w:start'), 'w:val') ?? 1,
  };
}

/** The levels of each list, by its `numId`, with what the list overrides of its definition. */
async function readNumbering(pkg: PackageReader, main: string): Promise<Map<string, Level[]>> {
  const rel = await pkg.rel(main, 'numbering');
  const xml = rel && !rel.external ? await pkg.xml(rel.target) : undefined;
  const definitions = new Map<string, Level[]>();
  for (const definition of children(xml, 'w:abstractNum')) {
    const levels: Level[] = [];
    for (const lvl of children(definition, 'w:lvl')) {
      levels[intAttr(lvl, 'w:ilvl') ?? levels.length] = readLevel(lvl);
    }
    definitions.set(attr(definition, 'w:abstractNumId') ?? '', levels);
  }
  const lists = new Map<string, Level[]>();
  for (const num of children(xml, 'w:num')) {
    const levels = [...(definitions.get(attr(child(num, 'w:abstractNumId'), 'w:val') ?? '') ?? [])];
    for (const override of children(num, 'w:lvlOverride')) {
      const i = intAttr(override, 'w:ilvl') ?? 0;
      const lvl = child(override, 'w:lvl');
      if (lvl) levels[i] = readLevel(lvl);
      const start = intAttr(child(override, 'w:startOverride'), 'w:val');
      if (start !== undefined && levels[i]) levels[i] = { ...levels[i], start };
    }
    lists.set(attr(num, 'w:numId') ?? '', levels);
  }
  return lists;
}

const LATIN = 'abcdefghijklmnopqrstuvwxyz';
const HEBREW = 'אבגדהוזחטיכלמנסעפצקרשת';
const ROMAN: [number, string][] = [
  [1000, 'm'],
  [900, 'cm'],
  [500, 'd'],
  [400, 'cd'],
  [100, 'c'],
  [90, 'xc'],
  [50, 'l'],
  [40, 'xl'],
  [10, 'x'],
  [9, 'ix'],
  [5, 'v'],
  [4, 'iv'],
  [1, 'i'],
];

/** a … z, then aa … zz, as Word counts in letters. */
const letters = (n: number, alphabet: string) =>
  alphabet[(n - 1) % alphabet.length]!.repeat(Math.ceil(n / alphabet.length));

function roman(n: number): string {
  let out = '';
  for (const [value, mark] of ROMAN) {
    for (; n >= value; n -= value) out += mark;
  }
  return out;
}

/** The Hebrew numerals of 1–999: יא, טו, קכג. */
function gematria(n: number): string {
  const ones = ['', ...'אבגדהוזחט'];
  const tens = ['', ...'יכלמנסעפצ'];
  const hundreds = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק'];
  const rest = n % 100;
  const tail =
    rest === 15 ? 'טו' : rest === 16 ? 'טז' : tens[Math.floor(rest / 10)]! + ones[n % 10]!;
  return hundreds[Math.floor(n / 100)]! + tail;
}

/** A number in the format of a level of a list; in digits for a format not written here. */
function numeral(n: number, format: string): string {
  if (n < 1) return String(n);
  switch (format) {
    case 'lowerLetter':
      return letters(n, LATIN);
    case 'upperLetter':
      return letters(n, LATIN).toUpperCase();
    case 'lowerRoman':
      return n < 4000 ? roman(n) : String(n);
    case 'upperRoman':
      return n < 4000 ? roman(n).toUpperCase() : String(n);
    case 'hebrew1':
      return n < 1000 ? gematria(n) : String(n);
    case 'hebrew2':
      return letters(n, HEBREW);
    default:
      return String(n);
  }
}

/** The elements of a name, also where a content control or custom XML wraps them. */
function within(el: XmlElement | undefined, name: string): XmlElement[] {
  return children(el).flatMap((node) =>
    node.name === name
      ? [node]
      : node.name === 'w:sdt'
        ? within(child(node, 'w:sdtContent'), name)
        : node.name === 'w:customXml'
          ? within(node, name)
          : [],
  );
}

class WordReader {
  /** The numbers so far of each list, by its `numId`, a number for each level. */
  readonly #counts = new Map<string, number[]>();

  constructor(
    readonly pkg: PackageReader,
    readonly pictures: Pictures,
    readonly styles: Map<string, Style>,
    readonly numbering: Map<string, Level[]>,
  ) {}

  /** A property of a paragraph style, or of the style it is based on. */
  #style<K extends keyof Style>(id: string | undefined, key: K): Style[K] | undefined {
    for (let depth = 0; id && depth < 10; depth++) {
      const style = this.styles.get(id);
      if (style?.[key] !== undefined) return style[key];
      id = style?.basedOn;
    }
    return undefined;
  }

  /** The number of the next item of a list at a level, as Word shows it; '' for none. */
  #marker(numId: string, ilvl: number): string {
    const levels = this.numbering.get(numId) ?? [];
    const level = levels[ilvl];
    if (!level || level.format === 'bullet') return '-';
    if (level.format === 'none') return '';
    const counts = this.#counts.get(numId) ?? [];
    this.#counts.set(numId, counts);
    counts[ilvl] = (counts[ilvl] ?? level.start - 1) + 1;
    // An item starts the levels under it again.
    counts.length = ilvl + 1;
    return level.text
      .replace(/%([1-9])/g, (_, k: string) => {
        const i = Number(k) - 1;
        return numeral(counts[i] ?? levels[i]?.start ?? 1, levels[i]?.format ?? 'decimal');
      })
      .trim();
  }

  async document(main: string): Promise<string> {
    const body = child(await this.pkg.xml(main), 'w:body');
    const blocks: Block[] = [];
    // The page header of the document's last section, the one most pages have: a letterhead,
    // a logo. Even pages are left out, and a first page that says the same.
    const rels = await this.pkg.rels(main);
    const headers = new Set<string>();
    for (const reference of children(child(body, 'w:sectPr'), 'w:headerReference')) {
      if (attr(reference, 'w:type') === 'even') continue;
      const rel = rels.get(attr(reference, 'r:id') ?? '');
      if (!rel || rel.external) continue;
      const text = joinBlocks(await this.#blocks(await this.pkg.xml(rel.target), rel.target));
      if (text && !headers.has(text)) blocks.push({ text: `Page header:\n${text}` });
      headers.add(text);
    }
    blocks.push(...(await this.#blocks(body, main)));
    blocks.push(
      ...(await this.#notes(main, 'footnotes')),
      ...(await this.#notes(main, 'endnotes')),
    );
    return joinBlocks(blocks);
  }

  async #notes(main: string, kind: 'footnotes' | 'endnotes'): Promise<Block[]> {
    const rel = await this.pkg.rel(main, kind);
    if (!rel || rel.external) return [];
    const blocks: Block[] = [];
    const name = kind === 'footnotes' ? 'w:footnote' : 'w:endnote';
    for (const note of children(await this.pkg.xml(rel.target), name)) {
      // The separator lines are notes too.
      if ((attr(note, 'w:type') ?? 'normal') !== 'normal') continue;
      const text = joinBlocks(await this.#blocks(note, rel.target)).replace(/\s*\n\s*/g, ' ');
      if (text)
        blocks.push({ text: `[^${noteKey(kind, attr(note, 'w:id'))}]: ${text}`, list: kind });
    }
    return blocks;
  }

  async #blocks(container: XmlElement | undefined, part: string): Promise<Block[]> {
    const blocks: Block[] = [];
    for (const node of children(container)) {
      if (node.name === 'w:p') blocks.push(...(await this.#paragraph(node, part)));
      else if (node.name === 'w:tbl') blocks.push({ text: await this.#table(node, part) });
      else if (node.name === 'w:sdt') {
        blocks.push(...(await this.#blocks(child(node, 'w:sdtContent'), part)));
      } else if (node.name === 'w:customXml') blocks.push(...(await this.#blocks(node, part)));
      else if (node.name === 'mc:AlternateContent') {
        blocks.push(...(await this.#blocks(branch(node), part)));
      }
    }
    return blocks;
  }

  async #paragraph(p: XmlElement, part: string): Promise<Block[]> {
    const inline: Inline = { text: '', after: [] };
    await this.#inline(p, part, inline);
    const text = inline.text
      .split('\n')
      .map((line) => line.trim())
      .join('\n')
      .trim();
    if (!text) return inline.after;
    const pPr = child(p, 'w:pPr');
    const style = attr(child(pPr, 'w:pStyle'), 'w:val');
    const outline = intAttr(child(pPr, 'w:outlineLvl'), 'w:val');
    const heading =
      outline === undefined
        ? this.#style(style, 'heading')
        : outline < 9
          ? hashes(outline)
          : undefined;
    const numPr = child(pPr, 'w:numPr');
    const numId = attr(child(numPr, 'w:numId'), 'w:val') ?? this.#style(style, 'numId');
    const ilvl = intAttr(child(numPr, 'w:ilvl'), 'w:val') ?? this.#style(style, 'ilvl') ?? 0;
    const marker = numId && numId !== '0' ? this.#marker(numId, ilvl) : undefined;
    const numbered = marker ? `${marker} ` : '';
    let block: Block;
    if (heading) block = { text: `${'#'.repeat(heading)} ${numbered}${text.replace(/\n+/g, ' ')}` };
    else if (marker !== undefined) {
      const indent = '  '.repeat(ilvl);
      block = { text: `${indent}${numbered}${text.replace(/\n/g, `\n${indent}  `)}`, list: numId };
    } else block = { text };
    return [block, ...inline.after];
  }

  async #inline(el: XmlElement | undefined, part: string, out: Inline): Promise<void> {
    for (const node of children(el)) {
      switch (node.name) {
        case 'w:r':
          await this.#run(node, part, out);
          break;
        case 'w:hyperlink': {
          const inner: Inline = { text: '', after: out.after };
          await this.#inline(node, part, inner);
          const id = attr(node, 'r:id');
          const rel = id ? (await this.pkg.rels(part)).get(id) : undefined;
          const words = inner.text.trim();
          out.text +=
            rel?.external && words && words !== rel.target
              ? `[${inner.text}](${rel.target})`
              : inner.text;
          break;
        }
        case 'w:ins':
        case 'w:moveTo':
        case 'w:smartTag':
        case 'w:customXml':
        case 'w:fldSimple':
        case 'w:bdo':
        case 'w:dir':
          await this.#inline(node, part, out);
          break;
        case 'w:sdt':
          await this.#inline(child(node, 'w:sdtContent'), part, out);
          break;
        case 'mc:AlternateContent':
          await this.#inline(branch(node), part, out);
          break;
        case 'm:oMath':
        case 'm:oMathPara':
          out.text += clean(descendants(node, 'm:t').map(textOf).join(''));
          break;
      }
    }
  }

  async #run(r: XmlElement | undefined, part: string, out: Inline): Promise<void> {
    for (const node of children(r)) {
      switch (node.name) {
        case 'w:t':
          out.text += clean(textOf(node));
          break;
        case 'w:tab':
        case 'w:ptab':
          out.text += '\t';
          break;
        case 'w:br':
        case 'w:cr':
          out.text += '\n';
          break;
        case 'w:noBreakHyphen':
          out.text += '-';
          break;
        case 'w:footnoteReference':
          out.text += `[^${noteKey('footnotes', attr(node, 'w:id'))}]`;
          break;
        case 'w:endnoteReference':
          out.text += `[^${noteKey('endnotes', attr(node, 'w:id'))}]`;
          break;
        case 'w:drawing':
        case 'w:pict':
        case 'w:object':
          await this.#drawing(node, part, out);
          break;
        case 'mc:AlternateContent':
          await this.#run(branch(node), part, out);
          break;
      }
    }
  }

  /** A drawing's pictures where it stands, and its text boxes, chart or SmartArt after it. */
  async #drawing(el: XmlElement | undefined, part: string, out: Inline): Promise<void> {
    for (const node of children(el)) {
      if (node.name === 'mc:AlternateContent') await this.#drawing(branch(node), part, out);
      else if (node.name === 'a:blip') {
        out.text += await this.pictures.byRel(part, attr(node, 'r:embed'));
      } else if (node.name === 'v:imagedata') {
        out.text += await this.pictures.byRel(part, attr(node, 'r:id'));
      } else if (node.name === 'w:txbxContent') out.after.push(...(await this.#blocks(node, part)));
      else if (node.name === 'c:chart' || node.name === 'dgm:relIds') {
        const text = await graphicText(el, part, this.pictures);
        if (text) out.after.push({ text });
      } else await this.#drawing(node, part, out);
    }
  }

  async #table(tbl: XmlElement, part: string): Promise<string> {
    const rows: string[][] = [];
    for (const tr of within(tbl, 'w:tr')) {
      const row: string[] = [];
      for (const tc of within(tr, 'w:tc')) {
        const tcPr = child(tc, 'w:tcPr');
        const merge = child(tcPr, 'w:vMerge');
        // A cell merged with the one above it says nothing of its own.
        const continued = merge !== undefined && attr(merge, 'w:val') !== 'restart';
        row.push(continued ? '' : joinBlocks(await this.#blocks(tc, part)));
        const span = intAttr(child(tcPr, 'w:gridSpan'), 'w:val') ?? 1;
        for (let i = 1; i < span; i++) row.push('');
      }
      rows.push(row);
    }
    return table(rows);
  }
}

/** The key of a note in the Markdown: `3` for a footnote, `e3` for an endnote. */
const noteKey = (kind: 'footnotes' | 'endnotes', id: string | undefined) =>
  `${kind === 'endnotes' ? 'e' : ''}${id ?? ''}`;

export async function readWord(
  pkg: PackageReader,
  main: string,
  pictures: Pictures,
): Promise<string> {
  const [styles, numbering] = await Promise.all([readStyles(pkg, main), readNumbering(pkg, main)]);
  return new WordReader(pkg, pictures, styles, numbering).document(main);
}
