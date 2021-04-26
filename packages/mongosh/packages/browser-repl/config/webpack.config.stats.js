const WebpackVisualizerPlugin = require('webpack-visualizer-plugin');
const webpackConfigProd = require('./webpack.config.prod');

module.exports = {
  ...webpackConfigProd,
  plugins: [
    new WebpackVisualizerPlugin()
  ]
};
