const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}', 'src/**/*.test.{ts,tsx}', 'test/**/*.{ts}'],
  project: ['src/**/*.{ts,tsx}', 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [...base.ignoreDependencies, 'sinon'],
};
