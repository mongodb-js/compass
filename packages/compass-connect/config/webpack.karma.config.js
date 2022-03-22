const merge = require('webpack-merge');
const baseWebpackConfig = require('./webpack.base.config');

const config = {
  mode: 'none',
  target: 'electron-renderer', // Webpack should compile node compatible code for tests
  devtool: 'eval-source-map',
  stats: 'errors-only',
  externals: {
    'jsdom': 'window',
    'react/addons': 'react',
    'react/lib/ExecutionEnvironment': 'react',
    'react/lib/ReactContext': 'react',
    'react-addons-test-utils': 'react-dom',
    'os-dns-native': 'commonjs2 os-dns-native',
    'system-ca': 'commonjs2 system-ca',
    'win-export-certificate-and-key': 'commonjs2 win-export-certificate-and-key',
    'macos-export-certificate-and-key': 'commonjs2 macos-export-certificate-and-key'
  },
  module: {
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
