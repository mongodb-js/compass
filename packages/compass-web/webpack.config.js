const path = require('path');
const {
  webpack,
  createWebConfig,
  isServe,
  merge,
} = require('@mongodb-js/webpack-config-compass');
const { createWebSocketProxy } = require('@gribnoysup/mongodb-browser/proxy');

function localPolyfill(name) {
  return path.resolve(__dirname, 'polyfills', ...name.split('/'), 'index.ts');
}

module.exports = async (env, args) => {
  const serve = isServe({ env });

  let config = createWebConfig({
    ...args,
    hot: serve,
    entry: path.resolve(__dirname, serve ? 'sandbox' : 'src', 'index.tsx'),
  });

  delete config.externals;

  config = merge(config, {
    resolve: {
      alias: {
        // Dependencies for the unsupported connection types in data-service
        '@mongodb-js/ssh-tunnel': false,
        ssh2: false,

        // Used for randomBytes in a few places
        crypto: localPolyfill('crypto'),

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
        zlib: false,
        v8: false,
        electron: false,
        'hadron-ipc': false,

        // TODO(COMPASS-7411): compass-user-data
        // can't disable the whole module, imports used directly in module scope
        // '@mongodb-js/compass-user-data': false,
        worker_threads: false,

        // TODO(COMPASS-7411): compass-utils
        fs: localPolyfill('fs'),

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
        // string correctly at the moment, but we should also omit some
        // depdendencies that might not be required for this to work in the
        // browser
        url: require.resolve('whatwg-url'),
        // Make sure we're not getting multiple versions included
        'whatwg-url': require.resolve('whatwg-url'),
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: require.resolve('process/browser'),
      }),
    ],
  });

  if (serve) {
    // TODO: logs are pretty rough here, should make it better
    createWebSocketProxy();

    config.output = {
      path: config.output.path,
      filename: config.output.filename,
      assetModuleFilename: config.output.assetModuleFilename,
    };

    return merge(config, {
      devServer: {
        hot: true,
        open: true,
        magicHtml: false,
        historyApiFallback: {
          rewrites: [{ from: /./, to: 'index.html' }],
        },
        static: {
          directory: path.resolve(__dirname, 'sandbox'),
          publicPath: '/',
        },
        client: {
          overlay: { warnings: false, errors: true, runtimeErrors: true },
        },
      },
      resolve: {
        alias: {
          // TODO(ticket): move mongodb-browser from mms to the monorepo and
          // package it too
          mongodb: require.resolve('@gribnoysup/mongodb-browser'),
        },
      },
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

      // TODO(CLOUDP-228421): move mongodb-browser from mms to the monorepo and
      // package it too
      bson: 'commonjs2 bson',
      mongodb: 'commonjs2 mongodb',
    },
  });
};
