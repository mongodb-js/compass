/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts is inferred from compass:exports in package.json.
  entry: [
    // Spec patterns from .mocharc.js / @mongodb-js/mocha-config-compass — listed
    // explicitly because knip's mocha plugin can't evaluate the dynamic require
    // chain in .mocharc.js when --config is passed.
    'src/**/*.spec.{ts,tsx}',
    'src/index.tsx',
    'test/**/*.test-d.{ts,tsx}',
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
    // tsd used in test/types/index.test-d.ts but not declared in package.json
    'tsd',

    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    '@types/chai',
    'sinon',
    '@types/react',
    '@types/react-dom',
    '@types/express-http-proxy',
    'buffer',
    'events',
    'process',
    'util',
    '@mongodb-js/devtools-proxy-support',
    'mongodb',
    'bson',
    // Browser polyfills used via webpack config aliases, not direct imports
    'aws-sdk',
    'browser-process-hrtime',
    'crypto-browserify',
    'debug',
    'dns-query',
    'is-ip',
    'mongodb-mcp-server',
    'os-browserify',
    'path-browserify',
    'readable-stream',
    'timers-browserify',
    'vm-browserify',
    'whatwg-url',
    'ws',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // tsc hoisted from root
    'tsc',
  ],
};
