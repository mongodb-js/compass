'use strict';
const path = require('path');
const {
  webpack,
  createWebConfig,
  isServe,
  merge,
  HtmlWebpackPlugin,
} = require('@mongodb-js/webpack-config-compass');
const { execFile, spawn, execFileSync } = require('child_process');
const { promisify } = require('util');
const { createWebSocketProxy } = require('./scripts/ws-proxy');

const execFileAsync = promisify(execFile);

function localPolyfill(name) {
  return path.resolve(__dirname, 'polyfills', ...name.split('/'), 'index.ts');
}

/**
 * Atlas Cloud uses in-flight compression that doesn't compress anything that is
 * bigger than 10MB, we want to make sure that compass-web assets stay under the
 * limit so that they are compressed when served
 */
const MAX_COMPRESSION_FILE_SIZE = 10_000_000;

/**
 * @type {(env: Record<string, any>, args: Record<string, any>) => import('webpack').Configuration}
 */
module.exports = (env, args) => {
  const serve = isServe({ env });
  const watch = env.WEBPACK_WATCH === true;

  if (watch && serve) {
    throw new Error('Can not watch and serve at the same time');
  }

  const sharedWebConfig = merge(
    createWebConfig({
      ...args,
      hot: serve,
    }),
    {
      plugins: [
        new webpack.DefinePlugin({
          // Can be either `web` or `webdriverio`, helpful if we need special
          // behavior for tests in sandbox
          'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV ?? 'web'),
          'process.env.GIT_COMMIT_HASH': JSON.stringify(
            execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
              encoding: 'utf8',
            }).trim()
          ),
          // NB: DefinePlugin completely replaces matched string with a provided
          // value, in most cases WE DO NOT WANT THAT and process variables in the
          // code are added to be able to change them in runtime. Do not add new
          // records unless you're super sure it's needed
        }),
      ],
    }
  );

  // Stuff from shared config that doesn't apply at all here
  delete sharedWebConfig.entry;
  delete sharedWebConfig.output;
  delete sharedWebConfig.externals;

  const libraryConfig = merge(sharedWebConfig, {
    context: __dirname,
    entry: { index: path.resolve(__dirname, 'src', 'index.tsx') },
    output: {
      path: path.resolve(__dirname, 'dist'),
      filename: (pathData) => {
        return pathData.chunk.hasEntryModule()
          ? 'compass-web.mjs'
          : '[name].[contenthash].mjs';
      },
      library: {
        type: 'module',
      },
      clean: true,
    },
    module: {
      rules: [
        {
          test: /\.(m|c)?(js|ts)x?$/,
          use: {
            // Our d3 version is out of date, so it's easier to patch it to be
            // "strict mode" compatible instead of trying to update across the
            // whole repo. See the file for details
            loader: path.join(__dirname, 'scripts', 'patch-d3-for-esm.js'),
          },
        },
      ],
    },
    resolve: {
      alias: {
        // Dependencies for the unsupported connection types in data-service
        '@mongodb-js/devtools-proxy-support/proxy-options': require.resolve(
          '@mongodb-js/devtools-proxy-support/proxy-options'
        ),
        '@mongodb-js/devtools-proxy-support': localPolyfill(
          '@mongodb-js/devtools-proxy-support'
        ),

        // Replace 'devtools-connect' with a package that just directly connects
        // using the driver (= web-compatible driver) logic, because devtools-connect
        // contains a lot of logic that makes sense in a desktop application/CLI but
        // not in a web environment (DNS resolution, OIDC, CSFLE/QE, etc.)
        '@mongodb-js/devtools-connect': localPolyfill(
          '@mongodb-js/devtools-connect'
        ),

        // TODO(COMPASS-7407): compass-logging
        // hard to disable the whole thing while there are direct dependencies
        // on log-writer
        // 'mongodb-log-writer': localPolyfill('mongodb-log-writer'),
        v8: false,
        electron: false,
        'hadron-ipc': false,

        // TODO(COMPASS-7411): compass-user-data
        // can't disable the whole module, imports used directly in module scope
        // '@mongodb-js/compass-user-data': false,
        worker_threads: false,

        // Used by driver outside of the supported web connection path. Has to
        // be defined before `fs` so that webpack first reads the namespaced
        // alias before trying to resolve it relative to `fs` polyfill path
        'fs/promises': localPolyfill('fs/promises'),
        // TODO(COMPASS-7411): compass-utils
        fs: localPolyfill('fs'),

        // We can't polyfill connection-form because some shared methods from
        // connection-form are used in connection flow, so you can't connect
        // unless you import the whole connection-form. They should probably be
        // moved to connection-info package at least which is already a place
        // where shared connection types and methods that are completely not
        // platform specific and don't contain any UI are kept
        // '@mongodb-js/connection-form': localPolyfill(
        //   '@mongodb-js/connection-form'
        // ),

        // Things that are easier to polyfill than to deal with their usage
        'process/browser': require.resolve('process/browser'),
        process: localPolyfill('process'),

        'stream/promises': localPolyfill('stream/promises'),
        stream: require.resolve('readable-stream'),

        path: require.resolve('path-browserify'),
        // The `/` so that we are resolving the installed polyfill version with
        // the same name as Node.js built-in, not a built-in Node.js one
        'util/types': localPolyfill('util/types'),
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        events: require.resolve('events/'),
        // Used by export-to-language feature and there is no real way we can
        // remove the usage at the moment
        vm: require.resolve('vm-browserify'),

        // TODO(NODE-5408): requires a polyfill to be able to parse connection
        // string correctly at the moment
        url: require.resolve('whatwg-url'),
        // Make sure we're not getting multiple versions included
        'whatwg-url': require.resolve('whatwg-url'),
        // Heavy dependency of whatwg-url that we can replace in the browser
        // environment
        tr46: localPolyfill('tr46'),

        // Polyfills that are required for the driver to function in browser
        // environment
        tls: localPolyfill('tls'),
        net: localPolyfill('net'),
        'timers/promises': require.resolve('timers-browserify'),
        timers: require.resolve('timers-browserify'),
        os: require.resolve('os-browserify/browser'),
        crypto: require.resolve('crypto-browserify'),
        dns: localPolyfill('dns'),
        // Built-in Node.js modules imported by the driver directly and used in
        // ways that requires us to provide a no-op polyfill
        zlib: localPolyfill('zlib'),
        // Built-in Node.js modules imported by the driver directly, but used in
        // a way that allows us to just provide an empty module alias
        http: false,
        child_process: false,
        // Optional driver dependencies that should throw on import as a way for
        // driver to identify them as missing and so require a special
        // "polyfill" that throws in module scope on import. See
        // https://github.com/mongodb/node-mongodb-native/blob/main/src/deps.ts
        // for the full list of dependencies that fall under that rule
        'kerberos/package.json': localPolyfill('throwError'),
        kerberos: localPolyfill('throwError'),

        '@mongodb-js/zstd': localPolyfill('throwError'),
        '@aws-sdk/credential-providers': localPolyfill('throwError'),
        'gcp-metadata': localPolyfill('throwError'),
        snappy: localPolyfill('throwError'),
        socks: localPolyfill('throwError'),
        aws4: localPolyfill('throwError'),

        'mongodb-client-encryption/package.json': localPolyfill('throwError'),
        'mongodb-client-encryption': localPolyfill('throwError'),

        'prom-client': false,
        diagnostics_channel: false,
        // mongodb-mcp-server polyfills
        // This is only used by StreamableHttpTransport which we do not use.
        express: false,
        http2: false,
        // Only used by Atlas Local tools which we do not currently use.
        '@mongodb-js/atlas-local': localPolyfill('throwError'),
        // Only used by Atlas tools which we do not currently use.
        'node-fetch': false,
      },
    },
    externalsType: 'window',
    // MMS implementation defines these global variables in https://github.com/10gen/mms/blob/e188be1f58a46c7c4a0ab485f8c09096aaa6f3a8/client/packages/project/dataExplorerCompassWeb/hooks/useCompassWebModule.tsx#L6-L11
    // if you're changing these values, make sure to update the mms part
    externals: {
      react: ['__compassWebSharedRuntime', 'React'],
      'react-dom': ['__compassWebSharedRuntime', 'ReactDOM'],
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        // Required by the driver to function in browser environment
        process: [localPolyfill('process'), 'process'],
      }),

      // Plugin to collect entrypoint filename information and save it in a
      // manifest file
      function (compiler) {
        compiler.hooks.emit.tap('manifest', function (compilation) {
          const stats = compilation.getStats().toJson({
            all: false,
            outputPath: true,
            entrypoints: true,
          });

          if (!('index' in stats.entrypoints)) {
            throw new Error('Missing expected entrypoint in the stats object');
          }

          const assets = JSON.stringify(
            stats.entrypoints.index.assets
              .map((asset) => {
                return asset.name;
              })
              // The root entrypoint is at the end of the assets list, but
              // we'd want to preload it first, reversing here puts the
              // manifest list in the load order we want
              .reverse(),
            null,
            2
          );

          compilation.emitAsset(
            'assets-manifest.json',
            new webpack.sources.RawSource(assets)
          );
        });
      },

      // Only applied when running webpack in --watch mode. In this mode we want
      // to constantly rebuild d.ts files when source changes, we also don't
      // want to fail and stop compilation if we failed to generate definitions
      // for whatever reason, we only print the error
      function (compiler) {
        compiler.hooks.watchRun.tap('compile-ts', function () {
          compiler.hooks.done.tapPromise('compile-ts', async function () {
            const logger = compiler.getInfrastructureLogger('compile-ts');
            try {
              await execFileAsync('npm', ['run', 'typescript']);
              logger.log('Compiled TypeScript definitions successfully');
            } catch (err) {
              logger.error('Failed to complie TypeScript definitions:');
              logger.error();
              logger.error(err.stdout);
            }
          });
        });
      },

      /**
       * Plug into the normalModuleFactory to remove the `node:` schema from
       * imports: webpack doesn't handle node: schema for web and doesn't allow
       * to alias imports with the schema so we clean them up before we can get
       * to the aliasing flow.
       *
       * @see {@link https://github.com/webpack/webpack/issues/14166}
       */
      function (compiler) {
        compiler.hooks.normalModuleFactory.tap(
          'RemoveNodeSchemaPlugin',
          (factory) => {
            factory.hooks.beforeResolve.tap(
              'RemoveNodeSchemaPlugin',
              (data) => {
                // Remove the `node:` prefix and allow a "normal" webpack
                // resolution mechanism to do the rest
                if (data.request.startsWith('node:')) {
                  data.request = data.request.replace('node:', '');
                  for (const dep of data.dependencies) {
                    dep.request = dep.request.replace('node:', '');
                    dep.userRequest = dep.userRequest.replace('node:', '');
                  }
                }
              }
            );
          }
        );
      },
    ],
    optimization: {
      splitChunks: {
        chunks: 'all',
        maxInitialRequests: Infinity,
        // Kinda arbitrary numbers to give us a decent abount of code split
        minSize: 1_000_000,
        maxSize: 4_000_000,
      },
    },
    performance: {
      hints:
        serve || args.watch || sharedWebConfig.mode !== 'production'
          ? 'warning'
          : 'error',
      // Entrypoint is basically the whole distribution size as there is only
      // one entry and all chunks are summed up, we only care that separate
      // chunks are under `MAX_COMPRESSION_FILE_SIZE`
      maxEntrypointSize: Infinity,
      maxAssetSize: MAX_COMPRESSION_FILE_SIZE,
    },
    experiments: {
      outputModule: true,
    },
  });

  // Add code that exposes some internals of compass-web. Useful for e2e tests /
  // local sync
  if (watch || serve || process.env.COMPASS_WEB_EXPOSE_INTERNALS === 'true') {
    libraryConfig.entry.index = [
      path.resolve(__dirname, 'sandbox', 'sandbox-process.ts'),
      path.resolve(__dirname, 'sandbox', 'sandbox-preferences.ts'),
      path.resolve(__dirname, 'sandbox', 'sandbox-logger-and-telemetry.ts'),
      path.resolve(__dirname, 'sandbox', 'sandbox-connection-storage.tsx'),
      path.resolve(__dirname, 'sandbox', 'sandbox-multiplex-transport.ts'),
      libraryConfig.entry.index,
    ];
  }

  // For watch mode we will additionally start a simple static file server
  if (watch) {
    const staticServerProcess = spawn(
      'npm',
      ['run', '--workspace', '@mongodb-js/compass-web', 'serve-dist'],
      { stdio: 'inherit' }
    );

    process.on('beforeExit', () => {
      staticServerProcess.kill();
    });

    return libraryConfig;
  }

  // For serve mode, we will create a local sandbox application that will
  // roughly reproduce how compass-web is embedded inside Atlas Cloud
  if (serve) {
    const wsProxy = createWebSocketProxy(1337);

    process.on('beforeExit', () => {
      for (const client of Array.from(wsProxy.clients())) {
        client.close();
      }
      wsProxy.close();
    });

    const sandboxConfig = merge(sharedWebConfig, {
      entry: { sandbox: path.resolve(__dirname, 'sandbox', 'index.tsx') },
      output: {
        publicPath: '/',
      },
      resolve: {
        alias: {
          // Local polyfills for tls / net that allow us to connect to our
          // sandbox tls proxy
          tls: localPolyfill('tls'),
          net: localPolyfill('net'),
          'stream/promises': localPolyfill('stream/promises'),
          stream: require.resolve('readable-stream'),
        },
      },
      devServer: {
        allowedHosts: 'all',
        bonjour: false,
        client: {
          overlay:
            process.env.DISABLE_DEVSERVER_OVERLAY === 'true'
              ? { warnings: false, errors: false, runtimeErrors: false }
              : { warnings: false, errors: true, runtimeErrors: true },
          webSocketURL: 'ws://localhost:7777/ws',
        },
        devMiddleware: {
          writeToDisk: true,
        },
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        },
        historyApiFallback: true,
        host: 'localhost',
        port: 7777,
        hot: libraryConfig.mode === 'development',
        liveReload: libraryConfig.mode === 'development',
        open: process.env.OPEN_BROWSER !== 'false',
        static: [
          {
            directory: path.resolve(__dirname, 'sandbox', 'static'),
            publicPath: '/static',
          },
          // Multicompiler mode is having some issues serving assets from both
          // compilations, so we force it to serve our dist by tricking it into
          // thinking that this is static assets
          {
            directory: path.resolve(__dirname, 'dist'),
            publicPath: '/',
            watch: false, // no need to watch, we're already watching source
          },
        ],
      },
      plugins: [
        new HtmlWebpackPlugin({
          title: 'Compass Web Sandbox',
          template: path.resolve(__dirname, 'sandbox', 'index.html'),
        }),
      ],
    });

    return [libraryConfig, sandboxConfig];
  }

  return libraryConfig;
};
