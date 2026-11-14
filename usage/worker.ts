/**
 * The Worker `usage` (`wrangler.jsonc`): counts a start (`count.ts`) and, once a day, forgets the
 * days it no longer keeps. Its module exports only the handlers, as the runtime requires.
 */
import { forget, handle, type Env } from './count';

export default {
  fetch: (request: Request, env: Env) => handle(request, env),
  scheduled: (_event: unknown, env: Env, context: { waitUntil(work: Promise<unknown>): void }) => {
    context.waitUntil(forget(env));
  },
};
