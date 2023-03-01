/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/main/docs/api/browser-window.md
 */
import { pathToFileURL } from 'url';
import path from 'path';
import createDebug from 'debug';
import { ipcMain } from 'hadron-ipc';
import { once } from 'events';
import type {
  BrowserWindowConstructorOptions,
  FindInPageOptions,
} from 'electron';
import { app as electronApp, shell, dialog, BrowserWindow } from 'electron';
import { enable } from '@electron/remote/main';

import COMPASS_ICON from './icon';
import type { CompassApplication } from './application';
import preferences from 'compass-preferences-model';
import {
  getWindowAutoConnectPreferences,
  onCompassDisconnect,
  registerMongoDbUrlForBrowserWindow,
} from './auto-connect';

const debug = createDebug('mongodb-compass:electron:window-manager');

const earlyOpenUrls: string[] = [];
function earlyOpenUrlListener(
  event: { preventDefault: () => void },
  url: string
) {
  event.preventDefault();
  earlyOpenUrls.push(url);
}
export function installEarlyOpenUrlListener(): void {
  electronApp.on('open-url', earlyOpenUrlListener);
}

export function uninstallEarlyOpenUrlListener(): void {
  electronApp.off('open-url', earlyOpenUrlListener);
}

/**
 * Constants for window sizes on multiple platforms
 */

/**
 * The outer dimensions to use for new windows.
 */
const DEFAULT_WIDTH = 1432;
const DEFAULT_HEIGHT = (() => {
  let height = 840;
  /**
   * Adjust the heights to account for platforms
   * that use a single menu bar at the top of the screen.
   */
  if (process.platform === 'linux') {
    height -= 30;
  } else if (process.platform === 'darwin') {
    height -= 60;
  }
  return height;
})();

// We set the min width to 1025 so that the screensize breakpoints of leafygreen
// components are not hit. The breakpoints make the styles of the Select component
// change significantly at widths of 1024 and less.
const MIN_WIDTH = process.env.COMPASS_MIN_WIDTH ?? 1025;
const MIN_HEIGHT = process.env.COMPASS_MIN_HEIGHT ?? 640;

/**
 * The app's HTML shell which is the output of `./src/index.html`
 * created by the `build:pages` gulp task.
 */
const DEFAULT_URL =
  process.env.COMPASS_INDEX_RENDERER_URL ||
  pathToFileURL(path.join(__dirname, 'index.html')).toString();

async function showWindowWhenReady(bw: BrowserWindow) {
  await once(bw, 'ready-to-show');
  bw.show();
}

/**
 * Call me instead of using `new BrowserWindow()` directly because i'll:
 *
 * 1. Make sure the window is the right size
 * 2. Doesn't load a blank screen
 * 3. Overrides `window.open` so we have control over message passing via URL's
 *
 *
 * @param {Object} opts - Smaller subset of [`BrowserWindow#options`][0].
 * @return {BrowserWindow}
 * [0]: http://git.io/vnwTY
 */
function showConnectWindow(
  compassApp: typeof CompassApplication,
  opts: Partial<
    BrowserWindowConstructorOptions & {
      rendererUrl: string;
      mongodbUrl: string;
    }
  > = {}
): BrowserWindow {
  const rendererUrl = opts.rendererUrl ?? DEFAULT_URL;
  const mongodbUrl = opts.mongodbUrl;

  const windowOpts = {
    width: Number(DEFAULT_WIDTH),
    height: Number(DEFAULT_HEIGHT),
    minWidth: Number(MIN_WIDTH),
    minHeight: Number(MIN_HEIGHT),
    /**
     * On Windows and macOS, this will be set automatically to the optimal
     * app icon.  Only on Linux do we need to set this explictly.
     *
     * @see https://jira.mongodb.org/browse/COMPASS-586
     */
    icon: process.platform === 'linux' ? COMPASS_ICON : undefined,
    show: !!process.env.DEBUG_MAIN_WINDOW,
    backgroundColor: '#ffffff',
    ...opts,
    webPreferences: {
      'subpixel-font-scaling': true,
      'direct-write': true,
      nodeIntegration: true,
      contextIsolation: false,
      enableRemoteModule: true,
      ...(opts && opts.webPreferences),
    },
  };

  debug('creating new main window:', windowOpts);
  const { networkTraffic } = preferences.getPreferences();

  let window: BrowserWindow | null = new BrowserWindow(windowOpts);
  if (mongodbUrl) {
    registerMongoDbUrlForBrowserWindow(window, mongodbUrl);
  }
  if (networkTraffic !== true) {
    // https://github.com/electron/electron/issues/22995
    window.webContents.session.setSpellCheckerDictionaryDownloadURL(
      'http://127.0.0.1:0/'
    );
  }

  enable(window.webContents);

  compassApp.emit('new-window', window);

  const onWindowClosed = () => {
    debug('Window closed. Dereferencing.');
    window = null;
  };

  window.once('closed', onWindowClosed);

  debug(`Loading page ${rendererUrl} in main window`);

  void showWindowWhenReady(window);

  void window.loadURL(rendererUrl);

  /**
   * Open all external links in the system's web browser.
   */
  window.webContents.setWindowOpenHandler((details) => {
    void shell.openExternal(details.url);
    return { action: 'deny' };
  });

  window.webContents.on('will-navigate', function (e, url) {
    e.preventDefault();
    debug(
      `Blocked navigation to url ${url} in main window. Make sure links are opened in a different window with _target="blank".`
    );
  });

  return window;
}

/**
 * @param {Object} _bw - Current BrowserWindow
 * @param {String} message - Message to be set by MessageBox
 * @param {String} detail - Details to be shown in MessageBox
 */
function showInfoDialog(_bw: BrowserWindow, message: string, detail: string) {
  void dialog.showMessageBox({
    type: 'info',
    icon: COMPASS_ICON,
    message: message,
    detail: detail,
    buttons: ['OK'],
  });
}

const onFindInPage = (
  bw: BrowserWindow,
  searchTerm: string,
  opt: FindInPageOptions = {}
) => {
  bw.webContents.findInPage(searchTerm, opt);
};

const onStopFindInPage = (
  bw: BrowserWindow,
  action: 'clearSelection' | 'keepSelection' | 'activateSelection'
) => {
  bw.webContents.stopFindInPage(action);
};

/**
 * Respond to events relevant to BrowserWindow management from the renderer
 * process.
 *
 * Certain Electron API's are only accessible in the main process.
 * These are exposed via IPC so that renderer processes can access
 * those API's.
 */

async function onAppReady() {
  // install development tools (devtron, react tools) if in development mode
  if (process.env.NODE_ENV === 'development') {
    debug('Activating Compass specific devtools...');
    const { default: installDevtools, REACT_DEVELOPER_TOOLS } = await import(
      'electron-devtools-installer'
    );
    try {
      await installDevtools(REACT_DEVELOPER_TOOLS);
    } catch (e) {
      // noop
    }
  }
}

class CompassWindowManager {
  private static initPromise: Promise<void> | null = null;

  private static async _init(compassApp: typeof CompassApplication) {
    electronApp.on('before-quit', function () {
      const first = BrowserWindow.getAllWindows()[0];
      if (first) {
        debug('sending `app:quit` msg');
        first.webContents.send('app:quit');
      }
    });

    electronApp.on('window-all-closed', () => {
      if (process.platform !== 'darwin') {
        electronApp.quit();
      }
    });

    compassApp.on('show-connect-window', () => {
      showConnectWindow(compassApp);
    });

    ipcMain.respondTo({
      'app:show-info-dialog': showInfoDialog,
      'app:find-in-page': onFindInPage,
      'app:stop-find-in-page': onStopFindInPage,
      'compass:error:fatal'(_bw, meta) {
        ipcMain.broadcast('compass:error:fatal', meta);
      },
      'compass:log'(_bw, meta) {
        ipcMain.broadcast('compass:log', meta);
      },
      'compass:disconnected': onCompassDisconnect,
      'compass:get-window-auto-connect-preferences':
        getWindowAutoConnectPreferences,
      'test:show-connect-window': () => showConnectWindow(compassApp),
    });

    await electronApp.whenReady();
    await onAppReady();

    // Start listening to the macOS activate event only after first Compass window
    // is shown. Otherwise activate can happen on application start and cause
    // multiple Compass windows to appear
    electronApp.on('activate', (evt, hasVisibleWindows) => {
      if (!hasVisibleWindows) {
        showConnectWindow(compassApp);
      }
    });
    uninstallEarlyOpenUrlListener();
    electronApp.on('open-url', (evt, url) => {
      evt.preventDefault();
      showConnectWindow(compassApp, { mongodbUrl: url });
    });

    showConnectWindow(compassApp, { mongodbUrl: earlyOpenUrls.shift() });
    // Handle the very unlikely case that multiple open-url events arrived before
    // this point by opening.
    for (const url of earlyOpenUrls) {
      showConnectWindow(compassApp, { mongodbUrl: url });
    }
  }

  static init(app: typeof CompassApplication): Promise<void> {
    return (this.initPromise ??= this._init(app));
  }
}

export { CompassWindowManager };
