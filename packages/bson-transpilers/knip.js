const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['test/**/*.test.js', 'lib/antlr/*.js'],
  project: ['**/*.js', '!test/**', '!node_modules/**'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'java'],
};
