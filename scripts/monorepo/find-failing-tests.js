const path = require('path');
const { promises: fs } = require('fs');
const { runInDir } = require('./run-in-dir');
const { withProgress } = require('./with-progress');

const ROOT = path.resolve(__dirname, '..', '..');

async function runFind() {
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  const failing = [];

  for (const pkgDir of packages) {
    try {
      const packageJson = require(path.join(pkgDir, 'package.json'));

      await withProgress(
        `Running tests for package ${packageJson.name}`,
        async function () {
          const spinner = this;
          try {
            await runInDir(
              'npm run test',
              pkgDir,
              1000 *
                60 *
                10 /* 10mns should be enough, some of our tests are not exiting correctly */
            );
          } catch (e) {
            failing.push(packageJson.name);
            throw e;
          }
        }
      );
    } catch (e) {
      // noop
    }
  }

  if (failing.length > 0) {
    console.log();
    console.log(`Tests failed in ${failing.length} packages:`);
    console.log();
    console.log(failing.map((name) => `  ${name}`).join('\n'));
  } else {
    console.log()
    console.log('None of the tests failed 🎉')
  }


  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runFind();
