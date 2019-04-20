const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const ExtractTextPlugin = require('extract-text-webpack-plugin');
const PeerDepsExternalsPlugin = require('peer-deps-externals-webpack-plugin');
// const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const GLOBALS = {
  __DEV__: JSON.stringify(JSON.parse(process.env.DEBUG || 'false'))
};

const config = {
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
    library: 'FieldStorePlugin',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{
          loader: 'file-loader',
          // In prod we need to go to $COMPASS_HOME/node_modules/<plugin>/lib or
          // $USER_HOME/.mongodb/compasss(-community)/plugins
          //
          // @note This currently does not work in published plugin.
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
          // In prod we need to go to $COMPASS_HOME/node_modules/<plugin>/lib or
          // $USER_HOME/.mongodb/compasss(-community)/plugins
          //
          // @note This currently does not work in published plugin.
          query: {
            name: 'assets/images/[name]__[hash:base64:5].[ext]',
            publicPath: function(file) {
              return path.join(__dirname, '..', 'lib', file);
            }
          }
        }]
      }
    ]
  },
  optimization: {
    // Minimize and uglify the code
    minimize: true
  },
  plugins: [
    // Auto-create webpack externals for any dependency listed as a peerDependency in package.json
    // so that the external vendor JavaScript is not part of our compiled bundle
    new PeerDepsExternalsPlugin(),

    // Do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin(),

    // Configure Extract Plugin for dependent global styles into a single CSS file
    new ExtractTextPlugin({
      filename: 'assets/css/index.css',
      allChunks: true,
      ignoreOrder: true // When using CSS modules import order of CSS no longer needs to be preserved
    }),

    // Defines global variables
    new webpack.DefinePlugin(GLOBALS),

    // Creates HTML page for us at build time
    new HtmlWebpackPlugin()

    // Uncomment to Analyze the output bundle size of the plugin. Useful for optimizing the build.
    // new BundleAnalyzerPlugin()
  ],
  stats: {
    colors: true,
    children: false,
    chunks: false,
    modules: false
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
