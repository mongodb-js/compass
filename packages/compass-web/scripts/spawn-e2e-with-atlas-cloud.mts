import fs from 'fs';
import { spawnSync } from 'child_process';
import type { SpawnSyncOptions } from 'child_process';
import path from 'path';
import os from 'os';
import { Readable, promises } from 'stream';
import type { ReadableStream as ReadableStreamWeb } from 'stream/web';

const {
  EVG_USER,
  EVG_API_KEY,
  EVG_API_SERVER = 'https://evergreen.mongodb.com/api',
  EVG_UI_SERVER = 'https://evergreen.mongodb.com',
} = process.env;

if (!EVG_USER || !EVG_API_KEY) {
  throw new Error('Evergreen credentials missing');
}

const OS = os.type().toLowerCase();
const ARCH = os.arch();
const CLI_DIR = path.join(os.tmpdir(), crypto.randomUUID());
const EVERGREEN_CONFIG = path.join(CLI_DIR, '.evergreen.yml');

await fs.promises.mkdir(CLI_DIR, { recursive: true, mode: 0o700 });

function cleanup() {
  console.debug('cleaning up...');
  fs.rmSync(CLI_DIR, { recursive: true, force: true });
}

process.on('beforeExit', cleanup);
process.on('uncaughtExceptionMonitor', cleanup);

await fs.promises.writeFile(
  EVERGREEN_CONFIG,
  `
user: ${EVG_USER}
api_key: ${EVG_API_KEY}
api_server_host: ${EVG_API_SERVER}
ui_server_host: ${EVG_UI_SERVER}
do_not_run_kanopy_oidc: true
`.trimStart()
);

const EVERGREEN_CLI_BIN = path.join(CLI_DIR, 'evergreen');

function spawnEvergreenSync(
  args: string[],
  extraOptions?: Omit<SpawnSyncOptions, 'encoding'>
) {
  const res = spawnSync(EVERGREEN_CLI_BIN, args, {
    encoding: 'utf-8',
    env: {
      ...process.env,
      ...extraOptions?.env,
    },
    ...extraOptions,
  });
  if (res.error) {
    throw res.error;
  }
  if (res.status !== 0) {
    throw Object.assign(
      new Error('Evergreen CLI exited with a non-zero status code'),
      {
        args,
        code: res.status,
        signal: res.signal,
        stdout: res.stdout,
        stderr: res.stderr,
      }
    );
  }
  return res;
}

console.debug(
  'downloading evergreen cli for %s %s to %s...',
  OS,
  ARCH,
  CLI_DIR
);

await fetch(`https://evergreen.mongodb.com/clients/${OS}_${ARCH}/evergreen`, {
  headers: {
    'Api-User': EVG_USER,
    'Api-Key': EVG_API_KEY,
  },
}).then((res) => {
  if (!res.ok || !res.body) {
    throw new Error(
      `Failed to download evergreen cli: ${res.status} (${res.statusText})`
    );
  }
  return promises.pipeline(
    Readable.fromWeb(
      // node `streamWeb.ReadableStream` and dom `ReadableStream` are currently
      // not fully compatible, but actually work together okay for our case.
      // When this issue goes away, typescript will highlight this as a
      // unnecessary assertion
      res.body as ReadableStreamWeb<Uint8Array<ArrayBuffer>>
    ),
    fs.createWriteStream(EVERGREEN_CLI_BIN)
  );
});

await fs.promises.chmod(EVERGREEN_CLI_BIN, 0o700);

console.debug(spawnEvergreenSync(['--version']).stdout.trimEnd());

console.debug(
  'current user: %s',
  spawnEvergreenSync(['client', 'user'], {
    env: {
      // in theory there is a `--config` flag, but it doesn't seem to work
      // specifically with the `user` commands, so we override the HOME to make
      // sure that our config is picked up from the "default" dir correctly
      HOME: CLI_DIR,
    },
  }).stdout.trimEnd()
);

const ATLAS_CLOUD_ENV =
  process.env.COMPASS_E2E_ATLAS_CLOUD_ENVIRONMENT ?? 'dev';

const patchInfoStr = spawnEvergreenSync([
  '--config',
  EVERGREEN_CONFIG,
  'patch',
  '--project',
  '10gen-compass-main',
  '--variants',
  'test-web-sandbox-atlas-cloud',
  '--tasks',
  'test-web-sandbox-atlas-cloud',
  '--description',
  process.env.COMPASS_WEB_E2E_TEST_EVERGREEN_PATCH_DESCRIPTION ??
    `Test compass-web with Atlas Cloud against ${ATLAS_CLOUD_ENV} environment`,
  '--param',
  `compass_web_publish_environment=${ATLAS_CLOUD_ENV}`,
  '--uncommitted',
  '--json',
  '--finalize',
]).stdout;

const patchInfo = JSON.parse(patchInfoStr);

console.debug(
  'created evergreen patch (url: https://evergreen.mongodb.com/version/%s)',
  patchInfo.patch_id
);

const startTime = Date.now();
// 2 hours: this is more than our global evergreen config timeout, evergreen
// will fail first and this will abort the loop, but just in case something goes
// really wrong we will also have the timeout here making sure this is not
// running forever
const timeoutMs = 1000 * 60 * 60 * 60 * 2;

const intervalId = setInterval(() => {
  const currentPatchInfoStr = spawnEvergreenSync([
    'list-patches',
    '--id',
    patchInfo.patch_id,
    '--json',
  ]).stdout;
  const currentPatchInfo = JSON.parse(currentPatchInfoStr);

  if (currentPatchInfo.status === 'success') {
    console.debug('finished running the patch successfully');
    clearInterval(intervalId);
    return;
  }

  if (currentPatchInfo.status === 'failed') {
    throw Object.assign(
      new Error(
        `Patch https://evergreen.mongodb.com/version/${currentPatchInfo.patch_id} failed`
      ),
      { patch: currentPatchInfo }
    );
  }

  if (Date.now() - startTime >= timeoutMs) {
    throw Object.assign(
      new Error(
        `Patch https://evergreen.mongodb.com/version/${currentPatchInfo.patch_id} failed due to the timeout`
      ),
      { patch: currentPatchInfo }
    );
  }

  console.debug('current patch status: %s', currentPatchInfo.status);
}, 60_000); // no need to check too often
