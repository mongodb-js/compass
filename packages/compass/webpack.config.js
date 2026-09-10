'use strict';
// @ts-check
const path = require('path');
// @ts-ignore
const { Target: HadronBuildTarget } = require('hadron-build');
const { WebpackDependenciesPlugin } = require('@mongodb-js/sbom-tools');

const {
  createElectronMainConfig,
  createElectronRendererConfig,
  sharedExternals,
  webpackArgsWithDefaults,
  isServe,
  webpack,
  merge,
} = require('@mongodb-js/webpack-config-compass');

/**
 * @type {(env: Record<string, any>, args: Record<string, any>) => import('webpack').Configuration}
 */
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

  // The data service utility process entry is emitted as ESM (so that
  // `import.meta.main` is available to it) in a single file that the main
  // process forks with `utilityProcess.fork`
  const dataServiceUtilityBaseConfig = createElectronMainConfig({
    ...opts,
    entry: {
      'data-service': path.resolve(
        __dirname,
        'src',
        'utilities',
        'data-service',
        'index.mts'
      ),
    },
    outputFilename: '[name].mjs',
  });
  // `createElectronMainConfig` attaches `WebpackPluginStartElectron` in serve
  // mode. That plugin is a singleton keyed on `compiler.options.target`, and
  // since this config also targets `electron-main`, attaching it here too
  // makes it overwrite the real main compiler it already latched onto,
  // racing which of the two decides the app's launch path. This isn't a
  // main-process entry that starts the app, so it shouldn't get this plugin.
  dataServiceUtilityBaseConfig.plugins = (
    dataServiceUtilityBaseConfig.plugins ?? []
  ).filter(
    (plugin) => plugin.constructor.name !== 'WebpackPluginStartElectron'
  );
  const dataServiceUtilityConfig = merge(dataServiceUtilityBaseConfig, {
    name: 'data-service',
    experiments: { outputModule: true },
    output: { module: true },
    // The eval-based devtools used in development wrap every module in a
    // script `eval`, where `import.meta` is a syntax error
    devtool: 'source-map',
    // Leave `import.meta` to the runtime instead of webpack rewriting it
    module: { parser: { javascript: { importMeta: false } } },
    externals: Object.fromEntries(
      sharedExternals.map((name) => [name, `node-commonjs ${name}`])
    ),
    plugins: [new webpack.optimize.LimitChunkCountPlugin({ maxChunks: 1 })],
  });

  const rendererConfig = createElectronRendererConfig({
    ...opts,
    entry: path.resolve(__dirname, 'src', 'app', 'index.ts'),
  });

  // Preload script for the main window. Kept as plain `window.postMessage`
  // listeners rather than `contextBridge` since `contextIsolation` is off
  // today; `postMessage` crosses the isolated-world boundary regardless, so
  // this doesn't need to change when that eventually flips.
  const preloadBaseConfig = createElectronMainConfig({
    ...opts,
    entry: { preload: path.resolve(__dirname, 'src', 'preload', 'index.ts') },
    outputFilename: '[name].js',
  });
  // See the comment above `dataServiceUtilityBaseConfig`: this is a second
  // `electron-main`-targeted config, so it would otherwise steal the
  // `WebpackPluginStartElectron` singleton from the real main compiler.
  preloadBaseConfig.plugins = (preloadBaseConfig.plugins ?? []).filter(
    (plugin) => plugin.constructor.name !== 'WebpackPluginStartElectron'
  );
  const preloadConfig = merge(preloadBaseConfig, {
    name: 'preload',
    target: 'electron-preload',
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

  const snapshot = {
    unmanagedPaths: [
      // Dependencies we would like to have able to be updated while
      // we are running Compass locally. This is useful for the `sync-to-compass`
      // scripts in these projects work.
      path.resolve('..', '..', 'node_modules', '@mongosh', 'browser-repl'),
      path.resolve('..', '..', 'node_modules', '@mongodb-js', 'diagramming'),
    ],
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
      snapshot,
      externals,
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        // In local dev mode, this flag is used to disable web security when
        // creating windows. It allows @mongosh/node-runtime-worker-thread
        // worker to load itself from the file path on the localhost
        new webpack.DefinePlugin({
          'process.env.DISABLE_ELECTRON_WEB_SECURITY': JSON.stringify(
            isServe(opts) ? '1' : '0'
          ),
        }),
        ...compileOnlyPlugins,
      ],
    }),
    merge(rendererConfig, {
      cache,
      snapshot,
      // Chunk splitting makes sense only for renderer processes where the
      // amount of dependencies is massive and can benefit from them more
      optimization,
      externals,
      resolve: {
        alias: {
          '@mongodb-js/atlas-local': false,
        },
      },
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        ...compileOnlyPlugins,
      ],
    }),
    merge(dataServiceUtilityConfig, {
      cache,
      snapshot,
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)],
    }),
    merge(preloadConfig, {
      cache,
      snapshot,
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)],
    }),
  ];
};
