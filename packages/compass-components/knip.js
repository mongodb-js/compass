const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    '@emotion/css',
    '@leafygreen-ui/lib',
  ],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck'],
};
