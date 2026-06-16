const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.ts'],
  project: ['src/**/*.ts'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    '@types/lodash',
    '@types/whatwg-url',
  ],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'nyc'],
};
