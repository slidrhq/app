# ADR-119 — One Import and one Export in the File menu

Status: Implemented on 2026-10-28 in the app. Superseded in part by [ADR-123](ADR-123-open-every-file-and-export-in-the-chat.md) on 2026-10-29: "Import…" is gone ("Open…" takes every file), and the export dialog is a card of the AI chat. It changes how the File menu reaches the imports of [ADR-036](ADR-036-html-import.md) and [ADR-108](ADR-108-powerpoint-files.md) and the exports of [ADR-032](ADR-032-export-dialog-and-fonts.md) and ADR-108; what each import and export does is unchanged.

## Request

"ב-app. לא נדרש 2 כפתורי ייבוא ו-2 כפתורי יצוא. בייבוא: כפתור אחד (סינון בתוך חלון הסיומות: כלומר יודע לקבל pptx ו-html). בייצוא: … להציג בשורה הראשונה חלון בחירה של הפורמט": the app needs neither two import items nor two export items. Import is one item whose file dialog filters for both `.pptx` and `.html`; Export is one item whose dialog chooses the format on its first line.

## Context

- The File menu had "Import HTML…", "Import PowerPoint…", "Export HTML…" and "Export to PowerPoint…". Each import had its own file dialog and each export its own dialog.
- The two export dialogs asked the same things (all slides or a range, with or without animations) in the same words, read from the `export` namespace. Only HTML asks where video and audio go; each has its own report.
- "Load from file" of the welcome screen already offered every importable file in one dialog, through the shell's registry of importers (`registerImporter`), and handed the chosen file to the importer of its extension.

## Decision

- **"Import…" is one item, served by the importers' registry.** `importFile` (`shell/fileActions.ts`) opens one dialog whose first filter is every file that can be imported (`file.filterImport`), followed by each importer's own filter, and hands the chosen file to the importer of its extension. A file of no importer's kind, chosen through "All files", is refused with a dialog that lists what can be imported. In a plain browser, which has no paths, the page's own picker stands in, and the importer gets the `File` (`FileImporter.openFile`). The welcome screen's "Load from file" uses the same function in a plain browser. The `import` and `importPptx` actions are gone: the HTML and PowerPoint areas only register importers.
- **"Export…" is one item and one dialog.** The export dialog (`export/ExportDialog.tsx`) has the format as its first line, a dropdown of "HTML page" and "PowerPoint presentation" (the names the save dialog gives their files). The slides and animations lines follow for both formats; the video-and-audio line only for HTML. The description, the file's extension, the save dialog's filter, the export that runs and the report follow the format. The PowerPoint report is `pptx/PptxExportReport.tsx`. The dialog offers the format of the last export in the session. The `exportPptx` action is gone.
- The `pickFiles` helper moved to the shell (`shell/pickFiles.ts`), which now uses it; `objects/insert.ts` re-exports it for the areas that take it from there. The shell does not import `objects/insert.ts`, whose shapes catalog loads with a top-level `await`.

## Consequences

- The File menu has two items where it had four. Test ids: `file-import`, `file-export`, and the export dialog's `export-dialog` (with `data-format`), `export-run` and `export-count` for both formats. `pptx-export-dialog`, `pptx-export-run`, `pptx-export-count`, `file-import-pptx` and `file-export-pptx` are gone.
- Strings: `file.import`, `file.export`, `file.filterImport`, `file.importUnknown`, `file.importKinds` and `export.format` are new; `export.title` is now "Export presentation"; `file.importHtml`, `file.importPptx`, `file.exportHtml`, `file.exportPptx` and `pptx:export.title` are gone, in every language.
- A new kind of import is a `registerImporter` call: it appears in "Import…" and "Load from file" without a change to the menu.

## Verification

- `shell/fileActions.test.ts`: one dialog with every importer's filters, the file handed to the importer of its kind, a file of no kind refused, a cancelled dialog.
- E2E: `pptx.spec.ts` (export through the format dropdown, import through "Import…", the refused file), `runtime-export-dialog.spec.ts`, `editor-shell.spec.ts` ("Load from file" and "Import" ask for the file), `a11y-audit.spec.ts` (the dialog in both formats).
