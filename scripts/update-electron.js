const semver = require('semver');
const fetch = require('make-fetch-happen');
const { exec } = require('child_process');
const { forEachPackage } = require('./monorepo/for-each-package');
const fs = require('fs');
const path = require('path');

function updatePackageVersions(packageJsonPath, newVersions) {
  // Load the package.json file
  const packageJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));

  // Update the dependencies
  [
    'dependencies',
    'devDependencies',
    'peerDependencies',
    'optionalDependencies',
  ].forEach((depType) => {
    if (packageJson[depType]) {
      Object.entries(packageJson[depType]).forEach(([packageName]) => {
        if (packageJson[depType][packageName]) {
          packageJson[depType][packageName] =
            newVersions[packageName] || packageJson[depType][packageName];
        }
      });
    }
  });

  // Write the updated package.json file
  fs.writeFileSync(
    packageJsonPath,
    `${JSON.stringify(packageJson, null, 2)}\n`
  );
}

function getLatestVersion(packageName) {
  return new Promise((resolve, reject) => {
    exec(`npm view ${packageName} version`, (error, stdout) => {
      if (error) {
        reject(error);
        return;
      }
      const latestVersion = stdout.trim();
      resolve(latestVersion);
    });
  });
}

async function getLatestElectronVersionMatchingNodeVersion(
  nodeVersionComparator
) {
  const releasesUrl = 'https://releases.electronjs.org/releases.json';

  const response = await fetch(releasesUrl);
  const releases = await response.json();

  // Filter the releases to exclude any pre-releases and those that don't match the Node version comparator
  const filteredReleases = releases.filter(
    (release) =>
      !semver.prerelease(release.version) &&
      semver.satisfies(release.node, nodeVersionComparator)
  );

  // Sort the filtered releases by version number in descending order
  filteredReleases.sort((a, b) => semver.rcompare(a.version, b.version));

  const latest = filteredReleases[0].version;

  console.log(
    `latest electron version built on node ${nodeVersionComparator}: ${latest}`
  );

  return latest;
}

async function main() {
  const nodeVersionComparator = `${
    semver.minVersion(require('../package.json').engines.node).major
  }.x`;

  const latestElectronVersion =
    await getLatestElectronVersionMatchingNodeVersion(nodeVersionComparator);

  const latestNodeAbiVersion = await getLatestVersion('node-abi');
  const latestElectronRemoteVersion = await getLatestVersion(
    '@electron/remote'
  );
  const latestElectronRebuildVersion = await getLatestVersion(
    '@electron/rebuild'
  );

  console.log({
    latestElectronVersion,
    latestNodeAbiVersion,
    latestElectronRemoteVersion,
    latestElectronRebuildVersion,
  });

  forEachPackage((props) => {
    const packageJsonPath = path.resolve(props.location, 'package.json');

    updatePackageVersions(packageJsonPath, {
      'node-abi': `^${latestNodeAbiVersion}`,
      '@electron/remote': `^${latestElectronRemoteVersion}`,
      '@electron/rebuild': `^${latestElectronRebuildVersion}`,
      electron: `^${latestElectronVersion}`,
    });
  });
}

main();
