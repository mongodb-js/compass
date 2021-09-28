// @ts-check
const path = require('path');
const HadronBuildTarget = require('hadron-build/lib/target');
const {
  createElectronMainConfig,
  createElectronRendererConfig,
  webpackArgsWithDefaults,
  webpack,
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
    entry: path.resolve(__dirname, 'src', 'main.js'),
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
    // main import and for that reason it needs to stay external to compass (and
    // compass-shell plugin)
    '@mongosh/node-runtime-worker-thread':
      'commonjs2 @mongosh/node-runtime-worker-thread'
  };

  const target = new HadronBuildTarget(__dirname);

  // This should be provided either with env vars directly or from hadron-build
  // when application is compiled
  const hadronEnvConfig = {
    // Required env variables with defaults
    HADRON_APP_VERSION: target.version,
    HADRON_DISTRIBUTION: target.distribution,
    HADRON_PRODUCT: target.name,
    HADRON_PRODUCT_NAME: target.productName,
    HADRON_READONLY: String(target.readonly),
    HADRON_ISOLATED: String(target.isolated),
    HADRON_CHANNEL: target.channel,
    // Optional env variables that will be set only by Evergreen CI for publicly
    // published releases
    HARDRON_METRICS_BUGSNAG_KEY: null,
    HARDRON_METRICS_INTERCOM_APP_ID: null,
    HARDRON_METRICS_STITCH_APP_ID: null
  };

  return [
    merge(mainConfig, {
      externals,
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)]
    }),
    merge(rendererConfig, {
      externals,
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)]
    })
  ];
};
