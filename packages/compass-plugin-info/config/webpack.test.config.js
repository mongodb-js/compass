const nodeExternals = require('webpack-node-externals');
const path = require('path');

const project = require('./project');

module.exports = {
  target: 'node', // webpack should compile node compatible code for tests
  externals: [ nodeExternals() ],
  stats: {
    warnings: false
  },
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', 'less'],
    alias: {
      actions: path.join(project.path.src, 'actions'),
      components: path.join(project.path.src, 'components'),
      constants: path.join(project.path.src, 'constants'),
      fonts: path.join(project.path.src, 'assets/fonts'),
      images: path.join(project.path.src, 'assets/images'),
      less: path.join(project.path.src, 'assets/less'),
      models: path.join(project.path.src, 'models'),
      plugin: path.join(project.path.src, 'index.js'),
      stores: path.join(project.path.src, 'stores'),

      utils: path.join(project.path.src, 'utils')
    }
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [
          { loader: 'style-loader'},
          { loader: 'css-loader' }
        ]
      },
      {
        test: /\.less$/,
        exclude: /node_modules/,
        use: [
          { loader: 'style-loader' },
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,

              modules: {
                localIdentName: 'Security_[name]-[local]__[hash:base64:5]'
              }
            }
          },
          {
            loader: 'postcss-loader',
            options: {
              plugins: function() {
                return [
                  project.plugin.autoprefixer
                ];
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
      {
        test: /\.(js|jsx)$/,
        use: [{
          loader: 'babel-loader',
          options: {
            root: path.resolve(__dirname, '..'),
            cacheDirectory: !process.env.CI
          }
        }],
        exclude: /(node_modules)/
      },
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
      }
    ]
  }
};
