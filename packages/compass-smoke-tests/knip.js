const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx}'],
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
