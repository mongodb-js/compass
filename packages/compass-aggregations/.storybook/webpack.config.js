module.exports = (storybookBaseConfig, env) => {
  const webpackConfig = require('../config/webpack.storybook.config.js');

  return {
    ...storybookBaseConfig,
    module: { rules: webpackConfig.module.rules },
    resolve: webpackConfig.resolve,
    plugins: storybookBaseConfig.plugins.concat(webpackConfig.plugins),
  };
};
