const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.ts'],
  project: ['src/**/*.ts'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'nyc'],
};
