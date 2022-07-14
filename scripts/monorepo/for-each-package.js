const path = require('path');
const { runInDir } = require('../run-in-dir');

const ROOT = path.resolve(__dirname, '..', '..');

const LERNA_BIN = path.resolve(
  __dirname,
  '..',
  '..',
  'node_modules',
  '.bin',
  'lerna'
);

async function getPackages() {
  return JSON.parse(
    (await runInDir(`${LERNA_BIN} list --all --json --toposort`)).stdout
  );
}

async function forEachPackage(fn) {
  let interrupted = false;
  const interrupt = () => {
    interrupted = true;
  };
  const packages = await getPackages();
  const result = [];
  for (const packageInfo of packages) {
    const packageJson = require(path.join(
      packageInfo.location,
      'package.json'
    ));
    result.push(
      await fn({ rootDir: ROOT, packageJson, ...packageInfo }, interrupt)
    );
    if (interrupted) {
      break;
    }
  }
  return result;
}

module.exports = { forEachPackage, getPackages };
