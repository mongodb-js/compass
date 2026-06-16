/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
  project: ['src/**/*.ts'],
  ignoreDependencies: [
    // hoisted mocha deps
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // mocha config, not imported
    '@mongodb-js/mocha-config-compass',
    // config tools, not imported
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
  ],
  ignoreBinaries: ['compass-scripts', 'depcheck', 'nyc', 'tsc'],
};
