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

var main = module.exports.main = null;
var childWindows = [];

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
  if (main) {
    childWindows.push(_window);
  }
  _window.webContents.on('new-window', function(event, url, frameName, disposition) {
    debug('got new-window event!', event, url, frameName, disposition);
    event.preventDefault();
    module.exports.create({
      url: 'file://' + RESOURCES + '/index.html' + url.replace('file://', '')
    });
  });
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

  main = module.exports.main = module.exports.create({
    height: height,
    width: DEFAULT_WIDTH_DIALOG,
    url: DEFAULT_URL
  });

  main.on('closed', function() {
    debug('main window closed.  killing children.');
    main = null;
    /*eslint no-unused-vars:0*/
    childWindows.map(function(_window) {
      _window = null;
    });
  });
});
