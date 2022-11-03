import type { Compiler } from 'webpack';
import { pathToFileURL } from 'url';
import { EnvironmentPlugin } from 'webpack';
import path from 'path';
import type { ChildProcess } from 'child_process';
import { spawn } from 'child_process';
import { once } from 'events';
import electronBinaryPath from 'electron';
import readline from 'readline';

export class WebpackPluginStartElectron {
  private opts!: {
    fileUrl: boolean;
    electronLiveReload: boolean;
  };

  private electronProcess: ChildProcess | null = null;

  private mainCompiler?: Compiler;

  private rendererCompiler?: Compiler;

  private static instance?: WebpackPluginStartElectron;

  private appPath: string | null = null;
  private mainReady = false;
  private rendererReady = false;

  private logger!: ReturnType<Compiler['getInfrastructureLogger']>;

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

    this.setupKeypressListeners();

    WebpackPluginStartElectron.instance = this;
  }

  apply(compiler: Compiler): void {
    this.logger = compiler.getInfrastructureLogger(
      'webpack-plugin-start-electron'
    );

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

      // After files are emitted we save main process application path and in
      // case when this is a subsequent rebuild, we will restart the app
      this.mainCompiler.hooks.afterEmit.tapPromise(
        'WebpackPluginStartElectron',
        async (compilation) => {
          const entryChunk = compilation.namedChunks.get(mainEntry);
          const entryChunkFilename = entryChunk?.files.values().next().value;

          if (!compilation.options.output.path) {
            throw new Error('Output path is required');
          }

          this.appPath = path.join(
            compilation.options.output.path,
            entryChunkFilename as string
          );

          // When live reload is enabled we will try to restart the app right
          // after files are emitted (this will not handle the inital
          // application start)
          if (this.opts.electronLiveReload) {
            await this.stopElectron();
            this.startElectron();
          }
        }
      );

      // When afterDone fires for any of the compilers, we will store this info
      // and will try to start the app
      this.mainCompiler.hooks.afterDone.tap(
        'WebpackPluginStartElectron',
        () => {
          this.mainReady = true;
          this.startElectron();
        }
      );
      this.rendererCompiler.hooks.afterDone.tap(
        'WebpackPluginStartElectron',
        () => {
          this.rendererReady = true;
          this.startElectron();
        }
      );
    }
  }

  private async stopElectron() {
    if (!this.electronProcess) {
      return;
    }
    this.logger.info('Stopping currently running app');
    await this.kill(this.electronProcess);
    this.electronProcess = null;
  }

  private startElectron(extraArgs?: string[]) {
    if (this.electronProcess) {
      return;
    }
    if (!this.mainReady || !this.rendererReady) {
      return;
    }
    if (!this.appPath) {
      throw new Error("Can't start the app: electron main path is not set");
    }
    extraArgs =
      extraArgs ??
      process.env.ELECTRON_EXTRA_ARGS?.split(' ').map((arg) => {
        return arg.trim();
      });
    this.logger.info('Starting electron application');
    this.logger.info('- Ctrl+R to restart the main process');
    this.logger.info(
      '- Ctrl+A to restart the main process with extra arguments'
    );
    this.electronProcess = spawn(
      // XXX: in non-electron environment this import returns path to the binary
      electronBinaryPath as unknown as string,
      [this.appPath, ...(extraArgs ?? [])],
      { stdio: 'inherit', env: process.env }
    );
    let stderr = '';
    this.electronProcess.stderr
      ?.setEncoding('utf-8')
      .on('data', (chunk) => (stderr += chunk));
    this.electronProcess.on('exit', (code) => {
      this.electronProcess = null;
      if (code && code > 0) {
        this.logger.error(
          'Electron app quit unexpectedly on start. Interrupting build.'
        );
        throw new Error('Electron app quit unexpectedly:\n\n' + stderr);
      }
    });
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

  private setupKeypressListeners() {
    if (!process.stdin.isTTY) {
      return;
    }
    process.stdin.setRawMode(true);
    readline.emitKeypressEvents(process.stdin);
    process.stdin.on('keypress', (str: string) => {
      // We are in the raw mode and have to handle some default keys ourselves
      if (str === /* ctrl+c */ '\x03') {
        this.electronProcess?.kill('SIGINT');
        (process as any).emit('SIGINT');
        return;
      }

      if (str === /* ctrl+r */ '\x12') {
        void this.stopElectron().then(() => {
          this.startElectron();
        });
        return;
      }

      if (str === /* ctrl+a */ '\x01') {
        const rl = readline.createInterface(process.stdin, process.stdout);
        rl.question(
          'Enter extra args (e.g., --protectConnectionStrings --theme=LIGHT): ',
          (answer: string) => {
            rl.close();
            const args = answer.split(' ').map((arg) => {
              return arg.trim();
            });
            void this.stopElectron().then(() => {
              this.startElectron(args);
            });
          }
        );
        return;
      }
    });
  }
}
