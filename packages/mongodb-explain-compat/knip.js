const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['test/**/*.js'],
  project: ['lib/**/*.js', 'test/**/*.js'],
  ignoreDependencies: [...base.ignoreDependencies, 'mocha'],
  ignoreBinaries: [
    ...base.ignoreBinaries,
    'depcheck',
    'nyc',
    'gen-esm-wrapper',
  ],
};
