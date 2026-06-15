/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: [
    // Spec patterns from .mocharc.js / @mongodb-js/mocha-config-compass — listed
    // explicitly because knip's mocha plugin can't evaluate the dynamic require
    // chain in .mocharc.js when --config is passed.
    'src/**/*.spec.{ts,tsx}',
    'tests/**/*.spec.{ts,tsx}',
    // e2e tests use .test.ts extension
    'tests/**/*.test.{ts,tsx}',
  ],

  project: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  ignoreDependencies: [
    // Hoisted mocha deps — available via @mongodb-js/mocha-config-compass, not declared here
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages included via tsconfig, not via import statements
    '@types/chai-dom',
    '@types/mocha',
    '@types/sinon-chai',

    // electron is a peer dep of electron-mocha, not imported directly
    'electron',
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    'ps-list',
    'puppeteer-core',
    // e2e test deps used indirectly via webdriverio config, dynamic imports, or at runtime
    '@electron/rebuild',
    '@mongodb-js/compass-components',
    '@mongodb-js/compass-generative-ai',
    '@mongodb-js/compass-test-server',
    '@mongodb-js/connection-info',
    '@mongodb-js/oidc-mock-provider',
    '@types/chai-as-promised',
    '@types/cross-spawn',
    '@types/yargs',
    'bson',
    'chai',
    'chai-as-promised',
    'clipboardy',
    'compass-preferences-model',
    'cross-spawn',
    'debug',
    'electron-to-chromium',
    'glob',
    'globals',
    'hadron-build',
    'jszip',
    'lodash',
    'mocha',
    'mongodb',
    'mongodb-build-info',
    'mongodb-connection-string-url',
    'mongodb-log-writer',
    'mongodb-ns',
    'node-fetch',
    'resolve-mongodb-srv',
    'semver',
    'tesseract.js',
    'tree-kill',
    'webdriverio',
    'why-is-node-running',
    'yargs',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // xvfb-maybe is hoisted from root; not declared as a dep here
    'xvfb-maybe',
    // tsc hoisted from root
    'tsc',
  ],
};
