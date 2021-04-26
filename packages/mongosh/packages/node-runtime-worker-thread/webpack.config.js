const path = require('path');
const TerserPlugin = require('terser-webpack-plugin');

/** @type import('webpack').Configuration */
const config = {
  target: 'node',

  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: '[name].js',
    libraryTarget: 'umd'
  },

  module: {
    rules: [
      {
        test: /\.ts$/,
        use: [{ loader: 'ts-loader' }],
        exclude: [/node_modules/]
      }
    ]
  },

  resolve: {
    extensions: ['.ts', '.js']
  },

  optimization: {
    minimizer: [
      new TerserPlugin({
        terserOptions: {
          // Not keeping classnames breaks shell-api during minification
          keep_classnames: true
        }
      })
    ]
  },

  node: false,

  externals: {
    'mongodb-client-encryption': 'commonjs2 mongodb-client-encryption',
    kerberos: 'commonjs2 kerberos',
    snappy: 'commonjs2 snappy',
    interruptor: 'commonjs2 interruptor'
  }
};

module.exports = ['index', 'child-process-proxy', 'worker-runtime'].map(
  (entry) => ({
    entry: { [entry]: path.resolve(__dirname, 'src', `${entry}.ts`) },
    ...config
  })
);
