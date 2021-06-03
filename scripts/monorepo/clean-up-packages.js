const path = require('path');
const { promises: fs } = require('fs');
const { runInDir } = require('../run-in-dir');
const { withProgress } = require('./with-progress');
const { updatePackageJson } = require('./update-package-json');

const ROOT = path.resolve(__dirname, '..', '..');

async function cleanUpPackage(packageDir = process.cwd()) {
  const spinner = this;
  const packageJson = require(path.join(packageDir, 'package.json'));
  const startSpinnerText = (spinner.text = `Cleaning up package ${packageJson.name}`);

  try {
    spinner.text = `${startSpinnerText}: removing GitHub metadata`;

    try {
      await fs.rmdir(path.join(packageDir, '.github'), { recursive: true });
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    spinner.text = `${startSpinnerText}: removing CI configs`;

    try {
      await fs.unlink(path.join(packageDir, '.travis.yml'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    try {
      await fs.unlink(path.join(packageDir, 'azure-pipeline.yml'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    // Otherwise removing mongodb-js-precommit doesn't work due to the ENOLOCAL
    // error. It doesn't hurt to regenerate the lock file anyways
    spinner.text = `${startSpinnerText}: removing package-lock before proceeding`;

    try {
      await fs.unlink(path.join(packageDir, 'package-lock.json'));
    } catch (e) {
      if (e.code !== 'ENOENT') throw e;
    }

    // Deprecated and not really used, let's clean it up while we're at it
    if (
      packageJson.devDependencies &&
      packageJson.devDependencies['mongodb-js-fmt']
    ) {
      spinner.text = `${startSpinnerText}: removing deprecated mongodb-js-fmt`;

      const [fmtScriptName] =
        Object.entries(packageJson.scripts || {}).find(([, val]) =>
          /^mongodb-js-fmt/.test(val)
        ) || [];

      if (fmtScriptName) {
        await updatePackageJson(packageDir, (pkgJson) => {
          delete pkgJson.scripts[fmtScriptName];
          return pkgJson;
        });
      }

      try {
        await fs.unlink(path.join(packageDir, '.jsfmtrc'));
      } catch (e) {
        if (e.code !== 'ENOENT') throw e;
      }

      await runInDir('npm uninstall --save mongodb-js-fmt', packageDir);
    }

    // Replace mongodb-js-precommit. It causes install issues for packages,
    // doesn't bring too much value, we also don't need the pre-commit part for
    // every package separately, root is responsible for running the git hooks
    if (
      packageJson.devDependencies &&
      packageJson.devDependencies['mongodb-js-precommit']
    ) {
      spinner.text = `${startSpinnerText}: replacing mongodb-js-precommit with depcheck + eslint`;

      const depCheckConfig = {
        ignore:
          (packageJson['dependency-check'] &&
            packageJson['dependency-check'].ignore) ||
          [],
        entries: (packageJson['dependency-check'] &&
          packageJson['dependency-check'].entries) || ['./package.json']
      };

      depCheckConfig.ignore =
        depCheckConfig.ignore && !Array.isArray(depCheckConfig.ignore)
          ? [depCheckConfig.ignore]
          : depCheckConfig.ignore;

      depCheckConfig.entries =
        depCheckConfig.entries && !Array.isArray(depCheckConfig.entries)
          ? [depCheckConfig.entries]
          : depCheckConfig.entries;

      // Not all of packages even have the scripts, let's provide some sensible
      // defaults so the code keeps running
      const [
        precommitCommandName = 'check',
        precommitCommand = 'mongodb-js-precommit'
      ] =
        Object.entries(packageJson.scripts).find(([, val]) =>
          /^mongodb-js-precommit/.test(val)
        ) || [];

      // // This is what the mongodb-js-precommit was checking, although we
      // // might want to reconsider in the future
      // const depCheckCommand = [
      //   'dependency-check',
      //   Array.isArray(depCheckConfig.entries)
      //     ? depCheckConfig.entries.join(' ').trim()
      //     : depCheckConfig.entries,
      //   Array.isArray(depCheckConfig.ignore)
      //     ? depCheckConfig.ignore.map((name) => `-i ${name}`).join(' ')
      //     : `-i ${depCheckConfig.ignore}`,
      //   '--detective precinct',
      //   '--missing'
      // ]
      //   .filter(Boolean)
      //   .join(' ');

      // We already migrated a few packages to `depcheck`, let's use it here
      const depCheckCommand = [
        'depcheck',
        depCheckConfig.ignore && depCheckConfig.ignore.length
          ? `--ignores="${depCheckConfig.ignore.join(',')}"`
          : '',
        '|| echo "!!! Dependency check failed, but the failure is ignored by now. This should be addressed in COMPASS-4772 !!!"'
      ]
        .filter(Boolean)
        .join(' ')
        .trim();

      const lintCommand = `eslint ${
        precommitCommand.replace('mongodb-js-precommit', '').trim() ||
        // Do not emit errors if we added a pattern that doesn't match, it's a
        // good enough compromise between making the logic of figuring out what
        // to lint and having a good enough default that can produce errors in
        // some cases
        '"./{src,lib,test,bin}/**/*.{js,jsx,ts,tsx}" "./*.js" --no-error-on-unmatched-pattern'
      }`;

      await updatePackageJson(packageDir, (pkgJson) => {
        delete pkgJson['precommit'];
        delete pkgJson['dependency-check'];
        pkgJson.scripts['lint'] = lintCommand;
        pkgJson.scripts['depcheck'] = depCheckCommand;
        pkgJson.scripts[precommitCommandName] =
          'npm run lint && npm run depcheck';
        return pkgJson;
      });

      await runInDir('npm uninstall --save mongodb-js-precommit', packageDir);
      await runInDir('npm install --save-dev depcheck eslint', packageDir);
    }

    spinner.text = startSpinnerText;
  } catch (e) {
    if (spinner.isSpinning) {
      spinner.fail();
    }
    throw e;
  }
}

async function runCleanUp() {
  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  for (const pkgDir of packages) {
    await withProgress('Cleaning up package', cleanUpPackage, pkgDir);
  }

  console.log();
  console.log('All done');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

runCleanUp();
