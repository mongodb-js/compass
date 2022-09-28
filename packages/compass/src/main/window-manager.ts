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

const debug = createDebug('mongodb-compass:electron:window-manager');

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

const MIN_WIDTH = process.env.COMPASS_MIN_WIDTH ?? 1024;
const MIN_HEIGHT = process.env.COMPASS_MIN_HEIGHT ?? 640;

/**
 * The app's HTML shell which is the output of `./src/index.html`
 * created by the `build:pages` gulp task.
 */
const DEFAULT_URL =
  process.env.COMPASS_INDEX_RENDERER_URL ||
  pathToFileURL(path.join(__dirname, 'index.html')).toString();

// track if app was launched, @see `renderer ready` handler below
let appLaunched = false;

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
  opts: Partial<BrowserWindowConstructorOptions & { url: string }> = {}
): BrowserWindow {
  const url = opts.url ?? DEFAULT_URL;

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
    backgroundColor: '#F5F6F7',
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
  const { networkTraffic } = compassApp.getPreferences().getPreferences();

  let window: BrowserWindow | null = new BrowserWindow(windowOpts);
  if (networkTraffic !== true) {
    // https://github.com/electron/electron/issues/22995
    window.webContents.session.setSpellCheckerDictionaryDownloadURL('http://127.0.0.1:0/');
  }

  enable(window.webContents);

  compassApp.emit('new-window', window);

  const onWindowClosed = () => {
    debug('Window closed. Dereferencing.');
    window = null;
  };

  window.once('closed', onWindowClosed);

  debug(`Loading page ${url} in main window`);

  void showWindowWhenReady(window);

  void window.loadURL(url);

  /**
   * Open devtools for this window when it's opened.
   *
   * @example DEVTOOLS=1 npm start
   * @see scripts/start.js
   */
  if (process.env.DEVTOOLS) {
    window.webContents.openDevTools({
      mode: 'detach',
    });
  }

  /**
   * Open all external links in the system's web browser.
   * TODO: https://jira.mongodb.org/browse/COMPASS-5187
   */
  window.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    void shell.openExternal(url);
  });

  return window;
}

/**
 * can't use webContents `did-finish-load` event here because
 * metrics aren't set up at that point. renderer app sends custom event
 * `window:renderer-ready` when metrics are set up. If first app launch,
 * send back `app:launched` message at that point.
 *
 * @param {Object} sender   original sender of the event
 */
function rendererReady(bw: BrowserWindow) {
  if (!appLaunched) {
    appLaunched = true;
    debug('sending `app:launched` msg back');
    bw.webContents.send('app:launched');
  }
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

async function onAppReady(compassApp: typeof CompassApplication) {
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

  showConnectWindow(compassApp);
}

async function showConnectWindowWhenReady(
  compassApp: typeof CompassApplication
): Promise<void> {
  await electronApp.whenReady();
  await onAppReady(compassApp);
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
      'window:renderer-ready': rendererReady,
      'app:show-info-dialog': showInfoDialog,
      'app:find-in-page': onFindInPage,
      'app:stop-find-in-page': onStopFindInPage,
      'compass:error:fatal'(_bw, meta) {
        ipcMain.broadcast('compass:error:fatal', meta);
      },
      'compass:log'(_bw, meta) {
        ipcMain.broadcast('compass:log', meta);
      },
    });

    await showConnectWindowWhenReady(compassApp);

    // Start listening to the macOS activate event only after first Compass window
    // is shown. Otherwise activate can happen on application start and cause
    // multiple Compass windows to appear
    electronApp.on('activate', (evt, hasVisibleWindows) => {
      if (!hasVisibleWindows) {
        showConnectWindow(compassApp);
      }
    });
  }

  static init(app: typeof CompassApplication): Promise<void> {
    return (this.initPromise ??= this._init(app));
  }
}

export { CompassWindowManager };
