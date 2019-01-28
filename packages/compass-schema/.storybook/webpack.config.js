const webpack = require('webpack');
const genDefaultConfig = require('@storybook/react/dist/server/config/defaults/webpack.config.js');

module.exports = (baseConfig, env) => {
  const GLOBALS = {
    'process.env': {
      'NODE_ENV': JSON.stringify(env)
    },
    __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || (env === 'development' ? 'true' : 'false')))
  };

  const pluginWebpackConfig = (env === 'production')
    ? require('../config/webpack.prod.config.js')
    : require('../config/webpack.dev.config.js');

  const config = genDefaultConfig(baseConfig, env);

  // Extend default storybook webpack config with our own webpack configuration
  config.module.rules = pluginWebpackConfig.module.rules;
  config.resolve = pluginWebpackConfig.resolve;
  config.plugins = config.plugins.concat([
    new webpack.DefinePlugin(GLOBALS)
  ]);

  return config;
};
