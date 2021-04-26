const path = require('path');
const webpackConfigBase = require('./webpack.config.base');
const package = require('../package.json');

const libraryName = 'mongosh-browser-repl';

module.exports = {
  ...webpackConfigBase,
  mode: 'production',
  devtool: 'source-map',
  target: 'web',
  entry: path.resolve(__dirname, '..', 'src', 'index.tsx'),
  output: {
    filename: `${libraryName}.js`,
    library: libraryName,
    libraryTarget: 'commonjs2',
    path: path.resolve(__dirname, '..', 'lib'),
    umdNamedDefine: true
  },
  externals: [...Object.keys(package.peerDependencies), 'vm', 'fs']
};
