/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/master/docs/api/browser-window.md
 */
var electron = require('electron');
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
let DEFAULT_HEIGHT = 800;

let MIN_WIDTH = 1024;

/**
* The outer window dimensions to use for new dialog
* windows like the connection and setup dialogs.
*/
let DEFAULT_WIDTH_DIALOG = 900;
let DEFAULT_HEIGHT_DIALOG = 800;

let MIN_WIDTH_DIALOG = 768;
/**
* Adjust the heights to account for platforms
* that use a single menu bar at the top of the screen.
*/
if (process.platform === 'linux') {
  DEFAULT_HEIGHT_DIALOG -= 30;
  DEFAULT_HEIGHT -= 30;
} else if (process.platform === 'darwin') {
  DEFAULT_HEIGHT_DIALOG -= 60;
  DEFAULT_HEIGHT -= 60;
}

/**
 * The app's HTML shell which is the output of `./src/index.html`
 * created by the `build:pages` gulp task.
 */
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');
var HELP_URL = 'file://' + path.join(RESOURCES, 'help.html#help');
var LOADING_URL = 'file://' + path.join(RESOURCES, 'loading', 'loading.html');

/**
 * We want the Help window to be special
 * and for there to ever only be one instance of each of them
 * so we'll use scope to essentially make each of them a Singleton.
 */
var helpWindow;

// track if app was launched, @see `renderer ready` handler below
var appLaunched = false;

/**
 * @see https://github.com/atom/electron/blob/master/docs/api/app.md
 *
 * @param {BrowserWindow} _window
 * @returns {Boolean}
 */
function isSingleInstance(_window) {
  var isNotSingle = app.makeSingleInstance(function(argv, dir) {
    /**
     * TODO (imlucas) To make clicking on a `mongodb://` URL in chrome
     * open Compass w/ connection dialog filled out, we can check if
     * any argv[i] starts w/ `mongodb://` and if so, call
     * `require('mongodb-connection-model').from(argv[i])` to parse the
     * URL an get back an instance of the Connection model.
     */
    debug('Someone tried to run a second instance! We should focus our window', {
      argv: argv,
      dir: dir
    });

    if (_window) {
      if (_window.isMinimized()) {
        _window.restore();
      }
      _window.focus();
    }
    return true;
  });

  return !isNotSingle;
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
var createWindow = module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    minwidth: MIN_WIDTH,
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
    'min-width': opts.minwidth,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });

  var _loading = new BrowserWindow({
    width: opts.width,
    height: opts.height,
    icon: opts.icon,
    'min-width': opts.minwidth,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });

  _loading.on('move', () => {
    const position = _loading.getPosition();
    _window.setPosition(position[0], position[1]);
  });

  _loading.on('resize', () => {
    const size = _loading.getSize();
    _window.setSize(size[0], size[1]);
  });

  ipc.respondTo('window:renderer-ready', () => {
    if (_loading) {
      if (_loading.isFullScreen()) {
        _window.setFullScreen(true);
      }
      _loading.hide();
      _loading.close();
      _loading = null;
      _window.show();
    }
  });

  AppMenu.load(_window);

  if (!isSingleInstance(_window)) {
    app.quit();
    return null;
  }

  _window.loadURL(opts.url);
  _loading.loadURL(LOADING_URL);

  /**
   * Open devtools for this window when it's opened.
   *
   * @example DEVTOOLS=1 npm start
   * @see scripts/start.js
   */
  if (process.env.DEVTOOLS) {
    _window.webContents.on('devtools-opened', function() {
      _window.webContents.addWorkSpace(path.join(__dirname, '..', '..'));
    });
    _window.webContents.openDevTools({
      detach: true
    });
  }
  return _window;
};

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

function showHelpWindow(win, id) {
  if (helpWindow) {
    helpWindow.focus();
    if (_.isString(id)) {
      ipc.broadcast('app:show-help-entry', id);
    }
    return;
  }
  var url = HELP_URL;
  if (_.isString(id)) {
    url += '/' + id;
  }
  helpWindow = createWindow({
    width: DEFAULT_WIDTH_DIALOG,
    height: DEFAULT_HEIGHT_DIALOG,
    minwidth: MIN_WIDTH_DIALOG,
    url: url
  });
  helpWindow.on('closed', function() {
    helpWindow = null;
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

// respond to events from the renderer process
ipc.respondTo({
  'app:show-connect-window': showConnectWindow,
  'app:show-help-window': showHelpWindow,
  'window:show-about-dialog': showAboutDialog,
  'window:show-collection-submenu': showCollectionSubmenu,
  'window:hide-collection-submenu': hideCollectionSubmenu,
  'window:show-compass-overview-submenu': showCompassOverview,
  'window:renderer-ready': rendererReady
});

// respond to events from the main process
app.on('window:show-about-dialog', showAboutDialog);
app.on('app:show-connect-window', showConnectWindow);
app.on('app:show-help-window', showHelpWindow);

app.on('before-quit', function() {
  var win = _.first(BrowserWindow.getAllWindows());
  if (win) {
    debug('sending `app:quit` msg');
    win.webContents.send('app:quit');
  }
});

app.on('ready', function() {
  // install development tools (devtron, react tools) if in development mode
  if (process.env.NODE_ENV === 'development') {
    require('devtron').install();
    const { default: installExtension, REACT_DEVELOPER_TOOLS } = require('electron-devtools-installer');
    installExtension(REACT_DEVELOPER_TOOLS)
      .then((name) => debug(`Added Extension:  ${name}`))
      .catch((err) => debug('An error occurred: ', err));
  }

  /**
   * When electron's main renderer has completed setup,
   * we'll always show the [connect][./src/connect] dialog
   * on start which is responsible for retaining it's own
   * state between application launches.
   */
  showConnectWindow();
});
