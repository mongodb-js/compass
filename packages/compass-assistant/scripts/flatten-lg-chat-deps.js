#!/usr/bin/env node
/* eslint-disable no-console */

const fs = require('fs');
const path = require('path');

const VENDOR_DIR = path.join(
  __dirname,
  '..',
  'packages',
  'compass-assistant',
  'src',
  'vendor',
  '@lg-chat'
);
const OUTPUT_FILE = path.join(
  __dirname,
  '..',
  'packages',
  'compass-assistant',
  'src',
  'vendor',
  'lg-chat-vendor-package.json'
);

function flattenDependencies() {
  console.log('Flattening @lg-chat dependencies...');

  const allDependencies = {};
  const allPeerDependencies = {};
  const packageNames = [];

  // Read all @lg-chat package.json files
  const lgChatDirs = fs
    .readdirSync(VENDOR_DIR, { withFileTypes: true })
    .filter((dirent) => dirent.isDirectory())
    .map((dirent) => dirent.name);

  console.log(`Found ${lgChatDirs.length} @lg-chat packages:`, lgChatDirs);

  lgChatDirs.forEach((dirName) => {
    const packageJsonPath = path.join(VENDOR_DIR, dirName, 'package.json');

    if (fs.existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(
          fs.readFileSync(packageJsonPath, 'utf8')
        );
        console.log(`Processing ${packageJson.name || dirName}...`);

        packageNames.push(packageJson.name || `@lg-chat/${dirName}`);

        // Merge production dependencies
        if (packageJson.dependencies) {
          Object.entries(packageJson.dependencies).forEach(([dep, version]) => {
            // Skip workspace dependencies and internal @lg-chat dependencies
            if (
              !version.startsWith('workspace:') &&
              !dep.startsWith('@lg-chat/')
            ) {
              if (allDependencies[dep] && allDependencies[dep] !== version) {
                console.warn(
                  `Version conflict for ${dep}: ${allDependencies[dep]} vs ${version}`
                );
                // Use the higher version number or keep existing if unable to determine
                allDependencies[dep] = version;
              } else {
                allDependencies[dep] = version;
              }
            }
          });
        }

        // Merge peer dependencies
        if (packageJson.peerDependencies) {
          Object.entries(packageJson.peerDependencies).forEach(
            ([dep, version]) => {
              // Skip workspace dependencies and internal @lg-chat dependencies
              if (
                !version.startsWith('workspace:') &&
                !dep.startsWith('@lg-chat/')
              ) {
                if (
                  allPeerDependencies[dep] &&
                  allPeerDependencies[dep] !== version
                ) {
                  console.warn(
                    `Peer dependency version conflict for ${dep}: ${allPeerDependencies[dep]} vs ${version}`
                  );
                  allPeerDependencies[dep] = version;
                } else {
                  allPeerDependencies[dep] = version;
                }
              }
            }
          );
        }
      } catch (error) {
        console.error(`Error processing ${packageJsonPath}:`, error.message);
      }
    } else {
      console.warn(
        `No package.json found in ${path.join(VENDOR_DIR, dirName)}`
      );
    }
  });

  // Create the flattened package.json
  const flattenedPackage = {
    name: '@lg-chat/vendor-flattened',
    version: '1.0.0',
    description: 'Flattened dependencies from all @lg-chat vendor packages',
    private: true,
    dependencies: allDependencies,
    peerDependencies: allPeerDependencies,
    _meta: {
      generated: new Date().toISOString(),
      sourcePackages: packageNames,
      script: 'scripts/flatten-lg-chat-dependencies.js',
    },
  };

  // Write the flattened package.json
  fs.writeFileSync(OUTPUT_FILE, JSON.stringify(flattenedPackage, null, 2));

  console.log('\n=== Summary ===');
  console.log(`Processed ${packageNames.length} packages`);
  console.log(
    `Found ${Object.keys(allDependencies).length} unique dependencies`
  );
  console.log(
    `Found ${Object.keys(allPeerDependencies).length} unique peer dependencies`
  );
  console.log(`Output written to: ${OUTPUT_FILE}`);

  console.log('\n=== Dependencies ===');
  Object.entries(allDependencies).forEach(([dep, version]) => {
    console.log(`  ${dep}: ${version}`);
  });

  if (Object.keys(allPeerDependencies).length > 0) {
    console.log('\n=== Peer Dependencies ===');
    Object.entries(allPeerDependencies).forEach(([dep, version]) => {
      console.log(`  ${dep}: ${version}`);
    });
  }
}

if (require.main === module) {
  flattenDependencies();
}

module.exports = { flattenDependencies };
