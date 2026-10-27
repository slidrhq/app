# ADR-115 — Word, PowerPoint and Excel files are read for the agent

Status: Implemented in the 2026-10-26 working tree; **not committed** at the time of this record.

## Request

"מדוע הסוכן לא יודע לתמוך בקריאת קובץ word? האם ניתן להוסיף תמיכה?" (why can't the agent read a Word file; can support be added), and then: "צריך פתרון גנרי לתמיכה בקבצי office" (a generic solution for Office files is needed).

## Context

- The chat's file dialog offered `.docx` and `.pptx` (CHT-U05), but no harness could read them.
  - Claude Code runs with `Read` and `Grep` only, confined to the conversation's attachments folder (`--restricted`), and with no shell. `Read` takes text, pictures and PDF, and refuses a `.docx` as binary.
  - Codex, Copilot, Gemini and Grok have `attachment_read`, which reads UTF-8 text only.
  - In a chat of 2026-10-26, Claude Code tried to read an attached `.docx` three times and gave up.
- Three ways were weighed.
  - **A shell or a skill for the agent.** This would undo the confinement of the harness, so it was not taken.
  - **Converting the file to PDF when it is attached.** This needs a layout engine the app does not have:
    - LibreOffice, hundreds of MB;
    - Word through COM, on Windows and only where Office is installed;
    - or a renderer of our own, whose fidelity for Hebrew, lists and tables would be poor.

    A PDF would help Claude Code alone, and Claude reads every page of a PDF as a picture as well as text, so each read costs thousands of tokens a page.
  - **Reading the file in the app, into Markdown and the pictures in it.** This needs no new dependency: `@slidr/pptx` already has a ZIP reader and an XML parser ([ADR-108](ADR-108-powerpoint-files.md)). Every harness reads the result, and the text is exact, Hebrew included.

## Decision

- **`@slidr/pptx/contents`.** `isOfficeFile(name, mime)` tells the files apart by name or type. `readOfficeFile(bytes)` gives `{ pictures, markdown(paths) }`, where `paths` are where the app stored the pictures. The kind is taken from the root element of the file's main part, so templates, shows and files with macros are read as well.
  - **Word.**
    - Paragraphs come in order, with headings by their outline level. A built-in style is matched by its English name, which Hebrew Word keeps behind its numbered style ids.
    - Lists carry the numbers Word shows: `א.`, `ב.1.`, `iv`.
    - Tables become Markdown tables, merged cells kept empty.
    - Also kept: links, equations, footnotes and endnotes, the page header of the last section, and text boxes, written after the paragraph they stand in.
    - Tracked changes read as Word shows them: deletions out, insertions in.
  - **PowerPoint.**
    - The slides come in the order the presentation lists them, each headed by its title and marked when it is hidden.
    - Each slide gives the text of its shapes in drawing order, as list items where a content placeholder or the paragraph has bullets.
    - Then its tables, charts, SmartArt, pictures and speaker notes.
    - What the layouts and the master draw on every slide (a logo, the footer, the slide's number) is left out.
  - **Excel.**
    - Each sheet is a table of the cells that hold something, under column letters and beside row numbers, so that a cell is named as Excel names it. A sheet shows at most 1,000 rows and 50 columns, and says what it left out.
    - Values appear as Excel shows them where that is a date (ISO) or a percentage. A formula Excel never calculated appears as the formula.
    - What the sheet's drawing holds (pictures, charts, text boxes) follows, with the cell each is anchored at.
  - **Charts**, in all three kinds of file, are their type, title, and the values they cache as a table.
- **Pictures.**
  - A picture is taken out once, however often the file uses it, in the order it first appears.
  - Only PNG, JPEG, GIF and WebP pictures are taken out, at most 20 a file.
  - One smaller than 1 KiB is a bullet or a spacer and is left out.
  - Any other picture (EMF, WMF, TIFF, or one past the limit) is written `[picture]` where it stands.
- **When a file is attached** (`AgentService.#attach`):
  - The file is stored as before.
  - Each of its pictures is stored as `<path>.picture-<n>.<ext>` and also with the document as an asset, as an attached picture is. The first eight are shown with the message.
  - Then its Markdown is stored as `<path>.md`, naming each picture by the path it was stored at.
  - All of these go to the conversation's attachments folder and the document's chat uploads, so they come back when the document is opened again.
  - A file that cannot be read (a password, a damaged file, a full disk) goes as it is, and the turn goes on.
- **What the agent is told.**
  - In `<slidr_attachments>`, such a file has `text`, the path of its Markdown. Each of its pictures has `from`, naming the file.
  - The block says to read the Markdown, and that a file of these kinds without `text` could not be read and the user should be told.
  - The chat shows the file the user attached and nothing the app made of it. The message's entry keeps the Markdown's path, so the summary a fresh session gets of the conversation (AGT-06) names it.
  - The system prompt is unchanged: the deck prompt's budget (46,450 characters) has no room for the sentence.
- The file dialog offers `.xlsx` too.

## Consequences

- Every harness reads Word, PowerPoint and Excel files, in Hebrew as in any language.
- The layout of a document is not kept. A document whose look matters can be attached as a PDF, which Claude Code reads with its pages as pictures.
- The pictures of a document land in the deck's Uploads tab. One no slide uses is not packed into the saved file (`unreferenced_assets_stay_in_the_workspace_but_are_not_packed`).
- Not read:
  - the binary formats before 2007 (`.doc`, `.xls`, `.ppt`) and files with a password;
  - comments, in Word and in Excel, and footers;
  - headers of sections other than the last;
  - the workbooks embedded behind charts, beyond the values the chart caches.
- Still open: a PDF attached to a harness other than Claude Code is unreadable, as before. The same path (text taken out when the file is attached) would serve it, with a PDF text extractor the app does not have.
- Checked by hand on 2026-10-26 with the two Hebrew `.docx` files of that chat:
  - instructions for posters, whose `hebrew1` list came out as Word numbers it;
  - a 128 KB thesis proposal, which became 123 KB of Markdown with its heading tree, its 89 footnotes and the university's logo as a picture.
