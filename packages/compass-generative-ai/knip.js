/** @type {import('knip').KnipConfig} */
module.exports = {
  // src/index.ts and src/provider.tsx are inferred from compass:exports in package.json.
  entry: [
    // Spec patterns from .mocharc.js / @mongodb-js/mocha-config-compass — listed
    // explicitly because knip's mocha plugin can't evaluate the dynamic require
    // chain in .mocharc.js when --config is passed.
    'src/**/*.spec.{ts,tsx}',
    'tests/**/*.spec.{ts,tsx}',
    // Braintrust eval entry points — not auto-detected (no knip plugin for braintrust).
    'tests/evals/gen-ai.eval.ts',
    'tests/evals/mock-data.eval.ts',
  ],

  project: ['src/**/*.{ts,tsx}', 'tests/**/*.{ts,tsx}'],

  ignoreDependencies: [
    // CLI used in test-electron script; not a direct import
    'electron-mocha',
    // Hoisted mocha deps — available via @mongodb-js/mocha-config-compass, not declared here
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages included via tsconfig, not via import statements
    '@types/chai-dom',
    '@types/mocha',
    '@types/sinon-chai',
    // Used in electron mocha tests via dynamic require, not statically imported
    'p-queue',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
  ],
};
