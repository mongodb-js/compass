module.exports = {
  // devtool: 'inline-source-map',
  // devtool: 'eval-source-map',
  // TODO: Prod with devtool: false
  // mode: 'development',

  entry: [
    './src/index.ts'
  ],
  output: {
    path: `${__dirname}/lib`,
    filename: 'index.js',
    // globalObject: 'this',
    libraryTarget: 'commonjs2',
    // libraryTarget: 'umd'
  },
  // target: 'electron-main',
  // target: 'node',
  // target: 'web',
  target: 'electron-renderer',
  // target: 'electron-preload',
  resolve: {
    modules: ['node_modules'],
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    aliasFields: ['module']
  },
  externals: {
    'react': 'commonjs react',
    'electron': 'electron',
    // '@mongodb-js/compass-shell': '@mongodb-js/compass-shell'
    // 'mongodb-client-encryption': 'commonjs2 mongodb-client-encryption'
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      // {
      //   test: /\.(js|jsx)$/,
      //   use: [{
      //     loader: 'babel-loader',
      //     options: {
      //       root: path.resolve(__dirname, '..'),
      //       cacheDirectory: !process.env.CI
      //     }
      //   }],
      //   exclude: /(node_modules)/
      // }
    ],
  }
}






// Working:
// module.exports = {
//   entry: [
//     './src/index.ts'
//   ],
//   output: {
//     path: `${__dirname}/lib`,
//     filename: 'index.js',
//     libraryTarget: 'commonjs2'
//   },
//   resolve: {
//     extensions: ['.ts', '.tsx', '.js'],
//     aliasFields: ['module']
//   },
//   externals: {
//     'react': 'commonjs react',
//     'electron': 'electron'
//   },
//   module: {
//     rules: [
//       {
//         test: /\.tsx?$/,
//         use: 'ts-loader',
//         exclude: /node_modules/,
//       }
//     ],
//   }
// }
