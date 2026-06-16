const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [...base.entry, 'test/**/*.spec.{ts,tsx}'],
  project: [...base.project, 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    'sinon',
    '@types/react',
    '@types/react-dom',
  ],
  ignoreBinaries: [...base.ignoreBinaries, 'ts-node', 'tsx'],
};
