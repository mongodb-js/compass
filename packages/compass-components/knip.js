const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [...base.entry, 'src/**/*.test.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    '@emotion/css',
    '@leafygreen-ui/lib',
  ],
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck'],
};
