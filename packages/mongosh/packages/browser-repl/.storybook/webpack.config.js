const webpackBaseConfig = require('../config/webpack.config.base');

module.exports = ({ config }) => {
  config.module.rules = webpackBaseConfig.module.rules;
  config.resolve.extensions = webpackBaseConfig.resolve.extensions;
  config.resolve.alias = {
    ...webpackBaseConfig.resolve.alias,
    ...config.resolve.alias
  };
  config.externals = {...config.externals || {}, fs: 'none'};
  return config;
};
