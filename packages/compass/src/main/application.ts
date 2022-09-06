import path from 'path';
import { EventEmitter } from 'events';
import type { BrowserWindow } from 'electron';
import { app } from 'electron';
import { ipcMain } from 'hadron-ipc';
import createDebug from 'debug';
import { CompassLogging } from './logging';
import { CompassTelemetry } from './telemetry';
import { CompassWindowManager } from './window-manager';
import { CompassMenu } from './menu';
import { setupCSFLELibrary } from './setup-csfle-library';

const debug = createDebug('mongodb-compass:main:application');

type ExitHandler = () => Promise<unknown>;

class CompassApplication {
  private constructor() {
    // marking constructor as private to disallow usage
  }

  private static emitter: EventEmitter = new EventEmitter();
  private static exitHandlers: ExitHandler[] = [];
  private static initPromise: Promise<void> | null = null;

  private static async _init() {
    if (require('electron-squirrel-startup')) {
      debug('electron-squirrel-startup event handled sucessfully');
      return;
    }

    this.setupUserDirectory();
    await Promise.all([this.setupLogging(), this.setupTelemetry()]);
    await Promise.all([this.setupAutoUpdate(), this.setupSecureStore()]);
    await setupCSFLELibrary();
    this.setupJavaScriptArguments();
    this.setupLifecycleListeners();
    this.setupApplicationMenu();
    this.setupWindowManager();
  }

  static init(): Promise<void> {
    return (this.initPromise ??= this._init());
  }

  private static async setupSecureStore(): Promise<void> {
    // importing storage-mixin attaches secure-store ipc listeners to handle
    // keychain requests from the renderer processes
    await import('storage-mixin');
  }

  private static setupJavaScriptArguments(): void {
    // For Linux users with drivers that are avoided by Chromium we disable the
    // GPU check to attempt to bypass the disabled WebGL settings.
    app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
  }

  private static async setupAutoUpdate(): Promise<void> {
    if (process.env.HADRON_ISOLATED !== 'true') {
      // This is done asyncronously so that webpack can completely remove
      // autoupdater from the application bundle during compilation
      const { CompassAutoUpdateManager } = await import(
        './auto-update-manager'
      );
      CompassAutoUpdateManager.init();
    }
  }

  private static setupApplicationMenu(): void {
    CompassMenu.init(this);
  }

  private static setupWindowManager(): void {
    void CompassWindowManager.init(this);
  }

  private static setupLifecycleListeners(): void {
    app.on('window-all-closed', function () {
      debug('All windows closed. Waiting for a new connection window.');
    });

    // eslint-disable-next-line @typescript-eslint/no-misused-promises
    app.on('will-quit', async (event: Event) => {
      event.preventDefault(); // Only exit asynchronously, after the cleanup handlers
      await this.runExitHandlers();
      app.exit();
    });

    ipcMain.respondTo({
      'license:disagree': function () {
        debug('Did not agree to license, quitting app.');
        app.quit();
      },
    });

    ipcMain.handle('coverage', () => {
      return (global as any).__coverage__;
    });
  }

  private static setupUserDirectory(): void {
    if (process.env.NODE_ENV === 'development') {
      const appName = app.getName();
      // When NODE_ENV is dev, we are probably running the app unpackaged
      // directly with Electron binary which causes user dirs to be just
      // `Electron` instead of app name that we want here
      app.setPath('userData', path.join(app.getPath('appData'), appName));
      app.setPath('userCache', path.join(app.getPath('cache'), appName));
    }
  }

  private static async setupLogging(): Promise<void> {
    const home = app.getPath('home');
    const appData = process.env.LOCALAPPDATA || process.env.APPDATA;
    const logDir =
      process.env.MONGODB_COMPASS_TEST_LOG_DIR || process.platform === 'win32'
        ? path.join(appData || home, 'mongodb', 'compass')
        : path.join(home, '.mongodb', 'compass');

    app.setAppLogsPath(logDir);

    await CompassLogging.init(this);
  }

  private static async setupTelemetry(): Promise<void> {
    await CompassTelemetry.init(this);
  }

  static addExitHandler(handler: ExitHandler): void {
    this.exitHandlers.push(handler);
  }

  static async runExitHandlers(): Promise<void> {
    let handler: ExitHandler | undefined;
    // Run exit handlers in reverse order of addition.
    while ((handler = this.exitHandlers.pop()) !== undefined) {
      await handler();
    }
  }

  static on(
    event: 'show-connect-window',
    handler: () => void
  ): typeof CompassApplication;
  static on(
    event: 'show-log-file-dialog',
    handler: () => void
  ): typeof CompassApplication;
  // @ts-expect-error typescript is not happy with this overload even though it
  //                  worked when it wasn't static and the implementation does
  //                  match the overload declaration
  static on(
    event: 'new-window',
    handler: (bw: BrowserWindow) => void
  ): typeof CompassApplication;
  static on(
    event: string,
    handler: (...args: unknown[]) => void
  ): typeof CompassApplication {
    this.emitter.on(event, handler);
    return this;
  }

  static emit(event: 'show-connect-window'): boolean;
  static emit(event: 'show-log-file-dialog'): boolean;
  static emit(event: 'new-window', bw: BrowserWindow): boolean;
  static emit(event: string, ...args: unknown[]): boolean {
    return this.emitter.emit(event, ...args);
  }

  static removeAllListeners(): typeof CompassApplication {
    this.emitter.removeAllListeners();
    return this;
  }
}

export { CompassApplication };
