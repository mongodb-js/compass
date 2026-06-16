/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: [
    'src/**/*.spec.{ts,tsx}',
    'src/**/*.test.{ts,tsx}',
    // Main app entry points
    'src/main/index.ts',
    'src/main/application.ts',
    'src/app/index.ts',
    // Mocha config files at package root
    '.mocharc.js',
    '.mocharc.renderer.js',
  ],

  project: ['src/**/*.{ts,tsx}', 'scripts/**/*.{ts,js}'],

  ignoreUnresolved: [
    // Platform-specific CSFLE native binary files; not JS/TS modules
    /mongo_crypt_v1/,
  ],

  ignoreDependencies: [
    // Hoisted mocha deps — available via @mongodb-js/mocha-config-compass, not declared here
    'react-16-node-hanging-test-fix',
    '@mongodb-js/mocha-config-devtools',
    // Type-only packages included via tsconfig, not via import statements
    '@types/minimatch',
    '@types/mocha',
    // Config tools, not imported directly
    '@mongodb-js/prettier-config-compass',
    '@mongodb-js/tsconfig-compass',
    '@mongodb-js/eslint-config-compass',
    // CLI used in test-electron script; not a direct import
    'electron-mocha',
    // Used as CLI in scripts
    'ts-node',
    // Webpack external — bundled into Electron app, not directly imported
    '@mongosh/node-runtime-worker-thread',
    // Bundled as native module in Electron asar, not directly imported
    'system-ca',
    // Invoked as electron-rebuild binary in scripts/electron-rebuild.js
    '@electron/rebuild',
    // Loaded at runtime via require() in optional-deps.ts
    'interruptor',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // xvfb-maybe is hoisted from root; not declared as a dep here
    'xvfb-maybe',
    // CLI tools used in scripts
    'depcheck',
    'hadron-build',
    'webpack-compass',
    'eslint-compass',
    'prettier',
    'electron',
    'tsc',
    'mongodb-sbom-tools',
  ],
};
