const path = require('path');
const findUp = require('find-up');
const fs = require('fs');
const WebpackLicensePlugin = require('webpack-license-plugin');
const { execSync, spawnSync } = require('child_process');

// --- options ---

const ALLOWED_LICENSES = [
  /^MIT$/,
  /^BSD-(2-Clause|3-Clause|4-Clause)$/,
  /^Apache-2\.0$/,
  /^ISC$/,
  /^CC-BY-4\.0$/,
  /^WTFPL$/,
  /^OFL-1\.1$/,
  /^Unlicense$/,
];

const IGNORED_PACKAGES = ['json-schema@0.2.3'];
const LICENSE_OVERRIDES = {
  'component-event@0.1.4': 'MIT',
  'delegate-events@1.1.1': 'MIT',
  'events-mixin@1.3.0': 'MIT',
  'sprintf@0.1.3': 'BSD-3-Clause',
  'media-type@0.3.0': 'Apache-2.0',
  'expand-template@2.0.3': 'MIT',
  'rc@1.2.8': 'MIT',
  // https://github.com/segmentio/loosely-validate-event/blob/master/LICENSE
  '@segment/loosely-validate-event@2.0.0': 'MIT',
  'jszip@3.6.0': 'MIT',
  'pako@1.0.11': 'MIT',
};

function checkOverridesArePresent() {
  const packagesToCheck = [
    ...IGNORED_PACKAGES,
    ...Object.keys(LICENSE_OVERRIDES),
  ];

  const { stdout } = spawnSync('npm', ['ls', '--json', ...packagesToCheck], {
    encoding: 'utf8',
  });

  let npmLs;
  try {
    npmLs = JSON.parse(stdout);
  } catch (e) {
    throw new Error('Failed to parse npm ls output, npm ls --failed');
  }

  const allPackages = new Set();

  const traverseDependencies = (dependencies, callback) => {
    for (const [name, dependency] of Object.entries(dependencies || {})) {
      callback(name, dependency);
      traverseDependencies(dependency.dependencies, callback);
    }
  };

  traverseDependencies(npmLs.dependencies, (name, dependency) => {
    allPackages.add(`${name}@${dependency.version}`);
  });

  for (const packageName of packagesToCheck) {
    if (!allPackages.has(packageName)) {
      throw new Error(
        `The package "${packageName}" is not installed, please remove it from IGNORED_PACKAGES or LICENSE_OVERRIDES in ${__filename}.`
      );
    }
  }
}

checkOverridesArePresent();

function getAllPackageNames() {
  const output = execSync('npx lerna ls --json', { encoding: 'utf-8' });
  const packages = JSON.parse(output);
  return packages.map((pkg) => pkg.name);
}

function isPermissiveLicense(licenseIdentifier) {
  return ALLOWED_LICENSES.some((regex) => regex.test(licenseIdentifier));
}

function resolvePackage(packageName) {
  const resolved = require.resolve(packageName);
  // this is the case of native packages that are also distributed as
  // npm packages for webpack (for example "buffer")
  if (resolved === packageName) {
    return require.resolve(packageName + '/');
  }

  return resolved;
}

function findPackageLocation(packageName) {
  try {
    const packageJsonPath = findUp.sync('package.json', {
      cwd: resolvePackage(packageName),
      allowSymlinks: false,
    });
    return path.dirname(packageJsonPath);
  } catch (err) {
    console.error(`Failed to find package.json for ${packageName}`);
    return null;
  }
}

function getProductionDeps(packageLocation) {
  const packageJsonPath = path.join(packageLocation, 'package.json');
  let dependencies = {};
  try {
    const packageJsonContents = fs.readFileSync(packageJsonPath, 'utf8');
    const packageJson = JSON.parse(packageJsonContents);
    dependencies = packageJson.dependencies || {};
  } catch (err) {
    console.error(`Failed to read package.json in ${packageLocation}`);
  }
  return Object.keys(dependencies);
}

function findAllProdDepsTreeLocations(root) {
  const allLocations = new Set();
  const visited = new Set();
  const queue = [root];

  while (queue.length > 0) {
    const packageLocation = queue.shift();
    if (visited.has(packageLocation)) {
      continue;
    }
    visited.add(packageLocation);

    const productionDeps = getProductionDeps(packageLocation);
    productionDeps.forEach((dep) => {
      try {
        const depLocation = findPackageLocation(dep);
        allLocations.add(depLocation);
        queue.push(depLocation);
      } catch (error) {
        throw new Error(
          `Error adding ${dep} from ${packageLocation}: ${error.message}`
        );
      }
    });
  }

  return Array.from(allLocations);
}

let packageNamesCache;

function createLicensePlugin({ outputFilename, includeProdPackages }) {
  return new WebpackLicensePlugin({
    outputFilename: outputFilename,
    excludedPackageTest: (packageName, version) => {
      packageNamesCache ||= getAllPackageNames();
      return (
        packageName.startsWith('@mongodb-js/') ||
        packageNamesCache.includes(packageName) ||
        IGNORED_PACKAGES.includes(`${packageName}@${version}`)
      );
    },
    licenseOverrides: LICENSE_OVERRIDES,
    unacceptableLicenseTest: (licenseIdentifier) => {
      return !isPermissiveLicense(licenseIdentifier);
    },
    // @ts-ignore
    includePackages: includeProdPackages
      ? () => findAllProdDepsTreeLocations(path.resolve(__dirname))
      : () => [],
  });
}

module.exports = { createLicensePlugin };
