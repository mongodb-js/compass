'use strict';
const path = require('path');
const {
  webpack,
  createWebConfig,
  isServe,
  merge,
} = require('@mongodb-js/webpack-config-compass');
const { execFile } = require('child_process');
const { promisify } = require('util');

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

module.exports = (env, args) => {
  const serve = isServe({ env });

  let config = createWebConfig({
    ...args,
    hot: serve,
    entry: path.resolve(__dirname, serve ? 'sandbox' : 'src', 'index.tsx'),
  });

  delete config.externals;

  config = merge(config, {
    context: __dirname,
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
        stream: require.resolve('readable-stream'),
        path: require.resolve('path-browserify'),
        // The `/` so that we are resolving the installed polyfill version with
        // the same name as Node.js built-in, not a built-in Node.js one
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
        kerberos: localPolyfill('throwError'),
        '@mongodb-js/zstd': localPolyfill('throwError'),
        '@aws-sdk/credential-providers': localPolyfill('throwError'),
        'gcp-metadata': localPolyfill('throwError'),
        snappy: localPolyfill('throwError'),
        socks: localPolyfill('throwError'),
        aws4: localPolyfill('throwError'),
        'mongodb-client-encryption': localPolyfill('throwError'),
      },
    },
    plugins: [
      new webpack.DefinePlugin({
        // Can be either `web` or `webdriverio`, helpful if we need special
        // behavior for tests in sandbox
        'process.env.APP_ENV': JSON.stringify(process.env.APP_ENV ?? 'web'),
      }),

      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        // Required by the driver to function in browser environment
        process: [localPolyfill('process'), 'process'],
      }),
    ],
    performance: {
      hints: serve ? 'warning' : 'error',
      maxEntrypointSize: MAX_COMPRESSION_FILE_SIZE,
      maxAssetSize: MAX_COMPRESSION_FILE_SIZE,
    },
  });

  if (serve) {
    config.output = {
      path: config.output.path,
      filename: config.output.filename,
      assetModuleFilename: config.output.assetModuleFilename,
    };

    return merge(config, {
      devServer: {
        hot: true,
        open: false,
        magicHtml: false,
        port: 4242,
        historyApiFallback: {
          rewrites: [{ from: /./, to: 'index.html' }],
        },
        static: {
          directory: path.resolve(__dirname, 'sandbox'),
          publicPath: '/',
        },
        client: {
          overlay:
            process.env.DISABLE_DEVSERVER_OVERLAY === 'true'
              ? false
              : { warnings: false, errors: true, runtimeErrors: true },
        },
      },
      resolve: {
        alias: {
          // Local polyfill for tls that allow us to connect to any MongoDB
          // server, not only to the Atlas Cloud one
          tls: localPolyfill('tls'),
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          // Matches the electron-proxy.js default value
          'process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG': JSON.stringify(
            process.env.COMPASS_WEB_HTTP_PROXY_CLOUD_CONFIG ?? 'dev'
          ),
        }),
      ],
    });
  }

  config.output = {
    path: config.output.path,
    filename: config.output.filename,
    library: {
      type: 'commonjs-static',
    },
  };

  return merge(config, {
    externals: {
      react: 'commonjs2 react',
      'react-dom': 'commonjs2 react-dom',

      // TODO(CLOUDP-228421): move Socket implementation from mms codebase when
      // active work on the connumicatino protocol is wrapped up
      tls: 'commonjs2 tls',
    },
    plugins: [
      // Always package dist with NODE_ENV set to production, otherwise @emotion
      // dev mode behavior completely hangs code in the browser when applying
      // dev build to locally running mms
      new webpack.DefinePlugin({
        'process.env.NODE_ENV': JSON.stringify('production'),
      }),

      // Only applied when running webpack in --watch mode. In this mode we want
      // to constantly rebuild d.ts files when source changes, we also don't
      // want to fail and stop compilation if we failed to generate definitions
      // for whatever reason, we only print the error
      function (compiler) {
        compiler.hooks.watchRun.tapPromise('compile-ts', async function () {
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
      },
    ],
  });
};
