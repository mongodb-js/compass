const path = require('path');
const { withProgress } = require('./monorepo/with-progress');
const { runInDir } = require('./run-in-dir');

const ROOT = process.cwd();

async function installElectron() {
  const packageJson = require(path.join(ROOT, 'package.json'));

  const electronVersion =
    (packageJson.dependencies && packageJson.dependencies.electron) ||
    (packageJson.devDependencies && packageJson.devDependencies.electron);

  const hasElectronDep = Boolean(electronVersion);

  if (hasElectronDep) {
    await withProgress(
      `Installing electron for package ${packageJson.name}`,
      async function () {
        const spinner = this;

        let version = electronVersion;

        try {
          const lockFile = require(path.join(ROOT, 'package-lock.json'));
          version = lockFile.dependencies.electron.version;
        } catch (e) {}

        spinner.text = `Installing electron@${version} for package ${packageJson.name}`;

        await runInDir(`npm install --no-save electron@${version}`, ROOT);
      }
    );
  }
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
});

installElectron();
