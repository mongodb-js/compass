var electron = require('electron');
var app = electron.app;
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var AutoUpdateManager = require('hadron-auto-update-manager');
var debug = require('debug')('mongodb-compass:main:application');

function Application() {
  // For testing set a clean slate for the user data.
  if (process.env.NODE_ENV === 'testing') {
    var userDataDir = path.resolve(path.join(
      __dirname, '..', '..', '.user-data'));
    app.setPath('userData', userDataDir);
  }

  app.on('window-all-closed', function() {
    debug('All windows closed.  Quitting app.');
    app.quit();
  });

  var AppMenu = require('./menu');
  AppMenu.init();

  require('./window-manager');

  app.on('ready', function() {
    require('./help');
  });

  this.autoUpdateManager = new AutoUpdateManager({
    /**
     * TODO (imlucas) Move this to an application-level
     * config.
     */
    endpoint: 'https://compass-mongodb-com.herokuapp.com'
    /**
     * TODO (imlucas) Extract .pngs from .icns so we can
     * have nice Compass icons in dialogs.
     *
     * icon_path: path.join(__dirname, '..', 'resources', 'mongodb-compass.png')
     */
  });
}
inherits(Application, EventEmitter);

Application._instance = null;

Application.main = function() {
  if (require('electron-squirrel-startup')) {
    /* eslint no-console: 0 */
    return console.log('electron-squirrel-startup event handled sucessfully.');
  }

  if (!Application._instance) {
    Application._instance = new Application();
  }
  return Application._instance;
};

module.exports = Application;
