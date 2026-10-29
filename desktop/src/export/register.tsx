import { registerMessages } from '../i18n';
import { getEditor, registerAction } from '../shell';
import { showExportCard } from './card';
import { en, he } from './messages';

/*
 * Export (WG9-T12): "Export…" of the File menu opens the export card in the AI chat. See
 * docs/adr/ADR-032-export-dialog-and-fonts.md and ADR-123.
 */

registerMessages('export', { he, en });

registerAction('export', () => showExportCard(getEditor()));
