const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [
    'src/**/*.spec.{ts,tsx}',
    'src/connection-info-provider.tsx',
    'src/stores/connections-store-redux.ts',
  ],
  project: ['src/**/*.{ts,tsx}'],
  ignoreDependencies: [...base.ignoreDependencies, '@types/react-dom'],
  ignoreBinaries: [...base.ignoreBinaries, 'tsc'],
};
