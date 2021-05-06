const path = require('path');
const { promises: fs } = require('fs');
const semver = require('semver');

const ROOT = path.resolve(__dirname, '..', '..');

// Flag that indicates if we should update the major
// versions on dependencies to bring them together.
const UPDATE_MAJOR_VERSION = false;

// TODO: Investigate downstreams of these changes
const depOverrides = {
  // https://github.com/mongodb-js/debug/commit/f389ed0b1109752ceea04ea39c7ca55d04f9eaa6
  'mongodb-js/debug#v2.2.3': '^4.1.1',
  // https://github.com/mongodb-js/hadron-build/tree/evergreen
  'github:mongodb-js/hadron-build#evergreen': '^23.5.0',

  // Used in the unused package `hadron-spectron`. `chai-as-promised`.
  // We might just remove this package.
  '>= 6.x': '^7.1.1'
};

const pinnedDeps = {
  'github:addaleax/js-bson#after-the-next-bson-release-you-can-just-use-the-npm-package-again': 'github:addaleax/js-bson#after-the-next-bson-release-you-can-just-use-the-npm-package-again',

  // TODO: Do we need this override? Can we just use v3.3.5?
  'https://github.com/twbs/bootstrap/archive/v3.3.5.tar.gz': 'https://github.com/twbs/bootstrap/archive/v3.3.5.tar.gz',

  // TODO: Look into.
  'cipacda/flat': 'cipacda/flat',

  'mongodb-js/reflux-state-mixin': 'mongodb-js/reflux-state-mixin',
  
  'github:rueckstiess/triejs': 'github:rueckstiess/triejs'
};

// Notes on manual changes:
// - Added graceful-fs to packages/electron-wix-msi
// - Updating semver requires a fix in a few of the packages' config/project.js
//   files. (Just need to add `new ` before `semver`)
// - Added webpack-cli to dev deps in `compass-auto-updates`

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
  for (const pkgDir of packages) {
    const packageJsonPath = path.join(pkgDir, 'package.json');
    const packageJson = require(packageJsonPath); 
    
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

        let highestVersionForDep = highestVersionsForDeps[dependencyType][depName];

        if (!UPDATE_MAJOR_VERSION) {
          const semverOfVersion = getSemverCompatibleVersion(currentDepVersion);
          const majorVersion = semver.major(semverOfVersion);
          highestVersionForDep = highestVersionsForDeps[dependencyType][depName][majorVersion];
        }

        if (currentDepVersion !== highestVersionForDep) {
          console.log(
            'Bumping', depName,
            'in', packageJson.name,
            dependencyType,
            'from', currentDepVersion,
            'to', highestVersionForDep
          );
          packageJson[dependencyType][depName] = highestVersionForDep;
          depsUpdatedCount++;
        }
      });
    }

    await fs.writeFile(packageJsonPath, JSON.stringify(packageJson, null, 2));
  }

  console.log();
  console.log('All done. Updated', depsUpdatedCount, 'dependencies.');
}

alignCommonDeps();
