const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const glob = require('glob');
const { sync: spawnSync } = require('cross-spawn');
const Mocha = require('mocha');
const { MongoClient } = require('mongodb');
const debug = require('debug')('compass-e2e-tests');
const {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
} = require('./helpers/compass');
const { createUnlockedKeychain } = require('./helpers/keychain');
const ResultLogger = require('./helpers/result-logger');

const keychain = createUnlockedKeychain();

const LOG_PATH = path.resolve(__dirname, '.log');

let metricsClient;

async function setup() {
  await keychain.activate();
  debug('Starting MongoDB server and importing fixtures');
  spawnSync('npm', ['run', 'start-server'], { stdio: 'inherit' });
  spawnSync('npm', ['run', 'insert-data'], { stdio: 'inherit' });

  try {
    debug('Clearing out past logs');
    fs.rmdirSync(LOG_PATH, { recursive: true });
  } catch (e) {
    debug('.log dir already removed');
  }
}

function cleanup() {
  keychain.reset();
  debug('Stopping MongoDB server and cleaning up server data');
  try {
    spawnSync('npm', ['run', 'stop-server'], {
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

async function main() {
  if (process.platform === 'win32') {
    // These tests are not working well on windows machines and we will
    // skip them for now.
    // https://jira.mongodb.org/browse/COMPASS-5159
    console.warn('⚠️ Skipping e2e tests on windows machine');
    return;
  }

  if (process.env.EVERGREEN && process.platform === 'darwin') {
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

  const tests = await promisify(glob)('tests/**/*.{test,spec}.js', {
    cwd: __dirname,
  });

  const mocha = new Mocha({
    timeout: 120_000,
  });

  tests.forEach((testPath) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  const metricsConnection = process.env.E2E_TESTS_METRICS_STRING;
  if (metricsConnection) {
    debug('Connecting to E2E_TESTS_METRICS_STRING');
    metricsClient = new MongoClient(metricsConnection);
    await metricsClient.connect();
  } else {
    debug('Not logging metrics to a database.');
  }

  debug('Running E2E tests');
  // mocha.run has a callback and returns a result, so just promisify it manually
  const { resultLogger, failures } = await new Promise((resolve, reject) => {
    let resultLogger;

    const runner = mocha.run((failures) => {
      process.exitCode = failures ? 1 : 0;
      resolve({ resultLogger, failures });
    });

    resultLogger = new ResultLogger(metricsClient, runner);

    // Synchronously create the ResultLogger so it can start listening to events
    // on runner immediately after calling mocha.run() before any of the events
    // fire.
    resultLogger.init().catch((err) => {
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

process.once('uncaughtException', (err) => {
  debug('Uncaught exception. Cleaning-up and exiting.');
  cleanup();
  throw err;
});

process.on('unhandledRejection', (err) => {
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

run();
