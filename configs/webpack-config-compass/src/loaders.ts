import path from 'path';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';
import type { ConfigArgs } from './args';
import { isServe } from './args';

const electronVersion = (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const [maj, min] = require('electron/package.json').version.split(
    '.'
  ) as string[];
  return `${maj}.${min}`;
})();

export const javascriptLoader = (args: ConfigArgs) => ({
  test: /\.(mjs|jsx?|tsx?)$/,
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
            targets: { electron: electronVersion },
            useBuiltIns: 'usage',
            corejs: { version: '3.12', proposals: true },
          },
        ],
        require.resolve('@babel/preset-react'),
        require.resolve('@babel/preset-typescript'),
      ],
      plugins: [
        [
          require.resolve('@babel/plugin-proposal-decorators'),
          { legacy: true },
        ],
        args.coverage && ['istanbul', {
          // all of mongodb-js/compass, not just packages/compass
          cwd: path.dirname(path.dirname(process.cwd()))
        }],
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

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const nodeLoader = (_args: ConfigArgs) => ({
  test: /\.node$/,
  use: [{ loader: require.resolve('node-loader') }],
});

export const cssLoader = (args: ConfigArgs) => ({
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
              { browsers: `electron ${electronVersion}` },
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
      options: {
        lessOptions: {
          modifyVars: {
            'fa-font-path': path.dirname(
              require.resolve('mongodb-compass/src/app/fonts/FontAwesome.otf')
            ),
          },
        },
      },
    },
  ],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export const assetsLoader = (_args: ConfigArgs) => ({
  test: /\.(jpe?g|png|svg|gif|woff|woff2|ttf|eot)(\?.+?)?$/,
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
  test: /\.(jpe?g|png|svg|gif|woff|woff2|ttf|eot)(\?.+?)?$/,
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
    // Produced by html-webpack-plugin and should not be handled
    /\.(ejs|html)$/,
    // Handled nicely by Webpack by default, no need to load it as raw source
    /\.json$/,
  ],
  type: 'asset/source',
});
