const merge = require('webpack-merge');
const path = require('path');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const baseWebpackConfig = require('./webpack.base.config');

const config = {
  mode: 'production',
  target: 'web',
  devtool: false,
  entry: {
    index: path.join(__dirname, '..', 'src')
  },
  output: {
    path: path.join(__dirname, '..', 'lib'),
    publicPath: './',
    filename: 'index.js',
    library: 'hadron-react-components',
    libraryTarget: 'umd',
    globalObject: 'this'
  },
  plugins: [
    new PeerDepsExternalsPlugin()
  ],
};

module.exports = merge.smart(baseWebpackConfig, config);
