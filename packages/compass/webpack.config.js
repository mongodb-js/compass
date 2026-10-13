'use strict';
// @ts-check
const fs = require('fs');
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

  // `WebpackPluginStartElectron` is a singleton keyed on the webpack target.
  // Utility and preload configs also target Electron, so keeping the plugin on
  // them would let them take over from the real main config and race which
  // one launches the app. Only the main config launches it.
  const withoutStartElectron = (config) => ({
    ...config,
    plugins: (config.plugins ?? []).filter(
      (plugin) => plugin.constructor.name !== 'WebpackPluginStartElectron'
    ),
  });

  // Every directory in src/utilities is a utility process: its entry is
  // `<name>/index.mts` and it is built to `<name>.mjs`, which main forks.
  // Adding a utility means adding a directory, nothing here.
  const utilitiesDir = path.resolve(__dirname, 'src', 'utilities');
  const utilityEntries = Object.fromEntries(
    fs
      .readdirSync(utilitiesDir, { withFileTypes: true })
      .filter((entry) => entry.isDirectory())
      .map(({ name }) => [name, path.join(utilitiesDir, name, 'index.mts')])
  );

  const utilitiesConfig = withoutStartElectron(
    createElectronMainConfig({
      ...opts,
      entry: utilityEntries,
      outputFilename: '[name].mjs',
    })
  );

  const preloadConfig = withoutStartElectron(
    createElectronMainConfig({
      ...opts,
      entry: { preload: path.resolve(__dirname, 'src', 'preload', 'index.ts') },
      outputFilename: '[name].js',
    })
  );

  const rendererConfig = createElectronRendererConfig({
    ...opts,
    entry: path.resolve(__dirname, 'src', 'app', 'index.ts'),
  });

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
      name: 'main',
      dependencies: ['utilities', 'preload'],
      cache,
      snapshot,
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        ...compileOnlyPlugins,
      ],
    }),
    merge(utilitiesConfig, {
      name: 'utilities',
      cache,
      snapshot,
      // Emitted as ESM so the utility can use `import.meta`
      experiments: { outputModule: true },
      output: { module: true },
      // The eval devtool wraps modules in `eval`, where `import.meta` is a
      // syntax error
      devtool: 'source-map',
      // Leave `import.meta` and `createRequire` to the runtime: utilities
      // resolve files that must stay on disk, like the shell's worker script,
      // and webpack would otherwise bundle them
      module: {
        parser: { javascript: { importMeta: false, createRequire: false } },
      },
      // `require` does not exist in ESM output, so CommonJS externals have to
      // go through `createRequire`
      externals: Object.fromEntries(
        [
          ...sharedExternals,
          // Starts its worker thread on its own file, which has to be the
          // real one rather than this bundle
          'web-worker',
        ].map((name) => [name, `node-commonjs ${name}`])
      ),
      plugins: [
        new webpack.EnvironmentPlugin(hadronEnvConfig),
        // Main forks one file per utility
        new webpack.optimize.LimitChunkCountPlugin({
          maxChunks: Object.keys(utilityEntries).length,
        }),
      ],
    }),
    merge(preloadConfig, {
      name: 'preload',
      target: 'electron-preload',
      cache,
      snapshot,
      plugins: [new webpack.EnvironmentPlugin(hadronEnvConfig)],
    }),
    merge(rendererConfig, {
      cache,
      snapshot,
      // Chunk splitting makes sense only for renderer processes where the
      // amount of dependencies is massive and can benefit from them more
      optimization,
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
  ];
};
