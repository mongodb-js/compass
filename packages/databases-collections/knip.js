/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: ['src/**/*.spec.{ts,tsx,js,jsx}'],
  project: ['src/**/*.{ts,tsx,js,jsx}'],
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
  ignoreBinaries: ['compass-scripts', 'depcheck', 'nyc'],
};
