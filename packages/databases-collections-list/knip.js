const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  ignoreBinaries: [...base.ignoreBinaries, 'depcheck', 'nyc'],
};
