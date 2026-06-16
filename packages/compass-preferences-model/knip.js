const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  project: [...base.project, 'test/**/*.{ts,tsx}'],
  ignoreBinaries: [
    ...base.ignoreBinaries,
    'gen-esm-wrapper',
    'prettier-compass',
    'tsc',
  ],
};
