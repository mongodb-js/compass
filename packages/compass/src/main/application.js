const _ = require('lodash');
const pkg = require('../../package.json');
const electron = require('electron');
const app = electron.app;
const { setupLogging } = require('./logging');
const showInitialWindow = require('./window-manager');

// For Linux users with drivers that are blacklisted by Chromium
// we ignore the blacklist to attempt to bypass the disabled
// WebGL settings.
app.commandLine.appendSwitch('ignore-gpu-blacklist', 'true');

const path = require('path');
const EventEmitter = require('events').EventEmitter;
const inherits = require('util').inherits;
const AutoUpdateManager = require('hadron-auto-update-manager');
const ipc = require('hadron-ipc');
const debug = require('debug')('mongodb-compass:main:application');

function Application() {
  const loggingSetupPromise = this.setupLogging();
  this.setupUserDirectory();
  this.setupJavaScriptArguments();
  this.setupLifecycleListeners();

  if (process.env.HADRON_ISOLATED !== 'true') {
    this.setupAutoUpdate();
  }
  this.setupApplicationMenu();

  loggingSetupPromise.then(() => {
    showInitialWindow();
  });
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
    process.env.HADRON_CHANNEL,
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
  if (process.env.NODE_ENV === 'development') {
    const appName = app.getName();
    // When NODE_ENV is dev, we are probably be running application unpackaged
    // directly with Electron binary which causes user dirs to be just
    // `Electron` instead of app name that we want here
    app.setPath('userData', path.join(app.getPath('appData'), appName));
    app.setPath('userCache', path.join(app.getPath('cache'), appName));
  }
};

Application.prototype.setupLogging = async function() {
  const home = app.getPath('home');
  const appData = process.env.LOCALAPPDATA || process.env.APPDATA;
  const logDir =
    process.env.MONGODB_COMPASS_TEST_LOG_DIR || process.platform === 'win32'
      ? path.join(appData || home, 'mongodb', 'compass')
      : path.join(home, '.mongodb', 'compass');
  app.setAppLogsPath(logDir);
  this.logFilePath = await setupLogging();
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
