const path = require('path');
const project = require('./project');

module.exports = {
  mode: (process.env.NODE_ENV !== 'production') ? 'development' : 'production',
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', '.less', '.wasm'],
    alias: {
      actions: path.join(project.path.src, 'actions'),
      components: path.join(project.path.src, 'components'),
      constants: path.join(project.path.src, 'constants'),
      fonts: path.join(project.path.src, 'assets/fonts'),
      images: path.join(project.path.src, 'assets/images'),
      less: path.join(project.path.src, 'assets/less'),
      models: path.join(project.path.src, 'models'),
      modules: path.join(project.path.src, 'modules'),
      plugin: path.join(project.path.src, 'index.js'),
      stores: path.join(project.path.src, 'stores'),

      utils: path.join(project.path.src, 'utils')
    }
  },
  externals: {
    'os-dns-native': 'commonjs2 os-dns-native',
    'win-export-certificate-and-key': 'commonjs2 win-export-certificate-and-key',
    'macos-export-certificate-and-key': 'commonjs2 macos-export-certificate-and-key'
  },
  module: {
    rules: [{
      test: /\.css$/,
      use: [
        { loader: 'style-loader' },
        { loader: 'css-loader' }
      ]
    }, {
      test: /.less$/,

      use: [
        { loader: 'style-loader' },
        {
          loader: 'css-loader',
          options: {
            importLoaders: 1,

            modules: {
              // Based on file name
              auto: true,
              localIdentName: 'QueryHistoryPlugin_[name]-[local]__[hash:base64:5]'
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
            lessOptions: {
              modifyVars: {
                // Only affects dev build (standalone plugin playground), required
                // so that font-awesome can correctly resolve image paths relative
                // to the compass
                'compass-fonts-path': '../fonts',
                'compass-images-path': '../images',
                'fa-font-path': path.dirname(
                  require.resolve('mongodb-compass/src/app/fonts/FontAwesome.otf')
                )
              }
            }
          }
        }
      ]
    }, // For native modules to be able to be loaded.
    {
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
    }]
  }
};
