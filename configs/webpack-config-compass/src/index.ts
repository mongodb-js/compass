import fs from 'fs';
import type {
  ResolveOptions,
  WebpackPluginInstance,
  Configuration,
} from 'webpack';
import { merge } from 'webpack-merge';
import ReactRefreshWebpackPlugin from '@pmmmwh/react-refresh-webpack-plugin';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-expect-error no types exist for this library
import DuplicatePackageCheckerPlugin from '@cerner/duplicate-package-checker-webpack-plugin';
import path from 'path';
import { builtinModules } from 'module';
import { BundleAnalyzerPlugin } from 'webpack-bundle-analyzer';
import { WebpackPluginStartElectron } from './webpack-plugin-start-electron';
import type { ConfigArgs, WebpackConfig, WebpackCLIArgs } from './args';
import { isServe, webpackArgsWithDefaults } from './args';
import {
  sourceMapLoader,
  javascriptLoader,
  nodeLoader,
  sourceLoader,
  cssLoader,
  lessLoader,
  assetsLoader,
  resourceLoader,
  sharedObjectLoader,
} from './loaders';
import {
  entriesToNamedEntries,
  toCommonJsExternal,
  entriesToHtml,
  getLibraryNameFromCwd,
} from './util';
import { sharedExternals, pluginExternals } from './externals';
import { WebpackPluginMulticompilerProgress } from './webpack-plugin-multicompiler-progress';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const sharedIgnoreWarnings: NonNullable<Configuration['ignoreWarnings']> = [
  // Usually caused by published d.ts files pointing to non-existent ts files in
  // the ignored for publish source folder
  /Failed to parse source map.+?ENOENT/,
  // Expected in most cases for Compass
  /require function is used in a way in which dependencies cannot be statically extracted/,
  /the request of a dependency is an expression/,
  // Optional, platform-specific dependencies (mostly from driver)
  /Module not found.+?(mongo_crypt_v1.(dll|so|dylib)|@mongodb-js\/zstd|aws-crt|gcp-metadata)/,
];

const sharedResolveOptions = (
  target: ConfigArgs['target']
): Pick<
  ResolveOptions,
  'mainFields' | 'exportsFields' | 'extensions' | 'alias'
> => {
  if (typeof target === 'string') {
    target = [target];
  }
  return {
    // This replicates webpack behavior with additional special `compass:` keys
    // taking priority over the default ones that webpack uses
    //
    // See https://webpack.js.org/configuration/resolve/#resolvemainfields
    mainFields:
      target?.includes('web') || target?.includes('webworker')
        ? [
            'compass:browser',
            'compass:module',
            'compass:main',
            'browser',
            'module',
            'main',
          ]
        : ['compass:module', 'compass:main', 'module', 'main'],
    exportsFields: ['compass:exports', 'exports'],
    extensions: ['.jsx', '.tsx', '.ts', '...'],
    alias: {
      // Removes `browserslist` that is pulled in by `babel` and is unnecessary
      // as well as being a particularly large dependency.
      browserslist: false,
      // Removes `ampersand-sync`: `ampersand-sync` is required by `ampersand-model`,
      // but is not actually used in Compass, we don't fetch and save models via http.
      // Additionally `ampersand-sync` brings into the bundle a number of other dependencies
      // that are outdated and having known vulnerabilities.
      'ampersand-sync': false,
      // `jose` provides a browser export that uses webcrypto APIs and returns
      // webcrypto objects to represent keys, but openid-client requires
      // KeyObject instances from the Node.js crypto API (https://tinyurl.com/2rrtu2hy).
      // Manually resolve `jose` to use the Node.js export here.
      jose: require.resolve('jose'),
    },
  };
};

export function createElectronMainConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'electron-main' });
  const namedEntry = entriesToNamedEntries(opts.entry);

  const config = {
    entry: namedEntry,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].main.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
      strictModuleErrorHandling: true,
      strictModuleExceptionHandling: true,
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        sourceMapLoader(opts),
        javascriptLoader(opts),
        nodeLoader(opts),
        resourceLoader(opts),
        sharedObjectLoader(opts),
        sourceLoader(opts),
      ],
    },
    node: false as const,
    externals: toCommonJsExternal(sharedExternals),
    resolve: {
      // To avoid resolving the `browser` field
      aliasFields: [],
      ...sharedResolveOptions(opts.target),
    },
    plugins: [new WebpackPluginMulticompilerProgress()],
    ignoreWarnings: sharedIgnoreWarnings,
  };

  return merge<WebpackConfig>(
    config,
    opts.mode === 'development'
      ? {
          output: {
            filename: opts.outputFilename ?? '[name].main.js',
            assetModuleFilename: 'assets/[name][ext]',
          },
        }
      : {},
    isServe(opts) ? { plugins: [new WebpackPluginStartElectron()] } : {},
    opts.analyze
      ? {
          plugins: [
            // Plugin types are not matching Webpack 5, but they work
            new BundleAnalyzerPlugin({
              logLevel: 'silent',
              analyzerPort: 'auto',
            }) as unknown as WebpackPluginInstance,

            new DuplicatePackageCheckerPlugin(),
          ],
        }
      : {}
  );
}

export function createElectronRendererConfig(
  args: Partial<ConfigArgs>
): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'electron-renderer' });
  const entries = entriesToNamedEntries(opts.entry);

  const config = {
    entry: entries,
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].[contenthash].renderer.js',
      assetModuleFilename: 'assets/[name].[hash][ext]',
      library: opts.library ?? getLibraryNameFromCwd(opts.cwd),
      libraryTarget: 'umd',
      strictModuleErrorHandling: true,
      strictModuleExceptionHandling: true,
      globalObject: 'globalThis',
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        sourceMapLoader(opts),
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sharedObjectLoader(opts),
        sourceLoader(opts),
      ],
    },
    plugins: [
      ...entriesToHtml(entries),
      new WebpackPluginMulticompilerProgress(),
    ],
    node: false as const,
    externals: toCommonJsExternal(sharedExternals),
    resolve: {
      // To avoid resolving the `browser` field
      aliasFields: [],
      ...sharedResolveOptions(opts.target),
    },
    ignoreWarnings: sharedIgnoreWarnings,
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
    opts.mode === 'production'
      ? {
          plugins: [
            new MiniCssExtractPlugin(),
          ] as unknown as WebpackPluginInstance[],
        }
      : {},
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
            client: {
              overlay: {
                errors: true,
                warnings: false,
              },
            },
            https: false,
            hot: opts.hot,
          },
          plugins: [
            new WebpackPluginStartElectron() as WebpackPluginInstance,
          ].concat(
            opts.hot
              ? [
                  // Plugin types are not matching Webpack 5, but they work
                  new ReactRefreshWebpackPlugin() as unknown as WebpackPluginInstance,
                ]
              : []
          ),
        }
      : {},
    opts.analyze
      ? {
          plugins: [
            // Plugin types are not matching Webpack 5, but they work
            new BundleAnalyzerPlugin({
              logLevel: 'silent',
              analyzerPort: 'auto',
            }) as unknown as WebpackPluginInstance,

            new DuplicatePackageCheckerPlugin(),
          ],
        }
      : {}
  );
}

export function createWebConfig(args: Partial<ConfigArgs>): WebpackConfig {
  const opts = webpackArgsWithDefaults(args, { target: 'web' });

  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { peerDependencies } = require(path.join(opts.cwd, 'package.json')) as {
    peerDependencies: Record<string, string>;
  };

  return {
    entry: entriesToNamedEntries(opts.entry),
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].js',
      assetModuleFilename: 'assets/[name][ext]',
      library: opts.library ?? getLibraryNameFromCwd(opts.cwd),
      libraryTarget: 'umd',
      // These two options are subtly different, and while
      // `strictModuleExceptionHandling` is deprecated, it is the only
      // one that actually gives us the right behavior currently.
      // https://github.com/webpack/webpack/blob/3ad4fcac25a976277f2d9cceb37bc81602e96b13/lib/javascript/JavascriptModulesPlugin.js#L1326-L1346
      // Note that hot module reloading turns these on by default,
      // so this is only affecting production builds and not the
      // typical development mode that we work in.
      strictModuleErrorHandling: true,
      strictModuleExceptionHandling: true,
      globalObject: 'globalThis',
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        sourceMapLoader(opts),
        javascriptLoader(opts, true),
        nodeLoader(opts),
        cssLoader(opts, true),
        lessLoader(opts),
        assetsLoader(opts),
        sourceLoader(opts),
      ],
    },
    // This follows current Compass plugin behavior and is here more or less to
    // keep compat for the external plugin users
    externals: {
      ...toCommonJsExternal(sharedExternals),
      ...toCommonJsExternal(Object.keys(peerDependencies ?? {})),
      ...toCommonJsExternal(builtinModules.flatMap((m) => [m, `node:${m}`])),
    },
    resolve: {
      ...sharedResolveOptions(opts.target),
    },
    ignoreWarnings: sharedIgnoreWarnings,
  };
}

export function compassPluginConfig(
  _env: WebpackCLIArgs['env'],
  _args: Partial<WebpackCLIArgs>
): WebpackConfig[] {
  const args = webpackArgsWithDefaults(_args);
  const opts = { ...args, hot: true };

  process.env.NODE_ENV = opts.nodeEnv;

  if (isServe(opts)) {
    const sandboxMain = path.join(opts.cwd, 'electron', 'index.js');
    const sandboxRenderer = path.join(
      opts.cwd,
      'electron',
      'renderer',
      'index.js'
    );

    try {
      fs.statSync(sandboxMain);
      fs.statSync(sandboxRenderer);
    } catch (e) {
      throw new Error(
        `Compass plugin is missing sandbox entry points. To be able to run the plugin in a sandbox outside of Compass, please add ./electron/index.ts and ./electron/renderer/index.ts entry points`
      );
    }

    return [
      merge(
        createElectronMainConfig({
          ...opts,
          entry: sandboxMain,
        }),
        { externals: toCommonJsExternal(pluginExternals) }
      ),
      merge(
        createElectronRendererConfig({
          ...opts,
          entry: sandboxRenderer,
        }),
        { externals: toCommonJsExternal(pluginExternals) }
      ),
    ];
  }

  const entry = fs.existsSync(path.join(opts.cwd, 'src', 'index.ts'))
    ? path.join(opts.cwd, 'src', 'index.ts')
    : path.join(opts.cwd, 'src', 'index.js');

  return [
    merge(
      createElectronRendererConfig({
        ...opts,
        entry,
        outputFilename: 'index.js',
      }),
      {
        externals: toCommonJsExternal(pluginExternals),
        plugins: [
          // For plugins, clean up the dist folder first before proceeding
          function (compiler) {
            compiler.hooks.initialize.tap('CleanDistPlugin', () => {
              try {
                fs.rmSync(compiler.outputPath, {
                  recursive: true,
                  force: true,
                });
              } catch {
                // noop
              }
            });
          },
        ],
      }
    ),
    merge(
      createWebConfig({
        ...opts,
        entry,
        outputFilename: 'browser.js',
      }),
      {
        externals: toCommonJsExternal(pluginExternals),
      }
    ),
  ];
}

export { sharedExternals, pluginExternals };
export { webpackArgsWithDefaults, isServe } from './args';
export { default as webpack } from 'webpack';
export { merge } from 'webpack-merge';
