const project = require('./project');

module.exports = {
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx', '.json', '.less', '.wasm']
  },
  module: {
    rules: [
      {
        test: /\.css$/,
        use: [{ loader: 'style-loader' }, { loader: 'css-loader' }]
      },
      /**
       * For styles that have to be global
       * @see https://github.com/css-modules/css-modules/pull/65
       */
      {
        test: /\.less$/,
        include: [/\.global/, /bootstrap/],
        use: [
          { loader: 'style-loader' },
          { loader: 'css-loader', options: { modules: false } },
          {
            loader: 'postcss-loader',
            options: { plugins: () => [project.plugin.autoprefixer] }
          },
          { loader: 'less-loader', options: { noIeCompat: true } }
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
              modules: true,
              importLoaders: 1,
              localIdentName: 'ConnectPlugin_[name]-[local]__[hash:base64:5]'
            }
          },
          {
            loader: 'postcss-loader',
            options: { plugins: () => [project.plugin.autoprefixer] }
          },
          { loader: 'less-loader', options: { noIeCompat: true } }
        ]
      },
      // For native modules to be able to be loaded.
      { test: /\.node$/, use: 'node-loader' },
      {
        test: /node_modules[\\\/]JSONStream[\\\/]index\.js/,
        use: [{ loader: 'shebang-loader' }]
      },
      {
        test: /\.(js|jsx)$/,
        use: [{
          loader: 'babel-loader',
          query: {
            cacheDirectory: true,
            plugins: ['transform-decorators-legacy']
          }
        }],
        exclude: /(node_modules)/
      }
    ]
  }
};
