/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: ['src/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    // hoisted mocha deps
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // mocha config, not imported
    '@mongodb-js/mocha-config-compass',
    // config tools, not imported
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    // type-only
    '@types/chai',
    '@types/chai-dom',
    '@types/mocha',
    '@types/sinon-chai',
    // Used as binary in test-electron script, not imported
    'electron-mocha',
  ],
  ignoreBinaries: ['compass-scripts', 'depcheck', 'nyc', 'tsc', 'xvfb-maybe'],
};
