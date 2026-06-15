/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: [
    // Spec patterns from .mocharc.js / @mongodb-js/mocha-config-compass — listed
    // explicitly because knip's mocha plugin can't evaluate the dynamic require
    // chain in .mocharc.js when --config is passed.
    'src/**/*.spec.{ts,tsx}',
  ],

  project: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],

  ignoreDependencies: [
    // Hoisted mocha deps — available via @mongodb-js/mocha-config-compass, not declared here
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages included via tsconfig, not via import statements
    '@types/chai-dom',
    '@types/mocha',
    '@types/sinon-chai',
    // Used via tsconfig.json "extends", not a direct import
    '@mongodb-js/tsconfig-compass',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // Build tools hoisted from root / configs packages
    'gen-esm-wrapper',
    'prettier-compass',
    'tsc',
  ],
};
