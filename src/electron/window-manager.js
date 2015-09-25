/**
 * A high-level wrapper around electron's builtin
 * [BrowserWindow](https://github.com/atom/electron/blob/master/docs/api/browser-window.md)
 * class
 */
var path = require('path');
var _ = require('lodash');
var app = require('app');
var attachMenu = require('./menu');
var BrowserWindow = require('browser-window');
var debug = require('debug')('scout-electron:window-manager');

/**
 * When running in electron, we're in `RESOURCES/src/electron`.
 */
var RESOURCES = path.resolve(__dirname, '../../');

/**
 * The app's HTML shell which is the output of `./src/index.jade`
 * created by the `build:pages` gulp task.
 */
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');

/**
 * The outer dimensions to use for new windows.
 */
var DEFAULT_WIDTH = 1024;
var DEFAULT_HEIGHT = 700;

/**
 * The outer window dimensions to use for new dialog
 * windows like the connection and setup dialogs.
 */
var DEFAULT_WIDTH_DIALOG = 640;
var DEFAULT_HEIGHT_DIALOG = 600;
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
 * We want want the Connect dialog window to be special
 * and for there to ever only be one instance of it
 * so we'll use scope to essentially make it a Singleton.
 */
var connectWindow;

// @todo (imlucas): Removed in setup branch as we dont need to do this anymore
// as a `all-windows-closed` event has been added to the `app` event api
// since this code was laid down.
var windowsOpenCount = 0;

/**
 * Call me instead of using `new BrowserWindow()` directly because i'll:
 *
 * 1. Make sure the window is the right size
 * 2. Doesn't load a blank screen
 * 3. Overrides `window.open` so we have control over message passing via URL's

 *
 * @param {Object} opts - Smaller subset of [`BrowserWindow#options`][0].
 * @return {BrowserWindow}
 * [0]: http://git.io/vnwTY
 */
module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    url: DEFAULT_URL
  });

  debug('creating new window');
  var _window = new BrowserWindow({
    width: opts.width,
    height: opts.height,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });
  attachMenu(_window);
  _window.loadUrl(opts.url);

  _window.webContents.on('new-window', function(event, url) {
    debug('intercepting new-window (disregard the "error" message '
      + 'preventDefault is about to cause)');
    event.preventDefault();

    module.exports.create({
      url: 'file://' + RESOURCES + '/index.html' + decodeURIComponent(url.replace('file://', ''))
    });
  });

  if (opts.url === DEFAULT_URL) {
    connectWindow = _window;
    connectWindow.on('closed', function() {
      debug('connect window closed.');
      connectWindow = null;
    });
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

  // When in dev mode, automaticaly open devtools
  // detached for ease of debugging.
  if (process.env.NODE_ENV === 'development') {
    _window.openDevTools({
      detach: true
    });
  }
  return _window;
};

app.on('show connect dialog', function(opts) {
  if (connectWindow) {
    connectWindow.focus();
    return connectWindow;
  }

  opts = opts || {};
  opts = _.extend(opts || {}, {
    height: DEFAULT_HEIGHT_DIALOG,
    width: DEFAULT_WIDTH_DIALOG,
    url: DEFAULT_URL
  });
  module.exports.create(opts);
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
