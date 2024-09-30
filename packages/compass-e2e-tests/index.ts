#!/usr/bin/env ts-node
import path from 'path';
import fs from 'fs';
import { glob } from 'glob';
import crossSpawn from 'cross-spawn';
import type { ChildProcessWithoutNullStreams } from 'child_process';
// @ts-expect-error it thinks process does not have getActiveResourcesInfo
import { getActiveResourcesInfo } from 'process';
import Mocha from 'mocha';
import Debug from 'debug';
import type { MongoClient } from 'mongodb';
import kill from 'tree-kill';
import {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
  COMPASS_PATH,
  LOG_PATH,
  removeUserDataDir,
  updateMongoDBServerInfo,
} from './helpers/compass';
import ResultLogger from './helpers/result-logger';

const debug = Debug('compass-e2e-tests');

const wait = (ms: number) =>
  new Promise((resolve) => {
    setTimeout(resolve, ms);
  });

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
  debug('X DISPLAY', process.env.DISPLAY);

  const disableStartStop = process.argv.includes('--disable-start-stop');
  const shouldTestCompassWeb = process.argv.includes('--test-compass-web');

  // When working on the tests it is faster to just keep the server running.
  if (!disableStartStop) {
    debug('Starting MongoDB server');
    crossSpawn.sync('npm', ['run', 'start-servers'], { stdio: 'inherit' });

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
            DISABLE_DEVSERVER_OVERLAY: 'true',
            APP_ENV: 'webdriverio',
          },
        }
      );

      let serverReady = false;
      const start = Date.now();
      while (!serverReady) {
        if (Date.now() - start >= 120_000) {
          throw new Error(
            'The compass-web sandbox is still not running after 120000ms'
          );
        }
        try {
          const res = await fetch('http://localhost:7777');
          serverReady = res.ok;
          debug('Web server ready: %s', serverReady);
        } catch (err) {
          debug('Failed to connect to dev server: %s', (err as any).message);
        }
        await wait(1000);
      }
    } else {
      debug('Writing electron-versions.json');
      crossSpawn.sync('scripts/write-electron-versions.sh', [], {
        stdio: 'inherit',
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

function getResources() {
  const resources: Record<string, number> = {};
  for (const resource of getActiveResourcesInfo()) {
    if (resources[resource] === undefined) {
      resources[resource] = 0;
    }
    ++resources[resource];
  }
  return resources;
}

function cleanup() {
  removeUserDataDir();

  const disableStartStop = process.argv.includes('--disable-start-stop');
  const shouldTestCompassWeb = process.argv.includes('--test-compass-web');

  if (!disableStartStop) {
    if (shouldTestCompassWeb) {
      debug('Stopping compass-web');
      try {
        if (compassWeb.pid) {
          debug(`killing compass-web [${compassWeb.pid}]`);
          kill(compassWeb.pid, 'SIGINT');
          debug('no pid for compass-web');
        }
      } catch (e) {
        debug('Failed to stop compass-web', e);
      }
    }

    debug('Stopping MongoDB server');
    try {
      crossSpawn.sync('npm', ['run', 'stop-servers'], {
        // If it's taking too long we might as well kill the process and move on,
        // mongodb-runner is flaky sometimes and in ci `posttest-ci` script will
        // take care of additional clean up anyway
        timeout: 120_000,
        stdio: 'inherit',
      });
    } catch (e) {
      debug('Failed to stop MongoDB Server', e);
    }
    debug('Done stopping');
  }

  // Since the webdriverio update something is messing with the terminal's
  // cursor. This brings it back.
  crossSpawn.sync('tput', ['cnorm'], { stdio: 'inherit' });

  // Log what's preventing the process from exiting normally to help debug the
  // cases where the process hangs and gets killed 10 minutes later by evergreen
  // because there's no output.
  const intervalId = setInterval(() => {
    console.log(getResources());
  }, 1_000);

  // Don't keep logging forever because then evergreen can't kill the job after
  // 10 minutes of inactivity if we get into a broken state
  const timeoutId = setTimeout(() => {
    clearInterval(intervalId);

    // Just exit now rather than waiting for 10 minutes just so evergreen can
    // kill the task and fail anyway.
    process.exit(process.exitCode ?? 1);
  }, 60_000);

  // No need to hold things up for a minute if there's nothing else preventing
  // the process from exiting.
  intervalId.unref();
  timeoutId.unref();
}

async function main() {
  await setup();

  const shouldTestCompassWeb = process.argv.includes('--test-compass-web');

  if (!shouldTestCompassWeb) {
    if (!process.env.CHROME_VERSION) {
      // written during setup() if disableStartStop is false
      const versionsJSON = await fs.promises.readFile(
        'electron-versions.json',
        'utf8'
      );
      const versions = JSON.parse(versionsJSON);
      process.env.CHROME_VERSION = versions.chrome;
    }
    debug(
      'Chrome version corresponding to Electron:',
      process.env.CHROME_VERSION
    );
  }

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

  const e2eTestGroupsAmount = parseInt(process.env.E2E_TEST_GROUPS || '1');
  const e2eTestGroup = parseInt(process.env.E2E_TEST_GROUP || '1');

  const rawTests = (
    await glob('tests/**/*.{test,spec}.ts', {
      cwd: __dirname,
    })
  ).filter((value, index, array) => {
    const testsPerGroup = Math.ceil(array.length / e2eTestGroupsAmount);
    const minGroupIndex = (e2eTestGroup - 1) * testsPerGroup;
    const maxGroupIndex = minGroupIndex + testsPerGroup - 1;

    return index >= minGroupIndex && index <= maxGroupIndex;
  });

  console.info('Test files:', rawTests);

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

  // print the test order for debugging purposes and so we can tweak the groups later
  console.log('test order', tests);

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
