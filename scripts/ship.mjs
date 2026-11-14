// Ships a release of Slidr from start to finish, on the author's machine: builds and signs the
// installer (release.mjs, then .github/workflows/release.yml on the runner here), checks the draft,
// publishes it, and waits until the homepage and the app's updater offer it (site.yml, then the
// site's deploy).
//
//   pnpm ship              the version the app has now
//   pnpm ship --bump       raises it by 0.1.0 first (release.mjs --bump)
//   pnpm ship --check      runs pnpm check:all before the tag
//   pnpm ship --publish    publishes the draft without asking
//   pnpm ship --dry-run    checks everything it can, and changes nothing
//
// It reads where the release of the app's version stands on GitHub and goes on from there, so after
// a failure or a stop, fix what it names and run it again:
//
//   no tag yet       checks the machine, starts the runner, tags and pushes (release.mjs)
//   a build          starts the runner if it is down, and waits for the build
//   a failed build   shows the end of its log, and offers to run it again
//   a draft          stops the runner, checks the installer's two signatures and latest.json,
//                    offers to install it, and asks to publish
//   published        waits for the Site workflow and the site's deploy, then checks the homepage's
//                    download buttons and the updater's latest.json
//
// The traps of this machine it takes care of, each of which once cost a failed or stuck build:
// - signing hangs for minutes when the SimplySign Desktop session has expired, though the
//   certificate is still in the store: a scratch file is signed first, with a time limit;
// - a runner started from pwsh 7 inherits its PSModulePath, and Windows PowerShell then cannot see
//   Cert:, so the runner is started with the machine's PSModulePath;
// - ~/pnpm-workspace.yaml breaks pnpm/action-setup: it is set aside while the build runs, and put
//   back after;
// - the runner must be registered to slidrhq/app, and stays up only while the build runs (the
//   repository is public, and a job on the runner runs as you).
import { execFileSync, spawn, spawnSync } from 'node:child_process';
import { createHash, createPublicKey, verify } from 'node:crypto';
import { copyFileSync, existsSync, mkdtempSync, readFileSync, renameSync, rmSync } from 'node:fs';
import { homedir, tmpdir } from 'node:os';
import { join } from 'node:path';
import { createInterface } from 'node:readline/promises';
import { fileURLToPath } from 'node:url';

process.chdir(fileURLToPath(new URL('..', import.meta.url)));

const OPTIONS = ['--bump', '--check', '--publish', '--dry-run'];
const args = process.argv.slice(2);
const unknown = args.filter((arg) => !OPTIONS.includes(arg));
if (unknown.length > 0) fail(`Unknown option: ${unknown.join(' ')}`);
const bump = args.includes('--bump');
const check = args.includes('--check');
const publishWithoutAsking = args.includes('--publish');
const dryRun = args.includes('--dry-run');

const REPO = 'slidrhq/app';
const SITE_REPO = 'slidrhq/site';
const HOMEPAGE = 'https://slidr.studio/';
const RUNNER_DIR = process.env.SLIDR_RUNNER_DIR || 'C:\\actions-runner';
const RUNNER_LABEL = 'slidr-signing';
const PNPM_WORKSPACE = join(homedir(), 'pnpm-workspace.yaml');
const PNPM_ASIDE = `${PNPM_WORKSPACE}.release-aside`;
const TAURI_CONF = 'desktop/src-tauri/tauri.conf.json';
// The certificate the Release workflow signs with, read from it so that the two cannot differ.
const CERT =
  readFileSync('.github/workflows/release.yml', 'utf8').match(/SLIDR_SIGN_CERT:\s*(\w+)/)?.[1] ??
  fail('No SLIDR_SIGN_CERT in .github/workflows/release.yml');
const tauriConf = () => JSON.parse(readFileSync(TAURI_CONF, 'utf8'));
const UPDATER_FEED = tauriConf().plugins.updater.endpoints[0];

const installerName = (version) => `Slidr_${version}_x64-setup.exe`;
const installerUrl = (version) =>
  `https://github.com/${REPO}/releases/download/v${version}/${installerName(version)}`;

// ---------------------------------------------------------------------------------------------

/** Set while a build runs on the runner: leaving then keeps the runner up and the file aside. */
let building = false;
/** Set once this run started the runner, so that leaving early stops it again. */
let startedRunner = false;
/** Set once this run set ~/pnpm-workspace.yaml aside, so that leaving early puts it back. */
let setAside = false;

process.on('SIGINT', () => process.exit(130));
process.on('exit', () => {
  if (dryRun) return;
  if (building) {
    console.log(
      '\nThe build goes on: the runner stays up, and ~/pnpm-workspace.yaml stays aside.\n' +
        'Run pnpm ship again to follow it; it stops the runner and puts the file back at the end.',
    );
    return;
  }
  if (startedRunner) stopRunner();
  if (setAside) putPnpmWorkspaceBack();
});

async function main() {
  let version = tauriConf().version;
  let tag = `v${version}`;
  console.log(
    `Slidr ${version}${bump ? ', raised by 0.1.0 first' : ''}${dryRun ? ' (dry run: nothing changes)' : ''}`,
  );

  let release = bump ? null : findRelease(tag);
  const tagged = !bump && (release !== null || remoteTagExists(tag));

  if (!tagged) {
    await tagRelease();
    if (dryRun) return;
    version = tauriConf().version;
    tag = `v${version}`;
  }

  if (release === null) {
    await build(tag);
    if (dryRun) return;
    release =
      findRelease(tag) ?? fail(`The build of ${tag} succeeded, but no release of it is on GitHub`);
  }

  if (release.isDraft) {
    stopRunner();
    putPnpmWorkspaceBack();
    const installer = checkDraft(tag, version, release);
    if (dryRun) return note('A draft: a real run offers to install it and asks to publish it.');
    if (!(await publish(tag, version, installer))) return;
    release = findRelease(tag) ?? fail(`${tag} was published, and then not found`);
  }

  await followSite(version, release);
  console.log(`\nSlidr ${version} is out: ${release.url}`);
}

// --- Tag ---------------------------------------------------------------------------------------

async function tagRelease() {
  const flags = bump ? ['--bump'] : [];
  step('Release checks (release.mjs --dry-run)');
  if (runVisible(process.execPath, ['release.mjs', '--dry-run', ...flags]) !== 0) process.exit(1);

  if (check) {
    step('pnpm check:all');
    if (spawnSync('pnpm check:all', { shell: true, stdio: 'inherit' }).status !== 0) {
      fail('pnpm check:all failed');
    }
  }

  step('This machine');
  checkRunnerRegistration();
  await checkSigning();
  if (dryRun) return;

  step('Tag and push (release.mjs)');
  building = true;
  setPnpmWorkspaceAside();
  await startRunner();
  if (runVisible(process.execPath, ['release.mjs', ...flags]) !== 0) {
    building = false;
    process.exit(1);
  }
}

// --- Build ------------------------------------------------------------------------------------

async function build(tag) {
  step(`Build of ${tag} (release.yml)`);
  let run =
    (await waitFor(() => releaseRun(tag), 120_000)) ??
    fail(`${tag} is on GitHub, but no Release workflow ran for it. Is the workflow on?`);

  for (;;) {
    if (run.status !== 'completed') {
      if (dryRun) return note(`The build is ${run.status}: ${run.url}`);
      building = true;
      setPnpmWorkspaceAside();
      await startRunner();
      note(`Waiting for ${run.url}`);
      run = watch(run, REPO);
      continue;
    }
    building = false;
    if (run.conclusion === 'success') return note('The build succeeded.');

    console.log(`\nThe build ${run.conclusion}: ${run.url}`);
    const log = spawnSync(
      'gh',
      ['run', 'view', String(run.databaseId), '--repo', REPO, '--log-failed'],
      {
        encoding: 'utf8',
        maxBuffer: 256 * 1024 * 1024,
      },
    );
    console.log(log.stdout.trim().split('\n').slice(-40).join('\n'));
    const retry =
      !dryRun &&
      (await ask('Run the failed job again? (when the fault was the machine, not the code)'));
    if (!retry) {
      fail(
        `The build of ${tag} ${run.conclusion}. When the code must change, take the tag back\n` +
          `  git push --delete origin ${tag} && git tag -d ${tag}\n` +
          'and release again; when the machine was at fault, fix it and run pnpm ship again.',
      );
    }
    checkRunnerRegistration();
    await checkSigning();
    gh('run', 'rerun', String(run.databaseId), '--repo', REPO, '--failed');
    const id = run.databaseId;
    run =
      (await waitFor(() => {
        const again = viewRun(id, REPO);
        return again.status === 'completed' ? null : again;
      }, 60_000)) ?? fail(`The build did not start again: ${run.url}`);
  }
}

function releaseRun(tag) {
  const runs = ghJsonOrNull(
    'run',
    'list',
    '--repo',
    REPO,
    '--workflow',
    'release.yml',
    '--branch',
    tag,
    '--limit',
    '1',
    '--json',
    RUN_FIELDS,
  );
  return runs?.[0] ?? null;
}

// --- Draft ------------------------------------------------------------------------------------

function checkDraft(tag, version, release) {
  step(`Draft ${tag}`);
  const name = installerName(version);
  const assets = release.assets.map((asset) => asset.name);
  const missing = [name, `${name}.sig`, 'latest.json'].filter((asset) => !assets.includes(asset));
  if (missing.length > 0) fail(`The draft lacks ${missing.join(', ')}: ${release.url}`);

  const dir = mkdtempSync(join(tmpdir(), `slidr-${tag}-`));
  gh('release', 'download', tag, '--repo', REPO, '--dir', dir);
  const installer = join(dir, name);

  const feed = JSON.parse(readFileSync(join(dir, 'latest.json'), 'utf8'));
  const platform = feed.platforms?.['windows-x86_64'];
  const signature = readFileSync(`${installer}.sig`, 'utf8').trim();
  if (feed.version !== version) fail(`latest.json names ${feed.version}, not ${version}`);
  if (platform?.url !== installerUrl(version)) fail(`latest.json points at ${platform?.url}`);
  if (platform.signature !== signature)
    fail(`latest.json's signature is not the one in ${name}.sig`);
  checkUpdaterSignature(installer, signature);
  note(
    "latest.json names the installer, and the updater's key in tauri.conf.json accepts its signature",
  );

  const [status, thumbprint] = powershell(
    `$s = Get-AuthenticodeSignature -LiteralPath ${quote(installer)}; $s.Status; $s.SignerCertificate.Thumbprint`,
  ).split(/\r?\n/);
  if (status !== 'Valid' || thumbprint?.toUpperCase() !== CERT) {
    fail(`The installer's Authenticode signature is ${status}, by ${thumbprint || 'nobody'}`);
  }
  note("The installer is signed with the project's certificate");
  note(installer);
  return installer;
}

/**
 * Checks a signature of Tauri's updater (minisign, in base64) against the public key the app
 * carries, as the installed app will: a release signed with another key never reaches anyone.
 */
function checkUpdaterSignature(file, signature) {
  const keyText = Buffer.from(tauriConf().plugins.updater.pubkey, 'base64').toString('utf8');
  const key = Buffer.from(keyText.trim().split(/\r?\n/)[1], 'base64'); // "Ed", key id (8), key (32)
  const [, sigLine, trustedLine, globalLine] = Buffer.from(signature, 'base64')
    .toString('utf8')
    .trim()
    .split(/\r?\n/);
  const sig = Buffer.from(sigLine, 'base64'); // algorithm (2), key id (8), signature (64)
  const trusted = trustedLine.replace(/^trusted comment: /, '');
  if (!sig.subarray(2, 10).equals(key.subarray(2, 10))) {
    fail(
      'The installer is signed for the updater with another key than the one in tauri.conf.json',
    );
  }
  const publicKey = createPublicKey({
    key: { kty: 'OKP', crv: 'Ed25519', x: key.subarray(10).toString('base64url') },
    format: 'jwk',
  });
  const bytes = readFileSync(file);
  // "ED" signs the file's BLAKE2b-512 hash, the older "Ed" the file itself.
  const signed =
    sig.subarray(0, 2).toString() === 'ED'
      ? createHash('blake2b512').update(bytes).digest()
      : bytes;
  const valid =
    verify(null, signed, publicKey, sig.subarray(10)) &&
    verify(
      null,
      Buffer.concat([sig.subarray(10), Buffer.from(trusted)]),
      publicKey,
      Buffer.from(globalLine, 'base64'),
    );
  if (!valid) fail("The updater's signature of the installer does not verify");
}

async function publish(tag, version, installer) {
  if (!publishWithoutAsking) {
    if (!process.stdin.isTTY) {
      note('Check the installer, then publish it: pnpm ship --publish');
      return false;
    }
    if (
      await ask(
        `Install ${installerName(version)} now, to check it? (the script goes on once it and the app it opens close)`,
      )
    ) {
      powershell(`Start-Process -FilePath ${quote(installer)} -Wait`);
    }
    if (
      !(await ask(
        `Publish Slidr ${version}? The updater and the homepage then offer it to everyone.`,
      ))
    ) {
      note('Left as a draft. To publish it later: pnpm ship');
      return false;
    }
  }
  step(`Publish ${tag}`);
  gh('release', 'edit', tag, '--repo', REPO, '--draft=false', '--latest');
  note('Published');
  return true;
}

// --- Site and updater -------------------------------------------------------------------------

async function followSite(version, release) {
  step('Homepage and updater');
  const url = installerUrl(version);
  if (dryRun) {
    note(
      `${HOMEPAGE} ${(await homepageOffers(url)) ? 'downloads' : 'does not download'} ${installerName(version)}`,
    );
    note(`The updater's latest.json offers ${(await feedVersion()) ?? 'nothing'}`);
    return;
  }

  // The Site workflow, which publishing the release runs; by hand when it did not run.
  const since = Date.parse(release.publishedAt) - 60_000;
  let site = await waitFor(() => siteRunSince(since), 90_000);
  if (site === null && !(await homepageOffers(url))) {
    note('The Site workflow did not run: running it now');
    const now = Date.now() - 5_000;
    gh('workflow', 'run', 'site.yml', '--repo', REPO);
    site =
      (await waitFor(() => siteRunSince(now), 90_000)) ?? fail('The Site workflow did not start');
  }
  if (site !== null) {
    note(`Site workflow: ${site.url}`);
    site = watch(site, REPO);
    if (site.conclusion !== 'success') fail(`The Site workflow ${site.conclusion}: ${site.url}`);
  }

  // The site's deploy of what the workflow pushed.
  const head = gh('api', `repos/${SITE_REPO}/commits/main`, '--jq', '.sha');
  let deploy = await waitFor(
    () =>
      ghJsonOrNull(
        'run',
        'list',
        '--repo',
        SITE_REPO,
        '--workflow',
        'deploy.yml',
        '--commit',
        head,
        '--limit',
        '1',
        '--json',
        RUN_FIELDS,
      )?.[0] ?? null,
    120_000,
  );
  if (deploy !== null) {
    note(`Deploy of the site: ${deploy.url}`);
    deploy = watch(deploy, SITE_REPO);
    if (deploy.conclusion !== 'success')
      fail(`The deploy of the site ${deploy.conclusion}: ${deploy.url}`);
  }

  // What people get.
  if (!(await waitFor(() => homepageOffers(url), 180_000)))
    fail(`${HOMEPAGE} does not link ${url}`);
  note(`${HOMEPAGE} downloads ${installerName(version)}`);
  if (!(await waitFor(async () => (await feedVersion()) === version, 180_000))) {
    fail(`${UPDATER_FEED} offers ${await feedVersion()}, not ${version}`);
  }
  note(`The updater's latest.json offers ${version}`);
  const head200 = await fetch(url, { method: 'HEAD', redirect: 'follow' }).catch(() => null);
  if (!head200?.ok)
    fail(`The installer does not download: ${url} (${head200?.status ?? 'no answer'})`);
  note('The installer downloads');
  note(
    `slidrhq/site has the bot's commit now: pull it in your checkout of the site before you push.`,
  );
}

function siteRunSince(since) {
  const runs = ghJsonOrNull(
    'run',
    'list',
    '--repo',
    REPO,
    '--workflow',
    'site.yml',
    '--limit',
    '5',
    '--json',
    `${RUN_FIELDS},createdAt`,
  );
  return runs?.find((run) => Date.parse(run.createdAt) >= since) ?? null;
}

async function homepageOffers(url) {
  const page = await fetch(`${HOMEPAGE}?ship=${Date.now()}`, { cache: 'no-store' }).catch(
    () => null,
  );
  return page?.ok === true && (await page.text()).includes(url);
}

async function feedVersion() {
  const feed = await fetch(UPDATER_FEED, { redirect: 'follow', cache: 'no-store' }).catch(
    () => null,
  );
  return feed?.ok ? ((await feed.json().catch(() => null))?.version ?? null) : null;
}

// --- This machine -----------------------------------------------------------------------------

function checkRunnerRegistration() {
  const file = join(RUNNER_DIR, '.runner');
  if (!existsSync(file)) fail(`No runner in ${RUNNER_DIR}; set SLIDR_RUNNER_DIR to its folder`);
  const runner = JSON.parse(readFileSync(file, 'utf8').replace(/^\uFEFF/, ''));
  if (runner.gitHubUrl !== `https://github.com/${REPO}`) {
    fail(
      `The runner in ${RUNNER_DIR} is registered to ${runner.gitHubUrl}, not ${REPO}. Register it again:\n` +
        `  ${RUNNER_DIR}\\config.cmd remove --token <gh api -X POST repos/<old repo>/actions/runners/remove-token --jq .token>\n` +
        `  ${RUNNER_DIR}\\config.cmd --url https://github.com/${REPO} --labels ${RUNNER_LABEL} ` +
        `--token <gh api -X POST repos/${REPO}/actions/runners/registration-token --jq .token>`,
    );
  }
  note(`The runner ${runner.agentName} is registered to ${REPO}`);
}

/** Signs a scratch file as the build will, so an expired SimplySign session fails now, not in 12 minutes. */
async function checkSigning() {
  const dir = mkdtempSync(join(tmpdir(), 'slidr-sign-'));
  const probe = join(dir, 'probe.exe');
  copyFileSync(join(process.env.SystemRoot ?? 'C:\\Windows', 'System32', 'whoami.exe'), probe);
  const child = spawn(process.execPath, ['desktop/scripts/sign-windows.mjs', probe], {
    env: { ...process.env, SLIDR_SIGN_CERT: CERT },
    stdio: ['ignore', 'pipe', 'pipe'],
  });
  let output = '';
  child.stdout.on('data', (data) => (output += data));
  child.stderr.on('data', (data) => (output += data));
  let timedOut = false;
  const timer = setTimeout(() => {
    timedOut = true;
    spawnSync('taskkill', ['/F', '/T', '/PID', String(child.pid)]);
  }, 180_000);
  const code = await new Promise((resolve) => child.on('close', resolve));
  clearTimeout(timer);
  rmSync(dir, { recursive: true, force: true, maxRetries: 3 });
  if (timedOut) {
    fail(
      'Signing a scratch file did not end in three minutes: the SimplySign Desktop session has\n' +
        'probably expired. Log in to it again (a code from the phone), then run again.',
    );
  }
  if (code !== 0)
    fail(`Signing a scratch file failed. Is SimplySign Desktop logged in?\n${output.trim()}`);
  note("SimplySign signs (a scratch file, signed with the project's certificate and verified)");
}

function runnerPids() {
  const out = exec('tasklist', ['/FI', 'IMAGENAME eq Runner.Listener.exe', '/FO', 'CSV', '/NH']);
  return [...out.matchAll(/^"Runner\.Listener\.exe","(\d+)"/gim)].map((match) => Number(match[1]));
}

/** Whether GitHub sees the runner online, or null when it cannot be asked. */
function runnerOnline() {
  try {
    const statuses = gh(
      'api',
      `repos/${REPO}/actions/runners`,
      '--jq',
      `.runners[] | select(any(.labels[]; .name == "${RUNNER_LABEL}")) | .status`,
    );
    return statuses.split(/\s+/).includes('online');
  } catch {
    return null;
  }
}

async function startRunner() {
  if (runnerPids().length > 0) {
    note('The runner is running');
  } else {
    // In a window of its own, as you, with the machine's PSModulePath (see the top).
    powershell(
      `Start-Process -FilePath ${quote(join(RUNNER_DIR, 'run.cmd'))} -WorkingDirectory ${quote(RUNNER_DIR)}`,
    );
    startedRunner = true;
    note(`The runner started in a window of its own (${RUNNER_DIR})`);
  }
  const online = await waitFor(() => runnerOnline() !== false, 120_000);
  if (!online) fail('The runner did not come online in two minutes: look at its window');
  note('The runner is online');
}

function stopRunner() {
  if (runnerPids().length === 0) return;
  spawnSync('taskkill', ['/F', '/T', '/IM', 'Runner.Listener.exe'], { stdio: 'ignore' });
  startedRunner = false;
  note('The runner is stopped');
}

function setPnpmWorkspaceAside() {
  if (!existsSync(PNPM_WORKSPACE)) return;
  if (existsSync(PNPM_ASIDE))
    fail(`Both ${PNPM_WORKSPACE} and ${PNPM_ASIDE} exist: keep one, then run again`);
  renameSync(PNPM_WORKSPACE, PNPM_ASIDE);
  setAside = true;
  note(`${PNPM_WORKSPACE} is set aside while the build runs`);
}

function putPnpmWorkspaceBack() {
  if (!existsSync(PNPM_ASIDE) || existsSync(PNPM_WORKSPACE)) return;
  renameSync(PNPM_ASIDE, PNPM_WORKSPACE);
  note(`${PNPM_WORKSPACE} is back`);
}

// --- Helpers ----------------------------------------------------------------------------------

const RUN_FIELDS = 'databaseId,status,conclusion,url';

function findRelease(tag) {
  return ghJsonOrNull(
    'release',
    'view',
    tag,
    '--repo',
    REPO,
    '--json',
    'isDraft,assets,url,publishedAt',
  );
}

function remoteTagExists(tag) {
  return exec('git', ['ls-remote', '--tags', 'origin', `refs/tags/${tag}`]) !== '';
}

function viewRun(id, repo) {
  return ghJson('run', 'view', String(id), '--repo', repo, '--json', RUN_FIELDS);
}

/** Follows a run of a workflow until it ends, and returns it as it ended. */
function watch(run, repo) {
  for (;;) {
    runVisible('gh', ['run', 'watch', String(run.databaseId), '--repo', repo, '--interval', '15']);
    run = viewRun(run.databaseId, repo);
    if (run.status === 'completed') return run;
  }
}

/** Windows PowerShell with the machine's module path: one inherited from pwsh 7 hides Cert: from it. */
function powershell(script) {
  const modules =
    "$env:PSModulePath = [Environment]::GetEnvironmentVariable('PSModulePath', 'Machine'); ";
  return exec('powershell.exe', ['-NoProfile', '-NonInteractive', '-Command', modules + script]);
}

const quote = (text) => `'${text.replace(/'/g, "''")}'`;

function exec(command, rest) {
  return execFileSync(command, rest, {
    encoding: 'utf8',
    stdio: ['ignore', 'pipe', 'pipe'],
  }).trim();
}

function gh(...rest) {
  return exec('gh', rest);
}

const ghJson = (...rest) => JSON.parse(gh(...rest));

function ghJsonOrNull(...rest) {
  try {
    return ghJson(...rest);
  } catch {
    return null;
  }
}

function runVisible(command, rest) {
  return spawnSync(command, rest, { stdio: 'inherit' }).status ?? 1;
}

/** Calls `probe` until it gives something other than null or false, or the time is up (then null). */
async function waitFor(probe, timeout, interval = 5_000) {
  for (const end = Date.now() + timeout; ; await sleep(interval)) {
    const value = await probe();
    if (value !== null && value !== false && value !== undefined) return value;
    if (Date.now() >= end) return null;
  }
}

const sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function ask(question) {
  if (!process.stdin.isTTY) return false;
  const prompt = createInterface({ input: process.stdin, output: process.stdout });
  prompt.on('SIGINT', () => process.exit(130));
  try {
    return /^y(es)?$/i.test((await prompt.question(`${question} [y/N] `)).trim());
  } finally {
    prompt.close();
  }
}

function step(title) {
  console.log(`\n== ${title}`);
}

function note(text) {
  console.log(`   ${text}`);
}

function fail(message) {
  console.error(`\nship: ${message}`);
  process.exit(1);
}

await main();
