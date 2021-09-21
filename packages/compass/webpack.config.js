// @ts-check
const path = require('path');
const {
  createElectronMainConfig,
  createElectronRendererConfig,
  webpackArgsWithDefaults,
  merge
} = require('@mongodb-js/webpack-config-compass');

module.exports = (_env, args) => {
  const opts = {
    ...webpackArgsWithDefaults(args),
    outputPath: path.resolve(__dirname, 'build'),
    hot: true
  };

  process.env.NODE_ENV = opts.nodeEnv;

  const mainConfig = createElectronMainConfig({
    ...opts,
    entry: path.resolve(__dirname, 'src', 'main', 'index.js'),
    outputFilename: 'main.js'
  });

  const rendererConfig = createElectronRendererConfig({
    ...opts,
    entry: [
      path.resolve(__dirname, 'src', 'app', 'index.js'),
      path.resolve(__dirname, 'src', 'app', 'loading', 'loading.js')
    ]
  });

  const externals = {
    // Runtime implementation depends on worker file existing near the library
    // main import and for that reason it needs to stay external to the
    // compass-shell
    '@mongosh/node-runtime-worker-thread':
      'commonjs2 @mongosh/node-runtime-worker-thread'
  };

  return [
    merge(mainConfig, { externals }),
    merge(rendererConfig, { externals })
  ];
};
