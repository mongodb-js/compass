const nodeExternals = require('webpack-node-externals');
const merge = require('webpack-merge');
const path = require('path');

const baseWebpackConfig = require('./webpack.base.config');

const externals = nodeExternals({
  // package node_modules
  modulesDir: path.resolve(__dirname, '..', 'node_modules'),
  // monorepo root node_modules
  additionalModuleDirs: [
    path.resolve(__dirname, '..', '..', '..', 'node_modules')
  ]
});

const config = {
  mode: 'none',
  target: 'node',
  devtool: 'source-map',
  externals: [externals],
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
