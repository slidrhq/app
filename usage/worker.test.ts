import { describe, expect, it } from 'vitest';
import { forget, handle, KEEP_DAYS, parseStart, type Database, type Env } from './count';
import worker from './worker';

/** A database that records what it was asked, and fails when told to. */
function recorder(fail = false) {
  const runs: { query: string; values: (string | number)[] }[] = [];
  const db: Database = {
    prepare(query) {
      const statement = {
        values: [] as (string | number)[],
        bind(...values: (string | number)[]) {
          statement.values = values;
          return statement;
        },
        run() {
          runs.push({ query: query.replace(/\s+/g, ' ').trim(), values: statement.values });
          return Promise.resolve();
        },
      };
      return statement;
    },
    async batch(statements) {
      if (fail) throw new Error('D1 is down');
      for (const statement of statements) await statement.run();
    },
  };
  return { env: { DB: db } satisfies Env, runs };
}

const ID = '6f1c2a52-8a1e-4c55-9a8e-1a2b3c4d5e6f';
const START = { install: ID, version: '0.4.0', os: 'windows', language: 'he' };
const NOW = new Date('2026-11-14T10:00:00Z');

function post(body: unknown, init: RequestInit & { country?: string } = {}) {
  const request = new Request('https://usage.slidr.studio/v1/start', {
    method: 'POST',
    body: typeof body === 'string' ? body : JSON.stringify(body),
    headers: { 'content-type': 'application/json' },
    ...init,
  });
  if (init.country) Object.assign(request, { cf: { country: init.country } });
  return request;
}

describe('the usage Worker (ADR-142)', () => {
  it('counts a start: the installation and its day', async () => {
    const { env, runs } = recorder();
    const response = await handle(post(START, { country: 'IL' }), env, NOW);
    expect(response.status).toBe(204);
    expect(runs).toHaveLength(2);
    expect(runs[0]?.query).toMatch(/^INSERT INTO installs .* ON CONFLICT \(id\) DO UPDATE/);
    expect(runs[0]?.values).toEqual([ID, '2026-11-14', '0.4.0', 'windows', 'he', 'IL']);
    expect(runs[1]?.query).toMatch(/^INSERT INTO days .* opens = opens \+ 1/);
    expect(runs[1]?.values).toEqual(['2026-11-14', ID, '0.4.0']);
  });

  it('keeps no more than the start says, and no country it was not told', async () => {
    const { env, runs } = recorder();
    await handle(post({ ...START, os: 'plan9', language: 'he"--', extra: 'x' }), env, NOW);
    expect(runs[0]?.values).toEqual([ID, '2026-11-14', '0.4.0', 'other', 'und', 'XX']);
  });

  it('turns away what is not a start', async () => {
    const { env, runs } = recorder();
    const bad = [
      post('not json'),
      post({ ...START, install: 'not-a-uuid' }),
      post({ ...START, install: ID.toUpperCase() }),
      post({ ...START, version: 'latest' }),
      post({ ...START, os: 1 }),
      post([START]),
    ];
    for (const request of bad) expect((await handle(request, env, NOW)).status).toBe(400);
    expect((await handle(post('x'.repeat(2000)), env, NOW)).status).toBe(413);
    const get = new Request('https://usage.slidr.studio/v1/start');
    expect((await handle(get, env, NOW)).status).toBe(405);
    const elsewhere = new Request('https://usage.slidr.studio/', { method: 'POST', body: '{}' });
    expect((await handle(elsewhere, env, NOW)).status).toBe(404);
    expect(runs).toEqual([]);
  });

  it('says 503 when the database fails, and nothing else of it', async () => {
    const { env } = recorder(true);
    const response = await handle(post(START), env, NOW);
    expect(response.status).toBe(503);
    expect(await response.text()).toBe('');
  });

  it(`forgets the days older than ${KEEP_DAYS} days`, async () => {
    const { env, runs } = recorder();
    await forget(env, NOW);
    expect(runs).toEqual([{ query: 'DELETE FROM days WHERE day < ?1', values: ['2025-10-10'] }]);
  });

  it('reads a version with a pre-release, and an unknown language as und', () => {
    expect(parseStart({ ...START, version: '0.5.0-beta.1' })?.version).toBe('0.5.0-beta.1');
    expect(parseStart({ ...START, language: '' })?.language).toBe('und');
    expect(parseStart(null)).toBeNull();
  });

  it('runs its jobs from the scheduled event', async () => {
    const { env, runs } = recorder();
    const waited: Promise<unknown>[] = [];
    worker.scheduled({}, env, { waitUntil: (work) => void waited.push(work) });
    await Promise.all(waited);
    expect(runs[0]?.query).toMatch(/^DELETE FROM days/);
  });
});
