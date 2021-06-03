// align internal dependencies in packages/compass/package.json
// since mongodb-compass is skipped in `lerna version` so to keep
// its own version to 0.0.0-dev.

const childProcess = require('child_process');
const path = require('path');
const fsExtra = require('fs-extra');

const packages = JSON.parse(
  childProcess.execSync('lerna list --all --json --toposort'));

const internalPackageVersions = packages.reduce(
  (acc, curr) => { return {...acc, [curr.name]: curr.version}; }, {}
);

const {
  location: compassPackageLocation
} = packages.find(({name}) => name === 'mongodb-compass');

const packageJsonPath = path.join(compassPackageLocation, 'package.json');
const packageJson = fsExtra.readJSONSync(packageJsonPath);

for (const dependencies of [
  'dependencies',
  'devDependencies',
  'peerDependencies'
]) {
  if (!packageJson[dependencies]) {
    continue;
  }

  for (const key of Object.keys(packageJson[dependencies])) {
    if (internalPackageVersions[key]) {
      packageJson[dependencies][key] = `^${internalPackageVersions[key]}`;
    }
  }
}

fsExtra.writeJSONSync(packageJsonPath, packageJson, {spaces: 2});
