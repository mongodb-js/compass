const nodeExternals = require('webpack-node-externals');
const merge = require('webpack-merge');

const baseWebpackConfig = require('../../../config/webpack.base.config');

const config = {
  mode: 'none',
  target: 'node',
  devtool: 'source-map',
  externals: [ nodeExternals() ],
  stats: {
    warnings: false
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{ loader: 'ignore-loader' }]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{ loader: 'ignore-loader' }]
      }
    ]
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
