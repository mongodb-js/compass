const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['test/**/*.test.{ts,tsx}'],
  project: [...base.project, 'test/**/*.{ts,tsx}'],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'nyc', 'tsc'],
};
