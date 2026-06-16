const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}', 'src/cli.ts', 'src/index.ts'],
  project: ['src/**/*.{ts,tsx}'],
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
