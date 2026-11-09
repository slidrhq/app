# ADR-140 — The image provider is chosen in the chat, after the agent

Status: Implemented on 2026-11-09 in the working tree; **not committed** at the time of this record. It changes the default of [ADR-004](ADR-004-image-provider.md) and the image half of what [ADR-117](ADR-117-system-settings-from-the-library.md) has the core fall back on.

## Request

"אני רוצה שהגדרות התמונות יבחרו בצאט, בפעם הראשונה/לאחר שינוי או כשלון חיבור/כשלא מוגדר (בלי ברירת מחדל) מיד לאחר הגדרת הסוכן (הכוונה: לאחר הסוכן בפעם הראשונה, או בעת הצורך, למשל אם לא מצליח להתחבר)."

It followed the question of how the image provider is set after a clean install: Codex CLI, chosen by the app because it is the first provider and needs no key, while the chat asks for its agent, model and effort before the first message.

## Context

- The chat's setup (`ai/ChatSetup.tsx`) asks for the agent, its model and its effort, and nothing is chosen for the user; an organization's default agent is only marked to begin with (ADR-117).
- The image provider was chosen by the core: the user's choice while offered, else the organization's, else the first provider registered (`ImageService::slot`). Settings → Media showed that first one as chosen. The chat never asked.

## Decision

- **No provider by default.** A job that names no provider goes to the user's choice while it is offered, else the organization's default; with neither, it is refused as `unknown_provider`, with words that tell the agent to have the user choose (`NOT_CHOSEN`). `image_default_provider` answers `null` then. The order of the list is unchanged: Codex CLI, which needs no key, comes first. Settings → Media marks none until one is chosen, and the media panel's AI images say "Not chosen" and lead there.
- **Not a fourth step of the agent's, under the same head.** The agent's steps are three (service, model, effort). The welcome or the finish stays over the images; once the agent's steps were answered in the chat, one line takes the place of their steps and sums them up (the agent's mark, name, model and effort); asked on its own, there is neither. "Who should make the images?" is asked as the agent's questions are: one compact list (`ChoiceList`), a row for each provider with its mark and no state, a short line under the question (what the provider is for, and that Settings can change it), Continue. Continue chooses the provider marked, as Settings would (`useImageProviders`, the state Settings shows); a provider that is ready ends the setup, and one that is not leads, as an agent does, to what it needs, without the list: the words and the action that install or sign in its CLI, or its key (`KeyField`, quiet); Back returns to the list. The setup ends by itself once that provider is ready. The quality and the longer lines of Settings → Media stay there; Not now leaves the step.
- **When the chat asks** (`useChatSetup`):
  - after every setup of the agent in the chat (the first one, another agent chosen, Back to the model or effort), with the current choice marked;
  - on its own, while no provider is chosen, by the user or by the organization, unless the user said Not now in this window;
  - when an image job of the agent failed on the provider itself (`unknown_provider`, `not_installed`, `not_logged_in`): the agent's image service reports it (`watchImageSetup`, `ai/imageSetup.ts`), and the step comes once the turn is over, so the Stop button stays while the turn runs. It says that the provider could not make an image.
- **Asked once, it stays** until it is finished or put off: a provider that still needs a key, an install or a sign-in keeps it open.
- **The stand-ins need no setup.** The scripted agent asks for nothing, the image step included. The plain browser page starts with its stand-in provider (`mock`) chosen in its settings, as it starts with its scripted agent.

## Consequences

- After a clean install, and once after updating to this version for someone who never chose a provider, the chat asks who makes the images before the first message.
- An organization's default image provider still stands for its people without asking, unlike its default agent, which is only marked; the step still follows a setup of the agent in the chat.
- Without a provider (Not now), the agent's image tools are refused with words it passes on, and the chat asks again once the turn is over.
- `harness-setup.spec.ts` goes through the step after every setup it finishes in the chat, and covers a configured chat with no provider, Not now, and a job that failed while a turn ran. `imageSetup.test.ts` covers which failures ask, and `service.rs` that none is chosen by itself and the organization's default stands.
