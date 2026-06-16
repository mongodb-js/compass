const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [...base.entry, 'src/**/*.test.{ts,tsx}'],
  project: [...base.project, 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    'sinon',
    '@types/react',
    '@types/react-dom',
  ],
};
