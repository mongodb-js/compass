const config = {
  mode: process.env.NODE_ENV !== 'production' ? 'development' : 'production',
  resolve: {
    modules: ['node_modules'],
    extensions: ['.js', '.jsx' ]
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        use: [
          {
            loader: 'babel-loader',
            query: {
              cacheDirectory: true
            }
          }
        ],
        exclude: /(node_modules)/
      }
    ]
  }
};

module.exports = config;
