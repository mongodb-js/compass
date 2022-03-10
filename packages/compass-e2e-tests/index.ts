#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import { promisify } from 'util';
import glob from 'glob';
import crossSpawn from 'cross-spawn';
import Mocha from 'mocha';
import Debug from 'debug';
import type { MongoClient } from 'mongodb';
import {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
  LOG_PATH,
} from './helpers/compass';
import { createUnlockedKeychain } from './helpers/keychain';
import ResultLogger from './helpers/result-logger';

const debug = Debug('compass-e2e-tests');
const keychain = createUnlockedKeychain();

// We can't import mongodb here yet because native modules will be recompiled
let metricsClient: MongoClient;

async function setup() {
  if (process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE !== 'true') {
    await keychain.activate();
  }

  const disableStartStop = process.argv.includes('--disable-start-stop');

  // When working on the tests it is faster to just keep the server running.
  // insert-data is idempotent anyway.
  if (!disableStartStop) {
    debug('Starting MongoDB server');
    crossSpawn.sync('npm', ['run', 'start-server'], { stdio: 'inherit' });
  }

  debug('Importing test fixtures');
  crossSpawn.sync('npm', ['run', 'insert-data'], { stdio: 'inherit' });

  try {
    debug('Clearing out past logs');
    fs.rmdirSync(LOG_PATH, { recursive: true });
  } catch (e) {
    debug('.log dir already removed');
  }

  fs.mkdirSync(LOG_PATH, { recursive: true });
}

function cleanup() {
  keychain.reset();

  const disableStartStop = process.argv.includes('--disable-start-stop');

  if (!disableStartStop) {
    debug('Stopping MongoDB server and cleaning up server data');
    try {
      crossSpawn.sync('npm', ['run', 'stop-server'], {
        // If it's taking too long we might as well kill the process and move on,
        // mongodb-runer is flaky sometimes and in ci `posttest-ci` script will
        // take care of additional clean up anyway
        timeout: 30_000,
        stdio: 'inherit',
      });
    } catch (e) {
      debug('Failed to stop MongoDB Server', e);
    }
    try {
      fs.rmdirSync('.mongodb', { recursive: true });
    } catch (e) {
      debug('Failed to clean up server data', e);
    }
  }
}

async function main() {
  if (
    process.env.COMPASS_E2E_DISABLE_KEYCHAIN_USAGE !== 'true' &&
    process.env.EVERGREEN &&
    process.platform === 'darwin'
  ) {
    // TODO: https://jira.mongodb.org/browse/COMPASS-5214
    console.warn(
      '⚠️ Compass e2e tests are skipped in Evergreen environment on macOS ' +
        'machines as running tests requires temporary changes to the default ' +
        'machine keychain and the machines are statefull which might cause issues ' +
        'for some processes.'
    );
    return;
  }

  await setup();

  const shouldTestPackagedApp = process.argv.includes('--test-packaged-app');
  // Skip this step if you are running tests consecutively and don't need to
  // rebuild modules all the time
  const noNativeModules = process.argv.includes('--no-native-modules');
  // Skip this step if you want to run tests against your own compilation (e.g,
  // a dev build or a build running in watch mode that autorecompiles)
  const noCompile = process.argv.includes('--no-compile');

  if (shouldTestPackagedApp) {
    process.env.TEST_PACKAGED_APP = '1';
    debug('Building Compass before running the tests ...');
    await buildCompass();
  } else {
    delete process.env.TEST_PACKAGED_APP;
    debug('Preparing Compass before running the tests');
    if (!noNativeModules) {
      debug('Rebuilding native modules ...');
      await rebuildNativeModules();
    }
    if (!noCompile) {
      debug('Compiling Compass assets ...');
      await compileCompassAssets();
    }
  }

  const tests = await promisify(glob)('tests/**/*.{test,spec}.ts', {
    cwd: __dirname,
  });

  const bail = process.argv.includes('--bail');

  const mocha = new Mocha({
    timeout: 120_000,
    bail,
  });

  tests.forEach((testPath: string) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  const metricsConnection = process.env.E2E_TESTS_METRICS_URI;
  if (metricsConnection) {
    debug('Connecting to E2E_TESTS_METRICS_URI');
    // only require it down here because it gets rebuilt up top
    const mongodb = await import('mongodb');
    metricsClient = new mongodb.MongoClient(metricsConnection);
    await metricsClient.connect();
  } else {
    debug('Not logging metrics to a database.');
  }

  debug('Running E2E tests');
  // mocha.run has a callback and returns a result, so just promisify it manually
  const { resultLogger, failures } = await new Promise((resolve, reject) => {
    // eslint-disable-next-line prefer-const
    let resultLogger: ResultLogger;

    const runner = mocha.run((failures: number) => {
      process.exitCode = failures ? 1 : 0;
      resolve({ resultLogger, failures });
    });

    debug('Initialising ResultLogger');
    resultLogger = new ResultLogger(metricsClient, runner);

    // Synchronously create the ResultLogger so it can start listening to events
    // on runner immediately after calling mocha.run() before any of the events
    // fire.
    resultLogger.init().catch((err: Error) => {
      // reject() doesn't stop mocha.run()...
      reject(err);
    });
  });

  // write a report.json to be uploaded to evergreen
  debug('Writing report.json');
  const result = await resultLogger.done(failures);
  const reportPath = path.join(LOG_PATH, 'report.json');
  const jsonReport = JSON.stringify(result, null, 2);
  await fs.promises.writeFile(reportPath, jsonReport);

  debug('done');
}

process.once('SIGINT', () => {
  debug(`Process was interrupted. Cleaning-up and exiting.`);
  cleanup();
  process.kill(process.pid, 'SIGINT');
});

process.once('SIGTERM', () => {
  debug(`Process was terminated. Cleaning-up and exiting.`);
  cleanup();
  process.kill(process.pid, 'SIGTERM');
});

process.once('uncaughtException', (err: Error) => {
  debug('Uncaught exception. Cleaning-up and exiting.');
  cleanup();
  throw err;
});

process.on('unhandledRejection', (err: Error) => {
  debug('Unhandled exception. Cleaning-up and exiting.');
  cleanup();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

async function run() {
  try {
    await main();
  } finally {
    if (metricsClient) {
      await metricsClient.close();
    }
    cleanup();
  }
}

void run();
