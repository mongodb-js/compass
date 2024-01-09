/*
 * Generate the `Packages Overview` section of the monorepo README.
 * Uses the `description` from the `package.json` of the packages in the monorepo.
 *
 * Prints to standard out, with the intention of copy pasting into the readme file.
 */
const path = require('path');

const { getPackages } = require('@mongodb-js/monorepo-tools');

const rootDir = path.resolve(__dirname, '..');

// From packages/compass/src/app/plugins/default.js
const pluginNames = [
  '@mongodb-js/compass-app-stores',
  '@mongodb-js/compass-aggregations',
  '@mongodb-js/compass-export-to-language',
  '@mongodb-js/compass-collection',
  '@mongodb-js/compass-crud',
  '@mongodb-js/compass-databases-collections',
  '@mongodb-js/compass-field-store',
  '@mongodb-js/compass-find-in-page',
  '@mongodb-js/compass-home',
  '@mongodb-js/compass-import-export',
  '@mongodb-js/compass-query-bar',
  '@mongodb-js/compass-schema',
  '@mongodb-js/compass-schema-validation',
  '@mongodb-js/compass-serverstats',
  '@mongodb-js/compass-shell',
  '@mongodb-js/compass-sidebar',
  '@mongodb-js/compass-indexes',
  '@mongodb-js/compass-explain-plan',
  '@mongodb-js/compass-saved-aggregations-queries',
];

function printPackageDescriptionLine(
  packageName,
  packageRelativePath,
  packageDescription
) {
  console.log(
    `- [**${packageName}**](${packageRelativePath}): ${packageDescription}`
  );
}

async function main() {
  console.log('\n## Packages Overview\n');

  const packages = await getPackages();

  const packageInfos = [];
  for (const { location } of packages) {
    const packageJson = require(path.join(location, 'package.json'));

    const packageRelativePath = location.substring(rootDir.length + 1);

    // Main Compass package
    if (packageRelativePath === 'packages/compass') {
      printPackageDescriptionLine(
        packageJson.name,
        packageRelativePath,
        packageJson.description
      );
      continue;
    }

    packageInfos.push({
      name: packageJson.name,
      relativePath: packageRelativePath,
      description: packageJson.description,
    });
  }

  // Alphabetize
  packageInfos.sort((a, b) => a.name.localeCompare(b.name));

  console.log('\n### Compass Plugins\n');
  for (const { name, relativePath, description } of packageInfos) {
    if (
      relativePath.startsWith('packages/') &&
      pluginNames.includes(name) &&
      relativePath !== 'packages/compass'
    ) {
      printPackageDescriptionLine(name, relativePath, description);
    }
  }

  console.log('\n### Shared Libraries and Build Tools\n');
  for (const { name, relativePath, description } of packageInfos) {
    if (relativePath.startsWith('packages/') && !pluginNames.includes(name)) {
      printPackageDescriptionLine(name, relativePath, description);
    }
  }

  console.log('\n### Shared Configuration Files\n');
  for (const { name, relativePath, description } of packageInfos) {
    if (relativePath.startsWith('configs/')) {
      printPackageDescriptionLine(name, relativePath, description);
    }
  }
  console.log('');
}

process.on('unhandledRejection', (err) => {
  console.error();
  console.error(err.stack || err.message || err);
  process.exitCode = 1;
});

main();
