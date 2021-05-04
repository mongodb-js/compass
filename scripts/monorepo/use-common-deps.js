const path = require('path');
const { promises: fs } = require('fs');
// const { runInDir } = require('./run-in-dir');
// const { withProgress } = require('./with-progress');
const semver = require('semver');

const ROOT = path.resolve(__dirname, '..', '..');

function getDevDepsUsedByPackages(packages) {
  const devDepsAndArrayOfVersionsUsed = {};
  for (const pkgDir of packages) {
    const packageJson = require(path.join(pkgDir, 'package.json'));
    
    if (!packageJson.devDependencies) {
      console.log('no dev deps in', packageJson.devDependencies);
      continue;
    }

    Object.keys(packageJson.devDependencies).forEach((depName) => {
      if (!devDepsAndArrayOfVersionsUsed[depName]) {
        devDepsAndArrayOfVersionsUsed[depName] = new Set();
      }

      const devDepVersion = packageJson.devDependencies[depName];

      devDepsAndArrayOfVersionsUsed[depName].add(devDepVersion);
    });
  }

  return devDepsAndArrayOfVersionsUsed;
}

function getHighestVersionUsedForDeps(devDepsAndArrayOfVersionsUsed) {
  const highestVersionsForDeps = {};

  const keys = Object.keys(devDepsAndArrayOfVersionsUsed).sort();
  keys.forEach((depName) => {
    const sortedDeps = [
      ...devDepsAndArrayOfVersionsUsed[depName]
    ].sort(
      semver.compare
    );
    const highestVersionDep = sortedDeps[sortedDeps.length - 1];

    highestVersionsForDeps[depName] = highestVersionDep;
    // console.log('dep', depName, '=', sortedDeps);
    // console.log('highestVersionForDep', highestVersionDep);
  });

  return highestVersionsForDeps;
}

async function alignCommonDeps() {
  console.log('Listing common deps...');
  console.log();

  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  const devDepsAndArrayOfVersionsUsed = getDevDepsUsedByPackages(packages);

  const highestVersionsForDeps = getHighestVersionUsedForDeps(devDepsAndArrayOfVersionsUsed);

  for (const pkgDir of packages) {
    const packageJsonPath = path.join(pkgDir, 'package.json');
    const packageJson = require(packageJsonPath);    
    if (!packageJson.devDependencies) {
      console.log('no dev deps, continue');
      continue;
    }

    Object.keys(packageJson.devDependencies).forEach((depName) => {
      const currentDevDep = packageJson.devDependencies[depName];
      if (currentDevDep === '*') {
        // Dep can be * which we can ignore.
        return;
      }

      if (currentDevDep !== highestVersionsForDeps[depName]) {
        console.log('bumping', depName, 'in', pkgDir, 'from', currentDevDep, 'to', highestVersionsForDeps[depName]);
        packageJson.devDependencies[depName] = highestVersionsForDeps[depName];
      }
    });

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  console.log();
  console.log('All done.');
}

alignCommonDeps();
