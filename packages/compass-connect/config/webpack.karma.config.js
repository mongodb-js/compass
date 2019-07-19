const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.config');

const config = {
  mode: 'none',
  target: 'electron-renderer', // Webpack should compile node compatible code for tests
  devtool: 'eval-source-map',
  stats: 'errors-only',
  externals: {
    'jsdom': 'window',
    'cheerio': 'window',
    'react/addons': 'react',
    'react/lib/ExecutionEnvironment': 'react',
    'react/lib/ReactContext': 'react',
    'react-addons-test-utils': 'react-dom'
  },
  resolve: {
    alias: {
      sinon: require.resolve('sinon/pkg/sinon')
    }
  },
  module: {
    noParse: [
      /node_modules\/sinon\//
    ],
    rules: [
      { test: /\.(png|jpg|jpeg|gif|svg)$/, use: [{ loader: 'ignore-loader' }] },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{ loader: 'ignore-loader' }]
      }
    ]
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
