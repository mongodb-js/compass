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

var DEFAULT_WIDTH_DIALOG = 600;
var DEFAULT_HEIGHT_DIALOG = 400;

var connectWindow;

module.exports.create = function(opts) {
  opts = _.defaults(opts || {}, {
    width: DEFAULT_WIDTH,
    height: DEFAULT_HEIGHT,
    url: DEFAULT_URL
  });

  if (opts.url === DEFAULT_URL && connectWindow) {
    connectWindow.focus();
    return connectWindow;
  }

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

  _window.webContents.on('new-window', function(event, url, frameName, disposition) {
    debug('got new-window event!', event, url, frameName, disposition);
    event.preventDefault();
    module.exports.create({
      url: 'file://' + RESOURCES + '/index.html' + url.replace('file://', '')
    });
  });

  if (opts.url === DEFAULT_URL) {
    connectWindow = _window;
    connectWindow.on('closed', function() {
      debug('connect window closed.');
      connectWindow = null;
    });
  }
  return _window;
};

app.on('ready', function() {
  // var height = DEFAULT_HEIGHT;
  var height = DEFAULT_HEIGHT_DIALOG;
  if (process.platform === 'win32') {
    height += 60;
  } else if (process.platform === 'linux') {
    height += 30;
  }
  debug('loading main window', DEFAULT_URL);

  module.exports.create({
    height: height,
    width: DEFAULT_WIDTH_DIALOG,
    url: DEFAULT_URL
  });
});
