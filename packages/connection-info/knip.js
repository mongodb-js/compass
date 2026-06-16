/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: ['src/**/*.spec.ts'],
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
    // type-only
    '@types/chai',
    '@types/mocha',
    '@types/sinon-chai',
  ],
  ignoreBinaries: ['compass-scripts', 'depcheck', 'gen-esm-wrapper', 'nyc'],
};
