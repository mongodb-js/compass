const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  ignoreDependencies: [...base.ignoreDependencies, 'sinon'],
  ignoreBinaries: [...base.ignoreBinaries, 'gen-esm-wrapper', 'nyc'],
};
