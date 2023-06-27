// Manually align internal dependencies in packages/compass/package.json due to
// private packages and peer dependencies being ignored by `lerna version`
// command (see https://github.com/lerna/lerna/issues/1575)
const path = require('path');

const {
  runInDir,
  withProgress,
  updatePackageJson,
} = require('@mongodb-js/monorepo-tools');

const LERNA_BIN = path.resolve(
  __dirname,
  '..',
  'node_modules',
  '.bin',
  'lerna'
);

const NO_STAGE = process.argv.includes('--no-stage');

const NO_COMMIT = process.argv.includes('--no-commit');

const NO_PACKAGE_LOCK = process.argv.includes('--no-package-lock');

async function main() {
  const packages = JSON.parse(
    (await runInDir(`${LERNA_BIN} list --all --json --toposort`)).stdout
  );

  const packageToVersionMap = new Map(
    packages.map((pkg) => [
      pkg.name,
      /^\d+\.\d+\.\d+-.+/.test(pkg.version)
        ? `${pkg.version}`
        : `^${pkg.version}`,
    ])
  );

  for (const pkg of packages) {
    await withProgress(
      `Aligning monorepo dependencies versions for package ${pkg.name}`,
      async () => {
        await updatePackageJson(pkg.location, (packageJson) => {
          for (const depType of [
            'dependencies',
            'devDependencies',
            'peerDependencies',
          ]) {
            if (!packageJson[depType]) {
              continue;
            }

            for (const depName of Object.keys(packageJson[depType])) {
              if (packageToVersionMap.has(depName)) {
                const version = packageToVersionMap.get(depName);
                packageJson[depType][depName] = version;
              }
            }
          }

          return packageJson;
        });
      }
    );
  }

  if (!NO_PACKAGE_LOCK) {
    await withProgress(
      'Updating node_modules and package-lock at root',
      async () => {
        // We do full install here so not only package-lock is updated, but your
        // local dependencies are up to date and ready for publish step
        await runInDir('npm install');
      }
    );
  }

  if (!NO_STAGE) {
    await withProgress('Staging changes for commit', async () => {
      const updatedPackageLockFiles = packages
        .map((pkg) => `${pkg.location}/package.json`)
        .join(' ');

      await runInDir(`git add package-lock.json ${updatedPackageLockFiles}`);
    });
  }

  if (!NO_COMMIT) {
    await withProgress('Committing changes', async () => {
      await runInDir(
        `git commit -m "chore(release): Update packages dependencies versions"`
      );
    });
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
