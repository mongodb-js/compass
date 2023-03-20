const semver = require('semver');
const fetch = require('make-fetch-happen');
const { forEachPackage } = require('./monorepo/for-each-package');
const fs = require('fs');
const path = require('path');
const { runInDir } = require('./run-in-dir');

async function cleanAndBootstrap(electronVersion) {
  try {
    await runInDir("npx lerna exec 'rm -Rf node_modules'");
    await runInDir('rm -Rf node_modules');
    const packageJsonBkp = fs.readFileSync('./package.json');
    await runInDir('npm i');
    await runInDir(`npm i electron@${electronVersion}`); // make sure electron is hoisted on the root
    await runInDir('npm run bootstrap');
    fs.writeFileSync('./package.json', packageJsonBkp);
  } catch (error) {
    console.error(`Error running command: ${error}`);
  }
}

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

async function getLatestVersion(packageName) {
  const output = await runInDir(`npm view ${packageName} version`);

  const latestVersion = output.stdout.trim();
  return latestVersion;
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

  const latestBrowserslistVersion = await getLatestVersion('browserslist');

  const newVersions = {
    'node-abi': `^${latestNodeAbiVersion}`,
    '@electron/remote': `^${latestElectronRemoteVersion}`,
    '@electron/rebuild': `^${latestElectronRebuildVersion}`,
    electron: `^${latestElectronVersion}`,
    browserslist: `^${latestBrowserslistVersion}`,
  };

  console.log('Updating the following packages:', newVersions);

  forEachPackage((props) => {
    const packageJsonPath = path.resolve(props.location, 'package.json');

    updatePackageVersions(packageJsonPath, newVersions);
  });

  console.log('Cleaning node_modules and rebootstrapping');
  cleanAndBootstrap(latestElectronVersion);
}

main();
