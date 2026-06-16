const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  ignoreDependencies: [...base.ignoreDependencies, 'electron'],
};
