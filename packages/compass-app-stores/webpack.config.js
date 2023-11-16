const path = require('path');
const {
  compassPluginConfig,
  createWebConfig,
} = require('@mongodb-js/webpack-config-compass');

module.exports = (env, args) => {
  return [
    ...compassPluginConfig(env, args),
    createWebConfig({
      entry: path.resolve(__dirname, 'src', 'provider.ts'),
      library: 'CompassAppStoresProvider',
    }),
  ];
};
