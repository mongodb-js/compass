var _ = require('lodash');
var pkg = require('../../package.json');
var electron = require('electron');
var app = electron.app;
// For Linux users with drivers that are blacklisted by Chromium
// we ignore the blacklist to attempt to bypass the disabled
// WebGL settings.
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');

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

  if (process.env.HADRON_ISOLATED !== 'true') {
    this.setupAutoUpdate();
  }
  this.setupApplicationMenu();

  require('./window-manager');
}
inherits(Application, EventEmitter);

Application.prototype.setupJavaScriptArguments = function() {
  app.commandLine.appendSwitch('js-flags', '--harmony');
};

/**
 * Map package.json product names to API endpoint product names.
 */
const API_PRODUCT = {
  'mongodb-compass': 'compass',
  'mongodb-compass-readonly': 'compass-readonly'
};

/**
 * Platform API mappings.
 */
const API_PLATFORM = {
  darwin: 'osx',
  win32: 'windows',
  linux: 'linux'
};

/**
 * Get the channel name from the version number.
 *
 * @returns {String} - The channel.
 */
const getChannel = () => {
  if (pkg.version.indexOf('beta') > -1) {
    return 'beta';
  }
  return 'stable';
};

/**
 * TODO (imlucas) Extract .pngs from .icns so we can
 * have nice Compass icons in dialogs.
 *
 * path.join(__dirname, '..', 'resources', 'mongodb-compass.png')
 */
Application.prototype.setupAutoUpdate = function() {
  this.autoUpdateManager = new AutoUpdateManager(
    _.get(pkg, 'config.hadron.endpoint'),
    null,
    API_PRODUCT[process.env.HADRON_PRODUCT],
    getChannel(),
    API_PLATFORM[process.platform]
  );

  this.autoUpdateManager.on('state-change', function(newState) {
    debug('new state', newState);
  });

  this.autoUpdateManager.on('checking-for-update', function() {
    ipc.broadcast('app:checking-for-update');
  });

  this.autoUpdateManager.on('update-not-available', function() {
    ipc.broadcast('app:update-not-available');
  });

  this.autoUpdateManager.on('update-available', function() {
    ipc.broadcast('app:update-available');
  });

  this.autoUpdateManager.on(
    'update-downloaded',
    function() {
      ipc.broadcast('app:update-downloaded', {
        releaseNotes: this.autoUpdateManager.releaseNotes,
        releaseVersion: this.autoUpdateManager.releaseVersion
      });
    }.bind(this)
  );

  var updateManager = this.autoUpdateManager;
  ipc.respondTo({
    'app:install-update': function() {
      updateManager.install();
    },
    'app:enable-auto-update': function() {
      updateManager.enable();
    },
    'app:disable-auto-update': function() {
      updateManager.disable();
    },
    'app:check-for-update': function() {
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

Application.prototype.setupLifecycleListeners = function() {
  app.on('window-all-closed', function() {
    debug('All windows closed. Waiting for a new connection window.');
  });

  ipc.respondTo({
    'license:disagree': function() {
      debug('Did not agree to license, quitting app.');
      app.quit();
    }
  });
};

Application.prototype.setupUserDirectory = function() {
  // For testing set a clean slate for the user data.
  if (process.env.NODE_ENV === 'testing') {
    var userDataDir = path.resolve(
      path.join(__dirname, '..', '..', '.user-data')
    );
    app.setPath('userData', userDataDir);
  } else if (process.env.NODE_ENV === 'development') {
    var channel = 'stable';
    // extract channel from version string, e.g. `beta` for `1.3.5-beta.1`
    // TODO @thomasr this is a copy of the functionality in hadron-build.
    // Eventually this should live in a hadron-version module.
    var appName = app.getName();
    var mtch = app.getVersion().match(/-([a-z]+)(\.\d+)?$/);
    if (mtch) {
      channel = mtch[1];
    }
    if (channel !== 'stable' && !appName.toLowerCase().endsWith(channel)) {
      // add channel suffix to product name, e.g. "MongoDB Compass Dev"
      var newAppName = appName + ' ' + _.capitalize(channel);
      app.setName(newAppName);
      // change preference paths (note: this will still create the default
      // path first, but we are ok with this for development builds)
      app.setPath('userData', path.join(app.getPath('appData'), newAppName));
      app.setPath('userCache', path.join(app.getPath('cache'), newAppName));
    }
  } else if (process.env.NODE_ENV === 'production') {
    // If we are on windows we need to look for the registry key that tells us
    // where Commpass is installed. If they key exists, we need to change the user
    // data directory to a subfolder of that.
    if (process.platform === 'win32') {
      console.log('noop to debug.');
      // const vsWinReg = require('vscode-windows-registry');
      /* eslint new-cap: 0 */
      // const installDir = vsWinReg.GetStringRegKey('HKEY_LOCAL_MACHINE', `SOFTWARE\\MongoDB\\${app.getName()}`, 'directory');
      // if (installDir) {
      //   app.setPath('userData', path.join(installDir, 'UserData'));
      //   app.setPath('userCache', path.join(installDir, 'Cache'));
      // }
    }
  }
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
