/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/master/docs/api/browser-window.md
 */
var electron = require('electron');
var AppMenu = require('./menu');
var BrowserWindow = electron.BrowserWindow;

var _ = require('lodash');
var app = electron.app;
var config = require('./config');
var migrate = require('./migrations');
var debug = require('debug')('mongodb-compass:electron:window-manager');
var dialog = electron.dialog;
var path = require('path');
var ipc = require('hadron-ipc');
var WindowEvent = require('hadron-events').WindowEvent;

/**
 * When running in electron, we're in `/src/main`.
 */
var RESOURCES = path.resolve(__dirname, '../app/');

/**
 * The app's HTML shell which is the output of `./src/index.html`
 * created by the `build:pages` gulp task.
 */
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');
var HELP_URL = 'file://' + path.join(RESOURCES, 'index.html#help');

/**
 * We want the Connect and Help window to be special
 * and for there to ever only be one instance of each of them
 * so we'll use scope to essentially make each of them a Singleton.
 */
var connectWindow;
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
module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: config.windows.DEFAULT_WIDTH,
    height: config.windows.DEFAULT_HEIGHT,
    minwidth: config.windows.MIN_WIDTH,
    url: DEFAULT_URL
  });

  debug('creating new window: ' + opts.url);
  var _window = new BrowserWindow({
    width: opts.width,
    height: opts.height,
    'min-width': opts.minwidth,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });
  AppMenu.load(_window);

  if (!isSingleInstance(_window)) {
    app.quit();
    return null;
  }

  _window.loadURL(opts.url);

  _window.webContents.on('new-window', function(event, url) {
    debug('intercepting new-window (disregard the "error" message '
      + 'preventDefault is about to cause)');
    event.preventDefault();

    module.exports.create({
      url: 'file://' + RESOURCES + '/index.html' + decodeURIComponent(url.replace('file://', ''))
    });
  });

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


function createWindow(opts, url) {
  opts = _.extend(opts, {
    width: config.windows.DEFAULT_WIDTH_DIALOG,
    height: config.windows.DEFAULT_HEIGHT_DIALOG,
    minwidth: config.windows.MIN_WIDTH_DIALOG,
    url: url
  });
  return module.exports.create(opts);
}

function showConnectWindow() {
  if (connectWindow) {
    if (connectWindow.isMinimized()) {
      connectWindow.restore();
    }
    connectWindow.show();
    return connectWindow;
  }

  connectWindow = createWindow({}, DEFAULT_URL);
  connectWindow.on('closed', function() {
    debug('connect window closed.');
    connectWindow = null;
  });
}

function closeConnectWindow() {
  if (connectWindow) {
    connectWindow.close();
  }
}

function showAboutDialog() {
  dialog.showMessageBox({
    type: 'info',
    message: 'MongoDB Compass Version: ' + app.getVersion(),
    buttons: []
  });
}

function showHelpWindow(win, id) {
  if (helpWindow) {
    helpWindow.focus();
    if (_.isString(id)) {
      helpWindow.webContents.send('app:show-help-entry', id);
    }
    return;
  }
  var url = HELP_URL;
  if (_.isString(id)) {
    url += '/' + id;
  }
  helpWindow = createWindow({}, url);
  helpWindow.on('closed', function() {
    helpWindow = null;
  });
}

function showCompassOverview() {
  AppMenu.showCompassOverview();
}

function showShareSubmenu() {
  AppMenu.showShare();
}

function hideShareSubmenu() {
  AppMenu.hideShare();
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
  'app:close-connect-window': closeConnectWindow,
  'app:show-help-window': showHelpWindow
});

ipc.respondTo(WindowEvent.SHOW_ABOUT_DIALOG, showAboutDialog);
ipc.respondTo(WindowEvent.SHOW_SHARE_SUBMENU, showShareSubmenu);
ipc.respondTo(WindowEvent.HIDE_SHARE_SUBMENU, hideShareSubmenu);
ipc.respondTo(WindowEvent.SHOW_COMPASS_OVERVIEW_SUBMENU, showCompassOverview);
ipc.respondTo(WindowEvent.RENDERER_READY, rendererReady);

// respond to events from the main process
app.on(WindowEvent.SHOW_ABOUT_DIALOG, showAboutDialog);
app.on('app:show-connect-window', showConnectWindow);
app.on('app:show-help-window', showHelpWindow);

app.on('before-quit', function() {
  debug('sending `app:quit` msg');
  _.first(BrowserWindow.getAllWindows()).webContents.send('app:quit');
});

/**
 * When electron's main renderer has completed setup,
 * we'll always show the [connect][./src/connect] dialog
 * on start which is responsible for retaining it's own
 * state between application launches.
 */
app.on('ready', function() {
  migrate(function(err) {
    if (err) {
      // ignore migration errors silently.
    }
    showConnectWindow();
  });
});
