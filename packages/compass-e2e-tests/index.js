const path = require('path');
const fs = require('fs');
const { promisify } = require('util');
const glob = require('glob');
const { sync: spawnSync } = require('cross-spawn');
const Mocha = require('mocha');
const debug = require('debug')('compass-e2e-tests');
const {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
} = require('./helpers/compass');
const { createUnlockedKeychain } = require('./helpers/keychain');

const keychain = createUnlockedKeychain();

function setup() {
  keychain.activate();
  debug('Starting MongoDB server and importing fixtures');
  spawnSync('npm', ['run', 'start-server'], { stdio: 'inherit' });
  spawnSync('npm', ['run', 'insert-data'], { stdio: 'inherit' });
}

function cleanup() {
  keychain.reset();
  debug('Stopping MongoDB server and cleaning up server data');
  try {
    spawnSync('npm', ['run', 'stop-server'], {
      // If it's taking too long we might as well kill the process and move on,
      // mongodb-runer is flaky sometimes and in ci `posttest-ci` script will
      // take care of additional clean up anyway
      timeout: 30000,
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
  setup();

  const shouldTestPackagedApp = process.argv.includes('--test-packaged-app');

  if (shouldTestPackagedApp) {
    process.env.TEST_PACKAGED_APP = '1';
    debug('Building Compass before running the tests ...');
    await buildCompass();
  } else {
    delete process.env.TEST_PACKAGED_APP;
    debug('Preparing Compass before running the tests');
    debug('Rebuilding native modules ...');
    await rebuildNativeModules();
    debug('Compiling Compass assets ...');
    await compileCompassAssets();
  }

  const tests = await promisify(glob)('tests/**/*.{test,spec}.js', {
    cwd: __dirname,
  });

  const mocha = new Mocha();

  tests.forEach((testPath) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  mocha.run((failures) => {
    cleanup();
    process.exitCode = failures ? 1 : 0;
  });
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

main();
