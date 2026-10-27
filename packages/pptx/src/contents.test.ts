import { describe, expect, it } from 'vitest';
import { isOfficeFile, MAX_PICTURES, OfficeReadError, readOfficeFile } from './contents';
import { officeFile } from './testing';
import { writeZip } from './zip';

/*
 * A Word, PowerPoint or Excel file read for the agent (ADR-115): the Markdown it reads, and the
 * pictures it can look at. The files are made here, part by part, as Office writes them.
 */

const NS = {
  w: 'http://schemas.openxmlformats.org/wordprocessingml/2006/main',
  r: 'http://schemas.openxmlformats.org/officeDocument/2006/relationships',
  a: 'http://schemas.openxmlformats.org/drawingml/2006/main',
  pic: 'http://schemas.openxmlformats.org/drawingml/2006/picture',
  wp: 'http://schemas.openxmlformats.org/drawingml/2006/wordprocessingDrawing',
  wps: 'http://schemas.microsoft.com/office/word/2010/wordprocessingShape',
  mc: 'http://schemas.openxmlformats.org/markup-compatibility/2006',
  v: 'urn:schemas-microsoft-com:vml',
  m: 'http://schemas.openxmlformats.org/officeDocument/2006/math',
  p: 'http://schemas.openxmlformats.org/presentationml/2006/main',
  c: 'http://schemas.openxmlformats.org/drawingml/2006/chart',
  x: 'http://schemas.openxmlformats.org/spreadsheetml/2006/main',
  xdr: 'http://schemas.openxmlformats.org/drawingml/2006/spreadsheetDrawing',
};
const xmlns = (...prefixes: (keyof typeof NS)[]) =>
  prefixes.map((prefix) => `xmlns:${prefix}="${NS[prefix]}"`).join(' ');

const TYPE = 'http://schemas.openxmlformats.org/officeDocument/2006/relationships/';

/** A relationships part: `[id, type, target]`, an external one with a fourth item. */
const rels = (...items: [string, string, string, 'External'?][]) =>
  `<Relationships xmlns="http://schemas.openxmlformats.org/package/2006/relationships">${items
    .map(
      ([id, type, target, mode]) =>
        `<Relationship Id="${id}" Type="${TYPE}${type}" Target="${target}"${mode ? ` TargetMode="${mode}"` : ''}/>`,
    )
    .join('')}</Relationships>`;

/** The bytes of a picture large enough to be taken out; the reader looks at its name only. */
const picture = (seed: number) => new Uint8Array(2048).fill(seed);

const pathsOf = (count: number, stem: string) =>
  Array.from({ length: count }, (_, i) => `${stem}.picture-${i + 1}.png`);

const run = (text: string) => `<w:r><w:t xml:space="preserve">${text}</w:t></w:r>`;
const para = (inner: string, pPr = '') =>
  `<w:p>${pPr ? `<w:pPr>${pPr}</w:pPr>` : ''}${inner}</w:p>`;
const item = (numId: number, ilvl: number, text: string) =>
  para(run(text), `<w:numPr><w:ilvl w:val="${ilvl}"/><w:numId w:val="${numId}"/></w:numPr>`);
const inlinePicture = (id: string) =>
  `<w:r><w:drawing><wp:inline><a:graphic><a:graphicData uri="http://schemas.openxmlformats.org/drawingml/2006/picture"><pic:pic><pic:blipFill><a:blip r:embed="${id}"/></pic:blipFill></pic:pic></a:graphicData></a:graphic></wp:inline></w:drawing></w:r>`;
const textBox = (text: string) =>
  `<w:r><mc:AlternateContent><mc:Choice Requires="wps"><w:drawing><wp:anchor><a:graphic><a:graphicData uri="http://schemas.microsoft.com/office/word/2010/wordprocessingShape"><wps:wsp><wps:txbx><w:txbxContent>${para(run(text))}</w:txbxContent></wps:txbx></wps:wsp></a:graphicData></a:graphic></wp:anchor></w:drawing></mc:Choice><mc:Fallback><w:pict><v:shape><v:textbox><w:txbxContent>${para(run(text))}</w:txbxContent></v:textbox></v:shape></w:pict></mc:Fallback></mc:AlternateContent></w:r>`;

function wordFile(body: string, more: Record<string, string | Uint8Array> = {}) {
  return officeFile('word/document.xml', {
    'word/document.xml': `<w:document ${xmlns('w', 'r', 'a', 'pic', 'wp', 'wps', 'mc', 'v', 'm')}><w:body>${body}</w:body></w:document>`,
    ...more,
  });
}

describe('a Word document', () => {
  it('reads as Word shows it: headings, lists, tables, links, notes, boxes and pictures', async () => {
    const body = [
      para(run('On every page'), ''),
      // Hebrew Word names its styles by number; the name inside is the English one.
      para(run('מבוא'), '<w:pStyle w:val="1"/>'),
      para(
        `${run('Text with ')}<w:del><w:r><w:delText>deleted </w:delText></w:r></w:del><w:ins>${run('inserted')}</w:ins><w:r><w:footnoteReference w:id="1"/></w:r>`,
      ),
      para(`<w:hyperlink r:id="rLink">${run('the site')}</w:hyperlink>`),
      item(1, 0, 'one'),
      item(1, 0, 'two'),
      item(1, 1, 'nested'),
      item(1, 0, 'three'),
      item(2, 0, 'point'),
      `<w:tbl><w:tr><w:tc>${para(run('Name'))}</w:tc><w:tc><w:tcPr><w:gridSpan w:val="2"/></w:tcPr>${para(run('Value'))}</w:tc></w:tr>` +
        `<w:tr><w:tc>${para(run('a|b'))}</w:tc><w:tc><w:tcPr><w:vMerge w:val="restart"/></w:tcPr>${para(run('x'))}</w:tc><w:tc>${para(run('y'))}</w:tc></w:tr>` +
        `<w:tr><w:tc>${para(run('c'))}</w:tc><w:tc><w:tcPr><w:vMerge/></w:tcPr>${para('')}</w:tc><w:tc>${para(run('z'))}</w:tc></w:tr></w:tbl>`,
      para(
        `${run('A picture: ')}${inlinePicture('rPic')}${run(' and again ')}${inlinePicture('rPic')}${inlinePicture('rTiny')}${inlinePicture('rEmf')}`,
      ),
      para(`${run('Before the box')}${textBox('In a box')}`),
      para('<m:oMath><m:r><m:t>x=1</m:t></m:r></m:oMath>'),
      para(run('Marks 0 are text')),
      '<w:sectPr><w:headerReference w:type="default" r:id="rHead"/></w:sectPr>',
    ].join('');
    const file = await wordFile(body, {
      'word/_rels/document.xml.rels': rels(
        ['rStyles', 'styles', 'styles.xml'],
        ['rNum', 'numbering', 'numbering.xml'],
        ['rFoot', 'footnotes', 'footnotes.xml'],
        ['rHead', 'header', 'header1.xml'],
        ['rLink', 'hyperlink', 'https://example.com/', 'External'],
        ['rPic', 'image', 'media/image1.png'],
        ['rTiny', 'image', 'media/image2.png'],
        ['rEmf', 'image', 'media/image3.emf'],
      ),
      'word/styles.xml': `<w:styles ${xmlns('w')}><w:style w:type="paragraph" w:styleId="1"><w:name w:val="heading 1"/><w:pPr><w:outlineLvl w:val="0"/></w:pPr></w:style></w:styles>`,
      'word/numbering.xml': `<w:numbering ${xmlns('w')}>
        <w:abstractNum w:abstractNumId="0">
          <w:lvl w:ilvl="0"><w:start w:val="1"/><w:numFmt w:val="hebrew1"/><w:lvlText w:val="%1."/></w:lvl>
          <w:lvl w:ilvl="1"><w:start w:val="1"/><w:numFmt w:val="decimal"/><w:lvlText w:val="%1.%2."/></w:lvl>
        </w:abstractNum>
        <w:abstractNum w:abstractNumId="1"><w:lvl w:ilvl="0"><w:numFmt w:val="bullet"/><w:lvlText w:val=""/></w:lvl></w:abstractNum>
        <w:num w:numId="1"><w:abstractNumId w:val="0"/></w:num>
        <w:num w:numId="2"><w:abstractNumId w:val="1"/></w:num>
      </w:numbering>`,
      'word/footnotes.xml': `<w:footnotes ${xmlns('w')}><w:footnote w:type="separator" w:id="-1">${para('<w:r><w:separator/></w:r>')}</w:footnote><w:footnote w:id="1">${para(run('A note'))}</w:footnote></w:footnotes>`,
      'word/header1.xml': `<w:hdr ${xmlns('w')}>${para(run('Letterhead'))}</w:hdr>`,
      'word/media/image1.png': picture(1),
      'word/media/image2.png': new Uint8Array(10),
      'word/media/image3.emf': picture(3),
    });

    const contents = await readOfficeFile(file);
    // The picture used twice is one picture; the spacer is no picture; the EMF stays in.
    expect(contents.pictures).toEqual([{ mime: 'image/png', extension: 'png', bytes: picture(1) }]);
    const shown = '![picture 1](<doc.docx.picture-1.png>)';
    expect(contents.markdown(pathsOf(1, 'doc.docx'))).toBe(
      [
        'Page header:\nLetterhead',
        'On every page',
        '## מבוא',
        'Text with inserted[^1]',
        '[the site](https://example.com/)',
        'א. one\nב. two\n  ב.1. nested\nג. three',
        '- point',
        '| Name | Value |  |\n| --- | --- | --- |\n| a\\|b | x | y |\n| c |  | z |',
        `A picture: ${shown} and again ${shown}[picture]`,
        'Before the box',
        'In a box',
        'x=1',
        'Marks 0 are text',
        '[^1]: A note',
      ].join('\n\n') + '\n',
    );
  });

  it('takes out so many pictures, and names the others', async () => {
    const count = MAX_PICTURES + 1;
    const ids = Array.from({ length: count }, (_, i): [string, string, string] => [
      `rP${i}`,
      'image',
      `media/image${i}.png`,
    ]);
    const file = await wordFile(para(ids.map(([id]) => inlinePicture(id)).join('')), {
      'word/_rels/document.xml.rels': rels(...ids),
      ...Object.fromEntries(ids.map(([, , target], i) => [`word/${target}`, picture(i)])),
    });
    const contents = await readOfficeFile(file);
    expect(contents.pictures).toHaveLength(MAX_PICTURES);
    const text = contents.markdown(pathsOf(MAX_PICTURES, 'many.docx'));
    expect(text.match(/!\[picture \d+\]/g)).toHaveLength(MAX_PICTURES);
    expect(text.trim().endsWith('[picture]')).toBe(true);
    // A picture whose path the caller does not give is named, not linked.
    expect((await readOfficeFile(file)).markdown([])).not.toContain('](');
  });
});

describe('a PowerPoint presentation', () => {
  const shape = (ph: string, paragraphs: string) =>
    `<p:sp><p:nvSpPr><p:cNvPr id="2" name="s"/><p:cNvSpPr/><p:nvPr>${ph}</p:nvPr></p:nvSpPr><p:spPr/><p:txBody><a:bodyPr/>${paragraphs}</p:txBody></p:sp>`;
  const ap = (text: string, pPr = '') => `<a:p>${pPr}<a:r><a:t>${text}</a:t></a:r></a:p>`;
  const slide = (tree: string, attrs = '') =>
    `<p:sld ${xmlns('p', 'a', 'r', 'c')}${attrs}><p:cSld><p:spTree>${tree}</p:spTree></p:cSld></p:sld>`;
  const frame = (data: string) =>
    `<p:graphicFrame><a:graphic><a:graphicData>${data}</a:graphicData></a:graphic></p:graphicFrame>`;

  it('reads each slide in the order it is shown, with its title, content and notes', async () => {
    const first = slide(
      [
        shape('<p:ph type="sldNum"/>', ap('7')),
        shape('<p:ph type="title"/>', ap('Plan')),
        shape(
          '<p:ph idx="1"/>',
          ap('Goal') + ap('Detail', '<a:pPr lvl="1"/>') + ap('Plain', '<a:pPr><a:buNone/></a:pPr>'),
        ),
        frame(
          '<a:tbl><a:tr><a:tc><a:txBody><a:p><a:r><a:t>H1</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>H2</a:t></a:r></a:p></a:txBody></a:tc></a:tr>' +
            '<a:tr><a:tc><a:txBody><a:p><a:r><a:t>a</a:t></a:r></a:p></a:txBody></a:tc><a:tc><a:txBody><a:p><a:r><a:t>b</a:t></a:r></a:p></a:txBody></a:tc></a:tr></a:tbl>',
        ),
        '<p:pic><p:blipFill><a:blip r:embed="rImg"/></p:blipFill></p:pic>',
      ].join(''),
    );
    const point = (idx: number, value: string) => `<c:pt idx="${idx}"><c:v>${value}</c:v></c:pt>`;
    const series = (name: string, values: string[]) =>
      `<c:ser><c:tx><c:strRef><c:strCache>${point(0, name)}</c:strCache></c:strRef></c:tx>` +
      `<c:cat><c:strRef><c:strCache><c:ptCount val="2"/>${point(0, 'Q1')}${point(1, 'Q2')}</c:strCache></c:strRef></c:cat>` +
      `<c:val><c:numRef><c:numCache><c:ptCount val="2"/>${values.map((v, i) => point(i, v)).join('')}</c:numCache></c:numRef></c:val></c:ser>`;
    const second = slide(
      [
        shape('', ap('Free text')),
        frame('<c:chart r:id="rChart"/>'),
        `<p:grpSp>${shape('', ap('In a group'))}</p:grpSp>`,
      ].join(''),
      ' show="0"',
    );
    const file = await officeFile('ppt/presentation.xml', {
      'ppt/presentation.xml': `<p:presentation ${xmlns('p', 'r')}><p:sldIdLst><p:sldId id="256" r:id="rB"/><p:sldId id="257" r:id="rA"/></p:sldIdLst></p:presentation>`,
      'ppt/_rels/presentation.xml.rels': rels(
        ['rA', 'slide', 'slides/slide1.xml'],
        ['rB', 'slide', 'slides/slide2.xml'],
      ),
      // Listed first, though its file is the second.
      'ppt/slides/slide2.xml': first,
      'ppt/slides/_rels/slide2.xml.rels': rels(
        ['rImg', 'image', '../media/image1.png'],
        ['rN', 'notesSlide', '../notesSlides/notesSlide1.xml'],
      ),
      'ppt/notesSlides/notesSlide1.xml': `<p:notes ${xmlns('p', 'a')}><p:cSld><p:spTree>${shape('<p:ph type="sldImg"/>', '')}${shape('<p:ph type="body" idx="1"/>', ap('Say hello'))}</p:spTree></p:cSld></p:notes>`,
      'ppt/slides/slide1.xml': second,
      'ppt/slides/_rels/slide1.xml.rels': rels(['rChart', 'chart', '../charts/chart1.xml']),
      'ppt/charts/chart1.xml': `<c:chartSpace ${xmlns('c', 'a')}><c:chart><c:title><c:tx><c:rich><a:p><a:r><a:t>Sales</a:t></a:r></a:p></c:rich></c:tx></c:title><c:plotArea><c:barChart>${series('2025', ['1', '0.30000000000000004'])}${series('2026', ['2', '4'])}</c:barChart></c:plotArea></c:chart></c:chartSpace>`,
      'ppt/media/image1.png': picture(1),
    });

    const contents = await readOfficeFile(file);
    expect(contents.pictures).toHaveLength(1);
    expect(contents.markdown(pathsOf(1, 'deck.pptx'))).toBe(
      [
        '## Slide 1: Plan',
        '- Goal\n  - Detail\nPlain',
        '| H1 | H2 |\n| --- | --- |\n| a | b |',
        '![picture 1](<deck.pptx.picture-1.png>)',
        'Speaker notes:\nSay hello',
        '## Slide 2 (hidden)',
        'Free text',
        'Chart (bar): Sales\n\n|  | 2025 | 2026 |\n| --- | --- | --- |\n| Q1 | 1 | 2 |\n| Q2 | 0.3 | 4 |',
        'In a group',
      ].join('\n\n') + '\n',
    );
  });
});

describe('an Excel workbook', () => {
  const cell = (ref: string, attrs: string, inner: string) => `<c r="${ref}"${attrs}>${inner}</c>`;
  const v = (value: string) => `<v>${value}</v>`;
  const sheet = (rows: string, more = '') =>
    `<worksheet xmlns="${NS.x}" ${xmlns('r')}><sheetData>${rows}</sheetData>${more}</worksheet>`;

  function workbook(
    sheets: Record<string, string>,
    more: Record<string, string | Uint8Array> = {},
  ) {
    const names = Object.keys(sheets);
    return officeFile('xl/workbook.xml', {
      'xl/workbook.xml': `<workbook xmlns="${NS.x}" ${xmlns('r')}><sheets>${names
        .map(
          (name, i) =>
            `<sheet name="${name.replace(' (hidden)', '')}" sheetId="${i + 1}" r:id="rS${i}"${name.endsWith('(hidden)') ? ' state="hidden"' : ''}/>`,
        )
        .join('')}</sheets></workbook>`,
      'xl/_rels/workbook.xml.rels': rels(
        ...names.map((_, i): [string, string, string] => [
          `rS${i}`,
          'worksheet',
          `worksheets/sheet${i}.xml`,
        ]),
        ['rStr', 'sharedStrings', 'sharedStrings.xml'],
        ['rSty', 'styles', 'styles.xml'],
      ),
      ...Object.fromEntries(names.map((name, i) => [`xl/worksheets/sheet${i}.xml`, sheets[name]!])),
      ...more,
    });
  }

  it('reads each sheet as a table of its cells, as Excel shows them', async () => {
    const rows = [
      `<row r="1">${cell('A1', ' t="s"', v('0'))}${cell('B1', ' t="s"', v('1'))}${cell('C1', ' t="inlineStr"', '<is><t>Inline</t></is>')}</row>`,
      `<row r="2">${cell('A2', '', v('0.30000000000000004'))}${cell('B2', ' s="1"', v('45000'))}${cell('C2', ' s="2"', v('0.256'))}${cell('D2', ' s="4"', v('7'))}</row>`,
      // An empty row is left out; a formula Excel did not work out is shown as the formula.
      `<row r="3">${cell('A3', ' t="s"', '')}</row>`,
      `<row r="4">${cell('A4', ' t="b"', v('1'))}${cell('B4', '', '<f>SUM(A1:A2)</f>')}${cell('D4', ' s="3"', v('45000.5'))}</row>`,
      `<row r="5">${cell('A5', ' t="e"', v('#DIV/0!'))}</row>`,
    ].join('');
    const file = await workbook(
      {
        Data: sheet(rows, '<drawing r:id="rD"/>'),
        'Secret (hidden)': sheet(`<row r="1">${cell('A1', ' t="s"', v('2'))}</row>`),
        Blank: sheet(''),
      },
      {
        'xl/sharedStrings.xml': `<sst xmlns="${NS.x}"><si><t>Name</t></si><si><r><t>Bo</t></r><r><t>ld</t></r><rPh><t>ボ</t></rPh></si><si><t>שלום</t></si></sst>`,
        'xl/styles.xml': `<styleSheet xmlns="${NS.x}"><numFmts><numFmt numFmtId="164" formatCode="dd/mm/yyyy\\ hh:mm"/><numFmt numFmtId="165" formatCode="[Red]0.00"/></numFmts><cellXfs><xf numFmtId="0"/><xf numFmtId="14"/><xf numFmtId="9"/><xf numFmtId="164"/><xf numFmtId="165"/></cellXfs></styleSheet>`,
        'xl/worksheets/_rels/sheet0.xml.rels': rels(['rD', 'drawing', '../drawings/drawing1.xml']),
        'xl/drawings/drawing1.xml': `<xdr:wsDr ${xmlns('xdr', 'a', 'r')}><xdr:twoCellAnchor><xdr:from><xdr:col>1</xdr:col><xdr:row>6</xdr:row></xdr:from><xdr:pic><xdr:blipFill><a:blip r:embed="rI"/></xdr:blipFill></xdr:pic></xdr:twoCellAnchor></xdr:wsDr>`,
        'xl/drawings/_rels/drawing1.xml.rels': rels(['rI', 'image', '../media/image1.jpeg']),
        'xl/media/image1.jpeg': picture(5),
      },
    );

    const contents = await readOfficeFile(file);
    expect(contents.pictures).toEqual([
      { mime: 'image/jpeg', extension: 'jpg', bytes: picture(5) },
    ]);
    expect(contents.markdown(['book.xlsx.picture-1.jpg'])).toBe(
      [
        '## Sheet: Data',
        '|  | A | B | C | D |\n| --- | --- | --- | --- | --- |\n' +
          '| 1 | Name | Bold | Inline |  |\n' +
          '| 2 | 0.3 | 2023-03-15 | 25.6% | 7 |\n' +
          '| 4 | TRUE | =SUM(A1:A2) |  | 2023-03-15 12:00 |\n' +
          '| 5 | #DIV/0! |  |  |  |',
        'At B7: ![picture 1](<book.xlsx.picture-1.jpg>)',
        '## Sheet: Secret (hidden)',
        '|  | A |\n| --- | --- |\n| 1 | שלום |',
        '## Sheet: Blank',
        '(empty)',
      ].join('\n\n') + '\n',
    );
  });

  it('says what it leaves out of a large sheet', async () => {
    const rows = Array.from(
      { length: 1003 },
      (_, i) => `<row r="${i + 1}">${cell(`A${i + 1}`, '', v(String(i)))}</row>`,
    ).join('');
    const wide = `<row r="1004">${cell('BZ1004', '', v('1'))}</row>`;
    const text = (await readOfficeFile(await workbook({ Big: sheet(rows + wide) }))).markdown([]);
    expect(text).toContain('(4 more rows, from row 1001, not shown)');
    expect(text).toContain('(columns AY–BZ not shown)');
  });
});

describe('a file that is not one', () => {
  it('is told apart by its name or its type', () => {
    expect(isOfficeFile('brief.docx', '')).toBe(true);
    expect(isOfficeFile('BUDGET.XLSM', '')).toBe(true);
    expect(isOfficeFile('show.ppsx', '')).toBe(true);
    expect(
      isOfficeFile(
        'download',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      ),
    ).toBe(true);
    expect(isOfficeFile('brief.pdf', 'application/pdf')).toBe(false);
    expect(isOfficeFile('old.doc', 'application/msword')).toBe(false);
  });

  it('is refused with the reason', async () => {
    const locked = new Uint8Array(64);
    locked.set([0xd0, 0xcf, 0x11, 0xe0, 0xa1, 0xb1, 0x1a, 0xe1]);
    await expect(readOfficeFile(locked)).rejects.toMatchObject({ reason: 'locked' });
    await expect(readOfficeFile(new Uint8Array([1, 2, 3]))).rejects.toBeInstanceOf(OfficeReadError);
    // An archive of something else: an e-book is a ZIP too.
    const book = await writeZip([{ name: 'mimetype', data: new TextEncoder().encode('epub') }]);
    await expect(readOfficeFile(book)).rejects.toMatchObject({ reason: 'unknown' });
  });
});
