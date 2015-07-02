var BrowserWindow = require('browser-window');
var app = require('app');
var debug = require('debug')('scout-electron:window-manager');

var DEFAULT_URL = 'http://localhost:29017/index.html#connect';

var DEFAULT_WIDTH = 1024;
var DEFAULT_HEIGHT = 700;

var DEFAULT_WIDTH_DIALOG = 600;
var DEFAULT_HEIGHT_DIALOG = 400;

var main = module.exports.main = null;
var childWindows = [];

module.exports.create = function() {
  debug('creating new window');
  var _window = new BrowserWindow({
    width: main.width,
    height: main.height,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });
  _window.loadUrl(DEFAULT_URL);
  childWindows.push(_window);
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
  main = module.exports.main = new BrowserWindow({
    // width: DEFAULT_WIDTH,
    width: DEFAULT_WIDTH_DIALOG,
    height: height,
    'web-preferences': {
      'subpixel-font-scaling': true,
      'direct-write': true
    }
  });
  main.loadUrl(DEFAULT_URL);
  if (process.env.NODE_ENV === 'development') {
    main.openDevTools({
      detach: true
    });
  }

  main.on('closed', function() {
    debug('main window closed.  killing children.');
    main = null;
    childWindows.map(function(_window) {
      _window = null;
    });
  });
});
