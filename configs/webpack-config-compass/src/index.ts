import type {
  Compiler,
  Configuration,
  WebpackOptionsNormalized,
} from 'webpack';
import { EnvironmentPlugin } from 'webpack';
import { merge } from 'webpack-merge';
import fs from 'fs';
import HtmlWebpackPlugin from 'html-webpack-plugin';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
import path from 'path';
import { builtinModules } from 'module';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { once } from 'events';

const electronVersion = (() => {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const [maj, min] = require('electron/package.json').version.split(
    '.'
  ) as string[];
  return `${maj}.${min}`;
})();

const electronBinary: string = (() => {
  return require('electron');
})();

class StartElectronWebpackPlugin {
  private opts: {
    mainEntry: string;
    rendererEntries: string[];
    devServerPort: number;
    liveReload?: boolean;
  };

  private electronProcess: ChildProcess | null = null;

  constructor(
    opts: {
      mainEntry?: string;
      liveReload?: boolean;
      rendererEntries?: string[];
    } = {}
  ) {
    this.opts = {
      mainEntry: 'index',
      rendererEntries: [],
      liveReload: true,
      devServerPort: 4242,
      ...opts,
    };
  }

  apply(compiler: Compiler): void {
    // This will set environmental variables that can be used by main process to
    // know what BrowserWindow to open exactly
    const entries = Object.fromEntries(
      this.opts.rendererEntries.map((name) => {
        return [
          `COMPASS_${name.toUpperCase()}_RENDERER_URL`,
          `http://localhost:${this.opts.devServerPort}/${name}.html`,
        ];
      })
    );
    const envPlugin = new EnvironmentPlugin(entries);

    envPlugin.apply(compiler);

    // This will spawn an eletron process when the main file is emitted in the
    // fs by webpack
    compiler.hooks.afterEmit.tapPromise(
      'StartElectronWebpackPlugin',
      async (compilation) => {
        const entryChunk = compilation.namedChunks.get(this.opts.mainEntry);
        const entryChunkFilename = entryChunk?.files.values().next().value;

        if (!compilation.options.output.path) {
          throw new Error('Output path is required');
        }

        const fullPath = path.join(
          compilation.options.output.path,
          entryChunkFilename
        );

        if (this.electronProcess !== null && this.opts.liveReload) {
          compilation.logger.info(
            'Restarting electron application: killing currently running app'
          );
          await this.kill(this.electronProcess);
          this.electronProcess = null;
        }

        if (this.electronProcess === null) {
          compilation.logger.info('Starting electron application');
          this.electronProcess = spawn(electronBinary, [fullPath]);
        }
      }
    );
  }

  setMainEntry(mainEntry: string): void {
    this.opts.mainEntry = mainEntry;
  }

  setRendererEntries(entries: string[]): void {
    this.opts.rendererEntries = entries;
  }

  setLiveReload(liveReload: boolean): void {
    this.opts.liveReload = liveReload;
  }

  setDevServerPort(port: number): void {
    this.opts.devServerPort = port;
  }

  private async kill(
    childProcess: ChildProcess,
    code: NodeJS.Signals | number = 'SIGTERM'
  ): Promise<void> {
    childProcess.kill(code);
    if (childProcess.exitCode === null && childProcess.signalCode === null) {
      await once(childProcess, 'exit');
    }
  }
}

const startElectronWebpackPlugin = new StartElectronWebpackPlugin();

type WebpackConfig = Configuration &
  Pick<WebpackOptionsNormalized, 'devServer'>;

type WebpackCLIArgs = {
  entry: string | string[];
  configName?: string | string[];
  name?: string;
  color?: boolean;
  merge?: boolean;
  env: typeof process.env & {
    WEBPACK_BUNDLE?: true;
    WEBPACK_BUILD?: true;
    WEBPACK_SERVE?: true;
  };
  nodeEnv: string;
  progress?: boolean | string;
  outputPath: string;
  target?: string | string[];
  watch?: boolean;
  watchOptionsStdin?: boolean;
  hot?: boolean;
  devtool?: string | false;
  prefetch?: boolean;
  json?: boolean | string;
  mode: WebpackConfig['mode'];
  stats?: boolean | string;
  analyze?: boolean;
};

type CompassConfigArgs = {
  outputFilename?: string;
  mainProcessLiveReload: boolean;
  devServerPort: number;
  cwd: string;
};

type ConfigArgs = WebpackCLIArgs & CompassConfigArgs;

function isMode(str?: string): str is WebpackConfig['mode'] {
  return ['development', 'production', 'none', undefined].includes(str);
}

function isServe(args: WebpackCLIArgs) {
  return Boolean(args?.env?.WEBPACK_SERVE);
}

function argsWithDefaults(
  args: Partial<ConfigArgs>,
  ...more: Partial<ConfigArgs>[]
): ConfigArgs {
  const cwd = process.cwd();

  return merge<ConfigArgs>(
    {
      entry: path.join(cwd, 'src', 'index.js'),
      env: {},
      nodeEnv: process.env.NODE_ENV ?? args.mode ?? 'production',
      outputPath: path.join(cwd, 'dist'),
      watch: false,
      watchOptionsStdin: false,
      hot: false,
      mode:
        isMode(process.env.NODE_ENV) && process.env.NODE_ENV
          ? process.env.NODE_ENV
          : 'production',
      mainProcessLiveReload: true,
      devServerPort: 4242,
      cwd,
    },
    args as ConfigArgs,
    ...(more as ConfigArgs[])
  );
}

const javascriptLoader = (args: ConfigArgs) => ({
  test: /\.(jsx?|tsx?)$/,
  // Otherwise core-js will polyfill itself with core-js and this doesn't work
  // for obvious reasons
  exclude: [/\bcore-js\b/],
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
        // react-refresh only works when NODE_ENV is dev and will throw otherwise
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
const nodeLoader = (_args: ConfigArgs) => ({
  test: /\.node$/,
  use: [{ loader: require.resolve('node-loader') }],
});

// eslint-disable-next-line @typescript-eslint/no-unused-vars
const cssLoader = (_args: ConfigArgs) => ({
  test: /\.css$/,
  use: [
    { loader: require.resolve('style-loader') },
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

const lessLoader = (args: ConfigArgs) => ({
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
const assetsLoader = (_args: ConfigArgs) => ({
  test: /\.(jpe?g|png|svg|gif|woff|woff2|ttf|eot)(\?.+?)?$/,
  type: 'asset',
  parser: {
    dataUrlCondition: {
      maxSize: 2 * 1024, // 2kb
    },
  },
});

const sourceLoader = (args: ConfigArgs) => ({
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

const externals = [
  // All peer dependencies of all Compass plugins
  '@leafygreen-ui/badge',
  '@leafygreen-ui/banner',
  '@leafygreen-ui/button',
  '@leafygreen-ui/checkbox',
  '@leafygreen-ui/icon',
  '@leafygreen-ui/icon-button',
  '@leafygreen-ui/leafygreen-provider',
  '@leafygreen-ui/portal',
  '@leafygreen-ui/select',
  '@leafygreen-ui/text-input',
  '@leafygreen-ui/toggle',
  '@leafygreen-ui/tooltip',
  '@leafygreen-ui/typography',
  '@mongodb-js/compass-components',
  '@mongodb-js/compass-connect',
  '@mongodb-js/compass-crud',
  '@mongodb-js/compass-deployment-awareness',
  '@mongodb-js/compass-export-to-language',
  '@mongodb-js/compass-field-store',
  '@mongodb-js/compass-indexes',
  '@mongodb-js/compass-query-bar',
  '@mongodb-js/compass-query-history',
  '@mongodb-js/compass-status',
  'async',
  'bson',
  'bson-transpilers',
  'd3',
  'debug',
  'electron',
  'hadron-document',
  'hadron-ipc',
  'hadron-react-bson',
  'hadron-react-buttons',
  'hadron-react-components',
  'jquery',
  'moment',
  'mongodb-ace-autocompleter',
  'mongodb-ace-mode',
  'mongodb-ace-theme',
  'mongodb-ace-theme-query',
  'mongodb-connection-model',
  'mongodb-data-service',
  'mongodb-extended-json',
  'mongodb-index-model',
  'mongodb-instance-model',
  'mongodb-js-metrics',
  'mongodb-language-model',
  'mongodb-ns',
  'mongodb-query-parser',
  'mongodb-schema',
  'numeral',
  'prop-types',
  'react',
  'react-ace',
  'react-bootstrap',
  'react-dom',
  'react-fontawesome',
  'react-redux',
  'react-select-plus',
  'react-tooltip',
  'redux',
  'redux-thunk',
  'reflux',
  'reflux-state-mixin',
  'storage-mixin',
  // MongoDB Node.js Driver stuff
  'bson-ext',
  'snappy',
];

type SimpleEntry = string | string[] | Record<string, string>;

function entriesToNamedEntries(entry: SimpleEntry): Record<string, string> {
  return typeof entry === 'string'
    ? { [path.basename(entry).replace(/\.(jsx?|tsx?)$/, '')]: entry }
    : Array.isArray(entry)
    ? Object.fromEntries(
        entry.map((entryPath) => [
          path.basename(entryPath).replace(/\.(jsx?|tsx?)$/, ''),
          entryPath,
        ])
      )
    : entry;
}

function entriesToHtml(entries: Record<string, string>) {
  return Array.from(
    Object.entries(entries).map(([name, entryPath]) => {
      let template = 'auto';

      try {
        const maybeTemplatePath = entryPath.replace(/\.(jsx?|tsx?)$/, '.html');
        fs.statSync(maybeTemplatePath);
        template = maybeTemplatePath;
      } catch (e) {
        // ignore and use default template, electron renderer entry will need
        // at least some kind of html page provided one way or the other
      }

      return new HtmlWebpackPlugin({
        filename: `${name}.html`,
        template,
        chunks: [name],
      });
    })
  );
}

function camelCase(str: string): string {
  return str
    .split(/[\W_]+/)
    .filter(Boolean)
    .map(([first, ...word]: string) => first.toUpperCase() + word.join(''))
    .join('');
}

export function createElectronMainConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = argsWithDefaults(args);
  const namedEntry = entriesToNamedEntries(opts.entry);

  startElectronWebpackPlugin.setMainEntry(Object.keys(namedEntry)[0]);
  startElectronWebpackPlugin.setLiveReload(opts.mainProcessLiveReload);

  const config = {
    entry: namedEntry,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].main.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    mode: opts.mode,
    target: 'electron-main',
    module: {
      rules: [javascriptLoader(opts), nodeLoader(opts), sourceLoader(opts)],
    },
    node: false as const,
    resolve: {
      extensions: ['.jsx', '.tsx', '.ts', '...'],
    },
  };

  return merge<Configuration>(
    config,
    opts.mode === 'development'
      ? {
          output: {
            filename: opts.outputFilename ?? '[name].main.js',
            assetModuleFilename: 'assets/[name][ext]',
          },
        }
      : {},
    isServe(opts) ? { plugins: [startElectronWebpackPlugin] } : {}
  );
}

export function createElectronRendererConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = argsWithDefaults(args);
  const entries = entriesToNamedEntries(opts.entry);

  startElectronWebpackPlugin.setRendererEntries(Object.keys(entries));
  startElectronWebpackPlugin.setDevServerPort(opts.devServerPort);

  const config = {
    entry: entries,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].renderer.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
    },
    mode: opts.mode,
    target: 'electron-renderer',
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sourceLoader(opts),
      ],
    },
    plugins: [...entriesToHtml(entries)],
    node: false as const,
    // TODO: Only required until we also make compass plugins pass through a
    // single webpack compilation with the Compass app itself
    externals: Object.fromEntries(
      externals.map((depName) => [depName, `commonjs2 ${depName}`])
    ),
    resolve: {
      extensions: ['.jsx', '.tsx', '.ts', '...'],
    },
  };

  return merge<WebpackConfig>(
    config,
    opts.mode === 'development'
      ? {
          output: {
            filename: opts.outputFilename ?? '[name].renderer.js',
            assetModuleFilename: 'assets/[name][ext]',
          },
        }
      : {},
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-expect-error ReactRefreshWebpackPlugin resolves webpack types from
    //                  the root of the monorepo where they are incompatible
    //                  with the webpack version we are using here
    //
    // TODO: This should go away when all plugins are on the same webpack
    // version
    isServe(opts)
      ? {
          devServer: {
            magicHtml: false,
            port: opts.devServerPort,
            devMiddleware: {
              // It's slower than in-memory fs, but required so that we can
              // start the electron app
              writeToDisk: true,
            },
            https: false,
            client: {
              // TODO: It's a nice feature, but it doesn't work well with
              // compass main. We might want to re-enable it when compass
              // doesn't have a separate loading screen anymore
              overlay: false,
            },
            hot: opts.hot,
          },
          plugins: opts.hot ? [new ReactRefreshWebpackPlugin()] : [],
        }
      : {}
  );
}

export function createWebConfig(args: Partial<ConfigArgs>): WebpackConfig {
  const opts = argsWithDefaults(args);

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { name, productName, peerDependencies = {} } = require(path.join(
    opts.cwd,
    'package.json'
  ));

  const library = camelCase(productName || name);

  return {
    entry: entriesToNamedEntries(opts.entry),
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].js',
      assetModuleFilename: 'assets/[name][ext]',
      library,
      libraryTarget: 'umd',
      publicPath: './',
    },
    mode: opts.mode,
    target: 'web',
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sourceLoader(opts),
      ],
    },
    // This follows current Compass plugin behavior and is here more or less to
    // keep compat for the external plugin users
    externals: Object.fromEntries(
      Object.keys(peerDependencies)
        .concat(builtinModules)
        .map((depName) => [depName, `commonjs2 ${depName}`])
    ),
    resolve: {
      extensions: ['.jsx', '.tsx', '.ts', '...'],
    },
  };
}

export function compassPluginConfig(
  _env: WebpackCLIArgs['env'],
  _args: Partial<WebpackCLIArgs>
): WebpackConfig[] {
  const args = argsWithDefaults(_args);
  const opts = { ...args, outputPath: path.join(args.cwd, 'lib'), hot: true };

  process.env.NODE_ENV = opts.nodeEnv;

  if (isServe(opts)) {
    return [
      createElectronMainConfig({
        ...opts,
        entry: path.join(opts.cwd, 'electron', 'index.js'),
      }),
      createElectronRendererConfig({
        ...opts,
        entry: path.join(opts.cwd, 'electron', 'renderer', 'index.js'),
      }),
    ];
  }

  return [
    createElectronRendererConfig({
      ...opts,
      entry: path.join(opts.cwd, 'src', 'index.js'),
      outputFilename: 'index.js',
    }),
    createWebConfig({
      ...opts,
      entry: path.join(opts.cwd, 'src', 'index.js'),
      outputFilename: 'browser.js',
    }),
  ];
}
