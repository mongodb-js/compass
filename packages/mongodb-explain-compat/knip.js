/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: ['test/**/*.js'],

  project: ['lib/**/*.js', 'test/**/*.js'],

  ignoreDependencies: [
    // Config tools, not imported directly
    '@mongodb-js/eslint-config-compass',
    // Used as binary in test script, not imported
    'mocha',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // CLI tools used in scripts
    'depcheck',
    'nyc',
    'gen-esm-wrapper',
  ],
};
