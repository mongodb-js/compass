const webpack = require('webpack');
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js');

module.exports = (baseConfig, env) => {
  const pluginWebpackConfig = (env === 'production')
    ? require('../config/webpack.prod.config.js')
    : require('../config/webpack.dev.config.js');
  const config = genDefaultConfig(baseConfig, env);

  // Extend default storybook webpack config with our own webpack configuration
  config.module.rules = pluginWebpackConfig.module.rules;
  config.resolve = pluginWebpackConfig.resolve;

  return config;
};
