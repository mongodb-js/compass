const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [
    ...base.entry,
    'src/connection-info-provider.tsx',
    'src/stores/connections-store-redux.ts',
  ],
  ignoreDependencies: [...base.ignoreDependencies, '@types/react-dom'],
  ignoreBinaries: [...base.ignoreBinaries, 'tsc'],
};
