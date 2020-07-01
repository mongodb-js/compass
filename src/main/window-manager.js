/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/master/docs/api/browser-window.md
 */
var electron = require('electron');
var electronLocalShortcut = require('electron-localshortcut');
var AppMenu = require('./menu');
var BrowserWindow = electron.BrowserWindow;

var _ = require('lodash');
var app = electron.app;

var debug = require('debug')('mongodb-compass:electron:window-manager');
var dialog = electron.dialog;
var path = require('path');
var ipc = require('hadron-ipc');
var COMPASS_ICON = require('../icon');

/**
 * When running in electron, we're in `/src/main`.
 */
var RESOURCES = path.resolve(__dirname, '../app/');

/**
 * Constants for window sizes on multiple platforms
 */

/**
 * The outer dimensions to use for new windows.
 */
let DEFAULT_WIDTH = 1280;
let DEFAULT_HEIGHT = 840;

let MIN_WIDTH = 1024;
let MIN_HEIGHT = 640;

/**
 * Adjust the heights to account for platforms
 * that use a single menu bar at the top of the screen.
 */
if (process.platform === 'linux') {
  DEFAULT_HEIGHT -= 30;
} else if (process.platform === 'darwin') {
  DEFAULT_HEIGHT -= 60;
}

/**
 * The app's HTML shell which is the output of `./src/index.html`
 * created by the `build:pages` gulp task.
 */
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html');
var LOADING_URL = 'file://' + path.join(RESOURCES, 'loading', 'loading.html');

// track if app was launched, @see `renderer ready` handler below
var appLaunched = false;

/**
 * TODO (@imlucas) Revisit this.
 *
 * @see https://github.com/atom/electron/blob/master/docs/api/app.md
 *
 * @returns {Boolean}
 */
// function isSingleInstance(_window) {
//   var isNotSingle = app.makeSingleInstance(function(argv, dir) {
//     /**
//      * TODO (imlucas) To make clicking on a `mongodb://` URL in chrome
//      * open Compass w/ connection dialog filled out, we can check if
//      * any argv[i] starts w/ `mongodb://` and if so, call
//      * `require('mongodb-connection-model').from(argv[i])` to parse the
//      * URL an get back an instance of the Connection model.
//      */
//     debug(
//       'Someone tried to run a second instance! We should focus our window',
//       {
//         argv: argv,
//         dir: dir
//       }
//     );

//     if (_window) {
//       if (_window.isMinimized()) {
//         _window.restore();
//       }
//       _window.focus();
//     }
//     return true;
//   });

//   return !isNotSingle;
// }

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
var createWindow = (module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minwidth: MIN_WIDTH,
    minheight: MIN_HEIGHT,
    url: DEFAULT_URL,
    /**
     * On Windows and macOS, this will be set automatically to the optimal
     * app icon.  Only on Linux do we need to set this explictly.
     *
     * @see https://jira.mongodb.org/browse/COMPASS-586
     */
    icon: process.platform === 'linux' ? COMPASS_ICON : undefined
  });

  debug('creating new window: ' + opts.url);
  var _window = new BrowserWindow({
    width: opts.width,
    height: opts.height,
    icon: opts.icon,
    show: false,
    minWidth: opts.minwidth,
    minHeight: opts.minheight,
    webPreferences: {
      'subpixel-font-scaling': true,
      'direct-write': true,
      nodeIntegration: true
    }
  });

  electronLocalShortcut.register(_window, 'CmdOrCtrl+=', () => {
    ipc.broadcast('window:zoom-in');
  });

  /**
   * TODO (@imlucas) COMPASS-3134 to factor out 2 BrowserWindow's.
   */
  var _loading = new BrowserWindow({
    width: opts.width,
    height: opts.height,
    icon: opts.icon,
    devTools: false,
    backgroundColor: '#3D4F58',
    minWidth: opts.minwidth,
    webPreferences: {
      'subpixel-font-scaling': true,
      'direct-write': true,
      nodeIntegration: true
    }
  });

  _loading.webContents.on('will-navigate', evt => evt.preventDefault());

  _loading.on('move', () => {
    const position = _loading.getPosition();
    _window.setPosition(position[0], position[1]);
  });

  _loading.on('resize', () => {
    const size = _loading.getSize();
    _window.setSize(size[0], size[1]);
  });

  /**
   * Take all the loading status changes and broadcast to other windows.
   */
  ipc.respondTo('compass:loading:change-status', (evt, meta) => {
    ipc.broadcast('compass:loading:change-status', meta);
  });

  ipc.respondTo('compass:error:fatal', (evt, meta) => {
    ipc.broadcast('compass:error:fatal', meta);
  });

  /**
   * `closed` is always fired if the `BrowserWindow`
   * is explicity `destroy()`ed when `_window` is ready
   * __or__ if it is closed by the user, which results
   * in the orphaned window problem reported in
   * COMPASS-3118 and COMPASS-3101.
   */
  const onLoadingClosed = () => {
    debug('loading window closed. dereferencing');
    _loading = null;
  };

  _loading.once('closed', onLoadingClosed);

  /**
   * # App Window IPC Handlers
   */
  const onRendererReady = () => {
    if (!_loading && !_window) {
      debug('loading and window gone away! dropping ipc window:renderer-ready');
      return;
    }

    if (_loading) {
      if (_loading.isFullScreen()) {
        _window.setFullScreen(true);
      }

      debug('close _loading');
      _loading.close();

      debug('showing _window');
      _window.show();
      _window.focus();
    } else {
      debug('uhoh... _loading already derefd?');
    }
  };

  /**
   * TODO (@imlucas) Replace with `ready-to-show` event?
   * https://github.com/electron/electron/blob/master/docs/api/browser-window.md#using-ready-to-show-event
   */
  ipc.respondTo('window:renderer-ready', onRendererReady);

  /**
   * ## Find in page support
   */

  const onFindInPage = (sender, searchTerm, opt) => {
    if (!_window) {
      debug('window gone away! dropping ipc app:find-in-page');
      return;
    }
    opt = opt || {};
    _window.webContents.findInPage(searchTerm, opt);
  };
  ipc.respondTo('app:find-in-page', onFindInPage);

  const onStopFindInPage = (sender, type) => {
    if (!_window) {
      debug('window gone away! dropping ipc app:stop-find-in-page');
      return;
    }
    _window.webContents.stopFindInPage(type);
  };

  ipc.respondTo('app:stop-find-in-page', onStopFindInPage);

  // TODO: ideally use this to send results to find-in-page component to show
  // indications of where you are in the page.  currently sending results
  // messes up findInPage results, however.
  //
  // _window.webContents.on('found-in-page', function(event, results) {
  //   ipc.broadcast('app:find-in-page-results', results);
  // })
  const onWindowClosed = () => {
    debug('Window closed. Removing ipc responders and dereferencing.');
    ipc.remove('window:renderer-ready', onRendererReady);
    ipc.remove('app:find-in-page', onFindInPage);
    ipc.remove('app:stop-find-in-page', onStopFindInPage);

    if (_loading) {
      debug('_loading not dereferenced yet. Destroying.');
      _loading.destroy();
    }

    _window = null;
  };
  _window.once('closed', onWindowClosed);

  AppMenu.load(_window);

  // if (!isSingleInstance(_window)) {
  //   app.quit();
  //   return null;
  // }

  _window.loadURL(opts.url);
  _loading.loadURL(LOADING_URL);

  /**
   * Open devtools for this window when it's opened.
   *
   * @example DEVTOOLS=1 npm start
   * @see scripts/start.js
   */
  if (process.env.DEVTOOLS) {
    _window.webContents.openDevTools({
      mode: 'detach'
    });
  }

  /**
   * Open all external links in the system's web browser.
   * TODO (@imlucas) Do we need this anymore?
   */
  _window.webContents.on('new-window', function(event, url) {
    event.preventDefault();
    electron.shell.openExternal(url);
  });
  return _window;
});

function showConnectWindow() {
  createWindow();
}

function showAboutDialog() {
  dialog.showMessageBox({
    type: 'info',
    title: 'About ' + app.getName(),
    icon: COMPASS_ICON,
    message: app.getName(),
    detail: 'Version ' + app.getVersion(),
    buttons: ['OK']
  });
}

/**
 * @param {Object} _bw - Current BrowserWindow
 * @param {String} message - Message to be set by MessageBox
 * @param {String} detail - Details to be shown in MessageBox
 */
function showInfoDialog(_bw, message, detail) {
  dialog.showMessageBox({
    type: 'info',
    icon: COMPASS_ICON,
    message: message,
    detail: detail,
    buttons: ['OK']
  });
}

function showCompassOverview() {
  AppMenu.showCompassOverview();
}

function showCollectionSubmenu() {
  AppMenu.showCollection();
}

function hideCollectionSubmenu() {
  AppMenu.hideCollection();
}

/**
 * can't use webContents `did-finish-load` event here because
 * metrics aren't set up at that point. renderer app sends custom event
 * `window:renderer-ready` when metrics are set up. If first app launch,
 * send back `app:launched` message at that point.
 *
 * @param {Object} sender   original sender of the event
 */
function rendererReady(sender) {
  if (!appLaunched) {
    appLaunched = true;
    debug('sending `app:launched` msg back');
    sender.send('app:launched');
  }
}

/**
 * Respond to events from the renderer process.
 * Certain Electron API's are only accessible in the main process.
 * These are exposed via IPC so that renderer processes can access
 * those API's.
 */
ipc.respondTo({
  'app:show-info-dialog': showInfoDialog,
  'app:show-connect-window': showConnectWindow,
  'window:show-about-dialog': showAboutDialog,
  'window:show-collection-submenu': showCollectionSubmenu,
  'window:hide-collection-submenu': hideCollectionSubmenu,
  'window:show-compass-overview-submenu': showCompassOverview,
  'window:renderer-ready': rendererReady
});

/**
 * Respond to events from the main process
 */
app.on('window:show-about-dialog', showAboutDialog);
app.on('app:show-connect-window', showConnectWindow);

app.on('before-quit', function() {
  var win = _.first(BrowserWindow.getAllWindows());
  if (win) {
    debug('sending `app:quit` msg');
    win.webContents.send('app:quit');
  }
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('ready', function() {
  // install development tools (devtron, react tools) if in development mode
  if (process.env.NODE_ENV === 'development') {
    debug('Activating Compass specific devtools...');
    require('devtron').install();
  }

  /**
   * When electron's main renderer has completed setup,
   * we'll always show the [connect][./src/connect] dialog
   * on start which is responsible for retaining it's own
   * state between application launches.
   */
  showConnectWindow();
});
