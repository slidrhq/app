import type { PackageReader } from '../import/package';
import { attr, child, children, intAttr, path, type XmlElement } from '../xml';
import { branch, drawingParagraph, graphicText, joinBlocks, table, type Pictures } from './common';

/*
 * A PowerPoint presentation as Markdown: each slide in the order the presentation lists them,
 * headed by its title, with the text of its shapes in the order they are drawn, its tables,
 * charts, SmartArt and pictures, and its speaker notes. What the layouts and the master draw on
 * every slide (a logo, a footer, the slide's number) is left out.
 */

/** Placeholders whose text is the slide's frame, not its content. */
const FRAME = new Set(['sldNum', 'dt', 'ftr', 'hdr']);

/** What a slide is building: its title, and the blocks of its content. */
interface Slide {
  title?: string;
  blocks: string[];
}

/**
 * The text of a shape: a line for each paragraph, as a list item where it has a bullet. The
 * content placeholders of a layout have bullets unless the paragraph says it has none.
 */
function bodyText(body: XmlElement | undefined, bulleted: boolean): string {
  const lines: string[] = [];
  for (const p of children(body, 'a:p')) {
    const text = drawingParagraph(p).trim();
    if (!text) continue;
    const pPr = child(p, 'a:pPr');
    const marked = child(pPr, 'a:buChar', 'a:buAutoNum', 'a:buBlip') !== undefined;
    if (marked || (bulleted && !child(pPr, 'a:buNone'))) {
      const indent = '  '.repeat(intAttr(pPr, 'lvl') ?? 0);
      lines.push(`${indent}- ${text.replace(/\n/g, `\n${indent}  `)}`);
    } else lines.push(text);
  }
  return lines.join('\n');
}

function tableText(tbl: XmlElement): string {
  return table(
    children(tbl, 'a:tr').map((tr) =>
      children(tr, 'a:tc').map((tc) =>
        // A merged cell's text is in the first cell of the merge.
        attr(tc, 'hMerge') || attr(tc, 'vMerge')
          ? ''
          : children(child(tc, 'a:txBody'), 'a:p')
              .map((p) => drawingParagraph(p).trim())
              .filter(Boolean)
              .join('\n'),
      ),
    ),
  );
}

async function shapes(
  tree: XmlElement | undefined,
  part: string,
  pictures: Pictures,
  slide: Slide,
): Promise<void> {
  for (const node of children(tree)) {
    switch (node.name) {
      case 'p:sp': {
        const placeholder = path(node, 'p:nvSpPr', 'p:nvPr', 'p:ph');
        const type = attr(placeholder, 'type');
        if (type && FRAME.has(type)) break;
        const fill = path(node, 'p:spPr', 'a:blipFill', 'a:blip');
        if (fill) slide.blocks.push(await pictures.byRel(part, attr(fill, 'r:embed')));
        const content = !type || type === 'body' || type === 'obj';
        const text = bodyText(child(node, 'p:txBody'), placeholder !== undefined && content);
        if ((type === 'title' || type === 'ctrTitle') && slide.title === undefined) {
          slide.title = text.replace(/\s*\n\s*/g, ' ');
        } else slide.blocks.push(text);
        break;
      }
      case 'p:pic':
        slide.blocks.push(
          await pictures.byRel(part, attr(path(node, 'p:blipFill', 'a:blip'), 'r:embed')),
        );
        break;
      case 'p:graphicFrame': {
        const data = path(node, 'a:graphic', 'a:graphicData');
        const tbl = child(data, 'a:tbl');
        slide.blocks.push(tbl ? tableText(tbl) : await graphicText(data, part, pictures));
        break;
      }
      case 'p:grpSp':
        await shapes(node, part, pictures, slide);
        break;
      case 'mc:AlternateContent':
        await shapes(branch(node), part, pictures, slide);
        break;
    }
  }
}

/** The speaker notes of a slide: the text of its notes page's body. */
async function notes(pkg: PackageReader, part: string): Promise<string> {
  const rel = await pkg.rel(part, 'notesSlide');
  if (!rel || rel.external) return '';
  const tree = path(await pkg.xml(rel.target), 'p:cSld', 'p:spTree');
  const bodies = children(tree, 'p:sp').filter(
    (sp) => attr(path(sp, 'p:nvSpPr', 'p:nvPr', 'p:ph'), 'type') === 'body',
  );
  return bodies.map((sp) => bodyText(child(sp, 'p:txBody'), false)).join('\n');
}

export async function readSlides(
  pkg: PackageReader,
  main: string,
  pictures: Pictures,
): Promise<string> {
  const presentation = await pkg.xml(main);
  const rels = await pkg.rels(main);
  const out: string[] = [];
  let number = 0;
  for (const id of children(child(presentation, 'p:sldIdLst'), 'p:sldId')) {
    const rel = rels.get(attr(id, 'r:id') ?? '');
    if (!rel || rel.external) continue;
    number++;
    const xml = await pkg.xml(rel.target);
    const slide: Slide = { blocks: [] };
    await shapes(path(xml, 'p:cSld', 'p:spTree'), rel.target, pictures, slide);
    const hidden = attr(xml, 'show') === '0' ? ' (hidden)' : '';
    const said = await notes(pkg, rel.target);
    out.push(
      joinBlocks([
        { text: `## Slide ${number}${slide.title ? `: ${slide.title}` : ''}${hidden}` },
        ...slide.blocks.map((text) => ({ text })),
        { text: said && `Speaker notes:\n${said}` },
      ]),
    );
  }
  return out.join('\n\n');
}
