/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: ['src/**/*.spec.{ts,tsx}'],

  project: ['src/**/*.{ts,tsx}'],

  ignoreDependencies: [
    // Hoisted mocha deps — available via @mongodb-js/mocha-config-compass, not declared here
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages included via tsconfig, not via import statements
    '@types/chai',
    '@types/mocha',
    '@types/sinon-chai',
    // Config tools, not imported directly
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    '@mongodb-js/eslint-config-compass',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // CLI tools used in scripts
    'depcheck',
    'nyc',
    'tsc',
  ],
};
