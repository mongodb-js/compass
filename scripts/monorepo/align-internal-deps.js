const childProcess = require('child_process');
const path = require('path');
const fsExtra = require('fs-extra');
const _ = require('lodash');


const packages = JSON.parse(childProcess.execSync('lerna list --all --json --toposort'));
const packagesByName = packages.reduce((acc, curr) => { return {...acc, [curr.name]: curr.version}; }, {})

for (const package of packages) {
  const packageJsonPath = path.join(package.location, 'package.json');
  const packageJson = fsExtra.readJSONSync(packageJsonPath);

  const mismatching = checkDependencyVersions(packageJson, packagesByName);

  const {dependencies, devDependencies, peerDependencies} = mismatching;
  if (dependencies.length || devDependencies.length || peerDependencies.length) {
    const newPackageJson = fixDeps(packageJson, packagesByName, mismatching);
    fsExtra.writeJSONSync(packageJsonPath, newPackageJson);
  }
}

function checkDependencyVersions(packageJson, packagesByName) {
  const dependencies = checkDependencyVersionsInSection(packageJson, packagesByName, 'dependencies');
  const devDependencies = checkDependencyVersionsInSection(packageJson, packagesByName, 'devDependencies');
  const peerDependencies = checkDependencyVersionsInSection(packageJson, packagesByName, 'peerDependencies');

  return {dependencies, devDependencies, peerDependencies};
}

function checkDependencyVersionsInSection(packageJson, packagesByName, section) {
  const found = [];
  Object.entries(packageJson[section] || {}).forEach(([depName, depVer]) => {
    if (packagesByName[depName] && packagesByName[depName] !== depVer.replace('^', '')) {
      found.push(depName);
    }
  });

  return found;
}

function fixDeps(packageJson, packagesByName, changes) {
  const newPackageJson = _.cloneDeep(packageJson);

  for (const key of ['dependencies', 'devDependencies', 'peerDependencies']) {
    if (!changes[key].length) {
      continue;
    }

    for (const dep of changes[key]) {
      newPackageJson[key][dep] = `^${packagesByName[dep]}`;
    }
  }

  return newPackageJson;
}