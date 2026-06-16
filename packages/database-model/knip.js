const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['test/**/*.test.js'],
  project: ['lib/**/*.js', 'index.js', 'test/**/*.js'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck'],
};
