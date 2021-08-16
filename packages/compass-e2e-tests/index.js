const path = require('path');
const { promisify } = require('util');
const glob = require('glob');
const Mocha = require('mocha');
const {
  rebuildNativeModules,
  compileCompassAssets,
  buildCompass
} = require('./helpers/compass');

async function main() {
  const shouldTestPackagedApp = process.argv.includes('--test-packaged-app');

  if (shouldTestPackagedApp) {
    process.env.TEST_PACKAGED_APP = '1';
    console.info('Building Compass before running the tests ...');
    await buildCompass();
  } else {
    delete process.env.TEST_PACKAGED_APP;
    console.log('Preparing Compass before running the tests ...');
    await rebuildNativeModules();
    await compileCompassAssets();
  }

  const tests = await promisify(glob)('tests/**/*.{test,spec}.js', {
    cwd: __dirname
  });

  const mocha = new Mocha();

  tests.forEach((testPath) => {
    mocha.addFile(path.join(__dirname, testPath));
  });

  const failures = await promisify(mocha.run.bind(mocha))();

  process.exitCode = failures ? 1 : 0;

  if (process.exitCode > 0) {
    // Force-exit if tests failed (sometimes electron gets stuck and causes
    // script to run forever)
    process.exit();
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
