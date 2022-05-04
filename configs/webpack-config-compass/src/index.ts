import fs from 'fs';
import type { WebpackPluginInstance } from 'webpack';
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
  javascriptLoader,
  nodeLoader,
  sourceLoader,
  cssLoader,
  lessLoader,
  assetsLoader,
  resourceLoader,
  sharedObjectLoader
} from './loaders';
import {
  entriesToNamedEntries,
  toCommonJsExternal,
  entriesToHtml,
  getLibraryNameFromCwd,
} from './util';
import { sharedExternals } from './externals';
import { WebpackPluginMulticompilerProgress } from './webpack-plugin-multicompiler-progress';
import MiniCssExtractPlugin from 'mini-css-extract-plugin';

const sharedResolveOptions = {
  mainFields: ['compass:module', 'compass:main', 'module', 'main'],
  exportsFields: ['compass:exports', 'exports'],
  extensions: ['.jsx', '.tsx', '.ts', '...'],
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
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        resourceLoader(opts),
        sharedObjectLoader(opts),
        sourceLoader(opts)
      ],
    },
    node: false as const,
    externals: toCommonJsExternal(sharedExternals),
    resolve: {
      // To avoid resolving the `browser` field
      aliasFields: [],
      ...sharedResolveOptions,
    },
    plugins: [new WebpackPluginMulticompilerProgress()],
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
      library: getLibraryNameFromCwd(opts.cwd),
      libraryTarget: 'umd',
      strictModuleErrorHandling: true,
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
        javascriptLoader(opts),
        nodeLoader(opts),
        cssLoader(opts),
        lessLoader(opts),
        assetsLoader(opts),
        sharedObjectLoader(opts),
        sourceLoader(opts)
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
      ...sharedResolveOptions,
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
  const { peerDependencies } = require(path.join(opts.cwd, 'package.json'));

  return {
    entry: entriesToNamedEntries(opts.entry),
    devtool: opts.devtool,
    output: {
      path: opts.outputPath,
      filename: opts.outputFilename ?? '[name].js',
      assetModuleFilename: 'assets/[name][ext]',
      library: getLibraryNameFromCwd(opts.cwd),
      libraryTarget: 'umd',
      strictModuleErrorHandling: true,
    },
    mode: opts.mode,
    target: opts.target,
    module: {
      rules: [
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
      ...toCommonJsExternal(Object.keys(peerDependencies)),
      ...toCommonJsExternal(builtinModules),
    },
    resolve: {
      ...sharedResolveOptions,
    },
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
      createElectronMainConfig({
        ...opts,
        entry: sandboxMain,
      }),
      createElectronRendererConfig({
        ...opts,
        entry: sandboxRenderer,
      }),
    ];
  }

  const entry = fs.existsSync(path.join(opts.cwd, 'src', 'index.ts'))
    ? path.join(opts.cwd, 'src', 'index.ts')
    : path.join(opts.cwd, 'src', 'index.js');

  return [
    createElectronRendererConfig({
      ...opts,
      entry,
      outputFilename: 'index.js',
    }),
    createWebConfig({
      ...opts,
      entry,
      outputFilename: 'browser.js',
    }),
  ];
}

export { webpackArgsWithDefaults, isServe } from './args';
export { default as webpack } from 'webpack';
export { merge } from 'webpack-merge';
