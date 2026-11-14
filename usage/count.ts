/**
 * The count of Slidr's installations and of their starts (docs/adr/ADR-142-installations-and-
 * starts-counted.md): what the Worker `usage` (`worker.ts`) does, at https://usage.slidr.studio.
 *
 * The app sends `POST /v1/start` at every start, unless the user or the organization turned it
 * off (`desktop/src-tauri/src/usage.rs`), with a JSON body of four fields:
 *
 * ```json
 * { "install": "<random UUID of the installation>", "version": "0.4.0", "os": "windows", "language": "he" }
 * ```
 *
 * The Worker keeps, in its D1 database (`schema.sql`), one row per installation (the day it was
 * first and last seen, and what it last said) and one row per installation per day it started
 * (how many times). It adds the country Cloudflare sees the request from, and keeps no address,
 * no header and nothing else of the request. The days are kept for `KEEP_DAYS`, then forgotten
 * (`forget`, once a day). Nothing is answered but the status: there is nothing to read here.
 */

/** The binding of the database, as far as this Worker uses it. */
export interface Database {
  prepare(query: string): Statement;
  batch(statements: Statement[]): Promise<unknown>;
}

export interface Statement {
  bind(...values: (string | number)[]): Statement;
  run(): Promise<unknown>;
}

export interface Env {
  DB: Database;
}

/** What one start says. */
export interface Start {
  install: string;
  version: string;
  os: string;
  language: string;
}

/** The id the app makes: a random (version 4) UUID, as Rust's `uuid` writes it. */
const INSTALL = /^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/;
/** A version of the app: `0.4.0`, `0.5.0-beta.1`. */
const VERSION = /^\d{1,4}\.\d{1,4}\.\d{1,4}(?:-[0-9A-Za-z.-]{1,24})?$/;
/** A language tag of the interface: `he`, `pt-BR`. */
const LANGUAGE = /^[A-Za-z0-9-]{1,16}$/;
/** The systems the app is built for (Rust's `std::env::consts::OS`); any other is `other`. */
const SYSTEMS = new Set(['windows', 'macos', 'linux']);
/** The largest body read; a start is some 120 bytes. */
const MAX_BODY = 1024;
/** How long the days of use are kept: a year and a month, to compare a month with its last year's. */
export const KEEP_DAYS = 400;

const DAY_MS = 24 * 60 * 60 * 1000;

/** The start a body says, or null when it is not one. */
export function parseStart(value: unknown): Start | null {
  if (typeof value !== 'object' || value === null) return null;
  const { install, version, os, language } = value as Record<string, unknown>;
  if (typeof install !== 'string' || !INSTALL.test(install)) return null;
  if (typeof version !== 'string' || !VERSION.test(version)) return null;
  if (typeof os !== 'string' || typeof language !== 'string') return null;
  return {
    install,
    version,
    os: SYSTEMS.has(os) ? os : 'other',
    language: LANGUAGE.test(language) ? language : 'und',
  };
}

/** The country Cloudflare sees the request from, two letters; `XX` when it does not say. */
function countryOf(request: Request): string {
  const country = (request as Request & { cf?: { country?: unknown } }).cf?.country;
  return typeof country === 'string' && /^[A-Z]{2}$/.test(country) ? country : 'XX';
}

const dayOf = (time: Date) => time.toISOString().slice(0, 10);

const status = (code: number, headers?: Record<string, string>) =>
  new Response(null, { status: code, headers });

/** Answers a request: counts a start, or says why it does not. */
export async function handle(request: Request, env: Env, now = new Date()): Promise<Response> {
  const { pathname } = new URL(request.url);
  if (pathname !== '/v1/start') return status(404);
  if (request.method !== 'POST') return status(405, { allow: 'POST' });
  if (Number(request.headers.get('content-length') ?? 0) > MAX_BODY) return status(413);
  const text = await request.text();
  if (text.length > MAX_BODY) return status(413);
  let start: Start | null;
  try {
    start = parseStart(JSON.parse(text));
  } catch {
    start = null;
  }
  if (!start) return status(400);

  const day = dayOf(now);
  try {
    await env.DB.batch([
      env.DB.prepare(
        `INSERT INTO installs (id, first_day, last_day, version, os, language, country)
         VALUES (?1, ?2, ?2, ?3, ?4, ?5, ?6)
         ON CONFLICT (id) DO UPDATE SET
           last_day = excluded.last_day, version = excluded.version, os = excluded.os,
           language = excluded.language, country = excluded.country`,
      ).bind(start.install, day, start.version, start.os, start.language, countryOf(request)),
      env.DB.prepare(
        `INSERT INTO days (day, id, version, opens) VALUES (?1, ?2, ?3, 1)
         ON CONFLICT (day, id) DO UPDATE SET opens = opens + 1, version = excluded.version`,
      ).bind(day, start.install, start.version),
    ]);
  } catch {
    // The app does not send a start again; one lost start is one day's undercount at most.
    return status(503);
  }
  return status(204);
}

/** Forgets the days older than `KEEP_DAYS`. The installations stay: they are the count. */
export async function forget(env: Env, now = new Date()): Promise<void> {
  const before = dayOf(new Date(now.getTime() - KEEP_DAYS * DAY_MS));
  await env.DB.prepare('DELETE FROM days WHERE day < ?1').bind(before).run();
}
