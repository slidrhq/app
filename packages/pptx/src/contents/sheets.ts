import type { PackageReader } from '../import/package';
import { attr, boolAttr, child, children, intAttr, path, textOf, type XmlElement } from '../xml';
import {
  branch,
  clean,
  drawingParagraph,
  graphicText,
  joinBlocks,
  table,
  tidy,
  type Pictures,
} from './common';

/*
 * An Excel workbook as Markdown: each sheet as a table of the cells that hold something, under
 * the letters of its columns and beside the numbers of its rows, so that a cell is named as Excel
 * names it. A value is written as Excel shows it where that is a date or a percentage, and a
 * formula Excel did not calculate as the formula. What the sheet's drawing holds (pictures,
 * charts, text boxes) follows, each with the cell it is anchored at.
 */

/** The most rows and columns a sheet's table shows; it says what it left out. */
const MAX_ROWS = 1000;
const MAX_COLUMNS = 50;

/** The number formats Excel has built in that show a date or a time, and a percentage. */
const DATES = new Set([
  14, 15, 16, 17, 18, 19, 20, 21, 22, 27, 28, 29, 30, 31, 32, 33, 34, 35, 36, 45, 46, 47, 50, 51,
  52, 53, 54, 55, 56, 57, 58,
]);
const PERCENTS = new Set([9, 10]);

type Shown = 'date' | 'percent' | undefined;

/** What a number format shows a number as, from its code: `dd/mm/yyyy`, `0.0%`. */
function shownAs(code: string): Shown {
  const bare = code
    .split(';')[0]!
    .replace(/"[^"]*"/g, '')
    .replace(/[\\_*]./g, '')
    // Colours and locales go; elapsed time, `[h]:mm`, stays.
    .replace(/\[(?![hms]+\])[^\]]*\]/gi, '');
  if (/[dmyhs]/i.test(bare)) return 'date';
  return bare.includes('%') ? 'percent' : undefined;
}

/** What each cell format shows a number as, by the index a cell's `s` names. */
async function formats(pkg: PackageReader, main: string): Promise<Shown[]> {
  const rel = await pkg.rel(main, 'styles');
  const xml = rel && !rel.external ? await pkg.xml(rel.target) : undefined;
  const codes = new Map<number, string>();
  for (const format of children(child(xml, 'x:numFmts'), 'x:numFmt')) {
    codes.set(intAttr(format, 'numFmtId') ?? -1, attr(format, 'formatCode') ?? '');
  }
  return children(child(xml, 'x:cellXfs'), 'x:xf').map((xf) => {
    const id = intAttr(xf, 'numFmtId') ?? 0;
    const code = codes.get(id);
    if (code !== undefined) return shownAs(code);
    return DATES.has(id) ? 'date' : PERCENTS.has(id) ? 'percent' : undefined;
  });
}

/** A string of the workbook: plain, or in runs; the reading aids of East Asian text left out. */
function stringItem(si: XmlElement | undefined): string {
  const plain = child(si, 'x:t');
  return clean(
    plain
      ? textOf(plain)
      : children(si, 'x:r')
          .map((r) => textOf(child(r, 'x:t')))
          .join(''),
  );
}

async function sharedStrings(pkg: PackageReader, main: string): Promise<string[]> {
  const rel = await pkg.rel(main, 'sharedStrings');
  const xml = rel && !rel.external ? await pkg.xml(rel.target) : undefined;
  return children(xml, 'x:si').map(stringItem);
}

/** Days from Excel's day 0 to 1970-01-01, in its two date systems. */
const EPOCH_1900 = 25569;
const EPOCH_1904 = 24107;
/** 9999-12-31, the last day Excel has. */
const LAST_DAY = 2958465;

/** A date of Excel, a number of days, in ISO form: the day, the time of day, or both. */
function dateText(serial: number, date1904: boolean): string {
  const seconds = Math.round((serial - (date1904 ? EPOCH_1904 : EPOCH_1900)) * 86400);
  const iso = new Date(seconds * 1000).toISOString();
  const day = iso.slice(0, 10);
  const time = iso.slice(11, 19).replace(/:00$/, '');
  if (serial < 1) return time;
  return Number.isInteger(serial) ? day : `${day} ${time}`;
}

interface Book {
  strings: string[];
  shown: Shown[];
  date1904: boolean;
}

function cellText(c: XmlElement, book: Book): string {
  const value = textOf(child(c, 'x:v'));
  switch (attr(c, 't')) {
    case 's':
      return value === '' ? '' : (book.strings[Number(value)] ?? '');
    case 'inlineStr':
      return stringItem(child(c, 'x:is'));
    case 'b':
      return value === '1' ? 'TRUE' : value === '0' ? 'FALSE' : value;
    case 'str':
    case 'e':
    case 'd':
      return clean(value);
  }
  if (value === '') {
    const formula = textOf(child(c, 'x:f'));
    return formula ? `=${clean(formula)}` : '';
  }
  const n = Number(value);
  const shown = book.shown[intAttr(c, 's') ?? 0];
  if (shown === 'date' && n >= 0 && n <= LAST_DAY) return dateText(n, book.date1904);
  if (shown === 'percent' && Number.isFinite(n)) return `${tidy(String(n * 100))}%`;
  return tidy(value);
}

/** The index of a cell's column, from 0: `C7` → 2. */
function columnOf(ref: string): number {
  let n = 0;
  for (const char of ref.toUpperCase()) {
    const code = char.charCodeAt(0);
    if (code < 65 || code > 90) break;
    n = n * 26 + code - 64;
  }
  return n - 1;
}

/** The letters of a column, from its index: 27 → `AB`. */
function columnName(index: number): string {
  let name = '';
  for (let n = index + 1; n > 0; n = Math.floor((n - 1) / 26)) {
    name = String.fromCharCode(65 + ((n - 1) % 26)) + name;
  }
  return name;
}

function sheetTable(sheet: XmlElement | undefined, book: Book): string {
  const rows: { number: number; cells: Map<number, string> }[] = [];
  let first = Infinity;
  let last = -1;
  let number = 0;
  for (const row of children(child(sheet, 'x:sheetData'), 'x:row')) {
    number = intAttr(row, 'r') ?? number + 1;
    const cells = new Map<number, string>();
    let column = -1;
    for (const c of children(row, 'x:c')) {
      const ref = attr(c, 'r');
      column = ref ? columnOf(ref) : column + 1;
      const text = cellText(c, book).trim();
      if (!text) continue;
      cells.set(column, text);
      first = Math.min(first, column);
      last = Math.max(last, column);
    }
    if (cells.size > 0) rows.push({ number, cells });
  }
  if (rows.length === 0) return '';
  const end = Math.min(last, first + MAX_COLUMNS - 1);
  const columns = Array.from({ length: end - first + 1 }, (_, i) => first + i);
  const grid = table([
    ['', ...columns.map(columnName)],
    ...rows
      .slice(0, MAX_ROWS)
      .map((row) => [String(row.number), ...columns.map((i) => row.cells.get(i) ?? '')]),
  ]);
  const left: string[] = [];
  if (rows.length > MAX_ROWS) {
    left.push(
      `(${rows.length - MAX_ROWS} more rows, from row ${rows[MAX_ROWS]!.number}, not shown)`,
    );
  }
  if (last > end) left.push(`(columns ${columnName(end + 1)}–${columnName(last)} not shown)`);
  return [grid, ...left].join('\n\n');
}

/** What an anchor of a sheet's drawing holds: pictures, charts, text boxes, groups of them. */
async function anchored(
  el: XmlElement | undefined,
  part: string,
  pictures: Pictures,
): Promise<string> {
  const parts: string[] = [];
  for (const node of children(el)) {
    switch (node.name) {
      case 'xdr:pic':
        parts.push(
          await pictures.byRel(part, attr(path(node, 'xdr:blipFill', 'a:blip'), 'r:embed')),
        );
        break;
      case 'xdr:graphicFrame':
        parts.push(await graphicText(path(node, 'a:graphic', 'a:graphicData'), part, pictures));
        break;
      case 'xdr:sp':
        parts.push(
          children(child(node, 'xdr:txBody'), 'a:p')
            .map((p) => drawingParagraph(p).trim())
            .filter(Boolean)
            .join('\n'),
        );
        break;
      case 'xdr:grpSp':
        parts.push(await anchored(node, part, pictures));
        break;
      case 'mc:AlternateContent':
        parts.push(await anchored(branch(node), part, pictures));
        break;
    }
  }
  return parts.filter(Boolean).join('\n\n');
}

/** What the drawing of a sheet (or of a chart sheet) holds, each with its cell. */
async function drawingText(
  pkg: PackageReader,
  part: string,
  sheet: XmlElement | undefined,
  pictures: Pictures,
): Promise<string[]> {
  const id = attr(child(sheet, 'x:drawing'), 'r:id');
  const rel = id ? (await pkg.rels(part)).get(id) : undefined;
  if (!rel || rel.external) return [];
  const anchors = children(await pkg.xml(rel.target)).flatMap((node) =>
    node.name === 'mc:AlternateContent' ? children(branch(node)) : [node],
  );
  const blocks: string[] = [];
  for (const anchor of anchors) {
    const content = await anchored(anchor, rel.target, pictures);
    if (!content) continue;
    const from = child(anchor, 'xdr:from');
    const column = Number(textOf(child(from, 'xdr:col')));
    const row = Number(textOf(child(from, 'xdr:row')));
    blocks.push(from ? `At ${columnName(column)}${row + 1}: ${content}` : content);
  }
  return blocks;
}

export async function readSheets(
  pkg: PackageReader,
  main: string,
  pictures: Pictures,
): Promise<string> {
  const workbook = await pkg.xml(main);
  const rels = await pkg.rels(main);
  const [strings, shown] = await Promise.all([sharedStrings(pkg, main), formats(pkg, main)]);
  const book: Book = {
    strings,
    shown,
    date1904: boolAttr(child(workbook, 'x:workbookPr'), 'date1904') ?? false,
  };
  const out: string[] = [];
  for (const entry of children(child(workbook, 'x:sheets'), 'x:sheet')) {
    const rel = rels.get(attr(entry, 'r:id') ?? '');
    if (!rel || rel.external) continue;
    const sheet = await pkg.xml(rel.target);
    const state = attr(entry, 'state');
    const hidden = state === 'hidden' || state === 'veryHidden' ? ' (hidden)' : '';
    const blocks = [
      sheetTable(sheet, book),
      ...(await drawingText(pkg, rel.target, sheet, pictures)),
    ].filter(Boolean);
    out.push(
      joinBlocks(
        [`## Sheet: ${clean(attr(entry, 'name') ?? '')}${hidden}`, ...blocks].map((text) => ({
          text,
        })),
      ) + (blocks.length === 0 ? '\n\n(empty)' : ''),
    );
  }
  return out.join('\n\n');
}
