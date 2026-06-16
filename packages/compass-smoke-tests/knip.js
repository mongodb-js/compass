const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  ignoreDependencies: [...base.ignoreDependencies, 'compass-e2e-tests'],
  ignoreBinaries: [
    ...base.ignoreBinaries,
    'ts-node',
    'apt',
    'rpm',
    'dnf',
    'reg',
  ],
};
