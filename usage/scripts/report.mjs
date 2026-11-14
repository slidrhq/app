/**
 * How many installations of Slidr there are and how many are in use, read from the database of
 * the Worker `usage` (../README.md). Run `pnpm report` in usage/, signed in to Cloudflare
 * (`pnpm exec wrangler login`). Days are UTC.
 */
import { execFileSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const DATABASE = 'slidr-usage';
// Its own bin, run with this Node: no shell, and nothing of the package's exports needed.
const wrangler = join(
  dirname(createRequire(import.meta.url).resolve('wrangler/package.json')),
  'bin/wrangler.js',
);
const cwd = fileURLToPath(new URL('..', import.meta.url));

/** The rows of one query, run on the database of the deployed Worker. */
function query(sql) {
  const out = execFileSync(
    process.execPath,
    [wrangler, 'd1', 'execute', DATABASE, '--remote', '--json', '--command', sql],
    { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'inherit'] },
  );
  const [result] = JSON.parse(out);
  return result?.results ?? [];
}

/** The installations active in the last 30 days, by one of what they said. */
const activeBy = (column) =>
  query(
    `SELECT ${column}, COUNT(*) AS installs FROM installs
     WHERE last_day >= date('now', '-29 days') GROUP BY ${column} ORDER BY installs DESC`,
  );

console.log('Installations and users');
console.table(
  query(`SELECT
    (SELECT COUNT(*) FROM installs) AS installs,
    (SELECT COUNT(*) FROM installs WHERE first_day >= date('now', '-6 days')) AS new_7_days,
    (SELECT COUNT(*) FROM installs WHERE first_day >= date('now', '-29 days')) AS new_30_days,
    (SELECT COUNT(DISTINCT id) FROM days WHERE day = date('now')) AS active_today,
    (SELECT COUNT(DISTINCT id) FROM days WHERE day >= date('now', '-6 days')) AS active_7_days,
    (SELECT COUNT(DISTINCT id) FROM days WHERE day >= date('now', '-29 days')) AS active_30_days`),
);

console.log('The last 14 days');
console.table(
  query(`SELECT d.day, COUNT(*) AS active, SUM(d.opens) AS starts,
      (SELECT COUNT(*) FROM installs i WHERE i.first_day = d.day) AS new
    FROM days d WHERE d.day >= date('now', '-13 days')
    GROUP BY d.day ORDER BY d.day DESC`),
);

console.log('Active in the last 30 days, by version');
console.table(activeBy('version'));
console.log('… by interface language');
console.table(activeBy('language'));
console.log('… by country');
console.table(activeBy('country'));
console.log('… by operating system');
console.table(activeBy('os'));
