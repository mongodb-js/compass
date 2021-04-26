const path = require('path');

module.exports = {
  stats: 'errors-only',
  resolve: {
    extensions: ['.tsx', '.ts', '.jsx', '.js', '.less'],
    alias: {
      // imports in service-provider-core that can break the browser build
      'whatwg-url': path.resolve(__dirname, 'empty.js'),
    }
  },
  module: {
    rules: [
      {
        test: /\.js(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      },
      {
        test: /\.ts(x?)$/,
        exclude: /node_modules/,
        use: {
          loader: 'ts-loader'
        }
      },
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader' }
        ]
      },
      // For styles that have to be global (see https://github.com/css-modules/css-modules/pull/65)
      {
        test: /\.less$/,
        include: [/\.global/, /bootstrap/],
        use: [
          {
            loader: 'style-loader',
          },
          {
            loader: 'css-loader',
            options: {
              modules: false
            }
          },
          {
            loader: 'less-loader',
          }
        ]
      },
      // For CSS-Modules locally scoped styles
      {
        test: /\.less$/,
        exclude: [/\.global/, /bootstrap/, /node_modules/],
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: {
                localIdentName: 'mongosh-[name]-[local]__[hash:base64:5]'
              },
              importLoaders: 1,
            }
          },
          {
            loader: 'less-loader'
          }
        ]
      }
    ]
  }
};
