import { points, richText } from '../import/chart';
import type { PackageReader } from '../import/package';
import { attr, child, children, descendants, textOf, type XmlElement } from '../xml';

/*
 * What every kind of Office file shares when it is read for the agent (ADR-115): its pictures,
 * taken out as files of their own and marked where they stand, its charts as the values they
 * cache, its SmartArt as the points it lists, and the Markdown they are all written in.
 */

/** A picture of the file, in a format the agent can look at. */
export interface OfficePicture {
  mime: 'image/png' | 'image/jpeg' | 'image/gif' | 'image/webp';
  /** Without the dot: `png`. */
  extension: string;
  bytes: Uint8Array;
}

const MIME: Record<string, OfficePicture['mime']> = {
  png: 'image/png',
  jpg: 'image/jpeg',
  jpeg: 'image/jpeg',
  jpe: 'image/jpeg',
  gif: 'image/gif',
  webp: 'image/webp',
};

/** The most pictures taken out of one file; the others are named and left in it. */
export const MAX_PICTURES = 20;
/** Smaller than this, a picture is a bullet, a spacer or a rule: nothing to look at. */
const MIN_PICTURE_BYTES = 1024;
/** What stands for a picture that was not taken out: an EMF drawing, or one past the limit. */
const LEFT_IN = '[picture]';

/** A picture's place in the text, until the paths of the pictures are known. */
export const MARK = /\uE000(\d+)\uE001/g;
/** A file's own text, with the mark's characters taken out so that none of it reads as one. */
export const clean = (text: string): string => text.replace(/[\uE000\uE001]/g, '');

/** The pictures of a file, each taken out once however often it is used. */
export class Pictures {
  readonly list: OfficePicture[] = [];
  readonly #marks = new Map<string, Promise<string>>();

  constructor(readonly pkg: PackageReader) {}

  /** The mark of the picture a part points at by a relationship: '' when there is none. */
  async byRel(source: string, id: string | undefined): Promise<string> {
    if (!id) return '';
    const rel = (await this.pkg.rels(source)).get(id);
    if (!rel || rel.external) return '';
    let mark = this.#marks.get(rel.target);
    if (!mark) {
      mark = this.#take(rel.target);
      this.#marks.set(rel.target, mark);
    }
    return mark;
  }

  async #take(part: string): Promise<string> {
    const size = this.pkg.size(part);
    if (size === undefined) return '';
    const extension = part.slice(part.lastIndexOf('.') + 1).toLowerCase();
    const mime = MIME[extension];
    if (mime && size < MIN_PICTURE_BYTES) return '';
    if (!mime || this.list.length >= MAX_PICTURES) return LEFT_IN;
    const bytes = await this.pkg.bytes(part);
    if (!bytes) return '';
    this.list.push({ mime, extension: mime === 'image/jpeg' ? 'jpg' : extension, bytes });
    return `\uE000${this.list.length - 1}\uE001`;
  }
}

/** The branch of `mc:AlternateContent` to read: the first choice, which is the richer one. */
export const branch = (alternate: XmlElement): XmlElement | undefined =>
  child(alternate, 'mc:Choice') ?? child(alternate, 'mc:Fallback');

/** A number as a spreadsheet shows it: without the noise of binary fractions. */
export function tidy(value: string): string {
  const n = Number(value);
  return value.trim() !== '' && Number.isFinite(n) ? String(Number(n.toPrecision(15))) : value;
}

/** A cell of a Markdown table: one line, its bars escaped. */
const cell = (text: string) =>
  text
    .trim()
    .replace(/\|/g, '\\|')
    .replace(/\s*\n\s*/g, '<br>');

/** Rows as a Markdown table, the first row its head; '' when every cell is empty. */
export function table(rows: readonly (readonly string[])[]): string {
  if (rows.every((row) => row.every((text) => !text.trim()))) return '';
  const width = Math.max(...rows.map((row) => row.length));
  const line = (row: readonly string[]) =>
    `| ${Array.from({ length: width }, (_, i) => cell(row[i] ?? '')).join(' | ')} |`;
  const [head, ...body] = rows;
  return [line(head!), `|${' --- |'.repeat(width)}`, ...body.map(line)].join('\n');
}

/** The text of a paragraph of DrawingML (`a:p`): a shape's, a cell's, a chart's. */
export function drawingParagraph(p: XmlElement): string {
  let text = '';
  for (const node of children(p)) {
    if (node.name === 'a:r' || node.name === 'a:fld') text += textOf(child(node, 'a:t'));
    else if (node.name === 'a:br') text += '\n';
    // An equation: its letters in a row, which says more than its fallback picture.
    else if (node.name === 'mc:AlternateContent') {
      text += descendants(branch(node), 'm:t').map(textOf).join('');
    }
  }
  return clean(text);
}

/** The most categories a chart's table shows. */
const MAX_CHART_ROWS = 200;

/** A chart as what it shows: its type and title, and the values it caches as a table. */
export async function chartText(pkg: PackageReader, part: string): Promise<string> {
  const chart = child(await pkg.xml(part), 'c:chart');
  const plot = child(chart, 'c:plotArea');
  const types = children(plot).filter((el) => /^c:\w+Chart$/.test(el.name));
  const kinds = types.map((el) => el.name.slice(2, -5)).join(', ');
  const title = clean(richText(child(chart, 'c:title')) ?? '');
  const head = `Chart${kinds ? ` (${kinds})` : ''}${title ? `: ${title}` : ''}`;
  const series = types.flatMap((el) => children(el, 'c:ser'));
  const names = series.map((ser, i) => {
    const tx = child(ser, 'c:tx');
    return clean(points(tx).values.get(0) ?? textOf(child(tx, 'c:v'))).trim() || `Series ${i + 1}`;
  });
  const values = series.map((ser) => points(child(ser, 'c:val') ?? child(ser, 'c:yVal')));
  const labeled = series.find((ser) => child(ser, 'c:cat') ?? child(ser, 'c:xVal'));
  const categories = points(labeled && (child(labeled, 'c:cat') ?? child(labeled, 'c:xVal')));
  const count = Math.min(MAX_CHART_ROWS, Math.max(categories.count, ...values.map((v) => v.count)));
  const rows = [['', ...names]];
  for (let i = 0; i < count; i++) {
    rows.push([
      clean(categories.values.get(i) ?? String(i + 1)),
      ...values.map((v) => tidy(v.values.get(i) ?? '')),
    ]);
  }
  const grid = series.length > 0 ? table(rows) : '';
  return grid ? `${head}\n\n${grid}` : head;
}

/** SmartArt as the points it lists, from its data part. */
export async function diagramText(pkg: PackageReader, part: string): Promise<string> {
  const list = child(await pkg.xml(part), 'dgm:ptLst');
  const lines: string[] = [];
  for (const pt of children(list, 'dgm:pt')) {
    const type = attr(pt, 'type') ?? 'node';
    if (type !== 'node') continue;
    const text = children(child(pt, 'dgm:t'), 'a:p')
      .map((p) => drawingParagraph(p).trim())
      .filter(Boolean)
      .join(' ');
    if (text) lines.push(`- ${text}`);
  }
  return lines.join('\n');
}

/**
 * What a frame of DrawingML holds (`a:graphicData`), from the part it is in: a picture's mark, a
 * chart, or SmartArt. Tables are each kind's own. '' for anything else.
 */
export async function graphicText(
  data: XmlElement | undefined,
  source: string,
  pictures: Pictures,
): Promise<string> {
  const target = async (id: string | undefined) => {
    const rel = id ? (await pictures.pkg.rels(source)).get(id) : undefined;
    return rel && !rel.external ? rel.target : undefined;
  };
  const picture = child(data, 'pic:pic');
  if (picture) {
    return pictures.byRel(source, attr(child(child(picture, 'pic:blipFill'), 'a:blip'), 'r:embed'));
  }
  const chart = await target(attr(child(data, 'c:chart'), 'r:id'));
  if (chart) return chartText(pictures.pkg, chart);
  const diagram = await target(attr(child(data, 'dgm:relIds'), 'r:dm'));
  if (diagram) return diagramText(pictures.pkg, diagram);
  return '';
}

/** A block of Markdown; an item of a list says which list. */
export interface Block {
  text: string;
  list?: string;
}

/** Blocks of Markdown, a blank line between each; the items of a list one under another. */
export function joinBlocks(blocks: readonly Block[]): string {
  let out = '';
  let list: string | undefined;
  for (const block of blocks) {
    if (!block.text) continue;
    if (out) out += list !== undefined && block.list === list ? '\n' : '\n\n';
    out += block.text;
    list = block.list;
  }
  return out;
}
