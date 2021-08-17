const path = require('path');
const execa = require('execa');
const monorepoPath = path.dirname(require.resolve('../../../package.json'));

async function publish(registryAddress) {
  await execa('npx', [
    'lerna', 'publish', 'from-package',
    '--ignore-scripts',
    '--registry', registryAddress,
    '--yes'
  ], { cwd: monorepoPath, stdio: 'inherit' });
}

async function listPackages() {
  const { stdout } = await execa('npx', [
    'lerna', 'ls', '--json'
  ], { cwd: monorepoPath });
  return JSON.parse(stdout);
}

module.exports = {
  publish,
  listPackages
};
