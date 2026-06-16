const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['test/**/*.test.ts', 'test/**/*.spec.ts'],
  project: ['src/**/*.ts'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'nyc', 'tsc'],
};
