/**
 * A high-level wrapper around electron's builtin [BrowserWindow][0] class.
 * https://github.com/atom/electron/blob/master/docs/api/browser-window.md
 */
var electron = require('electron');
var AppMenu = require('./menu');
var BrowserWindow = electron.BrowserWindow;
var Notifier = require('node-notifier');

var _ = require('lodash');
var app = electron.app;
var config = require('./config');
var debug = require('debug')('mongodb-compass:electron:window-manager');
var dialog = electron.dialog;
var path = require('path');

/**
 * When running in electron, we're in `/src/main`.
 */
var RESOURCES = path.resolve(__dirname, '../app/');

/**
 * TODO (imlucas) Missing this PNG.
 */
var COMPASS_ICON_PATH = RESOURCES + '/images/mongodb-compass.png';

/**
 * The app's HTML shell which is the output of `./src/index.jade`
 * created by the `build:pages` gulp task.
 */
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.jade#connect');
var HELP_URL = 'file://' + path.join(RESOURCES, 'index.jade#help');

/**
 * We want the Connect and Help window to be special
 * and for there to ever only be one instance of each of them
 * so we'll use scope to essentially make each of them a Singleton.
 */
var connectWindow;
var helpWindow;

/**
 * TODO (imlucas): Removed in setup branch as we dont need to do this anymore
 * as a `all-windows-closed` event has been added to the `app` event api
 * since this code was laid down.
 */
var windowsOpenCount = 0;

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

function openDevTools() {
  debug('openDevTools()');
  AppMenu.lastFocusedWindow.openDevTools({
    detach: true
  });
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
    url: DEFAULT_URL
  });

  debug('creating new window: ' + opts.url);
  var _window = new BrowserWindow({
    width: opts.width,
    height: opts.height,
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
      url: 'file://' + RESOURCES + '/index.jade' + decodeURIComponent(url.replace('file://', ''))
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
    _window.webContents.openDevTools({detach: true});
  }


  // @see `all-windows-closed` above
  windowsOpenCount++;
  _window.on('closed', function() {
    windowsOpenCount--;
    if (windowsOpenCount === 0) {
      debug('all windows closed.  quitting.');
      app.quit();
    }
  });

  return _window;
};

function createWindow(opts, url) {
  opts = _.extend(opts, {
    width: config.windows.DEFAULT_WIDTH_DIALOG,
    height: config.windows.DEFAULT_HEIGHT_DIALOG,
    url: url
  });
  return module.exports.create(opts);
}

app.on('show about dialog', function() {
  dialog.showMessageBox({
    type: 'info',
    message: 'MongoDB Compass Version: ' + app.getVersion(),
    buttons: []
  });
});

app.on('show connect dialog', function() {
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
});

app.on('close connect window', function() {
  if (connectWindow) {
    connectWindow.close();
  }
});

app.on('show help window', function(id) {
  if (helpWindow) {
    helpWindow.focus();
    if (_.isString(id)) {
      helpWindow.webContents.send('message', 'show-help-entry', id);
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
});

app.on('hide share submenu', function() {
  AppMenu.hideShare();
});

app.on('show compass overview submenu', function() {
  debug('show compass overview');
  AppMenu.showCompassOverview();
});

app.on('show share submenu', function() {
  AppMenu.showShare();
});

/**
 * can't use webContents `did-finish-load` event here because
 * metrics aren't set up at that point. renderer app sends custom event
 * `renderer ready` when metrics are set up. If first app launch, send back
 * `app launched` message at that point.
 */
app.on('renderer ready', function(arg, event) {
  if (!appLaunched) {
    appLaunched = true;
    debug('sending `app-launched` msg back');
    event.sender.send('message', 'app-launched');
  }
});

app.on('before-quit', function() {
  debug('sending `app-quit` msg');
  BrowserWindow.getAllWindows()[0].webContents.send('message', 'app-quit');
});

app.on('show bugsnag OS notification', function(errorMsg) {
  if (_.contains(['development', 'testing'], process.env.NODE_ENV)) {
    Notifier.notify({
      'icon': COMPASS_ICON_PATH,
      'message': errorMsg,
      'title': 'MongoDB Compass Exception',
      'wait': true
    }, function(err, resp) {
      if (err) {
        debug(err);
      }
      if (resp === 'Activate\n') {
        openDevTools();
      }
    });
  }
});

/**
 * When electron's main renderer has completed setup,
 * we'll always show the [connect][./src/connect] dialog
 * on start which is responsible for retaining it's own
 * state between application launches.
 */
app.on('ready', function() {
  app.emit('show connect dialog');
});

var ipc = electron.ipcMain;
ipc.on('message', function(event, msg, arg) {
  debug('message received in main process', msg, arg);
  app.emit(msg, arg, event);
});
