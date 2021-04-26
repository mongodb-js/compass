const webpackConfigBase = require('./webpack.config.base');

process.env.NODE_ENV = 'test';

module.exports = {
  ...webpackConfigBase,
  mode: 'development',
  devtool: 'eval-source-map',
  node: {
    global: true,
    crypto: 'empty',
    module: false,
    clearImmediate: false,
    setImmediate: false
  },
  externals: {
    'fs': 'none',
    'jsdom': 'window',
    'cheerio': 'window',
    'react/lib/ExecutionEnvironment': 'true',
    'react/addons': 'true',
    'react/lib/ReactContext': 'window'
  }
};
