const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [
    'test/**/*.test.js',
    'lib/environment.js',
    'lib/server-type.js',
    'lib/topology-type.js',
  ],
  project: ['lib/**/*.js', 'index.js', 'test/**/*.js'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck'],
};
