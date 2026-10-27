import { PackageReader } from '../import/package';
import { isCompoundFile } from '../zip';
import { MARK, Pictures, type OfficePicture } from './common';
import { readSheets } from './sheets';
import { readSlides } from './slides';
import { readWord } from './word';

/*
 * What a Word, PowerPoint or Excel file says, for the agent to read (ADR-115). The agent's file
 * tools read text, and a file of Office is a ZIP of XML: the app reads it once, when it is
 * attached, into Markdown and the pictures in it, and the agent reads those.
 */

export { MAX_PICTURES, type OfficePicture } from './common';

export class OfficeReadError extends Error {
  override name = 'OfficeReadError';
  constructor(
    /** `locked`: it has a password, or is of the binary formats before 2007. */
    readonly reason: 'locked' | 'unknown',
    message: string,
  ) {
    super(message);
  }
}

export interface OfficeContents {
  /** The pictures it holds, in the order they first stand in it. */
  pictures: OfficePicture[];
  /** Its text as Markdown, each picture written where it stands, by its path in `paths`. */
  markdown(paths: readonly string[]): string;
}

/** Word, PowerPoint and Excel files, documents and templates, with macros or without. */
const NAMES = /\.(doc|dot|ppt|pot|pps|xls|xlt)[xm]$/i;
const TYPES =
  /^application\/vnd\.(openxmlformats-officedocument\.|ms-(word|powerpoint|excel)\.\w+\.macroenabled)/i;

/** Each kind's reader, by the root element of the file's main part. */
const READERS: Record<
  string,
  ((pkg: PackageReader, main: string, pictures: Pictures) => Promise<string>) | undefined
> = {
  'w:document': readWord,
  'p:presentation': readSlides,
  'x:workbook': readSheets,
};

/** Whether a file is one of Word, PowerPoint or Excel, by its name or its media type. */
export function isOfficeFile(name: string, mime: string): boolean {
  return NAMES.test(name) || TYPES.test(mime);
}

/** Reads a Word, PowerPoint or Excel file. Rejects with `OfficeReadError`, or a broken file's. */
export async function readOfficeFile(bytes: Uint8Array): Promise<OfficeContents> {
  if (isCompoundFile(bytes)) {
    throw new OfficeReadError('locked', 'the file has a password, or is of an old format');
  }
  let pkg: PackageReader;
  try {
    pkg = new PackageReader(bytes);
  } catch {
    throw new OfficeReadError('unknown', 'the file is not a Word, PowerPoint or Excel file');
  }
  const main = await pkg.rel('', 'officeDocument');
  const part = main && !main.external ? main.target : '';
  const pictures = new Pictures(pkg);
  const read = READERS[(await pkg.xml(part))?.name ?? ''];
  if (!read) {
    throw new OfficeReadError('unknown', 'the file is not a Word, PowerPoint or Excel file');
  }
  const text = (await read(pkg, part, pictures)).replace(/\n{3,}/g, '\n\n').trim();
  return {
    pictures: pictures.list,
    markdown: (paths) =>
      `${text.replace(MARK, (_, n: string) => {
        const at = paths[Number(n)];
        return at ? `![picture ${Number(n) + 1}](<${at}>)` : '[picture]';
      })}\n`,
  };
}
