const path = require('path');
const project = require('./project');

module.exports = {
  stats: 'errors-only',
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', '.wasm'],
    alias: {
      actions: path.join(project.path.src, 'actions'),
      components: path.join(project.path.src, 'components'),
      constants: path.join(project.path.src, 'constants'),
      fonts: path.join(project.path.src, 'assets/fonts'),
      images: path.join(project.path.src, 'assets/images'),
      models: path.join(project.path.src, 'models'),
      modules: path.join(project.path.src, 'modules'),
      plugin: path.join(project.path.src, 'index.js'),
      stores: path.join(project.path.src, 'stores'),
      utils: path.join(project.path.src, 'utils'),
      'react-dom': '@hot-loader/react-dom'
    }
  },
  module: {
    rules: [
      { // For native modules to be able to be loaded.
        test: /\.node$/,
        use: 'node-loader'
      }, {
        test: /node_modules[\\\/]JSONStream[\\\/]index\.js/,
        use: [{ loader: 'shebang-loader' }]
      }, {
        test: /\.(js|jsx)$/,
        use: [{
          loader: 'babel-loader',
          options: {
            root: path.resolve(__dirname, '..'),
            cacheDirectory: !process.env.CI
          }
        }],
        exclude: /(node_modules)/
      }
    ]
  },
  externals: {
    // Runtime implementation depends on worker file existing near the library
    // main import and for that reason it needs to stay external to the
    // compass-shell
    '@mongosh/node-runtime-worker-thread': 'commonjs2 @mongosh/node-runtime-worker-thread',
  },
  node: false
};
