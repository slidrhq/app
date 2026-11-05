# ADR-135 — The text slide seated as the text-and-image slide

Status: Implemented on 2026-11-05 in the working tree; not committed. Published to the library on 2026-11-05 at 23:38:06 UTC (below, "Published").

## Request

"בכל ה-templates הקיימים: ה-layout של "טקסט" נוצר מאוחר יותר ולכן שונה קצת מהשאר. הוא צריך להיות קרוב לזה של "טקסט ותמונה" בעיקר בהקשרי ה-placeholders (אבל גם האלמנטים המרכזיים ב-layout). עדכן את ה-layout הזה בכל התבניות."

## Context

- The text layout came last (ADR-076: made by `withStandardLayouts` from a template's content slides, then drawn by hand in the two rounds of ADR-094). Its role contract was `title, body`; the text-and-image layout's is `caption, title, image, subtitle ×3, body ×3, footer`.
- In every template of the library (25) and of the authoring folder (14, ten of them not yet published, ADR-122), the text slide had no kicker over its title and no footer in its foot, though most drew the kicker's mark (the dot, the rule, the pin) with nothing beside it. Anan, Shvav, Mutzar and Atlas also set their title higher than their other slides. A slide changed from text-and-image to text lost its kicker and its footer, and a deck moved between templates had no seat for them there.

## Decision

- **The contract.** `text` seats `caption, title, body, footer` (`builtin/contract.ts`, and the agent's guide in `packages/prompts/src/template.ts`, which says the text layout is the text-and-image one with a body in place of the picture and the points). The kicker is set and drawn where the template's other slides set theirs, over the title; the footer where its full-width slides put it, beside the logo and the slide's number. The body, the card and the accent of ADR-094 stay.
- **The fallback.** A template without a text layout of its own (an older personal one) gets one from its content slides as before (`withStandardLayouts`), now with the kicker over the source slide's title and its footer.
- **The authored templates** (`authoring/<id>.ts`): the text layout draws its head with the kicker (`head(...)`), as the text-and-image slide does, and its foot with the footer (`foot('text')`). Where the title moved down to its place under the kicker, the card or sheet moved down with it (Gir, Dofek 16 px; Hon, Tavlin 10; Rakia, Maslul 8; Taarucha 12; Hadran 8; Sade 16) and kept its bottom. Tavlin, Rakia, Hadran and Mutzar placed their text title by hand and now take it from `head`; Taarucha and Mutzar gained an optional title height in `head` for a title of one line, Anan and Shvav one to keep their 92 px. Shvav's lone test point beside the title is now the kicker's traced pad, as on its text-and-image slide. Gir, Hon, Maslul and Shvav set the body 2–4 px over so that it starts on the footer's edge (the design check's L09).
- **The library's templates** (21 that exist only as the catalog) were rewritten from their table slide, whose foot is the text slide's: its kicker placeholder and its footer. What else: Zerem's accent line, which stood where the kicker now stands, is gone (on the flipped layout too); Ziv's kicker has its pill, as on every other slide, in place of the lone star; Sirtut's title block in the foot is as wide as on the other slides, to hold the footer; Layla, whose kicker stands at the far side on the line of the title's foot, sets the text title in the box of its other slides' titles (bottom-aligned as before, 1300 px wide), and the kicker beside it 400 px wide; Bolet's and Ziv's bodies end on the kicker's and footer's edge. Shidur's kicker and footer stand 4 px apart, as on all its slides; left so.
- **The samples**, in every language of each template (sixteen each): the text slide fills the kicker and the deck's footer. The kicker is written for each deck (Hebrew and English first, e.g. Zerem "THE MIGRATION", Shvil "הקריאייטיב / The creative", Hon "האספה השנתית / Annual General Meeting"), and in each other language in the manner of that template's other kickers in it (capitals or not, English terms kept or not). Authored templates hold it in their copy (`agenda.kicker`, Hadran's `setlist.kicker`, `technology/<lang>.ts`).
- **The rule.** `AGENTS.md` says it of every template; `textSlideGaps` in `authoring/check.ts` fails a sample whose text slide leaves the kicker or the footer empty, and a kicker that runs into the title or the body.

## Verification

- `check.ts` of the 14 authored templates: ok, in every language of their samples. `tsc` of the authoring folder and of the templates package: no error.
- The staged catalog (25 templates): every template valid (`Template.safeParse`), the contract kept by every layout, `textSlideGaps` clean, every sample drawn in all sixteen languages. The round trip of `builtin.test.ts` over it: 1200 of 1200 (every ordered pair, Hebrew and English). A text slide changed to text-and-image keeps the words of its kicker and footer, and back, in every template, Hebrew and English.
- Unit tests: `packages/templates` and `packages/prompts` pass, but for the contract of the *published* library (25 failures of `seats the roles every built-in template seats`, one a template, the text layout's caption and footer), which passed once the catalog was published (below). The round trip over the published library passes alone and timed out at its 120 s limit once, run beside the other files.
- Rendered at 640 px against the staged catalog (a dev server of its own, with its own media cache): every template's text slide beside its text-and-image slide in Hebrew, and the text slide of all 35 templates in all sixteen languages (560), with the review page's measure of text out of its box and the design check; looked at in Hebrew, English, Arabic, German and Japanese. No kicker or footer leaves its box in any language. What the measure reports is a title over its one-line box by the same 5–17 px in every language, which the unchanged text-and-image slide of the same template reports too; and the design check's word count (L13) and empty lower band (L17) of ADR-094. The near-alignments (L09) the new placeholders brought, body against footer or kicker 2–4 px apart, were removed (above), but Shidur's.

## Published

- At the user's word ("לפרסם!"), on 2026-11-05 at 23:38:06 UTC (the library's publication `2026-11-05T23:38:06.408Z`), through Slidr Library's API for an author's files: the 26 files staged (`PUT /api/library/staged/<sha256>`), then published at once (`POST /api/library/files`), each `from` the hash it was made from. Just before, the script checked that the live manifest still named those hashes: the catalog `7ffccc1a…`, ADR-125's publication, which the change was made on. `templates/catalog.json` (16.8 MB, from 16.7) and the 25 `templates/<id>/template.json` changed; nothing else.
- Read back from media.slidr.studio: the manifest names the 26 new hashes, and the catalog and a template file are those bytes. `builtin.test.ts` against the published library: 178 of 178, the contract of the text layout and the round trip of every pair included. An app of before reads the new catalog (no new field) and only gains the two seats.
- The script (`publish.mjs`) was kept outside the repository.

## Open for the user

- The ten templates of ADR-122 carry the change in their sources and are published with it whenever they are.
- The published samples of Anan, Shvav, Mutzar and Atlas still had the text slide of before ADR-094's addition of 2026-10-17 (a line of lead and bullets); taken from their sources, the staged catalog has the lead and four numbered points that addition wrote.
