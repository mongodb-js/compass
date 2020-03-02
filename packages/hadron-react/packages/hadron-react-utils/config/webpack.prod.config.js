const merge = require('webpack-merge');
const path = require('path');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const baseWebpackConfig = require('../../../config/webpack.base.config');

const config = {
  mode: 'production',
  target: 'electron-renderer',
  devtool: false,
  entry: {
    index: path.join(__dirname, '..', 'src')
  },
  output: {
    path: path.join(__dirname, '..', 'lib'),
    publicPath: './',
    filename: 'index.js',
    library: 'hadron-react-utils',
    libraryTarget: 'umd'
  },
  plugins: [
    new PeerDepsExternalsPlugin()
  ],
};

module.exports = merge.smart(baseWebpackConfig, config);
