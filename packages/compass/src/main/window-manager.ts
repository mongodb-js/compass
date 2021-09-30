/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/main/docs/api/browser-window.md
 */
import { pathToFileURL } from 'url';
import path from 'path';
import createDebug from 'debug';
import { ipcMain } from 'hadron-ipc';
import { once } from 'events';
import {
  app as electronApp,
  shell,
  dialog,
  BrowserWindow,
  BrowserWindowConstructorOptions,
  FindInPageOptions,
} from 'electron';
import COMPASS_ICON from './icon';
import { CompassMenu } from './menu';
import type { CompassApplication } from './application';

const debug = createDebug('mongodb-compass:electron:window-manager');

/**
 * Constants for window sizes on multiple platforms
 */

/**
 * The outer dimensions to use for new windows.
 */
const DEFAULT_WIDTH = 1280;
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

const MIN_WIDTH = 1024;
const MIN_HEIGHT = 640;

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
  opts: Partial<BrowserWindowConstructorOptions & { url: string }> = {}
): BrowserWindow {
  const url = opts.url || DEFAULT_URL;
  const windowOpts = {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minWidth: MIN_WIDTH,
    minHeight: MIN_HEIGHT,
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
      ...(opts && opts.webPreferences),
    },
  };

  debug('creating new main window:', windowOpts);

  let window: BrowserWindow | null = new BrowserWindow(windowOpts);

  /**
   * Take all the loading status changes and broadcast to other windows.
   */
  ipcMain.respondTo('compass:loading:change-status', (bw, meta) => {
    ipcMain.broadcast('compass:loading:change-status', meta);
  });

  ipcMain.respondTo('compass:error:fatal', (bw, meta) => {
    ipcMain.broadcast('compass:error:fatal', meta);
  });

  ipcMain.respondTo('compass:log', (bw, meta) => {
    ipcMain.broadcast('compass:log', meta);
  });

  /**
   * ## Find in page support
   */

  const onFindInPage = (
    bw: BrowserWindow,
    searchTerm: string,
    opt: FindInPageOptions = {}
  ) => {
    if (!window) {
      debug('window gone away! dropping ipc app:find-in-page');
      return;
    }
    opt = opt || {};
    window.webContents.findInPage(searchTerm, opt);
  };

  ipcMain.respondTo('app:find-in-page', onFindInPage);

  const onStopFindInPage = (
    bw: BrowserWindow,
    action: 'clearSelection' | 'keepSelection' | 'activateSelection'
  ) => {
    if (!window) {
      debug('window gone away! dropping ipc app:stop-find-in-page');
      return;
    }
    window.webContents.stopFindInPage(action);
  };

  ipcMain.respondTo('app:stop-find-in-page', onStopFindInPage);

  // TODO: ideally use this to send results to find-in-page component to show
  // indications of where you are in the page.  currently sending results
  // messes up findInPage results, however.
  // _window.webContents.on('found-in-page', function(event, results) {
  //   ipcMain.broadcast('app:find-in-page-results', results);
  // })

  const onWindowClosed = () => {
    debug('Window closed. Removing ipc responders and dereferencing.');
    ipcMain.remove('app:find-in-page', onFindInPage);
    ipcMain.remove('app:stop-find-in-page', onStopFindInPage);
    window = null;
  };

  window.once('closed', onWindowClosed);

  CompassMenu.load(window);

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
   * TODO (@imlucas) Do we need this anymore?
   */
  window.webContents.on('new-window', function (event, url) {
    event.preventDefault();
    void shell.openExternal(url);
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

  showConnectWindow();
}

async function showConnectWindowWhenReady(): Promise<void> {
  await electronApp.whenReady();
  await onAppReady();
}

class CompassWindowManager {
  private static initPromise: Promise<void> | null = null;

  private static async _init(compassApp: CompassApplication) {
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
      showConnectWindow();
    });

    ipcMain.respondTo({
      'app:show-info-dialog': showInfoDialog,
      'window:renderer-ready': rendererReady,
    });

    await showConnectWindowWhenReady();

    // Start listening to the macOS activate event only after first Compass window
    // is shown. Otherwise activate can happen on application start and cause
    // multiple Compass windows to appear
    electronApp.on('activate', (evt, hasVisibleWindows) => {
      if (!hasVisibleWindows) {
        showConnectWindow();
      }
    });
  }

  static init(app: CompassApplication): Promise<void> {
    if (this.initPromise) {
      return this.initPromise;
    }
    this.initPromise = this._init(app);
    return this.initPromise;
  }
}

export { CompassWindowManager };
