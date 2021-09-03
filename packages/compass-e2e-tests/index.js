const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const Mocha = require('mocha');
const debug = require('debug')('compass-e2e-tests');
const {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass,
} = require('./helpers/compass');

async function main() {
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

  const failures = await promisify(mocha.run.bind(mocha))();

  process.exitCode = failures ? 1 : 0;
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
