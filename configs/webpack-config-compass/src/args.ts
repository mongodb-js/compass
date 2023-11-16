import type { Configuration, WebpackOptionsNormalized } from 'webpack';
import { merge } from 'webpack-merge';
import path from 'path';

export type WebpackConfig = Configuration &
  Pick<WebpackOptionsNormalized, 'devServer'>;

export type WebpackCLIArgs = {
  entry: string | string[] | Record<string, string>;
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
  coverage?: string;
  library?: string;
};

export type ConfigArgs = WebpackCLIArgs & CompassConfigArgs;

function isMode(str?: string): str is WebpackConfig['mode'] {
  return ['development', 'production', 'none', undefined].includes(str);
}

export function isServe(args: WebpackCLIArgs): boolean {
  return Boolean(args?.env?.WEBPACK_SERVE);
}

export function webpackArgsWithDefaults(
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
      analyze: ['1', 'true'].includes(process.env.ANALYZE as string),
      cwd,
      coverage: process.env.COVERAGE || undefined,
    },
    args as ConfigArgs,
    ...(more as ConfigArgs[])
  );
}
