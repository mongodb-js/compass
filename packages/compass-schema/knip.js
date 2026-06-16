const base = require('@mongodb-js/knip-config-compass');
/** @type {import('knip').KnipConfig} */
module.exports = {
  ...base,
  entry: ['src/**/*.spec.{ts,tsx}'],
  project: ['src/**/*.{ts,tsx,jsx}', 'test/**/*.{ts,tsx}'],
  ignoreDependencies: [
    ...base.ignoreDependencies,
    '@types/react',
    '@types/react-dom',
    '@types/leaflet-draw',
  ],
};
