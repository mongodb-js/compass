const path = require('path');
const { promises: fs } = require('fs');
const semver = require('semver');

const ROOT = path.resolve(__dirname, '..', '..');

// TODO: Investigate downstreams of these changes
const devDepOverrides = {
  // https://github.com/mongodb-js/debug/commit/f389ed0b1109752ceea04ea39c7ca55d04f9eaa6
  'mongodb-js/debug#v2.2.3': '^4.1.1',
  // https://github.com/mongodb-js/hadron-build/tree/evergreen
  'github:mongodb-js/hadron-build#evergreen': '^23.5.0'
};

function getDevDepsUsedByPackages(packages) {
  const devDepsAndArrayOfVersionsUsed = {};
  for (const pkgDir of packages) {
    const packageJson = require(path.join(pkgDir, 'package.json'));
    
    if (!packageJson.devDependencies) {
      // console.log('No dev deps in', packageJson.name);
      continue;
    }

    Object.keys(packageJson.devDependencies).forEach((depName) => {
      if (!devDepsAndArrayOfVersionsUsed[depName]) {
        devDepsAndArrayOfVersionsUsed[depName] = new Set();
      }

      let devDepVersion = packageJson.devDependencies[depName];

      if (devDepOverrides[devDepVersion]) {
        devDepVersion = devDepOverrides[devDepVersion];
      }

      devDepsAndArrayOfVersionsUsed[depName].add(devDepVersion);
    });
  }

  return devDepsAndArrayOfVersionsUsed;
}

function getSemverCompatibleVersion(version) {
  if (version === '*') {
    return '0.0.0';
  }

  if (version.includes('^')) {
    return version.substring(1);
  }

  return version;
}

function getHighestVersionUsedForDeps(devDepsAndArrayOfVersionsUsed) {
  const highestVersionsForDeps = {};

  const keys = Object.keys(devDepsAndArrayOfVersionsUsed).sort();
  keys.forEach((depName) => {
    const sortedDeps = [
      ...devDepsAndArrayOfVersionsUsed[depName]
    ].sort(
      (a, b) => semver.compare(
        getSemverCompatibleVersion(a),
        getSemverCompatibleVersion(b)
      )
    );
    const highestVersionDep = sortedDeps[sortedDeps.length - 1];

    highestVersionsForDeps[depName] = highestVersionDep;
  });

  return highestVersionsForDeps;
}

async function alignCommonDeps() {
  console.log('Aligning dev dependencies to highest version present...');
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
      // console.log('No dev deps in ', packageJson.name, ', continue');
      continue;
    }

    Object.keys(packageJson.devDependencies).forEach((depName) => {
      const currentDevDep = packageJson.devDependencies[depName];
      if (currentDevDep === '*') {
        // Dep can be * which we can ignore.
        return;
      }

      if (currentDevDep !== highestVersionsForDeps[depName]) {
        console.log(
          'Bumping', depName,
          'in', packageJson.name,
          'from', currentDevDep,
          'to', highestVersionsForDeps[depName]
        );
        packageJson.devDependencies[depName] = highestVersionsForDeps[depName];
      }
    });

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  console.log();
  console.log('All done.');
}

alignCommonDeps();
