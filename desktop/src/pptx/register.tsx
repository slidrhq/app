import { i18n, registerMessages } from '../i18n';
import { getEditor, registerImporter } from '../shell';
import { importPptxFile, importPptxPath } from './importFlow';
import { en, he } from './messages';

/*
 * PowerPoint files (ADR-108): a .pptx chosen in "Open…" of the File menu or in "Load from
 * file" of the welcome screen. Its export is a format of the export card (`export/`).
 */

registerMessages('pptx', { he, en });

registerImporter({
  id: 'pptx',
  extensions: ['pptx'],
  filterName: () => i18n.t('filter', { ns: 'pptx' }),
  open: (path) => void importPptxPath(getEditor(), path),
  openFile: (file) => void importPptxFile(getEditor(), file),
});
