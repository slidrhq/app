# ADR-139 — No Actions panel beside the AI chat

Status: Implemented on 2026-11-09 in the working tree; **not committed** at the time of this record.

## Request

"מחק את פאנל "פעולות" מהאפליקציה, הוא עמוס וחסר משמעות."

## Context

- [ADR-072](ADR-072-one-ai-chat.md) put one AI chat in the Activity Bar and, beside it, an Actions panel (`PanelId.actions`, `ai/Actions.tsx`): ready-made requests for the selection, the slide on the Stage and the deck, each sent to the chat as an action of `@slidr/prompts`, among controls that are not AI.
- Most of what it held is reached elsewhere: the slide's layout and background in row B, transitions in their own panel, the image tools (mask, adjust, filter, cutout, upscale, as background) in row B, templates in the Templates panel. The AI actions are requests the chat takes in words.
- The panel showed many rows at once, for three scopes, and read as clutter.

## Decision

- **The panel is gone**, with its placeholder in the shell and `PanelId.actions`. The AI slot of the Activity Bar has the chat alone.
- **What only it used is gone too**: `ai/Actions.tsx`, the deck look (`ai/DeckLook.tsx`, `ai/look.ts`: the template gallery, colour palettes and font pairs of the panel), the "make a template with AI" form (`ai/TemplateForm.tsx`), painting the area of an AI image edit (`images/MaskPainter.tsx`, `images/mask.ts`), extending a picture past its edges (`images/expand.ts`) and the panel's transition button (`animations/TransitionTool.tsx`), with their strings in every language and their tests.
- **What stays**: the prompts of `@slidr/prompts` and the names of the actions (`ai:action.*`, and `ai:actions.languages` and `ai:actions.tones` that they use), so a saved chat still shows the actions it was sent, and the design check and the outline still send theirs.

## Consequences

- A change the panel offered is asked for in the chat: "translate the deck into French", "three other titles for this slide", "a template like this logo", with files attached to the message.
- Palettes and font pairs as one-click choices, the painted mask of an image edit and extending a picture have no control in the app now; the Templates panel still edits a template's colours and fonts.
- The e2e specs of the panel are removed, and the helpers no longer open it.
