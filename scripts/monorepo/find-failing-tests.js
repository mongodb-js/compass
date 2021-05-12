const path = require('path');
const { promises: fs } = require('fs');
const { runInDir } = require('../run-in-dir');
const { withProgress } = require('./with-progress');

const ROOT = path.resolve(__dirname, '..', '..');

async function runFind() {
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );
  const isCI = process.argv.includes('--ci');
  const failing = new Map();

  for (const pkgDir of packages) {
    try {
      const packageJson = require(path.join(pkgDir, 'package.json'));
      const scriptName = isCI ? 'test-ci' : 'test';

      if (packageJson.scripts && packageJson.scripts[scriptName]) {
        await withProgress(
          `Running ${scriptName} for package ${packageJson.name}`,
          async function () {
            try {
              await runInDir(
                isCI ? 'npm run test-ci' : 'npm run test',
                pkgDir,
                1000 *
                  60 *
                  10 /* 10mns should be enough, some of our tests are not exiting correctly */
              );
            } catch (e) {
              failing.set(packageJson.name, e);
              throw e;
            }
          }
        );
      } else {
        console.log(
          `- Skipping package ${packageJson.name}: no ${scriptName} npm script found`
        );
      }
    } catch (e) {
      // noop
    }
  }

  if (failing.size > 0) {
    console.log();
    console.log(
      `Tests failed in ${failing.size} package${failing.size > 1 ? 's' : ''}:`
    );
    console.log();
    failing.forEach((err, name) => {
      console.log(`  ${name}`);
    });
    failing.forEach((err, name) => {
      console.log();
      console.log(`${name}: ${err.cmd}`);
      err.stdout.split('\n').forEach((line) => console.log(`${name}: ${line}`));
      err.stderr.split('\n').forEach((line) => console.log(`${name}: ${line}`));
    });
  } else {
    console.log();
    console.log('None of the tests failed 🎉');
  }

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runFind();
