const execa = require('execa');
const path = require('path');
const fs = require('fs');
const util = require('util');

const readFile = util.promisify(fs.readFile);

const monorepoPath = path.dirname(require.resolve('../../../package.json'));

async function genPackageLock(registryAddress) {
  await execa('node', [
    require.resolve('./../../../scripts/generate-package-lock'),
    'mongodb-compass',
  ],
  {
    stdio: 'inherit',
    env: {
      npm_config_registry: registryAddress
    },
    cwd: monorepoPath
  });

  return await readFile(path.resolve(monorepoPath, 'packages', 'compass', 'package-lock.json'));
}

module.exports = genPackageLock;
