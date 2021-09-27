// @ts-check
const path = require('path');
const HadronBuildTarget = require('hadron-build/lib/target');
const {
  createElectronMainConfig,
  createElectronRendererConfig,
  webpack,
  merge
} = require('@mongodb-js/webpack-config-compass');

module.exports = (_env, args) => {
  const electronMainConfig = createElectronMainConfig({
    ...args,
    entry: path.resolve(__dirname, 'src', 'main.js'),
    outputPath: path.resolve(__dirname, 'build'),
    outputFilename: 'main.js'
  });

  const electronRendererConfig = createElectronRendererConfig({
    ...args,
    entry: [
      path.resolve(__dirname, 'src', 'app', 'index.js'),
      path.resolve(__dirname, 'src', 'app', 'loading', 'loading.js')
    ],
    outputPath: path.resolve(__dirname, 'build')
  });

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
    merge(electronMainConfig, {
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)]
    }),
    merge(electronRendererConfig, {
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)]
    })
  ];
};
