const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}', 'test/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    'sinon',
    '@types/react',
    '@types/react-dom',
  ],
  ignoreBinaries: [...base.ignoreBinaries, 'ts-node', 'tsx'],
};
