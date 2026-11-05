# ADR-134 — Motion that costs less: still thumbnails, and lights that run by CSS

Status: Implemented on 2026-11-05 in the working tree; **not committed** at the time of this record. It answers the open question of [ADR-127](ADR-127-animations-and-backgrounds-in-elements.md) about the filmstrip's thumbnails, and changes the `flow` background of ADR-127 and [ADR-129](ADR-129-backgrounds-of-elements-edge-to-edge-and-tuned.md).

## Request

"בדוק ותקן בעיות ביצועים באפליקציה בעובדה עם אלמנטים, ובפרט אנימציות ורקעים"

## Context

The cost was measured in Edge, the engine of WebView2, through the real renderer, with the main thread's time per second from the DevTools protocol (`Performance.getMetrics`) and the frames per second counted by `requestAnimationFrame`. An idle page takes about 12 ms a second.

| What was drawn | Main thread | Frames a second |
| --- | --- | --- |
| 20 thumbnails of slides with the eight moving backgrounds | ~240 ms/s | 4–5 (a frame of 367 ms) |
| the same 20, their animations paused by hand | 73 ms/s | 61 |
| the `flow` background on the stage | 490–550 ms/s, 370–400 of it restyling | 55–60 |
| the other moving backgrounds on the stage, after 4 s | 15–150 ms/s (0.1–2.4 ms a frame) | 60 (`network`, `drift` and `converge` 30–47, held by rasterising) |
| a tile of Elements playing `flow` under the pointer, with its stronger lines | 795 ms/s | 63 |

- **Every thumbnail moved.** The renderer draws a slide the same way in every mode (RND-01), and nothing paused a picture or a repeated motion in `thumbnail` mode. ADR-127 left it open whether the filmstrip's thumbnail of a moving slide should be still; ADR-128 noted that the thumbnail moves with its elements. A filmstrip, the templates panel, the ready slides and every other panel that shows slides drew each moving slide on every frame.
- **SMIL costs Chrome far more than CSS.** For every value SMIL sets, Chrome restyles. The lights of `flow` were 64 `<use>` copies of its 16 traces, each with an `animate` of its `stroke-dashoffset`: 6–8 ms of every frame. The same lights as CSS animations, each on a path of its own, took 0.8 ms (and 3.9 ms when CSS animated the `<use>` copies; SMIL on paths of their own took 25 ms).
- A step of the speed slider (ADR-128, ADR-129) draws the picture again from new markup and cleans it again: 4–10 ms a step for the stage and a thumbnail together. That is acceptable, and was left alone.

## Decision

- **A thumbnail holds still what moves by itself** (`packages/renderer/src/still.ts`). In `thumbnail` mode:
  - The root of the slide carries `data-slidr-still`. A rule written once in the slide where something moves (`STILL_CSS`, in `<style data-slidr-still>`) pauses the CSS animations of its elements at their start. A motion an element repeats (ADR-128) stands at rest, and what runs along a line (ADR-131) stands where it starts.
  - A picture (`SvgPicture`) is held at `STILL_AT`, 4 seconds into its motion (`holdPicture`): its SMIL timeline is paused there, and so are its CSS animations. This is the moment the tiles of Elements already showed, so that every piece shows what it is. It is held again each time the picture is shown again, because CSS animations start over in a picture that was hidden (a panel behind `Activity`).
  - The stage, a show, an exported file and the capture window draw in other modes and still move.
  - A host that wants a thumbnail to move plays it. `Animation.play()` and `unpauseAnimations()` take precedence over the hold. A tile of Elements still moves under the pointer, and now shares `STILL_AT` with the renderer.
- **The lights of `flow` run by CSS** (`runningLights` and `RUNNING_LIGHTS_CSS` in `motionKit.ts`). Each trace has one path per layer (the trail and the head), and its dashes are both of its lights, half a round apart. Each round moves them by a whole number of dash periods, so a round ends where the next begins. Each light says in its `style` how far it runs (`--from`, `--to`), its duration and its delay. `atSpeed` (ADR-128) divides those times as it does any other. Without CSS animations, as in PowerPoint, the lights rest where the round starts. The traces and their dots are as before. Laid side by side at 1, 3.5 and 7 seconds, the old and the new drawing are the same picture; the second light of each trace stands about 30 units from where it stood. The drawing is 29 KB instead of 34 KB.
- `runningLight` (SMIL), used by the circuit trace among the animations, is left as it is: a few lights on one small path.

## Consequences

- With the fix, 20 thumbnails of moving slides beside a stage that shows `flow` run at 60 frames a second. The thumbnails alone take about 34 ms a second, as much as an idle page. `flow` on the stage takes 0.4–0.8 ms a frame instead of 6–8.
- The filmstrip no longer shows the motion of a slide; the stage does. A thumbnail shows a moving background at 4 seconds, as its tile in Elements does.
- A deck saved with the old `flow` keeps its markup and its cost until the background is applied again from Elements, or its speed is changed (ADR-129 draws it again from the collection).
- What still costs the most on the stage, measured after the first 4 seconds: `waves` (SMIL morphs its seven lines: about 2.4 ms a frame), `particles` (60 CSS animations of SVG elements: 1.5 ms), `radar`, `converge` and `orbit` (about 1 ms each). `network`, `drift` and `converge` were held near 30–47 frames a second by rasterising, in headless Edge. That rasterises in software, so the numbers say little about a window with a GPU. Moving `waves` to CSS `d` would leave it still in Safari, where an exported file may be opened, and was not done.

## Verification

- `packages/renderer/src/still.browser.test.tsx` (5, Edge): in a thumbnail, a picture's SMIL is paused at 4 s and its CSS animation is paused at 4000 ms, and a turning element is paused at rest. On the stage and in a show both run. Hidden behind `Activity`, the picture has no CSS animation; shown again, its new one is held. A host's `play()` and `unpauseAnimations()` run them. The rule is written only where something moves.
- `motionBackgrounds.test.ts`: the traces of `flow` cross both edges, as read from its lights. Two new tests: its lights run by CSS, 32 paths, no SMIL and no `<use>`; and each round moves them by two whole dash periods, starting at rest.
- Run again and passing: `motion.test.ts`, the renderer's unit tests, `background.test.ts`, the browser tests `motion.browser.test.tsx`, `ambient.browser.test.tsx`, `flow.browser.test.tsx` (ADR-131) and `html-export/src/ambient.browser.test.ts`, and end to end in Edge, `elements-motion.spec.ts`, `elements-ambient.spec.ts` and `background-drawing.spec.ts` (11, among them: a tile is still, moves under the pointer and stops again, and a background's drawing moves on the stage).
- `designs.test.ts` fails as before ("296 first designs" finds 286), outside this record.
- Type check of the desktop app and the renderer, ESLint and Prettier on the changed files.
- The measurements above were taken with a probe that was removed afterwards.

## Open for the user

- Whether a thumbnail of the filmstrip should move while the pointer is on it, as a tile of Elements does.
- Whether `waves` and `particles` should be drawn again at a lower cost, at the price of the look in browsers other than Edge and Chrome (for `waves`), or of how much moves (for `particles`).
