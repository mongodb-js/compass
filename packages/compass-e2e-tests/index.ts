#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import crossSpawn from 'cross-spawn';
import type { ChildProcessWithoutNullStreams } from 'child_process';
import Mocha from 'mocha';
import Debug from 'debug';
import type { MongoClient } from 'mongodb';
import {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
  COMPASS_PATH,
  LOG_PATH,
  removeUserDataDir,
  MONGODB_TEST_SERVER_PORT,
  updateMongoDBServerInfo,
} from './helpers/compass';
import ResultLogger from './helpers/result-logger';

const debug = Debug('compass-e2e-tests');

const allowedArgs = [
  '--test-compass-web',
  '--no-compile',
  '--no-native-modules',
  '--test-packaged-app',
  '--disable-start-stop',
  '--bail',
];

for (const arg of process.argv) {
  if (arg.startsWith('--') && !allowedArgs.includes(arg)) {
    throw Error(
      `Unknown command argument "${arg}". Usage:\n\n  npm run test ${allowedArgs
        .map((arg) => `[${arg}]`)
        .join(' ')}\n`
    );
  }
}

// We can't import mongodb here yet because native modules will be recompiled
let metricsClient: MongoClient;

const FIRST_TEST = 'tests/time-to-first-query.test.ts';

let compassWeb: ChildProcessWithoutNullStreams;

async function setup() {
  const disableStartStop = process.argv.includes('--disable-start-stop');
  const shouldTestCompassWeb = process.argv.includes('--test-compass-web');

  // When working on the tests it is faster to just keep the server running.
  if (!disableStartStop) {
    debug('Starting MongoDB server');
    crossSpawn.sync('npm', ['run', 'start-server'], { stdio: 'inherit' });

    if (shouldTestCompassWeb) {
      debug('Starting Compass Web');
      compassWeb = crossSpawn.spawn(
        'npm',
        ['run', '--unsafe-perm', 'start-web'],
        {
          cwd: path.resolve(__dirname, '..', '..'),
          env: {
            ...process.env,
            OPEN_BROWSER: 'false', // tell webpack dev server not to open the default browser
          },
        }
      );
      // wait for webpack to finish compiling
      await new Promise<void>((resolve) => {
        let output = '';
        const listener = function (chunk: string) {
          console.log(chunk);
          output += chunk;
          if (/^webpack \d+\.\d+\.\d+ compiled/m.test(output)) {
            compassWeb.stdout.off('data', listener);
            resolve();
          }
        };
        compassWeb.stdout.setEncoding('utf8').on('data', listener);
      });
    }
  }

  try {
    debug('Clearing out past logs');
    fs.rmdirSync(LOG_PATH, { recursive: true });
  } catch (e) {
    debug('.log dir already removed');
  }

  fs.mkdirSync(LOG_PATH, { recursive: true });

  debug('Getting mongodb server info');
  updateMongoDBServerInfo();
}

function cleanup() {
  removeUserDataDir();

  const disableStartStop = process.argv.includes('--disable-start-stop');

  if (!disableStartStop) {
    debug('Stopping compass-web');
    try {
      compassWeb.kill('SIGTERM');
    } catch (e) {
      debug('Failed to stop compass-web', e);
    }

    debug('Stopping MongoDB server');
    try {
      crossSpawn.sync(
        'npm',
        [
          'run',
          'stop-server',
          '--',
          '--port',
          String(MONGODB_TEST_SERVER_PORT),
        ],
        {
          // If it's taking too long we might as well kill the process and move on,
          // mongodb-runner is flaky sometimes and in ci `posttest-ci` script will
          // take care of additional clean up anyway
          timeout: 120_000,
          stdio: 'inherit',
        }
      );
    } catch (e) {
      debug('Failed to stop MongoDB Server', e);
    }
    debug('Done stopping');
  }
}

async function main() {
  await setup();

  const shouldTestCompassWeb = process.argv.includes('--test-compass-web');

  // These are mutually exclusive since compass-web is always going to browse to
  // the running webserver.
  const shouldTestPackagedApp =
    process.argv.includes('--test-packaged-app') && !shouldTestCompassWeb;

  // Skip this step if you are running tests consecutively and don't need to
  // rebuild modules all the time. Also no need to ever recompile when testing
  // compass-web.
  const noNativeModules =
    process.argv.includes('--no-native-modules') || shouldTestCompassWeb;

  // Skip this step if you want to run tests against your own compilation (e.g,
  // a dev build or a build running in watch mode that autorecompiles). Also no
  // need to recompile when testing compass-web.
  const noCompile =
    process.argv.includes('--no-compile') || shouldTestCompassWeb;

  if (shouldTestPackagedApp) {
    process.env.TEST_PACKAGED_APP = '1';
    debug('Building Compass before running the tests ...');
    await buildCompass();
  } else {
    delete process.env.TEST_PACKAGED_APP;

    // set coverage to the root of the monorepo so it will be generated for
    // everything and not just packages/compass
    process.env.COVERAGE = path.dirname(path.dirname(COMPASS_PATH));

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

  const rawTests = await glob('tests/**/*.{test,spec}.ts', {
    cwd: __dirname,
  });

  // The only test file that's interested in the first-run experience (at the
  // time of writing) is time-to-first-query.ts and that happens to be
  // alphabetically right at the end. Which is fine, but the first test to run
  // will also get the slow first run experience for no good reason unless it is
  // the time-to-first-query.ts test.
  // So yeah.. this is a bit of a micro optimisation.
  const tests = [FIRST_TEST, ...rawTests.filter((t) => t !== FIRST_TEST)];

  // Ensure the insert-data mocha hooks are run.
  tests.unshift(path.join('helpers', 'insert-data.ts'));

  const bail = process.argv.includes('--bail');

  const mocha = new Mocha({
    timeout: 240_000, // kinda arbitrary, but longer than waitforTimeout set in helpers/compass.ts so the test can fail before it times out
    bail,
    reporter: path.resolve(
      __dirname,
      '..',
      '..',
      'configs/mocha-config-compass/reporter.js'
    ),
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
  const { resultLogger, failures } = await new Promise<{
    resultLogger: ResultLogger;
    failures: number;
  }>((resolve, reject) => {
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

  await resultLogger.done(failures);
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
