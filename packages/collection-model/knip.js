/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: ['test/**/*.test.js', 'lib/model.js'],

  project: ['lib/**/*.js', 'index.js', 'test/**/*.js'],

  ignoreDependencies: [
    // Config tools, not imported directly
    '@mongodb-js/eslint-config-compass',
    '@mongodb-js/prettier-config-compass',
    // Used as binary in test-electron script, not imported
    'electron-mocha',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // xvfb-maybe is hoisted from root; not declared as a dep here
    'xvfb-maybe',
    // CLI tools used in scripts
    'depcheck',
  ],
};
