const path = require('path');
const pkgUp = require('pkg-up');
const { promisify } = require('util');
const { execFile } = require('child_process');
const execFileAsync = promisify(execFile);

const monorepoRoot = path.resolve(__dirname, '..');

async function main(fileList) {
  const filesToPrettify = [];

  await Promise.all(
    fileList.map(async (filePath) => {
      const packageJsonPath = await pkgUp({ cwd: path.dirname(filePath) });

      if (!packageJsonPath) {
        return;
      }

      const packageRoot = path.dirname(packageJsonPath);

      if (monorepoRoot === packageRoot) {
        return;
      }

      const packageJson = require(packageJsonPath);

      // We are only prettifying files that are inside packages that already
      // have prettier set up
      if (packageJson.scripts?.prettier) {
        filesToPrettify.push(filePath);
      }
    })
  );

  if (filesToPrettify.length === 0) {
    console.log('No files to re-format. Skipping ...');
    return;
  }

  console.log('Re-formatting following files ...');
  filesToPrettify.map((filePath) => {
    console.log(`  - ${path.relative(process.cwd(), filePath)}`);
  });

  await execFileAsync('npx', [
    'prettier',
    '--config',
    require.resolve('@mongodb-js/prettier-config-compass/.prettierrc.json'),
    // Silently ignore files that are of format that is not supported by prettier
    '--ignore-unknown',
    '--write',
    ...filesToPrettify,
  ]);

  // Re-add potentially reformatted files
  await execFileAsync('git', ['add', ...filesToPrettify]);
}

const fileList = process.argv
  .slice(process.argv.indexOf('precommit') + 1)
  .filter((arg) => !arg.startsWith('-'))
  .map((filePath) => {
    return path.resolve(process.cwd(), filePath);
  });

main(fileList);
