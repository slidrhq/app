# ADR-123 — "Open…" takes every file, and the export asks its questions in the AI chat

Status: Implemented in the 2026-10-29 working tree; **not committed**. It replaces the "Import…" item and the export dialog of [ADR-119](ADR-119-one-import-one-export.md); what each import and export does ([ADR-032](ADR-032-export-dialog-and-fonts.md), [ADR-036](ADR-036-html-import.md), [ADR-108](ADR-108-powerpoint-files.md)) is unchanged.

## Request

"בטל את היבוא - הוסף את הפורמטים לפתיחה (כמו בדף הבית). בנוסף, לגבי היצוא: … צור את היצוא בחלון הצאט אם "חלונות" מובנים, כמו בבחירת סוכן/מודל/מאמץ ראשוני": remove Import and add its formats to Open, as the welcome screen does; and make the export a built-in step of the chat window, like the first choice of agent, model and effort, rather than a dialog.

## Context

- The File menu had "Open…" for `.slidr` files and "Import…" for `.html` and `.pptx`. The welcome screen's "Load from file" already offered all three in one dialog (`loadFile`, `shell/fileActions.ts`) and handed an imported file to the importer of its extension.
- The export was a modal dialog (`export/ExportDialog.tsx`): a format dropdown, segmented controls for the slides and the animations, and the report in the same frame.
- The AI chat already asks local questions that never reach the agent: the setup of the agent, model and effort (`ai/ChatSetup.tsx`), a step at a time with a numbered list of steps and a `ChoiceList`; and cards such as the outline (`ai/Outline.tsx`).

## Decision

- **"Open…" takes every file the app reads.** "Open…" of the File menu and Ctrl+O call `loadFile`, the function of "Load from file": one dialog whose first filter is every file (`.slidr` and each importer's extensions), then the app's own filter, then each importer's. In a plain browser, which has no files of the app's own, `loadFile` offers the importers' files through the page's picker and refuses a file of no importer's kind; "Open…" is enabled there when there is an importer. `importFile` is gone, and so is the "Import…" item (`file-import`); the item "Open…" has the test id `file-open`. `fileImporters()` (`shell/registry.ts`) gives the importers outside React, for the shortcut.
- **The export is a card of the AI chat** (`export/ExportCard.tsx`). "Export…" (`registerAction('export')`) opens the AI panel and shows the card: after the conversation, or in place of an empty chat's openings and of the agent setup, since it asks nothing of the agent. Three steps, numbered as the setup's are, a check on each that is behind: **Format** (a `ChoiceList` of "HTML page" and "PowerPoint presentation", each with its mark and a line on what the file is), **Content** (the format chosen, then the slides, the animations with a line on each choice, and for HTML with video or audio where it goes), **Save** (the save dialog, the work, then the report of ADR-032 or ADR-108). Back goes to the format; "Export again" starts at the format, and after a failure at the content. The card has a close button; Escape closes it and gives the keyboard to the slide.
- **The card's state is a store** (`export/card.ts`), not the component's: the chat is drawn anew when its panel shows something else, and an export that runs meanwhile still ends in its report. The format of the last export is offered first; the other choices start again each time the card is asked for, unless an export is being chosen or is running.
- **Not modal.** The card counts the deck as it is (a slide added meanwhile is counted), and the export takes the deck as it is when it starts. The HTML report names assets from the deck it exported.
- **ADR-057 holds on the card.** The HTML row says "one file" only while its video and audio go inside it; with them beside it, it says the folder goes with the file (`descriptionBeside`).
- **The keyboard.** Asked for, the card scrolls into view with the keyboard on the chosen format, one frame after the File menu has let go of it; each step it moves to takes the keyboard to its first choice, and the report to its Close button. A card drawn again because its panel came back leaves the keyboard where it is. Enter on a choice goes on (Continue, then Export); Enter in a range field only commits the number.
- **`ChoiceList` (`@slidr/ui`)** has an optional `description` per row, read as the row's description and not its name (`aria-describedby`), and an optional `disabled` row (media too large for one file).
- `export/ExportDialog.tsx` and `export/open.tsx` are gone.

## Consequences

- Strings: `file.import` and `file.filterImport` are gone in every language. `export` has `intro`, `steps`, `stepContent`, `stepSave`, `formatQuestion`, `continue`, `back` and `animations.withHint`, in every language. `pptx:export.description` is shorter (the row of the PowerPoint format; its `.pptx` read badly right to left), in every language.
- Test ids: `export-card` (with `data-format`, `data-phase`, `data-step`), `export-continue`, `export-back`, `export-close`, `export-chosen`; `export-run`, `export-count`, `export-media` and the report's are as they were. `export-dialog` and `file-import` are gone.
- A new kind of import is still one `registerImporter` call: it appears in "Open…" and "Load from file".

## Verification

- `shell/fileActions.test.ts`: "Load from file"/"Open…" in one dialog; in a plain browser, the importers' files through the page's picker, a file of no kind refused, a cancelled picker.
- E2E: `runtime-export-card.spec.ts` (the export through the card, the range, "Export again", the keyboard through the steps, the card kept while another panel is shown, renders in both languages and schemes and at 1366×768), `video-export.spec.ts` (the media question, ADR-057 on the card), `pptx.spec.ts` (the PowerPoint format, an import through "Open…"), `editor-shell.spec.ts` ("Load from file", "Open…" and Ctrl+O ask for the file; no "Import…"), `a11y-audit.spec.ts` (the card's steps and the PowerPoint report, in both languages and schemes), `a11y-focus.spec.ts` (a modal dialog, now the deck's properties), `import-panel.spec.ts`, `design-refresh.spec.ts`, `elements-panel.spec.ts`, `runtime-acceptance.spec.ts`. The audit was run on a dev server of its own: on the shared one, after a locale file changed, the app runs `i18n/index.ts?t=…` and the audit's import of `/src/i18n/index.ts` makes a second i18n instance that shows every key.
- The card was rendered and looked at in Hebrew and English, light and dark, at each step and in the report, for HTML and PowerPoint, and with the media question.
