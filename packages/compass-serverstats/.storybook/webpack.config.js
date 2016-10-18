module.exports = {
  resolve: {
    extensions: ['', '.js', '.jsx']
  },
  module: {
    loaders: [
      {
        test: /\.less$/,
        loader: 'style!css!less'
      }
    ]
  }
};
