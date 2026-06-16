const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: [...base.entry, 'src/**/*.test.{ts,tsx}', 'test/**/*.{ts}'],
  project: [...base.project, 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [...base.ignoreDependencies, 'sinon'],
};
