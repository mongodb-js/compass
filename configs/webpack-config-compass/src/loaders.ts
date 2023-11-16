import browserslist from 'browserslist';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import { execSync } from 'child_process';

import type { ConfigArgs } from './args';
import { isServe } from './args';
import chalk from 'chalk';

function isLatestBrowserslist() {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const browserslistVersion = require('browserslist/package.json').version;
  const command = `npm view browserslist version --json`;
  const latestBrowserslistVersion = JSON.parse(
    execSync(command).toString().trim()
  );

  return browserslistVersion === latestBrowserslistVersion;
}

const electronVersion = (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const [maj, min] = require('electron/package.json').version.split(
    '.'
  ) as string[];

  return `${maj}.${min}`;
})();

const browserslistElectronVersion = (() => {
  const installedElectronVersion = `electron ${electronVersion}`;
  try {
    // Occasionally it may happen that browserslist does not catch up with
    // Electron versions.

    // If we discover that our version of Electron is not supported by browserslist
    // we first try to determine if a new version of browserslist is avaliable.
    //
    // If a new version of browserslist is available we throw an error and prompt to update
    // browserslist, otherwise we ignore the error and we use the last known electron version.
    browserslist(installedElectronVersion);
    return installedElectronVersion;
  } catch (e) {
    if (!isLatestBrowserslist()) {
      const errorMessage = `${(e as Error).message}.
Please update browserslist in webpack-config-compass:
npm i -S -w @mongodb-js/webpack-config-compass browserslist@latest`;
      throw new Error(chalk.red(errorMessage));
    }

    return 'last 1 electron version';
  }
})();

/**
 * "Cloud Manager can be accessed on your computer through Chrome, Firefox, Safari and Edge. We no longer support IE."
 * @see {@link https://wiki.corp.mongodb.com/x/n5kVBQ}
 */
const cloudSupportedBrowserslistConfig =
  'last 1 Chrome versions, last 1 Safari versions, last 1 Firefox versions, last 1 Edge versions';

export const javascriptLoader = (args: ConfigArgs, web = false) => ({
  test: /\.(mjs|c?jsx?|tsx?)$/,
  exclude: [
    /\bnode_modules\b/,
    // Otherwise core-js will polyfill itself with core-js and this doesn't work
    // for obvious reasons
    /\bcore-js\b/,
  ],
  use: {
    loader: require.resolve('babel-loader'),
    options: {
      babelrc: false,
      sourceType: 'unambiguous',
      presets: [
        [
          require.resolve('@babel/preset-env'),
          {
            targets: web
              ? cloudSupportedBrowserslistConfig
              : browserslistElectronVersion,
            useBuiltIns: 'usage',
            corejs: { version: '3.12', proposals: true },
          },
        ],
        require.resolve('@babel/preset-react'),
        require.resolve('@babel/preset-typescript'),
      ],
      plugins: [
        [
          require.resolve('@babel/plugin-transform-runtime'),
          {
            helpers: true,
            regenerator: true,
            corejs: false,
          },
        ],
        [
          require.resolve('@babel/plugin-proposal-decorators'),
          { version: '2023-01' },
        ],
        args.coverage && [
          'istanbul',
          {
            cwd: args.coverage,
          },
        ],
        ['web', 'electron-renderer'].includes(args.target as string) &&
          // react-refresh only works when NODE_ENV is dev and will throw
          // otherwise
          args.nodeEnv === 'development' &&
          // we only need it when webpack-dev-server is running
          isServe(args) &&
          // and only if hot-reload is enabled (it is not in Compass main right
          // now)
          args.hot &&
          require.resolve('react-refresh/babel'),
      ].filter(Boolean),
    },
  },
});

export const sourceMapLoader = (args: ConfigArgs) => ({
  test: /\.(mjs|c?jsx?|tsx?)$/,
  enforce: 'pre',
  use: [
    {
      loader: require.resolve('source-map-loader'),
      options: {
        filterSourceMappingUrl() {
          return args.env.WEBPACK_SERVE === true ? 'consume' : 'remove';
        },
      },
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const nodeLoader = (_args: ConfigArgs) => ({
  test: /\.node$/,
  use: [{ loader: require.resolve('node-loader') }],
});

export const cssLoader = (args: ConfigArgs, web = false) => ({
  test: /\.css$/,
  use: [
    args.mode === 'production' && args.target === 'electron-renderer'
      ? MiniCssExtractPlugin.loader
      : { loader: require.resolve('style-loader') },
    {
      loader: require.resolve('css-loader'),
      options: {
        importLoaders: 1,
        modules: {
          auto: true,
          localIdentName: '[name]-[local]__[hash:base64:5]',
        },
      },
    },
    {
      loader: require.resolve('postcss-loader'),
      options: {
        postcssOptions: {
          plugins: [
            [
              require.resolve('postcss-preset-env'),
              {
                browsers: web
                  ? cloudSupportedBrowserslistConfig
                  : browserslistElectronVersion,
              },
            ],
          ],
        },
      },
    },
  ],
});

export const lessLoader = (args: ConfigArgs) => ({
  test: /\.less$/,
  use: [
    ...cssLoader(args).use,
    {
      loader: require.resolve('less-loader'),
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assetsLoader = (_args: ConfigArgs) => ({
  test: /\.(jpe?g|png|svg|gif|woff|woff2|ttf|eot|otf)(\?.+?)?$/,
  // asset (or asset auto) will either compile as data-uri or to a file path
  // based on the size, this is a good strategy for loading assets in the GUI
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 2 * 1024, // 2kb
    },
  },
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const resourceLoader = (_args: ConfigArgs) => ({
  test: /\.(jpe?g|png|svg|gif|woff|woff2|ttf|eot|otf)(\?.+?)?$/,
  // asset/resource always compiles imports to paths to files, this is a good
  // strategy for electron main (node.js) process where handling data uris might
  // be more work than handling files
  type: 'asset/resource',
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const sharedObjectLoader = (_args: ConfigArgs) => ({
  test: /\.(dylib|so|dll)(\?.+?)?$/,
  // asset/resource always compiles imports to paths to files, this is a good
  // strategy for electron main (node.js) process where handling data uris might
  // be more work than handling files
  type: 'asset/resource',
});

export const sourceLoader = (args: ConfigArgs) => ({
  exclude: [
    javascriptLoader(args).test,
    nodeLoader(args).test,
    cssLoader(args).test,
    lessLoader(args).test,
    assetsLoader(args).test,
    sharedObjectLoader(args).test,
    // Produced by html-webpack-plugin and should not be handled
    /\.(ejs|html)$/,
    // Handled nicely by Webpack by default, no need to load it as raw source
    /\.json$/,
  ],
  type: 'asset/source',
});
