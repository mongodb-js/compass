var BrowserWindow = require('browser-window'),
  app = require('app'),
  debug = require('debug')('scout-atom:window-manager');

var DEFAULT_URL = 'http://localhost:29017/index.html';

var main = module.exports.main = null,
  childWindows = [];

module.exports.create = function(){
  debug('creating new window');
  var _window = new BrowserWindow({
    width: main.width,
    height: main.height
  });
  _window.loadUrl(DEFAULT_URL);
  childWindows.push(_window);
};

app.on('ready', function() {
  var height = 600;
  if (process.platform === 'win32'){
    height += 60;
  }
  else if (process.platform === 'linux'){
    height += 30;
  }
  debug('loading main window', DEFAULT_URL);
  main = new BrowserWindow({width: 800, height: height});
  main.loadUrl(DEFAULT_URL);

  main.on('closed', function(){
    debug('main window closed.  killing children.');
    main = null;
    childWindows.map(function(_window){
      _window = null;
    });
  });
});
