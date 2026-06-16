/** @type {import('knip').KnipConfig} */
module.exports = {
  entry: ['test/**/*.test.js', 'lib/antlr/*.js'],
  project: ['**/*.js', '!test/**', '!node_modules/**'],
  ignoreDependencies: [
    // config tool, not imported
    '@mongodb-js/eslint-config-compass',
  ],
  ignoreBinaries: ['compass-scripts', 'depcheck', 'java'],
};
