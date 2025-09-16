import path from 'path';
import fs from 'fs';
import util from 'util';
import child_process from 'child_process';
import stream from 'stream';
import * as wdio from 'webdriverio';
import JSZip from 'jszip';
import os from 'os';

const redirectExtensionPath = path.join(
  import.meta.dirname,
  'redirect-extension'
);

function getZippedExtension() {
  const zip = new JSZip();
  for (const file of ['manifest.json', 'redirect-rules.json']) {
    zip.file(file, fs.createReadStream(path.join(redirectExtensionPath, file)));
  }
  return zip.generateAsync({ type: 'base64' });
}

async function startBrowserWithPreloadedRedirectExtension() {
  const browser = await wdio.remote({
    capabilities: {
      // TODO: arugments for browser, infer default one (if firefox installed ? firefox : chrome)
      browserName: 'firefox',
      'goog:chromeOptions': {
        args: [
          `--load-extension=${redirectExtensionPath}`,
          // load-extension is deprecated in chrome, but available in chromium /
          // chrome-for-testing, for now in chrome you can enable the flag by
          // disabling the "disable" feature flag
          '--disable-features=DisableLoadExtensionCommandLineSwitch',
        ],
      },
    },
  });
  // In firefox you have to load a zip archive
  if (browser.capabilities.browserName === 'firefox') {
    await browser.installAddOn(await getZippedExtension(), true);
  }
  // TODO: arguments for default env to open
  await browser.url('https://cloud-dev.mongodb.com');
}

const defualtMmsDir = path.join(os.tmpdir(), '.mms');
const mmsDir = process.env.MMS_HOME || defualtMmsDir;

const execFileAsync = util.promisify(child_process.execFile);

async function pathExists(path: string) {
  try {
    await fs.promises.stat(path);
    return true;
  } catch {
    return false;
  }
}

async function runMmsDevServer() {
  // TODO: if something running on 8081, assume it's devserver and skip
  if (!process.env.MMS_HOME && !(await pathExists(defualtMmsDir))) {
    console.warn();
    console.warn(
      'WARN: Environmental variable MMS_HOME is not set. Assuming mms repo is not cloned, cloning from remote to %s. This is slow, to speed up dev build, clone mms repo locally and set MMS_HOME env variable to the mms root directory.',
      defualtMmsDir
    );
    console.warn();
    await execFileAsync('git', [
      'clone',
      '--depth=1',
      'git@github.com:10gen/mms.git',
      defualtMmsDir,
    ]);
  }
  const {
    default: { engines },
  } = await import(path.join(mmsDir, 'package.json'), {
    with: { type: 'json' },
  });
  const pnpmVersion = engines.pnpm ?? 'latest';
  console.log('Installing mms dependencies via pnpm...');
  await execFileAsync(
    'npx',
    [
      `pnpm@${pnpmVersion}`,
      // mms requires exact Node.js version, Compass might be slightly off, this
      // doesn't matter that much if we're in the same range
      '--engine-strict=false',
      'install',
    ],
    { cwd: mmsDir }
  );
  console.log('Starting mms dev server...');
  return new Promise((resolve) => {
    const mmsDevServerProcess = child_process.execFile(
      'npx',
      [
        `pnpm@${pnpmVersion}`,
        '--engine-strict=false',
        'compile:js:apps',
        // TODO: production mode
        '--serve',
      ],
      { cwd: mmsDir, maxBuffer: Infinity }
    );
    function resolveOnReady(chunk: any) {
      if (/webpack .+? compiled (successfully|with \d warnings?)/.test(chunk)) {
        mmsDevServerProcess.stdout?.off('data', resolveOnReady);
        resolve(mmsDevServerProcess);
      }
    }
    // TODO: super noisy, better logging
    mmsDevServerProcess.stdout?.pipe(process.stdout);
    mmsDevServerProcess.stderr?.pipe(process.stderr);
    mmsDevServerProcess.stdout?.on('data', resolveOnReady);
  });
}

async function runCompassWebSync() {
  // TODO: check if this is already running, skip if it is
  return new Promise((resolve) => {
    const compassWebSyncBuild = child_process.execFile(
      'npm',
      ['run', 'sync', '--workspace', '@mongodb-js/compass-web'],
      { maxBuffer: Infinity, env: { ...process.env, MMS_HOME: mmsDir } }
    );

    function resolveOnReady(chunk: any) {
      if (/webpack .+? compiled (successfully|with \d warnings?)/.test(chunk)) {
        compassWebSyncBuild.stdout?.off('data', resolveOnReady);
        resolve(compassWebSyncBuild);
      }
    }
    // TODO: super noisy, better logging
    compassWebSyncBuild.stdout?.pipe(process.stdout);
    compassWebSyncBuild.stderr?.pipe(process.stderr);
    compassWebSyncBuild.stdout?.on('data', resolveOnReady);
  });
}

async function main() {
  await runCompassWebSync();
  console.log('>>> compass-web ready');
  await runMmsDevServer();
  console.log('>>> mms ready');
  startBrowserWithPreloadedRedirectExtension();
}

main();
