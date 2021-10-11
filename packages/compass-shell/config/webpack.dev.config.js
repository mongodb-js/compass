const webpack = require('webpack');
const merge = require('webpack-merge');
const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const { spawn } = require('child_process');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

/** @type import('webpack').Configuration */
const config = {
  mode: 'development',
  target: 'electron-renderer',
  devtool: 'eval-source-map',
  entry: {
    index: [
      // Activate HMR for React
      'react-hot-loader/patch',
      // Bundle the client for webpack-dev-server
      // and connect to the provided endpoint
      'webpack-dev-server/client?http://0.0.0.0:8080',
      // Bundle the client for hot reloading
      // only- means to only hot reload for successful updates
      'webpack/hot/only-dev-server',
      // The entry point of our plugin for dev
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
    // Do not emit compiled assets that include errors
    new webpack.NoEmitOnErrorsPlugin(),
    // Creates HTML page for us at build time
    new HtmlWebpackPlugin()
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
  },
  resolve: {
    // Without this alias, in dev mode symlinked browser-repl breaks the code
    // by having two reacts loadeded on the page
    alias: {
      'react': require.resolve('react'),
      'react-dom': require.resolve('@hot-loader/react-dom'),
    }
  },
  externals: {
    // "Optional" mongodb dependencies that should stay out of the build in dev
    // mode
    kerberos: 'commonjs2 kerberos',
    snappy: 'commonjs2 snappy'
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
