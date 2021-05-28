const path = require('path');
const { promises: fs } = require('fs');
const semver = require('semver');

const compassDepsList = require('./compass-deps-list');

const ROOT = path.resolve(__dirname, '..', '..');

// Flag that indicates if we should update the major
// versions on dependencies to bring them together.
const UPDATE_MAJOR_VERSION = true;

// This flag says if we should only update the versions
// of package dependencies where the dependency
// is a package in this monorepo.
const ALIGN_ONLY_DEPS_IN_MONOREPO = true;

const SKIP_BABEL_DEPS = false;

// We skip aligning dependencies in a few packages for now
// since they currently fail to install after aligning.
const skippedPackages = [];

const depOverrides = {
  // TODO: Investigate reasons for these packages to be pinned (can we unpin):
  // https://github.com/mongodb-js/debug/commit/f389ed0b1109752ceea04ea39c7ca55d04f9eaa6
  // 'mongodb-js/debug#v2.2.3': '^4.1.1',
  // https://github.com/mongodb-js/hadron-build/tree/evergreen
  // 'github:mongodb-js/hadron-build#evergreen': '^23.5.0'
};

/** Noted manual changes:
 * - Added `babel-preset-es2015` to `compass-server-version`
 * - Skipped `ssh tunnel failures` tests in `connection-model`, let's investigate and re-enable.
 * - Added `"react": "^16.8.0",` as a dev dep to `compass-app-stores`. Previously was just a peer dep.
 **/

const pinnedDeps = {
  'github:addaleax/js-bson#after-the-next-bson-release-you-can-just-use-the-npm-package-again': 'github:addaleax/js-bson#after-the-next-bson-release-you-can-just-use-the-npm-package-again',

  // TODO: Do we need this override? Can we just use v3.3.5?
  'https://github.com/twbs/bootstrap/archive/v3.3.5.tar.gz': 'https://github.com/twbs/bootstrap/archive/v3.3.5.tar.gz',

  // TODO: Look into how we can align these.
  'cipacda/flat': 'cipacda/flat',
  'mongodb-js/debug#v2.2.3': 'mongodb-js/debug#v2.2.3',
  'github:mongodb-js/hadron-build#evergreen': 'github:mongodb-js/hadron-build#evergreen',

  'mongodb-js/reflux-state-mixin': 'mongodb-js/reflux-state-mixin',

  'github:rueckstiess/triejs': 'github:rueckstiess/triejs'
};

// Map used to look up if a dependency is a package in our monorepo.
const compassDepsListMapName = {};
compassDepsList.forEach(dep => {
  compassDepsListMapName[dep.name] = true;
});

const dependencyTypes = ['dependencies', 'devDependencies'];

function getDepsUsedByPackages(packages) {
  const depsAndArrayOfVersionsUsed = {};

  for (const pkgDir of packages) {
    const packageJson = require(path.join(pkgDir, 'package.json'));

    for (const dependencyType of dependencyTypes) {
      if (!packageJson[dependencyType]) {
        // console.log('No', dependencyType, 'found in', packageJson.name);
        continue;
      }

      if (!depsAndArrayOfVersionsUsed[dependencyType]) {
        depsAndArrayOfVersionsUsed[dependencyType] = {}
      }

      Object.keys(packageJson[dependencyType]).forEach((depName) => {
        if (!depsAndArrayOfVersionsUsed[dependencyType][depName]) {
          depsAndArrayOfVersionsUsed[dependencyType][depName] = new Set();
        }

        let depVersion = packageJson[dependencyType][depName];

        if (depOverrides[depVersion]) {
          depVersion = depOverrides[depVersion];
        }

        depsAndArrayOfVersionsUsed[dependencyType][depName].add(depVersion);
      });
    }
  }

  return depsAndArrayOfVersionsUsed;
}

function getSemverCompatibleVersion(version) {
  if (depOverrides[version]) {
    return depOverrides[version].substring(1);
  }

  if (version === '*') {
    return '0.0.0';
  }

  if (pinnedDeps[version]) {
    return '0.0.0';
  }

  if (version.includes('^')) {
    return version.substring(1);
  }

  return version;
}

function getHighestVersionUsedForDeps(depsAndArrayOfVersionsUsed) {
  const highestVersionsForDeps = {};

  const keys = Object.keys(depsAndArrayOfVersionsUsed).sort();
  keys.forEach((depName) => {
    if (UPDATE_MAJOR_VERSION) {
      const sortedDeps = [
        ...depsAndArrayOfVersionsUsed[depName]
      ].sort(
        (a, b) => semver.compare(
          getSemverCompatibleVersion(a),
          getSemverCompatibleVersion(b)
        )
      );

      const highestVersionDep = sortedDeps[sortedDeps.length - 1];

      highestVersionsForDeps[depName] = highestVersionDep;
    } else {
      highestVersionsForDeps[depName] = {};
      depsAndArrayOfVersionsUsed[depName].forEach(depVersion => {
        const semverOfVersion = getSemverCompatibleVersion(depVersion);
        if (semverOfVersion === '*') {
          return;
        }
        const majorVersion = semver.major(semverOfVersion);
        if (!highestVersionsForDeps[depName][majorVersion] || semver.compare(
          getSemverCompatibleVersion(highestVersionsForDeps[depName][majorVersion]),
          getSemverCompatibleVersion(depVersion)
        ) < 0) {
          highestVersionsForDeps[depName][majorVersion] = depVersion;
        }
      });
    }

  });

  return highestVersionsForDeps;
}

async function alignCommonDeps() {
  console.log('Aligning dependencies to highest version present...');
  console.log();

  const packagesDir = path.resolve(ROOT, 'packages');
  const packages = (await fs.readdir(packagesDir)).map((dir) =>
    path.join(packagesDir, dir)
  );

  const depsAndArrayOfVersionsUsed = getDepsUsedByPackages(packages);

  const highestVersionsForDeps = {};

  for (const dependencyType of dependencyTypes) {
    highestVersionsForDeps[dependencyType] = getHighestVersionUsedForDeps(
      depsAndArrayOfVersionsUsed[dependencyType]
    );
  }


  let depsUpdatedCount = 0;
  let individualDepsUpdated = 0;
  let depsCounted = {};
  for (const pkgDir of packages) {
    const packageJsonPath = path.join(pkgDir, 'package.json');
    const packageJson = require(packageJsonPath); 

    if (skippedPackages.includes(packageJson.name)) {
      console.log('Skipping aligning dependencies in', packageJson.name);
      continue;
    }

    let depsHaveChanged = false;

    for (const dependencyType of dependencyTypes) {
      if (!packageJson[dependencyType]) {
        // console.log('No', dependencyType, 'found in', packageJson.name);
        continue;
      }

      Object.keys(packageJson[dependencyType]).forEach((depName) => {
        const currentDepVersion = packageJson[dependencyType][depName];
        if (currentDepVersion === '*') {
          // Dep can be * which we can ignore.
          return;
        }

        if (pinnedDeps[currentDepVersion]) {
          // Keep the same version.
          return;
        }

        if (SKIP_BABEL_DEPS && depName.includes('babel')) {
          // Skip babel deps when the flag is enabled.
          return;
        }

        if (ALIGN_ONLY_DEPS_IN_MONOREPO && !compassDepsListMapName[depName]) {
          // This flag says if we should only update the versions
          // of package dependencies where the dependency
          // is a package in this monorepo.
          return;
        }

        let highestVersionForDep = highestVersionsForDeps[dependencyType][depName];

        if (!UPDATE_MAJOR_VERSION) {
          const semverOfVersion = getSemverCompatibleVersion(currentDepVersion);
          const majorVersion = semver.major(semverOfVersion);
          highestVersionForDep = highestVersionsForDeps[dependencyType][depName][majorVersion];
        }

        if (currentDepVersion !== highestVersionForDep) {
          depsHaveChanged = true;
          console.log(
            'Bumping', depName,
            'in', packageJson.name,
            dependencyType,
            'from', currentDepVersion,
            'to', highestVersionForDep
          );
          packageJson[dependencyType][depName] = highestVersionForDep;

          if (!depsCounted[depName]) {
            individualDepsUpdated++;
            depsCounted[depName] = true;
          }
          depsUpdatedCount++;
        }
      });
    }

    if (depsHaveChanged) {
      await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
    }
  }

  console.log();
  console.log('All done.');
  console.log('Updated', depsUpdatedCount, 'individual package dependencies.');
  console.log('Updated', individualDepsUpdated, 'different dependencies.');
}

alignCommonDeps();