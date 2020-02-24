module.exports = (storybookBaseConfig, env) => {
  const webpackConfig = require('../config/webpack.storybook.config.js');
  return {
    ...storybookBaseConfig.config,
    module: { rules: webpackConfig.module.rules },
    resolve: webpackConfig.resolve,
    plugins: storybookBaseConfig.config.plugins.concat(webpackConfig.plugins),
  };
};
