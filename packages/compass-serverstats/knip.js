const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}', 'test/**/*.test.{ts,tsx,jsx}'],
  project: ['src/**/*.{ts,tsx,jsx}', 'test/**/*.{ts,tsx,jsx}'],
  ignoreDependencies: [...base.ignoreDependencies, 'react-dom'],
};
