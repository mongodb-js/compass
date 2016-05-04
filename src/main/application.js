var _ = require('lodash');
var pkg = require('../../package.json');
var electron = require('electron');
var app = electron.app;
var path = require('path');
var EventEmitter = require('events').EventEmitter;
var inherits = require('util').inherits;
var AutoUpdateManager = require('hadron-auto-update-manager');
var ipc = require('hadron-ipc');
var debug = require('debug')('mongodb-compass:main:application');
var evnt = require('hadron-events')
var AppEvent = evnt.AppEvent;
var ElectronEvent = evnt.ElectronEvent;

function Application() {
  this.setupUserDirectory();
  this.setupJavaScriptArguments();
  this.setupLifecycleListeners();

  this.setupAutoUpdate();
  this.setupApplicationMenu();

  require('./window-manager');
}
inherits(Application, EventEmitter);

Application.prototype.setupJavaScriptArguments = function() {
  app.commandLine.appendSwitch('js-flags', '--harmony');
};

Application.prototype.setupAutoUpdate = function() {
  this.autoUpdateManager = new AutoUpdateManager(
    _.get(pkg, 'config.hadron.endpoint')
    /**
     * TODO (imlucas) Extract .pngs from .icns so we can
     * have nice Compass icons in dialogs.
     *
     * path.join(__dirname, '..', 'resources', 'mongodb-compass.png')
     */
  );

  this.autoUpdateManager.on('state-change', function(newState) {
    debug('new state', newState);
  });

  this.autoUpdateManager.on('checking-for-update', function() {
    ipc.broadcast(AppEvent.CHECKING_FOR_UPDATE);
  });

  this.autoUpdateManager.on('update-not-available', function() {
    ipc.broadcast(AppEvent.UPDATE_NOT_AVAILABLE);
  });

  this.autoUpdateManager.on('update-available', function() {
    ipc.broadcast(AppEvent.UPDATE_AVAILABLE);
  });

  this.autoUpdateManager.on('update-downloaded', function() {
    ipc.broadcast(AppEvent.UPDATE_DOWNLOADED, {
      releaseNotes: this.autoUpdateManager.releaseNotes,
      releaseVersion: this.autoUpdateManager.releaseVersion
    });
  }.bind(this));

  var updateManager = this.autoUpdateManager;
  ipc.respondTo(AppEvent.INSTALL_UPDATE, function() {
    updateManager.install();
  });
  ipc.respondTo(AppEvent.ENABLE_AUTO_UPDATE, function() {
    updateManager.enable();
  });
  ipc.respondTo(AppEvent.DISABLE_AUTO_UPDATE, function() {
    updateManager.disable();
  });
  ipc.respondTo(AppEvent.CHECK_FOR_UPDATE, function() {
    updateManager.check();
  });
};

Application.prototype.setupApplicationMenu = function() {
  // this.applicationMenu = new ApplicationMenu({
  //   autoUpdateManager: this.autoUpdateManager
  // });
  require('./menu').init();
};

Application.prototype.setupUserDirectory = function() {
  // For testing set a clean slate for the user data.
  if (process.env.NODE_ENV === 'testing') {
    var userDataDir = path.resolve(path.join(
      __dirname, '..', '..', '.user-data'));
    app.setPath('userData', userDataDir);
  }
};

Application.prototype.setupLifecycleListeners = function() {
  app.on(ElectronEvent.ALL_WINDOWS_CLOSED, function() {
    debug('All windows closed.  Quitting app.');
    app.quit();
  });
};

Application.prototype.setupApplicationMenu = function() {
  // this.applicationMenu = new ApplicationMenu({
  //   autoUpdateManager: this.autoUpdateManager
  // });
  require('./menu').init();
};

Application.prototype.setupUserDirectory = function() {
  // For testing set a clean slate for the user data.
  if (process.env.NODE_ENV === 'testing') {
    var userDataDir = path.resolve(path.join(
      __dirname, '..', '..', '.user-data'));
    app.setPath('userData', userDataDir);
  }
};

Application.prototype.setupLifecycleListeners = function() {
  app.on(ElectronEvent.ALL_WINDOWS_CLOSED, function() {
    debug('All windows closed.  Quitting app.');
    app.quit();
  });
};

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
