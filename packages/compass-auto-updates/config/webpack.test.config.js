const nodeExternals = require('webpack-node-externals');
const merge = require('webpack-merge');

const baseWebpackConfig = require('./webpack.base.config');
const project = require('./project');

const config = {
  target: 'node', // webpack should compile node compatible code for tests
  externals: [ nodeExternals() ],
  stats: {
    warnings: false
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)/,
        enforce: 'post', // Enforce as a post step so babel can do its compilation prior to instrumenting code
        exclude: [
          /node_modules/,
          /constants/,
          /.*?(?=\.spec).*?\.js/
        ],
        include: project.path.src,
        use: {
          loader: 'istanbul-instrumenter-loader',
          options: {
            esModules: true
          }
        }
      },
      {
        test: /\.(png|jpg|jpeg|gif|svg)$/,
        use: [{ loader: 'ignore-loader' }]
      },
      {
        test: /\.(woff|woff2|ttf|eot)(\?v=\d+\.\d+\.\d+)?$/,
        use: [{ loader: 'ignore-loader' }]
      }
    ]
  }
};

module.exports = merge.smart(baseWebpackConfig, config);
