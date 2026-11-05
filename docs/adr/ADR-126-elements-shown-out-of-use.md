# ADR-126 — Elements shown out of use, and the animations that take them there and back

Status: Implemented on 2026-11-05 in the working tree of the app; not committed at the time of this record.

## Request

"אני רוצה שלכל אוביקט תהיה אפשרות להצגת disabled (הכוונה לא שיהיה ב-disabled רק שיראה כך): טקסט, צורה, אייקון וכו'. כולל קבוצה (שכל האובייקטים בה ב-disabled). בנוסף - אני רוצה אנימציה (בפאנל האנימציות) שמאפשרת להעביר ל-disabled וחזרה"

## Context

- A slide often shows a control, an option or a step that is not available, or a point of a list that has been covered: the convention is to draw it grey and faded. Until now that took a recolouring of every part by hand, and could not be undone in a show.
- The runtime never writes to the elements it animates (ADR-020): everything it does is a Web Animation, and between groups a slide remembers only which targets are hidden, a state it knows in advance for every point of the timeline. An emphasis leaves the part as it found it.
- The runtime depends on nothing, so a name or a value it shares with the renderer is repeated, and a test in `@slidr/html-export` holds the two together (the clip attributes are the precedent).

## Decision

- **A field of every element, `disabled`** (`packages/model/src/schema/elements.ts`). It changes only the look: the element is selected, edited, animated, and followed as a link as before. Ungrouping a group shown so shows each of its parts so, as it does with `hidden` and `locked`.
- **The look is a filter, `grayscale(1) opacity(0.4)`** (`DISABLED_LOOK`), at the end of the box's own filter, after the filter its `css` may give it: the shadow fades with the element, and a group is grey with everything in it. A part of a group drawn so is not faded a second time. The box says so with `data-slidr-disabled` (`packages/renderer/src/disabled.ts`). The opacity goes into the filter, not into `opacity`, so the fades of the animations and the hiding of the timeline, which use `opacity`, compose with it untouched.
- **Two emphasis animations, `disable` and `enable`** (`packages/runtime/src/presets.ts`). Unlike every other emphasis they leave the part as they made it (`Preset.disables`), until another step changes it. The timeline keeps a second state beside the hidden targets: the targets out of use before the lead-in and after every group, starting from what the renderer drew (`disabledStates` in `timeline.ts`). Going back or arriving from the next slide sets it directly. A step plays from where its part stands, so `disable` on a part out of use already does not flash it back. Between groups the state is held by a filter animation where it differs from what the renderer drew. `clear()` leaves the slide as drawn.
- **Whole elements and paragraphs only.** By paragraph, each paragraph is taken out of use on its own trigger: the points already covered of a list. Words and letters are put back together after their step (`text.ts`), so they cannot stay out of use: such a step takes the whole element, and the panel offers only "all at once" and "by paragraph" for these two (`PresetInfo.textBy`).
- **In the editor**: "Show as disabled" / "Show as enabled" in the right-click menu of any selection, beside lock and hide, and a button of the floating toolbar that is pressed while the whole selection is shown so. The panel's tiles draw the two animations, and their settings say that the state stays, and how to start a slide with an element out of use.
- **PowerPoint**: an element out of use is written faded (its alpha times 0.4), a group once with what is in it; PowerPoint has no grey for every kind of shape. The animations are its "Transparency" emphasis (preset 9), to 0.4 and back to 1. `enable` of an element written faded cannot bring it back in the file, and the export says so (`animation-approximated`).
- **Lint**: L05 (contrast) leaves alone text shown out of use, by itself or in its group: it is faint on purpose, and the agent must not "fix" it with a veil.
- **The agent** sees the field in the element schema and the two presets in `animation_set`, whose description says what they do.

## Consequences

- An exported HTML file plays the two animations with the bundled runtime, which was rebuilt.
- The agent's tool listing grew by the field in every element type: the budgets of `listing.test.ts` were raised by 500 characters.
- An element out of use inside a group out of use is drawn faded once; an animation that takes such a part out of use again fades it a second time. A paragraph taken out of use in an element drawn out of use is faded twice, and `enable` by paragraph cannot lift the element's own look.

## Checks

- Unit: the look's filter and how it comes off a filter as the browser writes it; the two presets, their keyframes over a shadow, and what a picker is told of them; `withPreset` drops "word by word" for them; the renderer's filter, attribute, a filter of `css`, and a group drawn once; L05 leaves them alone; the PowerPoint alpha of an element, a group and its parts, and the Transparency effects; the runtime, the renderer and the model hold one look.
- Browser (Edge, real Web Animations): disable half way and at the end, back a step and clear; enable of an element drawn out of use; a step that leaves a part as it stands; disable and enable on two clicks; by paragraph; word by word takes the whole.
- End to end (`editor-stage-menu.spec.ts`): the menu's item and the toolbar's button, each one undo step, the element still selected and drawn grey.
- Looked at: the elements and a card out of use on a light and a dark template, and the two tiles of the gallery.
- Not run: the animations panel and a show in the app itself, and PowerPoint opening an exported file with the two animations.
