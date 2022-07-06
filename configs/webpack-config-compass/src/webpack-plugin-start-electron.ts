import type { Compiler } from 'webpack';
import { pathToFileURL } from 'url';
import { EnvironmentPlugin } from 'webpack';
import path from 'path';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { once } from 'events';
import electronBinaryPath from 'electron';

export class WebpackPluginStartElectron {
  private opts!: {
    fileUrl: boolean;
    electronLiveReload: boolean;
  };

  private electronProcess: ChildProcess | null = null;

  private mainCompiler?: Compiler;

  private rendererCompiler?: Compiler;

  private static instance?: WebpackPluginStartElectron;

  constructor(
    opts: {
      fileUrl?: boolean;
      electronLiveReload?: boolean;
    } = {}
  ) {
    if (WebpackPluginStartElectron.instance) {
      return WebpackPluginStartElectron.instance;
    }

    this.opts = {
      fileUrl: false,
      electronLiveReload: true,
      ...opts,
    };

    WebpackPluginStartElectron.instance = this;
  }

  apply(compiler: Compiler): void {
    if (compiler.options.target === 'electron-renderer') {
      this.rendererCompiler = compiler;
    }

    if (compiler.options.target === 'electron-main') {
      this.mainCompiler = compiler;
    }

    if (this.rendererCompiler && this.mainCompiler) {
      const mainEntry = Object.keys(this.mainCompiler.options.entry)[0];
      const rendererEntries = Object.keys(this.rendererCompiler.options.entry);
      const rendererOutputPath = this.rendererCompiler.options.output
        .path as string;
      const devServerPort: number =
        this.rendererCompiler.options.devServer?.port ?? 4242;

      // This will set environmental variables that can be used by main process to
      // know what BrowserWindow to open exactly
      const env = Object.fromEntries(
        rendererEntries.map((name) => {
          return [
            `COMPASS_${name.toUpperCase()}_RENDERER_URL`,
            this.opts.fileUrl
              ? pathToFileURL(path.join(rendererOutputPath, `${name}.html`))
              : `http://localhost:${devServerPort}/${name}.html`,
          ];
        })
      );
      const envPlugin = new EnvironmentPlugin(env);
      envPlugin.apply(this.mainCompiler);

      // This will spawn an eletron process when the main file is emitted in the
      // fs by webpack
      this.mainCompiler.hooks.afterEmit.tapPromise(
        'StartElectronWebpackPlugin',
        async (compilation) => {
          const logger = compilation.getLogger('webpack-plugin-start-electron');
          const entryChunk = compilation.namedChunks.get(mainEntry);
          const entryChunkFilename = entryChunk?.files.values().next().value;

          if (!compilation.options.output.path) {
            throw new Error('Output path is required');
          }

          const fullPath = path.join(
            compilation.options.output.path,
            entryChunkFilename as string
          );

          if (this.electronProcess !== null && this.opts.electronLiveReload) {
            logger.info(
              'Restarting electron application: killing currently running app'
            );
            await this.kill(this.electronProcess);
            this.electronProcess = null;
          }

          if (this.electronProcess === null) {
            logger.info('Starting electron application');
            this.electronProcess = spawn(
              // XXX: in non-electron environment this import returns path to
              // the binary
              electronBinaryPath as unknown as string,
              [fullPath],
              { stdio: 'inherit', env: process.env }
            );
            let stderr = '';
            this.electronProcess.stderr
              ?.setEncoding('utf-8')
              .on('data', (chunk) => (stderr += chunk));
            this.electronProcess.on('exit', (code) => {
              if (code && code > 0) {
                logger.error(
                  'Electron app quit unexpectedly on start. Interrupting build.'
                );
                throw new Error('Electron app quit unexpectedly:\n\n' + stderr);
              }
            });
          }
        }
      );
    }
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
