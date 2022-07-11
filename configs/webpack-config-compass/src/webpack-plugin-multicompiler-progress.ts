import path from 'path';
import type { Compiler, WebpackPluginInstance } from 'webpack';
import { ProgressPlugin } from 'webpack';
import type { SingleBar } from 'cli-progress';
import { MultiBar } from 'cli-progress';
import chalk from 'chalk';

const multibar = new MultiBar({
  format: `{name} [{bar}] {percentage}% | {msg} ${chalk.gray('{additional}')}`,
  autopadding: true,
  barsize: 30,
  stopOnComplete: true,
});

const bars = new Map<string, SingleBar>();

function parseAdditionalInfo(type: string, str: string[]): string {
  if (type === 'building') {
    const activeModule = str[1];
    if (activeModule) {
      const importWithLoaders = activeModule.split(/(!|\|)/).filter(Boolean);
      const last = importWithLoaders[importWithLoaders.length - 1];
      return path.isAbsolute(last) ? path.relative(process.cwd(), last) : last;
    }

    return '';
  }

  return str.join(' ');
}

function progressHandler(
  compiler: Compiler,
  name: string,
  percentage: number,
  msg: string,
  ...args: string[]
) {
  const padEndName = Math.max(
    ...Array.from(bars.keys()).map((name) => name.length)
  );

  const padStartMsg = Math.max(
    ...(Array.from(bars.values()).map((bar) =>
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      bar ? (bar as any).payload.msg.trim().length : 0
    ) as number[])
  );

  const payload = {
    name: name.padEnd(padEndName),
    msg: msg.padStart(padStartMsg),
    additional: parseAdditionalInfo(msg, args),
  };

  if (bars.has(name)) {
    const bar = bars.get(name);
    bar?.update(percentage, payload);
  } else {
    const bar = multibar.create(1, percentage, payload);
    bars.set(name, bar);
  }
}

export class WebpackPluginMulticompilerProgress
  implements WebpackPluginInstance
{
  params!: ConstructorParameters<typeof ProgressPlugin>;

  private static instance?: WebpackPluginMulticompilerProgress;

  constructor(...params: ConstructorParameters<typeof ProgressPlugin>) {
    if (WebpackPluginMulticompilerProgress.instance) {
      return WebpackPluginMulticompilerProgress.instance;
    }

    this.params = params;

    WebpackPluginMulticompilerProgress.instance = this;
  }

  apply(compiler: Compiler): void {
    const opts = this.params[0];
    const plugin = new ProgressPlugin({
      ...opts,
      activeModules: true,
      handler(...args) {
        progressHandler(
          compiler,
          String(compiler.options.name ?? compiler.options.target ?? ''),
          ...args
        );
      },
    });
    plugin.apply(compiler);
  }
}
