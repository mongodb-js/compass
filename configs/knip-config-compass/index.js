'use strict';

/** @type {import('knip').KnipConfig} */
const baseConfig = {
  // Default patterns for TypeScript packages; override or extend per-package as needed
  entry: ['src/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    // Hoisted transitive deps from @mongodb-js/mocha-config-compass; not declared directly
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages used via tsconfig, not via direct import
    '@types/chai',
    '@types/chai-dom',
    '@types/mocha',
    '@types/sinon-chai',
    // Config tools consumed by compass-scripts / tsconfig, not via direct import
    '@mongodb-js/eslint-config-compass',
    '@mongodb-js/mocha-config-compass',
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    // Used as binary in test-electron scripts, not imported
    'electron-mocha',
  ],
  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // Hoisted from monorepo root; not declared as a dep in individual packages
    'xvfb-maybe',
  ],
};

module.exports = baseConfig;
