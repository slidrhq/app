# ADR-141 — Codex and Claude Code sign in without a window, and the app can call it off

Status: Implemented on 2026-11-09 in the working tree; **not committed** at the time of this record.

## Request

"בחיבור ללוגין - נפתח חלון CMD" — said of signing in Codex CLI from the chat, as the image provider (ADR-140). Then, of the CLIs that kept their terminal: "כן, בדוק" (check Claude Code).

## Context

- Sign in ran every CLI's sign-in in a visible PowerShell console (`setup::login`, `terminal`): the interactive sign-ins need one (Gemini's start, a device code to read), and closing the window was how the user called a sign-in off.
- `codex login` needs nothing of a terminal: it opens the sign-in page in the browser itself, waits on a local server for the answer, and exits with `0` once signed in. Its console showed only a line or two, over the app.
- `claude auth login` (Claude Code 2.1.292, read from its own code and run as below) does the same: it listens on `127.0.0.1` on a free port, opens the browser itself (`rundll32 url,OpenURL`, or `BROWSER`), and exits with `0` ("Login successful.") once the browser's answer reaches that listener. Its "Paste code here if prompted" reads a line of input with plain `readline`, not a terminal UI, and only for a browser that cannot reach the listener (another computer); with no input it keeps waiting for the listener.

## Decision

- **Codex and Claude Code sign in without a window** (`browser_login` in `harness/setup.rs`): `codex login` and `claude auth login` run hidden (`CREATE_NO_WINDOW`), with no input; the app waits for them as before, at most 10 minutes. A sign-in that fails says what the CLI wrote, its errors first.
- **The app's Cancel stands for closing the window.** While such a sign-in waits, "Cancel sign-in" stands under the words that ask the user to finish it: in the chat's setup of the agent and of the images, in a problem card of the chat, and in Settings (agent and image providers). It calls `agent_cancel_login`, which stops the CLI; the harness is left as it was before the sign-in, with nothing said about a failure (`HarnessSetup.cancelLogin`).
- **Which CLIs** is the harness's look (`signIn: 'browser'` in `harnessLook.ts`). GitHub Copilot (a device code to read), Gemini (its interactive start), Grok and an organization's own agent keep their terminal: their sign-ins may ask for something there, and that was not checked otherwise.

## Consequences

- No console window opens for Codex or Claude Code, as the agent or as the image provider; the browser is "the window that opened" of the words that wait.
- On a computer whose browser cannot reach `127.0.0.1` (a remote session), Claude Code's paste-a-code fallback is not offered; Cancel ends the wait.
- `setup.rs` tests a stand-in sign-in that ends, fails with its words, and is called off at once; `harnessSetup.test.ts` that a call-off leaves no error and a failure still says why; `harness-setup.spec.ts` that the chat offers Cancel during a held sign-in and returns to Sign in.
- Checked by hand on 2026-11-09: `claude auth login` started hidden, with no input and a scratch `CLAUDE_CONFIG_DIR` (the user's sign-in untouched), and a stand-in `BROWSER` that recorded the URL: it kept waiting, handed the browser a URL whose `redirect_uri` is `http://localhost:<port>/callback`, and that port answered. It was stopped before anything was signed in.
- Not run: either sign-in completed from the app, end to end in the desktop window.
