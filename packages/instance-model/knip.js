/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: [
    'test/**/*.test.js',
    'lib/environment.js',
    'lib/server-type.js',
    'lib/topology-type.js',
  ],

  project: ['lib/**/*.js', 'index.js', 'test/**/*.js'],

  ignoreDependencies: [
    // Config tools, not imported directly
    '@mongodb-js/eslint-config-compass',
    '@mongodb-js/prettier-config-compass',
  ],

  ignoreBinaries: [
    // Monorepo-level CLI from configs/compass-scripts; not declared as a dep here
    'compass-scripts',
    // CLI tools used in scripts
    'depcheck',
  ],
};
