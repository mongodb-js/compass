const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const config = {
  mode: 'development',
  target: 'electron-renderer',
  devtool: 'source-map',
  watch: true,
  entry: {
    // Export the entry to our plugin. Referenced in package.json main.
    index: path.resolve(project.path.src, 'index.js')
  },
  output: {
    path: project.path.output,
    publicPath: '/',
    filename: '[name].js',
    // Export our plugin as a UMD library (compatible with all module definitions - CommonJS, AMD and global variable)
    library: 'AggregationsPlugin',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{
          loader: 'file-loader',
          query: {
            name: 'assets/images/[name]__[hash:base64:5].[ext]',
            publicPath: function(file) {
              return path.join(__dirname, '..', 'lib', file);
            }
          }
        }]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'file-loader',
          query: {
            name: 'assets/fonts/[name]__[hash:base64:5].[ext]',
            publicPath: function(file) {
              return path.join(__dirname, '..', 'lib', file);
            }
          }
        }]
      }
    ]
  },
  plugins: [
    // Auto-create webpack externals for any dependency listed as a peerDependency in package.json
    // so that the external vendor JavaScript is not part of our compiled bundle
    new PeerDepsExternalsPlugin(),

    // Do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin()
  ],
  stats: {
    colors: true,
    children: false,
    chunks: false,
    modules: false
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
