const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const config = {
  mode: 'production',
  target: 'electron-renderer',
  devtool: false,
  entry: {
    // Export the entry to our plugin. Referenced in package.json main.
    index: path.resolve(project.path.src, 'index.js')
  },
  output: {
    path: project.path.output,
    publicPath: './',
    filename: '[name].js',
    // Export our plugin as a UMD library (compatible with all module definitions - CommonJS, AMD and global variable)
    library: 'AggregationsPlugin',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 500000
            }
          }
        ]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [
          {
            loader: 'url-loader',
            options: {
              limit: 500000
            }
          }
        ]
      }
    ]
  },
  plugins: [
    // Auto-create webpack externals for any dependency listed as a peerDependency in package.json
    // so that the external vendor JavaScript is not part of our compiled bundle
    new PeerDepsExternalsPlugin(),

    // Configure Extract Plugin for dependent global styles into a single CSS file
    new ExtractTextPlugin({
      filename: 'assets/css/index.css',
      allChunks: true,
      ignoreOrder: true // When using CSS modules import order of CSS no longer needs to be preserved
    }),
    // Creates HTML page for us at build time
    new HtmlWebpackPlugin()
  ],
  stats: {
    colors: true,
    children: false,
    chunks: false,
    modules: false
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
