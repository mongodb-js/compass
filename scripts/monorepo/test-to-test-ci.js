const { promises: fs } = require('fs');
const path = require('path');
const { withProgress } = require('./with-progress');
const { updatePackageJson } = require('./update-package-json');

const ROOT = path.resolve(__dirname, '..', '..');

async function addTestCi() {
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  for (const pkgDir of packages) {
    const packageJson = require(path.join(pkgDir, 'package.json'));

    await withProgress(
      `Updaing npm scripts for ${packageJson.name}`,
      async (pkgDir) => {
        const hasTestCommand = Boolean(
          packageJson.scripts && packageJson.scripts.test
        );

        const hasTestCiCommand = Boolean(
          packageJson.scripts && packageJson.scripts['test-ci']
        );

        const hasMongoDbRunner = Boolean(
          packageJson.devDependencies &&
            packageJson.devDependencies['mongodb-runner']
        );

        if (hasTestCommand && !hasTestCiCommand) {
          await updatePackageJson(pkgDir, (packageJson) => {
            packageJson.scripts['test-ci'] = 'npm run test';
            if (hasMongoDbRunner) {
              packageJson.scripts['posttest-ci'] =
                'node ../../scripts/killall-mongo.js';
            }
            return packageJson;
          });
        }
      },
      pkgDir
    );
  }

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

addTestCi();
