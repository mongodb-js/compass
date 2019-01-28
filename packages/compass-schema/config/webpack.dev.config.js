const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const GLOBALS = {
  'process.env': {
    'NODE_ENV': JSON.stringify('development')
  },
  __DEV__: JSON.stringify(JSON.parse('true'))
};

const config = {
  target: 'electron-renderer',
  devtool: 'eval-source-map',
  entry: {
    index: [
      // activate HMR for React
      'react-hot-loader/patch',

      // bundle the client for webpack-dev-server
      // and connect to the provided endpoint
      'webpack-dev-server/client?http://0.0.0.0:8080',

      // bundle the client for hot reloading
      // only- means to only hot reload for successful updates
      'webpack/hot/only-dev-server',

      // the entry point of our plugin for dev
      path.resolve(project.path.electron, 'renderer/index.js')
    ]
  },
  output: {
    path: project.path.output,
    publicPath: '/',
    filename: '[name].js'
  },
  module: {
    rules: [
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{
          loader: 'url-loader',
          query: {
            limit: 8192,
            name: 'assets/images/[name]__[hash:base64:5].[ext]'
          }
        }]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{
          loader: 'url-loader',
          query: {
            limit: 8192,
            name: 'assets/fonts/[name]__[hash:base64:5].[ext]'
          }
        }]
      }
    ]
  },
  plugins: [
    // Enable HMR globally
    new webpack.HotModuleReplacementPlugin(),

    // Prints more readable module names in the browser console on HMR updates
    new webpack.NamedModulesPlugin(),

    // Do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin(),

    // Creates HTML page for us at build time
    new HtmlWebpackPlugin(),

    // Defines global variables
    new webpack.DefinePlugin(GLOBALS)
  ],
  devServer: {
    host: '0.0.0.0',
    hot: true,
    contentBase: project.path.output,
    stats: {
      colors: true,
      chunks: false,
      children: false
    },
    before() {
      spawn('electron', [project.path.electron], { shell: true, env: process.env, stdio: 'inherit' })
        .on('close', () => process.exit(0))
        .on('error', spawnError => console.error(spawnError)); // eslint-disable-line no-console
    }
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
