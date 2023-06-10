// @ts-check
const path = require('path');
// @ts-ignore
const HadronBuildTarget = require('hadron-build/lib/target');
const { WebpackDependenciesPlugin } = require('@mongodb-js/sbom-tools');

const {
  createElectronMainConfig,
  createElectronRendererConfig,
  webpackArgsWithDefaults,
  isServe,
  webpack,
  merge,
} = require('@mongodb-js/webpack-config-compass');

module.exports = (_env, args) => {
  const opts = {
    ...webpackArgsWithDefaults(args),
    outputPath: path.resolve(__dirname, 'build'),
    hot: true,
  };

  process.env.NODE_ENV = opts.nodeEnv;

  const mainConfig = createElectronMainConfig({
    ...opts,
    // Explicitly provide entry name and outputFilename so that it's not changed
    // between dev, prod, or any other build mode. It's important for the main
    // entrypoint as it would be require additional logic for electron to start
    // the app correctly. Having a stable name allows us to avoid this
    entry: { main: path.resolve(__dirname, 'src', 'main', 'index.ts') },
    outputFilename: '[name].js',
  });

  const rendererConfig = createElectronRendererConfig({
    ...opts,
    entry: path.resolve(__dirname, 'src', 'app', 'index.jsx'),
  });

  const externals = {
    // Runtime implementation depends on worker file existing near the library
    // main import and for that reason it needs to stay external to compass (and
    // compass-shell plugin)
    '@mongosh/node-runtime-worker-thread':
      'commonjs2 @mongosh/node-runtime-worker-thread',
  };

  // Having persistent build cache makes initial dev build slower, but
  // subsequent builds much much faster
  const cache = {
    /** @type {'filesystem'} */
    type: 'filesystem',
    allowCollectingMemory: opts.nodeEnv !== 'production',
    buildDependencies: {
      config: [__filename],
    },
  };

  // Having runtime outside of entries means less rebuilding when dependencies
  // change (default is runtime is part of the entry and the whole entry needs
  // a rebuild when dependency tree changes)
  const optimization = {
    /** @type {'single'} */
    runtimeChunk: 'single',
    splitChunks: {
      /** @type {'all'} */
      chunks: 'all',
      maxInitialRequests: Infinity,
      minSize: 0,
      // Ignore all other splitting rules and enforce the split if we are
      // hitting a 4mb limit for a single chunk (this gives us a reasonable
      // amount of chunks loaded by the renderer in parallel)
      maxSize: 4_000_000,
    },
  };

  const target = new HadronBuildTarget(__dirname);

  // This should be provided either with env vars directly or from hadron-build
  // when application is compiled
  const hadronEnvConfig = {
    // Required env variables with defaults
    HADRON_APP_VERSION: target.version,
    HADRON_DISTRIBUTION: target.distribution,
    HADRON_PRODUCT: target.name,
    HADRON_PRODUCT_NAME: isServe(opts)
      ? `${target.productName} Local`
      : target.productName,
    HADRON_READONLY: String(target.readonly),
    HADRON_ISOLATED: String(target.isolated),
    HADRON_CHANNEL: target.channel,
    HADRON_AUTO_UPDATE_ENDPOINT: target.autoUpdateBaseUrl,
    // Optional env variables that will be set only by Evergreen CI for publicly
    // published releases
    HADRON_METRICS_INTERCOM_APP_ID: null,
    HADRON_METRICS_SEGMENT_API_KEY: null,
    HADRON_METRICS_SEGMENT_HOST: null,
  };

  const compileOnlyPlugins = isServe(opts)
    ? []
    : [
        // ignoring type here as JSDoc still uses webpack@4 that is
        // resolved from plugins not yet updated to the new config
        /** @type {any} */ (
          new WebpackDependenciesPlugin({
            outputFilename: path.resolve(
              __dirname,
              '..',
              '..',
              '.sbom',
              'dependencies.json'
            ),
            includeExternalProductionDependencies: true,
            includePackages: ['electron'],
          })
        ),
      ];

  return [
    merge(mainConfig, {
      cache,
      externals,
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        ...compileOnlyPlugins,
      ],
    }),
    merge(rendererConfig, {
      cache,
      // Chunk splitting makes sense only for renderer processes where the
      // amount of dependencies is massive and can benefit from them more
      optimization,
      externals,
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        ...compileOnlyPlugins,
      ],
    }),
  ];
};
