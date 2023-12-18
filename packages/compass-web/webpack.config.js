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
  let config = createWebConfig({
    ...args,
    entry: path.resolve(__dirname, 'src', 'index.tsx'),
  });

  delete config.externals;

  config = merge(config, {
    resolve: {
      alias: {
        // Leafygreen tries to include all the server-side emotion stuff in
        // the client bundle, this requires packaging a ton of otherwise
        // unneccessary polyfills. To work around this, we're prviding a
        // minimally required polyfill for code not to break
        //
        // TODO(ticket): move this to shared config, all our code will benefit
        // from this, also ask leafygreen again if they ever plan to fix this
        '@emotion/server/create-instance': localPolyfill(
          '@emotion/server/create-instance'
        ),

        // TODO(ticket): data-service (only certain connection types, not
        // explicitly optional)
        '@mongodb-js/ssh-tunnel': false,
        ssh2: false,

        // TODO(ticket): data-service -> devtools-connect (only certain
        // connection types, not explicitly optional)
        '@mongodb-js/oidc-plugin': localPolyfill('@mongodb-js/oidc-plugin'),
        'system-ca': false,
        http: localPolyfill('http'),
        zlib: false,
        os: localPolyfill('os'),
        crypto: localPolyfill('crypto'),

        // TODO(ticket): non-optional data-service -> devtools-connect required
        // for +srv, should be skippable
        dns: false,
        'os-dns-native': false,
        'resolve-mongodb-srv': false,

        // TODO(ticket): compass-logging
        // hard to disable the whole thing while there are direct dependencies
        // on logger
        // 'mongodb-log-writer': localPolyfill('mongodb-log-writer'),
        v8: false,
        // TODO(ticket): compass-logging
        'hadron-ipc': false,

        // TODO(ticket): compass-user-data
        // can't disable the whole module, imports used directly in module scope
        // '@mongodb-js/compass-user-data': false,
        worker_threads: false,

        // TODO(ticket): compass-utils
        fs: localPolyfill('fs'),

        // TODO(ticket): required by FileInput component, we probably can remove
        // this dependency from the package
        path: require.resolve('path-browserify'),

        // Optional data-service -> devtools-connect dependencies
        socks: false,
        'mongodb-client-encryption': false,
        kerberos: false,

        // Things that are easier to polyfill than not to (TODO: we can limit
        // the polyfilling here by not using third party packages for it)
        stream: require.resolve('readable-stream'),
        // The `/` so that we are resolving the installed polyfill version, not
        // a built-in Node.js one
        util: require.resolve('util/'),
        buffer: require.resolve('buffer/'),
        events: require.resolve('events/'),

        // TODO(ticket): requires a polyfill to be able to parse connection
        // string correctly at the moment, but we should also omit some
        // depdendencies that might not be required for this to work in the
        // browser
        url: require.resolve('whatwg-url'),
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

  if (isServe({ env })) {
    // TODO: logs are pretty rough here, should make it better
    createWebSocketProxy();

    config.entry = path.resolve(__dirname, 'sandbox', 'index.tsx');

    config.output = {
      path: path.resolve(__dirname, 'dist'),
      filename: 'index.js',
    };

    return merge(config, {
      devServer: {
        magicHtml: false,
        historyApiFallback: {
          rewrites: [{ from: /./, to: 'index.html' }],
        },
        hot: true,
        static: {
          directory: path.resolve(__dirname, 'sandbox'),
          publicPath: '/',
        },
        client: {
          overlay: { errors: true, warnings: false, runtimeErrors: false },
        },
      },
      resolve: {
        alias: {
          mongodb: require.resolve('@gribnoysup/mongodb-browser'),

          // NB: We polyfill those in `@gribnoysup/mongodb-browser` already, but
          // devtools-connect does its own dns resolution for srv so we have to
          // do it again. This is something that potentially mms will also need
          // to do on their side if they ever want to support srv connections
          // (but they don't need to, they already have a resolved info for
          // connection on their side)
          dns: localPolyfill('dns'),
          'os-dns-native': localPolyfill('os-dns-native'),
          // We exclude it for the published  distribution as it requires dns
          // resolution to work which is not expected
          'resolve-mongodb-srv': require.resolve('resolve-mongodb-srv'),
        },
      },
    });
  }

  return merge(config, {
    resolve: {
      externals: {
        mongodb: 'commonjs2 mongodb',
      },
    },
  });
};
