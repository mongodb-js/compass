const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [...base.entry, 'src/cli.ts', 'src/index.ts'],
  ignoreBinaries: [
    ...base.ignoreBinaries,
    'depcheck',
    'nyc',
    'tsc',
    'eslint-compass',
    'prettier-compass',
    'ditto',
  ],
};
