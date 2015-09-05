var _ = require('lodash');

var BrowserWindow = require('browser-window');
var app = require('app');
var debug = require('debug')('scout-electron:window-manager');
var attachMenu = require('./menu');
var path = require('path');

var RESOURCES = path.resolve(__dirname, '../../');
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');

var DEFAULT_WIDTH = 1024;
var DEFAULT_HEIGHT = 700;

var DEFAULT_HEIGHT_DIALOG;

if (process.platform === 'win32') {
  DEFAULT_HEIGHT_DIALOG = 500;
} else if (process.platform === 'linux') {
  DEFAULT_HEIGHT_DIALOG = 470;
} else {
  DEFAULT_HEIGHT_DIALOG = 440;
}
var DEFAULT_WIDTH_DIALOG = 640;

var connectWindow;
var windowsOpenCount = 0;

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

app.on('ready', function() {
  app.emit('show connect dialog');
});
