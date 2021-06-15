const path = require('path');
const project = require('./project');

module.exports = {
  mode: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', 'less'],
    alias: {
      components: path.join(project.path.src, 'components'),
      constants: path.join(project.path.src, 'constants'),
      containers: path.join(project.path.src, 'containers'),
      fonts: path.join(project.path.src, 'assets/fonts'),
      images: path.join(project.path.src, 'assets/images'),
      less: path.join(project.path.src, 'assets/less'),
      models: path.join(project.path.src, 'models'),
      modules: path.join(project.path.src, 'modules'),
      plugin: path.join(project.path.src, 'index.js'),
      stores: path.join(project.path.src, 'stores'),
      storybook: project.path.storybook,
      utils: path.join(project.path.src, 'utils'),
      'react-dom': '@hot-loader/react-dom'
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      {
        test: /\.mjs$/,
        include: /node_modules/,
        type: 'javascript/auto'
      },
      // For styles that have to be global (see https://github.com/css-modules/css-modules/pull/65)
      {
        test: /\.less$/,
        include: [/global/, /bootstrap/],
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              modules: false
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: function() {
                return [project.plugin.autoprefixer];
              }
            }
          },
          {
            loader: 'less-loader',
            options: {
              noIeCompat: true
            }
          }
        ]
      },
      // For CSS-Modules locally scoped styles
      {
        test: /\.less$/,
        exclude: [/\.global/, /bootstrap/, /node_modules/, /global\.less/],
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              modules: {
                localIdentName:
                  'AggregationsPlugin_[name]-[local]__[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: function() {
                return [project.plugin.autoprefixer];
              }
            }
          },
          {
            loader: 'less-loader',
            options: {
              noIeCompat: true
            }
          }
        ]
      },
      // For native modules to be able to be loaded.
      {
        test: /\.node$/,
        use: 'node-loader'
      },
      {
        test: /node_modules[\\\/]JSONStream[\\\/]index\.js/,
        use: [{ loader: 'shebang-loader' }]
      },
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              root: path.resolve(__dirname, '..'),
              cacheDirectory: !process.env.CI
            }
          }
        ],
        exclude: /(node_modules)/
      }
    ]
  }
};
