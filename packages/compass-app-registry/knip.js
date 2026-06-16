const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [...base.ignoreDependencies, 'sinon'],
  ignoreBinaries: [...base.ignoreBinaries, 'gen-esm-wrapper', 'nyc'],
};
