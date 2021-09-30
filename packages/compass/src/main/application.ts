import path from 'path';
import { EventEmitter } from 'events';
import { app } from 'electron';
import { ipcMain } from 'hadron-ipc';
import createDebug from 'debug';
import { CompassLogging } from './logging';
import { CompassWindowManager } from './window-manager';
import { CompassMenu } from './menu';

const debug = createDebug('mongodb-compass:main:application');

class CompassApplication extends EventEmitter {
  private constructor() {
    super();

    this.setupUserDirectory();

    void Promise.all([
      this.setupLogging(),
      this.setupAutoUpdate(),
      this.setupSecureStore(),
    ])
      .then(() => {
        this.setupJavaScriptArguments();
        this.setupLifecycleListeners();
        this.setupApplicationMenu();
        this.setupWindowManager();
      })
      .catch((err) => {
        // If anything failed during setup it's probably a big deal. Rethrow so
        // that our uncaughtException handlers can kick in
        throw err;
      });
  }

  async setupSecureStore(): Promise<void> {
    // importing storage-mixin attaches secure-store ipc listeners to handle
    // keychain requests from the renderer processes
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    await import('storage-mixin');
  }

  setupJavaScriptArguments(): void {
    // Enable ES6 features
    app.commandLine.appendSwitch('js-flags', '--harmony');
    // For Linux users with drivers that are avoided by Chromium we disable the
    // GPU check to attempt to bypass the disabled WebGL settings.
    app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');
  }

  async setupAutoUpdate(): Promise<void> {
    if (process.env.HADRON_ISOLATED !== 'true') {
      // This is done asyncronously so that webpack can completely remove
      // autoupdater from the application bundle during compilation
      const { CompassAutoUpdateManager } = await import(
        './auto-update-manager'
      );
      CompassAutoUpdateManager.init(this);
    }
  }

  setupApplicationMenu(): void {
    CompassMenu.init(this);
  }

  setupWindowManager(): void {
    void CompassWindowManager.init(this);
  }

  setupLifecycleListeners(): void {
    app.on('window-all-closed', function () {
      debug('All windows closed. Waiting for a new connection window.');
    });

    ipcMain.respondTo({
      'license:disagree': function () {
        debug('Did not agree to license, quitting app.');
        app.quit();
      },
    });
  }

  setupUserDirectory(): void {
    if (process.env.NODE_ENV === 'development') {
      const appName = app.getName();
      // When NODE_ENV is dev, we are probably be running application unpackaged
      // directly with Electron binary which causes user dirs to be just
      // `Electron` instead of app name that we want here
      app.setPath('userData', path.join(app.getPath('appData'), appName));
      app.setPath('userCache', path.join(app.getPath('cache'), appName));
    }
  }

  async setupLogging(): Promise<void> {
    const home = app.getPath('home');
    const appData = process.env.LOCALAPPDATA || process.env.APPDATA;
    const logDir =
      process.env.MONGODB_COMPASS_TEST_LOG_DIR || process.platform === 'win32'
        ? path.join(appData || home, 'mongodb', 'compass')
        : path.join(home, '.mongodb', 'compass');

    app.setAppLogsPath(logDir);

    await CompassLogging.init(this);
  }

  private static instance: CompassApplication;

  static main(): CompassApplication | undefined {
    if (require('electron-squirrel-startup')) {
      console.log('electron-squirrel-startup event handled sucessfully.');
      return;
    }

    if (!this.instance) {
      this.instance = new CompassApplication();
    }

    return this.instance;
  }
}

export { CompassApplication };
