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
  this.autoUpdateManager.on('checking-for-update', function() {
    ipc.broadcast('app:checking-for-update');
  });

  this.autoUpdateManager.on('update-not-available', function() {
    ipc.broadcast('app:update-not-available');
  });

  this.autoUpdateManager.on('update-available', function() {
    debug('broadcasting app:update-available');
    ipc.broadcast('app:update-available');
  });

  this.autoUpdateManager.on('error', function(err) {
    // handle error silently.
    debug('auto update error encountered:', err);
  });

  this.autoUpdateManager.on('update-downloaded', function() {
    debug('broadcasting app:update-downloaded');
    ipc.broadcast('app:update-downloaded', {
      releaseNotes: this.autoUpdateManager.releaseNotes,
      releaseVersion: this.autoUpdateManager.releaseVersion
    });
  }.bind(this));

  var updateManager = this.autoUpdateManager;
  ipc.respondTo({
    'app:download-update': function() {
      debug('respond to app:download-update');
      updateManager.download();
    },
    'app:install-update': function() {
      debug('respond to app:install-update');
      updateManager.install();
    },
    'app:enable-auto-update': function() {
      debug('respond to app:enable-auto-update');
      updateManager.enable();
    },
    'app:disable-auto-update': function() {
      debug('respond to app:disable-auto-update');
      updateManager.disable();
    },
    'app:check-for-update': function() {
      debug('respond to app:check-for-update');
      updateManager.check();
    }
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
  app.on('window-all-closed', function() {
    debug('All windows closed.  Quitting app.');
    app.quit();
  });
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
  app.on('window-all-closed', function() {
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
