var _ = require('lodash');
var BrowserWindow = require('browser-window');
var app = require('app');
var debug = require('debug')('scout-electron:window-manager');
var attachMenu = require('./menu');
var path = require('path');

var RESOURCES = path.resolve(__dirname, '../../');
var CONNECT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');
var SETUP_URL = 'file://' + path.join(RESOURCES, 'index.html#setup');

var DEFAULT_WIDTH = 1024;
var DEFAULT_HEIGHT = 700;

var DEFAULT_HEIGHT_DIALOG;
if (process.platform === 'win32') {
  DEFAULT_HEIGHT_DIALOG = 460;
} else if (process.platform === 'linux') {
  DEFAULT_HEIGHT_DIALOG = 430;
} else {
  DEFAULT_HEIGHT_DIALOG = 400;
}

var ICON = path.join(__dirname, '..', '..', 'images', 'mongodb-leaf.png');
var DEFAULT_WIDTH_DIALOG = 600;

var connectWindow;
var setupWindow;

module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    url: CONNECT_URL,
    icon: ICON,
    centered: true
  });

  opts['web-preferences'] = _.defaults(opts['web-preferences'] || {}, {
    'subpixel-font-scaling': true,
    'direct-write': true
  });

  debug('creating new window');
  var _window = new BrowserWindow(opts);
  attachMenu(_window);
  _window.loadUrl(opts.url);

  _window.webContents.on('new-window', function(event, url, frameName, disposition) {
    debug('got new-window event!', event, url, frameName, disposition);
    event.preventDefault();
    module.exports.create({
      url: 'file://' + RESOURCES + '/index.html' + url.replace('file://', '')
    });
  });

  if (opts.url === CONNECT_URL) {
    connectWindow = _window;
    connectWindow.on('closed', function() {
      debug('connect window closed.');
      connectWindow = null;
    });
  }

  if (opts.url === SETUP_URL) {
    setupWindow = _window;
    setupWindow.on('closed', function() {
      debug('setup window closed.');
      setupWindow = null;
    });
  }

  debug('emitting `window-opened`');
  app.emit('window-opened', _window);
  return _window;
};

module.exports.openConnectDialog = function(opts) {
  if (connectWindow) {
    connectWindow.focus();
    return connectWindow;
  }

  opts = opts || {};
  opts = _.extend(opts || {}, {
    url: CONNECT_URL,
    height: DEFAULT_HEIGHT_DIALOG,
    width: DEFAULT_WIDTH_DIALOG,
    resizable: false
  });
  return module.exports.create(opts);
};

module.exports.openSetupDialog = function(opts) {
  if (setupWindow) {
    setupWindow.focus();
    return setupWindow;
  }

  opts = opts || {};
  opts = _.extend(opts || {}, {
    url: SETUP_URL,
    height: 550,
    width: 600,
    resizable: false
  });
  return module.exports.create(opts);
};
