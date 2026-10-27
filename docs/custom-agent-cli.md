# Custom agent CLI — the integration contract

Status: Proposal, 2026-10-26. Not implemented. Builds on the harness contract ([ADR-010](adr/ADR-010-agent-harness.md), [ADR-096](adr/ADR-096-gemini-and-grok-harnesses.md)), the tool bridge ([ADR-022](adr/ADR-022-mcp-bridge.md)) and the image providers ([ADR-004](adr/ADR-004-image-provider.md), [ADR-025](adr/ADR-025-image-providers.md), [ADR-051](adr/ADR-051-media-and-settings.md), [ADR-097](adr/ADR-097-images-made-while-the-agent-goes-on.md)).

## 1. Purpose

Today every agent CLI the app runs has an adapter of its own in Rust (`harness/claude_code.rs`, `harness/one_shot.rs`) and a place in a fixed list (`harness/registry.rs`, `image_providers/registry.rs`). This document defines one protocol instead: a CLI that speaks it is added in Settings and offered like the built-in ones —

- as an **agent harness**: chosen in the chat and in Settings → Agent, with its models, sign-in, the Deck API, pictures in the turn, interrupt and resume;
- as an **image provider**: chosen in Settings → Images, called by `image_generate`, `image_fill_placeholders` and `image_edit`;
- or as both, with one sign-in.

The app needs one generic adapter for every such CLI. This is AGT-04 ("a settings file listing harnesses") of `harness/registry.rs`.

The protocol is shaped like the one-shot adapters (Codex, Copilot, Gemini, Grok): one process per turn and one process per image, JSON in on standard input, JSON Lines out on standard output, the app's tools over MCP. Every field below maps onto a type that already crosses IPC (`harness/types.rs`, `image_providers/types.rs`), so the webview does not change for it.

Out of scope for version 1: a long-lived process per session (as Claude Code's), installation of the CLI by the app, and an API key held by the app. The CLI keeps its own credentials, as every CLI harness does.

## 2. Overview

```text
Settings → agents.custom[]  ──►  CustomCliHarness (AgentHarness)   CustomCliImageProvider (ImageProvider)
                                          │                                   │
   <cli> slidr describe | status | models | login          (setup: no prompt, short-lived)
   <cli> slidr turn    stdin: TurnRequest   stdout: agent events, JSON Lines   one process per turn
   <cli> slidr image   stdin: ImageRequest  stdout: one result line            one process per image
                                          │
   the CLI's agent ──MCP, Streamable HTTP, Bearer token──► 127.0.0.1 tool bridge ──► Deck API (webview)
```

## 3. Registration

The user adds the CLI in Settings → Agent ("Add a CLI…"). The app stores it in `settings.json`, in a new section:

```json
{
  "agents": {
    "custom": [
      {
        "id": "acme-agent",
        "command": "C:\\Tools\\acme\\acme.exe",
        "args": [],
        "env": { "ACME_REGION": "eu" }
      }
    ]
  }
}
```

| Field | Type | Required | Rule |
|---|---|---|---|
| `id` | string | yes | `^[a-z][a-z0-9-]{1,31}$`. Stable: used in settings, in `agent_start`, in a thread's harness and in an asset's `lineage.provider`. Not one of the built-in ids (`claude-code`, `codex-cli`, `copilot-cli`, `gemini-cli`, `grok-cli`, `openai-api`, `mock`). |
| `command` | string | yes | Absolute path of a **native executable**. Not a `.cmd`, `.bat` or `.ps1` shim: the app stops a turn by ending this one process, and a shim would leave the real CLI running (the reason `one_shot.rs` starts Node.js on `gemini.js` and the native `copilot.exe`). A Node.js CLI is registered as `node.exe` with its script as the first of `args`. |
| `args` | string[] | no | Placed before the protocol's own arguments. |
| `env` | object of strings | no | Added to the environment of every start. Not for secrets: Settings shows it, and `settings.json` is plain text. |

Everything else — the name, the version, what the CLI can do — the CLI says itself (`slidr describe`), so the registration stays this small and the CLI is the one source of truth.

## 4. Rules for every start

**Command line.** `<command> <args…> slidr <subcommand>`. The protocol's subcommands are under `slidr`, so they cannot collide with the CLI's own. No other argument is passed: everything a request needs comes on standard input, which has no length limit (Windows allows a command line about 32,000 characters; the system prompt alone is about 44,000).

**Environment.** The app adds:

| Variable | When | Value |
|---|---|---|
| `SLIDR_PROTOCOL` | always | `1` |
| `SLIDR_MCP_TOKEN` | `turn`, when the session has tools | The tool endpoint's bearer token. Never written to disk, to a log, or to standard output. |
| the registration's `env` | always | as registered |

**Standard input.** For `turn` and `image`: one JSON object, UTF-8, then end of file. For the other subcommands it is closed. The CLI never waits for more.

**Standard output.** JSON Lines only: one JSON object per line, UTF-8, `\n` at the end, at most 8 MiB a line. No banner, no progress bar, no ANSI colour, no update notice. The app records every line in the session's diagnostics log (AGT-08), so nothing secret goes there. A line that is not JSON is ignored, and so is an unknown `type` or field (forward compatibility, both ways).

**Standard error.** Free text, for people. When a run fails without an `error` line, the last 20 lines become the error's message.

**Exit code.** `0` when the subcommand did what it was asked; anything else when it did not.

**Working directory.** Set by the app for `turn` and `image` (§6, §7); an empty temporary folder for the others.

**Being stopped.** The app ends the process without warning, at any moment: Stop in the chat, closing a session, cancelling an image, a time limit, quitting the app. On Windows that is `TerminateProcess`, with no signal to catch. So: any helper process is started in a job object that ends with the CLI, and the CLI's stored state is written so that an end at any instant leaves it consistent (§6.2).

**No window, no prompt.** The app starts the CLI with `CREATE_NO_WINDOW`. Nothing but `login` may ask the user anything or open a window.

**Isolation.** In a Slidr run the CLI loads none of the user's own setup: no global or project configuration, no MCP servers of their own, no hooks, plugins, skills, memory across sessions, and no instruction files (`AGENTS.md`, `CLAUDE.md` and the like) from the working folder or its parents. The built-in CLIs are run the same way (`--ignore-user-config`, `--strict-mcp-config`, `--setting-sources ""`, `GROK_MEMORY=0`).

**Concurrency.** Several processes of one CLI run at once: a turn in each open chat, and while a turn runs, up to `maxParallel` image runs it asked for (ADR-097). The CLI's own stores (conversations, credentials, caches) must take that: no exclusive lock held for a whole run, and token refresh safe across processes.

**Encoding.** All text is UTF-8, Hebrew and Arabic included, in and out. On Windows the CLI writes UTF-8 whatever the console code page.

## 5. Setup subcommands

### 5.1 `slidr describe`

What the CLI is and can do. Answers within 15 seconds, without the network. The app calls it when the CLI is added and on every start of the app; a CLI whose `protocol` does not include `1` is shown as unavailable.

```json
{
  "protocol": [1],
  "name": "Acme Agent",
  "version": "0.4.2",
  "glyph": "A",
  "agent": {
    "capabilities": { "streaming": true, "imageInput": true, "thinking": false },
    "builtinTools": ["web_search", "web_fetch"]
  },
  "images": {
    "edit": "regenerate",
    "mask": false,
    "quality": true,
    "maxParallel": 3
  }
}
```

| Field | Type | Meaning | Maps to |
|---|---|---|---|
| `protocol` | int[] | Protocol versions the CLI speaks. | — |
| `name` | string | Display name. The chat shows it without a trailing "CLI". | `HarnessDescriptor.name`, `ProviderDescriptor.name` |
| `version` | string | The CLI's version, for Settings and the diagnostics log. | `HarnessStatus.version` |
| `glyph` | string, 1–2 characters | The mark beside the name. Absent: a terminal mark (`harnessLook.ts`). | `HarnessLook.glyph` |
| `agent` | object or null | Present: the CLI is offered as a harness. | `HarnessDescriptor` |
| `agent.capabilities.streaming` | bool | Text arrives as `text_delta` while the model writes. False: each message arrives whole. | `Capabilities.streaming` |
| `agent.capabilities.imageInput` | bool | A turn may carry pictures (`images`). False: the chat hides attaching them. | `Capabilities.image_input` |
| `agent.capabilities.thinking` | bool | Reasoning arrives as `thinking_delta`. | `Capabilities.thinking` |
| `agent.builtinTools` | string[] | Which of `web_search`, `web_fetch`, `file_read` the CLI has (§6.4). Without `file_read` the app adds its own `attachment_read` tool, as it does for Codex, Copilot, Gemini and Grok. | `ATTACHMENT_HARNESSES` in `agentService.ts` |
| `images` | object or null | Present: the CLI is offered as an image provider (§7). | `ProviderDescriptor` |
| `images.edit` | `none` \| `regenerate` \| `exact` | What `image` does with `operation: "edit"` (§7.4). | `Capabilities.edit` |
| `images.mask` | bool | An edit can be confined to a mask. Only with `exact`. | `Capabilities.mask` |
| `images.quality` | bool | The CLI reads `quality` (Settings → Images). | `Capabilities.quality` |
| `images.maxParallel` | int, 1–8 | How many image runs the app starts at once; the rest of a job waits. | `Capabilities.max_parallel` |

The other harness capabilities are fixed by the protocol and not described: `resume` and `interrupt` are always true (a turn is a process the app ends; the next one resumes), and `toolEndpoint` is always true (§6.3). An image provider's `transparent` is false: the app asks no provider for transparency and cuts the subject out itself (`imageService.ts`).

### 5.2 `slidr status`

Whether the CLI can work now. Answers within 15 seconds; may use the network to check the sign-in.

```json
{ "state": "ready", "account": "Acme Pro", "detail": null }
```

| Field | Type | Meaning |
|---|---|---|
| `state` | `ready` \| `not_logged_in` \| `unavailable` | `not_installed` is the app's to say: when `command` is missing or does not start. |
| `account` | string or null | How it is signed in (plan, method). No name, no e-mail address. |
| `detail` | string or null | English guidance or error text: how to sign in, what failed. |

Maps to `HarnessStatus` and `ProviderStatus`.

### 5.3 `slidr models`

The models the signed-in account can use, for the model picker. Answers within 60 seconds. Called when the user connects the harness (`setup::connect`).

```json
{
  "models": [
    { "id": "acme-large", "label": "Acme Large", "effortLevels": ["low", "medium", "high"] },
    { "id": "acme-fast", "label": "Acme Fast" }
  ],
  "default": "acme-large"
}
```

| Field | Rule |
|---|---|
| `models[].id` | What a turn's `model` takes. Not empty, not starting with `-`. |
| `models[].label` | Display name. |
| `models[].effortLevels` | Optional. Each matches `^[a-z_]+$`. |
| `default` | The id used when the user picks none. |

Explicit models only: no `auto` (the app leaves it out for Copilot and Gemini too). Not signed in: an `error` line with `kind: "not_logged_in"` and a non-zero exit. Maps to `ModelOption`.

### 5.4 `slidr login`

Settings → Sign in opens a visible terminal on this subcommand (as `setup::login` does for `codex login`). It is interactive — browser, device code, whatever the CLI uses — and exits with `0` once signed in. The app runs `status` again when it ends, and waits at most 10 minutes.

## 6. An agent turn: `slidr turn`

One process per turn of the chat. Its working directory is the thread's `attachments/` folder (`<workdir>/attachments/`), the only folder the agent may read: the files the user attached to the chat are there.

### 6.1 The request (standard input)

```json
{
  "protocol": 1,
  "session": { "id": "0d6c3f8e-5f2a-4c1e-9a57-3b1f1f0e2a44", "resume": false },
  "systemPrompt": "You are Slidr's presentation agent… (about 44,000 characters)",
  "context": "<slidr_context>scope: slide …</slidr_context>",
  "text": "תוסיף שקף על תוצאות הרבעון",
  "images": [{ "mediaType": "image/png", "data": "iVBORw0KGgo…" }],
  "model": "acme-large",
  "effort": "high",
  "webAccess": true,
  "tools": { "url": "http://127.0.0.1:53817/mcp/k3f9…", "server": "slidr" }
}
```

| Field | Type | Meaning | From |
|---|---|---|---|
| `protocol` | int | `1`. | — |
| `session.id` | UUID | The conversation. The app chooses it (§6.2). | `SessionConfig.resume`, `native_session_id` |
| `session.resume` | bool | `false`: create the conversation under `id`. `true`: continue it. | — |
| `systemPrompt` | string | The app's prompt modules (SPEC 11.6). **Replaces** the CLI's own system prompt entirely; it is not a user message and is not echoed. Every turn carries it; use the latest. | `SessionConfig.system_prompt` |
| `context` | string or null | This turn's `<slidr_context>` block: the current slide, the selection, the selected text. Goes into this turn's user message, before `text`. Kept apart from `text` so the transcript stores what the user wrote. | `UserTurn.context` |
| `text` | string | What the user wrote, or an action's prompt. May be empty when `images` is not. | `UserTurn.text` |
| `images` | array | Pictures pasted or attached: `mediaType` is `image/png`, `image/jpeg`, `image/gif` or `image/webp`; `data` is base64. Sent only when `imageInput` is true. They go into this turn's user message as images. | `UserTurn.images` |
| `model` | string or null | One of `slidr models`' ids. Null: the CLI's default. | `SessionConfig.model` |
| `effort` | string or null | One of the model's `effortLevels`. | `SessionConfig.effort` |
| `webAccess` | bool | Web search and fetch are allowed (AID-07). When false the CLI's web tools are off for this turn. | `SessionConfig.web_access` |
| `tools` | object or null | The app's tools (§6.3): `url` of the MCP endpoint, and `server`, the name to give it (`slidr`). The token is in `SLIDR_MCP_TOKEN`. Null: the turn has no app tools. | `SessionConfig.tool_endpoint` |

`SessionConfig.scope` is not sent: the prompt and the Deck API's scope guard act on it, not the harness.

### 6.2 The conversation

- **The ID is the app's.** As for Copilot, Gemini and Grok (ADR-096), the app allocates a UUID when a session starts. A turn with `resume: false` creates the conversation under it; once a turn has reached the model, the app sends `resume: true`.
- **Announce once it exists.** On a created conversation the CLI emits `session_started` as soon as the model accepted the first request, not before. The app keeps the ID only after that, so it never keeps an ID with nothing behind it.
- **An ID the CLI already has.** `resume: false` on an ID the CLI already stores: before calling the model, an `error` with `kind: "session_exists"`. The app starts the turn once more under a new ID. (A turn ended after the CLI stored the conversation but before the model answered leaves one.)
- **An ID the CLI does not have.** `resume: true` on an unknown ID (another computer, history cleared): an `error` with `kind: "resume_failed"`. The app ends the session and starts a new one with a summary (AGT-06).
- **Where it lives.** In the CLI's own store, keyed by the ID, outside the working folder or inside it, as the CLI likes; it survives restarts of the app and of the computer.
- **Safe to end at any instant.** Each completed step (a model message, a tool result) is stored atomically, as a write to a temporary file and a rename. A tool call whose result never came, because the process was ended, is closed when the conversation is resumed (recorded as interrupted) or dropped, so that the next request to the model is valid. Most model APIs refuse a history with a tool call and no result.

### 6.3 The app's tools: the Deck API over MCP

- **Transport.** MCP over Streamable HTTP: `POST` to `tools.url` with `Authorization: Bearer $SLIDR_MCP_TOKEN`. The bridge speaks protocol version 2026-07-28 — each request stands alone — and still answers an `initialize` of 2025-06-18. It listens on 127.0.0.1 only; a request without the session's path and token gets 401.
- **Listing.** `tools/list` at the start of every turn: the tools depend on the session's scope and on the harness. Every tool is given to the model under its own name and with its schema unchanged.
- **No approvals.** Every tool of this server runs without a confirmation; nobody could answer one.
- **Time.** A call may take minutes: the bridge waits for the webview up to each tool's own limit. The CLI waits at least 600 seconds a call (`MCP_TOOL_TIMEOUT` for Claude Code, `timeout: 600000` for Copilot and Gemini).
- **Results.** A result has `text` and `image` content blocks. **Images must reach the model as images**: the agent looks at its slides through `slide_render` and `deck_render_contact_sheet`, and the design check sends it back to look. A result of up to 100,000 tokens reaches the model whole, not cut short or saved to a file (`MAX_MCP_OUTPUT_TOKENS`, `claude_code.rs`). A result with `isError: true` is given to the model as a failure.
- **Several calls at once.** The model may make several calls in one step, and the CLI runs them side by side. The prompt asks for a slide's image together with the next slide (ADR-097); run one after the other, the deck waits for every image.
- **Unreachable.** When the server cannot be reached or initialized: an `error` with `kind: "tools_unavailable"`, before the model is called. The agent must not work on the deck without its tools (ADR-002).

### 6.4 The CLI's own tools

A turn may use, of the CLI's own tools, only these:

| Tool | When |
|---|---|
| `web_search`, `web_fetch` | Only with `webAccess: true`. |
| `file_read` | Read-only, confined to the working folder. Optional; without it the app's `attachment_read` stands in. |

Everything else is off: shell, writing or editing files, running code, subagents, plan mode, browser control, and **the CLI's own image generation**. A picture for the deck is made through the app's `image_generate`, so that it gets the deck's image style and palette, lands in the workspace's assets and goes into its element (§7).

### 6.5 The events (standard output)

The CLI's events are the app's `AgentEvent`s, with the same names and fields (`harness/types.rs`), so the adapter maps them one to one.

| `type` | Fields | When |
|---|---|---|
| `session_started` | `sessionId`, `model` | Once, on a created conversation, when the model accepted the first request (§6.2). On a resumed one, never. `model` is the model actually used. |
| `text_delta` | `text` | The next piece of the reply. The pieces of a turn, joined, are the reply exactly: the final message is not sent again after its deltas. Without `streaming`, each message as one piece. |
| `thinking_delta` | `text` | The next piece of the reasoning; may be empty, as a sign of life. Only with `thinking`. |
| `tool_call_started` | `id`, `name`, `source`, `input` | The agent called a tool. `name` is the tool's own name, without a server prefix (`slide_create_from_html`, not `mcp__slidr__slide_create_from_html`). `source`: `app` for the Deck API, `harness` for the CLI's own (`web_search`). `input`: the complete arguments object. |
| `tool_call_finished` | `id`, `ok`, `summary` | The call `id` returned. `summary`: at most 300 characters of the result, for the chip. |
| `error` | `kind`, `message` | Something the user should see (§6.6). |
| `turn_completed` | `outcome` | The last line of a turn: `completed`, or `failed` after an `error`. |

Order: `session_started` (if any) before anything else of the turn; every `tool_call_started` followed by its `tool_call_finished` before `turn_completed`; `turn_completed` last, exactly once. An `id` is unique within the conversation. The CLI never sends `interrupted` or `exited`: the app ends the process and says those itself.

A turn, as the app reads it:

```jsonl
{"type":"session_started","sessionId":"0d6c3f8e-5f2a-4c1e-9a57-3b1f1f0e2a44","model":"acme-large"}
{"type":"text_delta","text":"אוסיף שקף עם "}
{"type":"text_delta","text":"שלושת המספרים של הרבעון."}
{"type":"tool_call_started","id":"call_1","name":"slide_create_from_html","source":"app","input":{"index":3,"html":"<section>…</section>"}}
{"type":"tool_call_started","id":"call_2","name":"image_generate","source":"app","input":{"prompt":"…","elementId":"e_7"}}
{"type":"tool_call_finished","id":"call_2","ok":true,"summary":"making 1 image for s_4"}
{"type":"tool_call_finished","id":"call_1","ok":true,"summary":"created s_4"}
{"type":"tool_call_started","id":"call_3","name":"slide_render","source":"app","input":{"slideId":"s_4"}}
{"type":"tool_call_finished","id":"call_3","ok":true,"summary":"rendered s_4"}
{"type":"text_delta","text":"הוספתי את השקף."}
{"type":"turn_completed","outcome":"completed"}
```

### 6.6 Errors

`kind` is one of a closed list. The message is English, for the log and for the user's details; the app words what the user reads from `kind`.

| `kind` | When | What the app does | `AgentErrorKind` |
|---|---|---|---|
| `not_logged_in` | No sign-in, or it expired. | Offers Sign in. | `not_logged_in` |
| `quota` | A usage limit was reached. | Says so; the session takes another turn. | `quota` |
| `network` | The model could not be reached. Nothing is wrong with the turn. | Offers to send it again. | `network` |
| `tools_unavailable` | The MCP server could not be reached or initialized. | Stops the turn. | `tools_unavailable` |
| `resume_failed` | `resume: true` on a conversation the CLI does not have. | Ends the session; a new one starts with a summary. | `resume_failed` |
| `session_exists` | `resume: false` on an ID the CLI has. | Starts the turn once more under a new ID. Not shown. | — |
| `invalid_input` | A field the CLI cannot take: an unknown model or effort, an image type. | Shows it. | `invalid_input` |
| `turn_failed` | Anything else the model or the CLI reported. | Shows it; the session takes another turn. | `turn_failed` |

## 7. Image generation: `slidr image`

### 7.1 How the app uses it

The agent never runs the CLI for an image. It calls the Deck API — `image_generate`, `image_fill_placeholders`, `image_edit` — and the app's image service runs the provider chosen in Settings → Images (`images.defaultProvider`): one process per image, up to `maxParallel` at once, `count` images per job. The bytes become a workspace asset (`<workspace>/assets/<sha256>.<ext>`), with the CLI's `id` as `lineage.provider`.

An image run is independent of any turn. It runs while a turn of the same CLI runs, and may outlive it. The CLI's `ProviderDescriptor.harness` is its own `id`, so Settings → Images offers its sign-in through the agent's entry, as it does for Codex.

### 7.2 The request (standard input)

The working directory is an empty temporary folder of its own, `outputDir`. The app removes it once the image is read, however the run ended.

```json
{
  "protocol": 1,
  "operation": "generate",
  "prompt": "A rooftop solar array at dawn over a Mediterranean city, warm low sun… Style: editorial photography, soft contrast. Palette: #0F3D3E, #F2C14E, #F7F3EA.",
  "aspect": "16:9",
  "quality": "high",
  "outputDir": "C:\\Users\\…\\Temp\\slidr-image-7f1c…"
}
```

| Field | Type | When | Meaning | From |
|---|---|---|---|---|
| `protocol` | int | always | `1`. | — |
| `operation` | `generate` \| `edit` | always | `edit` only when `images.edit` is not `none`. | — |
| `prompt` | string | `generate` | What the image shows, with the deck's image style and palette already added by the app. Used as it is: the CLI adds no style of its own. At most 8,000 characters. | `GenerateRequest.prompt` |
| `instruction` | string | `edit` | What to change. | `EditRequest.instruction` |
| `aspect` | `16:9` \| `4:3` \| `1:1` \| `3:4` \| `9:16` | always | The shape of the frame the image is for (GEN-05). The CLI gets as close as it can; the element's crop does the rest. For `edit`, the source's own shape is kept. | `Aspect` |
| `quality` | `low` \| `medium` \| `high` \| `auto` | with `images.quality` | Settings → Images: what an image costs and how long it takes. | images settings |
| `source` | absolute path | `edit` | The image to edit, in the workspace. Read only. | `EditRequest.source` |
| `mask` | absolute path | `edit`, with `images.mask` | An image whose transparent area is where the change may happen. Read only. | `EditRequest.mask` |
| `outputDir` | absolute path | always | Where the CLI writes the one image it makes. Also its working directory. | — |

### 7.3 The result (standard output)

One line, the last:

```jsonl
{"type":"image","file":"image.png","width":1672,"height":941}
```

or

```jsonl
{"type":"error","kind":"generation_failed","message":"The request was refused by the content policy: it names a real person. Describe the scene without them."}
```

| Field | Meaning |
|---|---|
| `file` | The image's file name in `outputDir`. |
| `width`, `height` | Its size in pixels. |

The image:

- PNG, JPEG or WebP, sRGB. PNG is preferred.
- The long side at least 1024 pixels; 1536–2048 is right for a 1920×1080 slide. At most 20 MB.
- As close to `aspect` as the model allows (Codex makes 1672×941 for 16:9).
- No watermark, frame or caption the prompt did not ask for.

Time: within 240 seconds, or the app ends the run with `timeout` (ADR-097: the Deck API keeps no timers of its own, so the providers do). Codex takes 43–95 seconds an image.

Cancellation: the app ends the process when the job is cancelled. Nothing of the run may be left outside `outputDir`: no process, no file in the CLI's own folders (`codex_cli.rs` removes `generated_images/<thread>/` for the same reason).

### 7.4 What an edit is

`images.edit` says, and `image_edit`'s result tells the agent, which it must tell the user:

| `edit` | Meaning |
|---|---|
| `none` | No editing. `image_edit` is refused before the CLI is run. |
| `regenerate` | A new image drawn after the source: the composition is similar, but no pixel is kept and small details move. A mask is refused. |
| `exact` | The source with only what the instruction asks changed, at the source's size. With `mask`, every pixel outside it is kept. |

### 7.5 Errors

The message reaches the agent as its tool call's result, so it says what to do next where there is something to do.

| `kind` | When | `ImageErrorKind` |
|---|---|---|
| `not_logged_in` | No sign-in, or it expired. | `not_logged_in` |
| `quota` | A usage limit was reached. | `quota` |
| `generation_failed` | The CLI ran and made no usable image: refused by a policy, the model failed, the network failed. | `generation_failed` |
| `invalid_input` | A field it cannot take. | `invalid_input` |
| `unsupported` | An edit, or a mask, it does not do. | `unsupported` |

`timeout`, `cancelled` and `io` are the app's to say.

## 8. The model behind the CLI

What the app's agent relies on, whatever model the CLI runs:

- **Tool use** with JSON Schema arguments, several calls in one step.
- **Vision**: pictures in the user's turn and in tool results. Without it the agent cannot look at its slides, and the design check cannot pass.
- **Context**: the system prompt is about 11,000 tokens, the tool listing several thousand more, and a slide's HTML can be tens of thousands. 128,000 tokens at least.
- **Long instructions** followed closely, and replies in the UI's language — Hebrew and English first — with right-to-left text in the HTML it writes.

## 9. Security

- The app runs only a `command` the user added in Settings, and shows its path there. It never runs a program it found on its own under this protocol.
- The tool endpoint's token is the session's own (SEC-01). It is in the environment of the turn's process and nowhere else: not on disk, not on standard output, not sent anywhere but `tools.url`.
- The app holds no key of the CLI's. The CLI signs in through `login` and keeps its credentials where it keeps them for itself.
- The CLI reads only its working folder, and for `image` the `source` and `mask` it was given. It writes only to its own store and, for `image`, to `outputDir`.
- It reaches the network only for its model and, with `webAccess`, its web tools.

## 10. Conformance

Before a CLI is offered, these hold. The app's tests run the same checks against a stand-in (as `image_providers/codex_cli/fake-cli.mjs` stands in for Codex).

1. `describe`, `status` and `models` answer in time, with nothing on standard output but their JSON.
2. A turn calls an app tool through the bridge and reports the call with its bare name and `source: "app"`.
3. Two calls in one step run side by side: a slow tool does not hold up a fast one.
4. A tool result with an image reaches the model: asked what the rendered slide shows, the agent says.
5. A result of 300,000 characters reaches the model whole.
6. A turn is ended in the middle of a tool call; the next turn resumes the conversation and is answered.
7. `resume: false` on a stored ID gives `session_exists`; `resume: true` on an unknown one gives `resume_failed`, before the model is called.
8. With `webAccess: false` no web tool is offered to the model; no shell or file-writing tool is ever offered.
9. Nothing of the user's own configuration is loaded: an MCP server and an `AGENTS.md` placed for the test are not seen.
10. A Hebrew request and reply survive the round trip unchanged.
11. `image` makes a 16:9 image within 240 seconds; ended halfway, it leaves no process and no file outside `outputDir`.
12. A turn and three image runs of the same CLI run at once without a lock error.

## 11. What changes in the app

The outline of the work, for when this is taken up; an ADR records it then.

- **Settings** (`src-tauri/src/settings`): the `agents.custom` section, checked on write (§3).
- **Harness** (`harness/custom_cli.rs`): one `AgentHarness` for every registered CLI, built on `one_shot.rs`'s process handling — a process per turn, stopped by ending it, the `session_exists` retry — with events taken one to one. `registry::builtin` appends one per registered CLI that `describe`s an `agent`.
- **Setup** (`harness/setup.rs`): `connect` runs `slidr models`; `login` opens a terminal on `slidr login`; `install` is not offered.
- **Image provider** (`image_providers/custom_cli.rs`): one `ImageProvider` for every registered CLI that `describe`s `images`, with `harness` set to its id; appended by `image_providers::registry::builtin`.
- **Webview**: Settings → Agent gets "Add a CLI…" (a file picker, then `describe`, showing the name and version or why it was refused); `harnessLook.ts` takes the `glyph`; `attachment_read` follows `builtinTools` instead of the fixed `ATTACHMENT_HARNESSES`.
- **Tests**: a Node.js stand-in CLI that speaks this protocol and replays recorded turns, its fixtures beside `harness/fixtures/contract.json`, and `e2e/harness-setup.spec.ts` extended with adding one, looked at in Hebrew and English.
