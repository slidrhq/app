// A stand-in for a CLI of the custom agent protocol (docs/custom-agent-cli.md), for the adapter's
// tests (`custom_cli.rs`) without a real one. Its conversations are files `<id>.json` in the
// folder FAKE_STORE names; FAKE_STATE is what `status` says (`ready`, `not_logged_in`). What a
// turn's text says picks what it does:
//   "hang"   text deltas every 20ms until it is ended
//   "crash"  writes to standard error and exits with 3, without an error line
//   "quota"  reports a quota error
//   anything else: thinking, "echo: " and the text, one app tool call, and a completed turn
// Each turn writes probe.json into its working folder: the request, its arguments and what it
// found in its environment.
/* global process, setInterval */
import fs from 'node:fs';
import path from 'node:path';

const out = (line) => process.stdout.write(JSON.stringify(line) + '\n');
const [, , namespace, subcommand] = process.argv;
const state = process.env.FAKE_STATE ?? 'ready';
const store = process.env.FAKE_STORE ?? '.';

if (namespace !== 'slidr') {
  process.stderr.write('not a Slidr subcommand\n');
  process.exit(2);
}

const read = () =>
  new Promise((resolve) => {
    let text = '';
    process.stdin.setEncoding('utf8');
    process.stdin.on('data', (chunk) => (text += chunk));
    process.stdin.on('end', () => resolve(JSON.parse(text)));
  });

switch (subcommand) {
  case 'describe':
    out({
      protocol: [1],
      name: 'Acme Agent',
      version: '0.4.2',
      glyph: 'A',
      agent: {
        capabilities: { streaming: true, imageInput: true, thinking: true },
        builtinTools: [],
      },
      images: null,
    });
    break;
  case 'status':
    out({ state, account: state === 'ready' ? 'Acme Pro' : null, detail: null });
    break;
  case 'models':
    if (state !== 'ready') {
      out({ type: 'error', kind: 'not_logged_in', message: 'Sign in to Acme.' });
      process.exit(1);
    }
    out({
      models: [
        { id: 'acme-large', label: 'Acme Large', effortLevels: ['low', 'high'] },
        { id: 'acme-fast', label: 'Acme Fast' },
      ],
      default: 'acme-large',
    });
    break;
  case 'turn': {
    const request = await read();
    fs.writeFileSync(
      'probe.json',
      JSON.stringify({
        request,
        argv: process.argv.slice(2),
        protocol: process.env.SLIDR_PROTOCOL,
        token: process.env.SLIDR_MCP_TOKEN,
        region: process.env.ACME_REGION,
      }),
    );
    const { id, resume } = request.session;
    const file = path.join(store, `${id}.json`);
    const exists = fs.existsSync(file);
    if (!resume && exists) {
      out({ type: 'error', kind: 'session_exists', message: `A conversation ${id} exists.` });
      process.exit(1);
    }
    if (resume && !exists) {
      out({ type: 'error', kind: 'resume_failed', message: `No conversation ${id}.` });
      process.exit(1);
    }
    if (request.text === 'crash') {
      process.stderr.write('Connecting…\nthe model went away\n');
      process.exit(3);
    }
    if (request.text === 'quota') {
      out({ type: 'error', kind: 'quota', message: 'The usage limit was reached.' });
      out({ type: 'turn_completed', outcome: 'failed' });
      process.exit(1);
    }
    if (!resume) {
      fs.writeFileSync(file, JSON.stringify({ turns: [] }));
      out({ type: 'session_started', sessionId: id, model: request.model });
    }
    if (request.text === 'hang') {
      setInterval(() => out({ type: 'text_delta', text: '.' }), 20);
      break;
    }
    out({ type: 'thinking_delta', text: 'thinking' });
    out({ type: 'text_delta', text: 'echo: ' });
    out({ type: 'text_delta', text: request.text });
    out({
      type: 'tool_call_started',
      id: 'call_1',
      name: 'slide_render',
      source: 'app',
      input: { slideId: 's_1' },
    });
    out({ type: 'tool_call_finished', id: 'call_1', ok: true, summary: 'rendered s_1' });
    out({ type: 'turn_completed', outcome: 'completed' });
    break;
  }
  default:
    process.stderr.write(`unknown subcommand ${subcommand}\n`);
    process.exit(2);
}
