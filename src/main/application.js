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
  debug('running Application() setup!');
  this.setupUserDirectory();
  this.setupJavaScriptArguments();
  this.setupLifecycleListeners();

  if (process.env.HADRON_ISOLATED !== 'true') {
    this.setupAutoUpdate();
  } else {
    debug('skipped setupAutoUpdate for hadron_isolated');
  }
  this.setupApplicationMenu();

  /**
   * TODO (lucas) oh... why...
   */
  debug('requiring ./window-manager...');
  require('./window-manager');
  debug('top-level Application() setup complete!');
}
inherits(Application, EventEmitter);

Application.prototype.setupJavaScriptArguments = function() {
  debug('setting electron app commandLine switches...');
  app.commandLine.appendSwitch('js-flags', '--harmony');
};

/**
 * Map package.json product names to API endpoint product names.
 */
const API_PRODUCT = {
  'mongodb-compass': 'compass',
  'mongodb-compass-community': 'compass-community',
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
  debug('setupApplicationMenu');
  require('./menu').init();
};

Application.prototype.setupLifecycleListeners = function() {
  debug('setupLifecycleListeners');
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
/**
 * TODO: Huh?! Already defined above. Must have been a missed conflict resolve.
 */
// Application.prototype.setupApplicationMenu = function() {
//   // this.applicationMenu = new ApplicationMenu({
//   //   autoUpdateManager: this.autoUpdateManager
//   // });
//   require('./menu').init();
// };

Application.prototype.setupUserDirectory = function() {
  debug('setupUserDirectory');
  // For testing set a clean slate for the user data.
  if (process.env.NODE_ENV === 'testing') {
    var userDataDir = path.resolve(
      path.join(__dirname, '..', '..', '.user-data')
    );
    app.setPath('userData', userDataDir);
    debug('NODE_ENV testing so userDataDir will be', userDataDir);
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
      debug('setupUserDirectory for NODE_ENV development');
      // add channel suffix to product name, e.g. "MongoDB Compass Dev"
      var newAppName = appName + ' ' + _.capitalize(channel);
      app.setName(newAppName);
      debug('setupUserDirectory: set appName to', newAppName);
      // change preference paths (note: this will still create the default
      // path first, but we are ok with this for development builds)
      /**
       * TODO (lucas) This seems wacky... revisit.
       */
      app.setPath('userData', path.join(app.getPath('appData'), newAppName));
      debug('setupUserDirectory: set userDataDir to', path.join(app.getPath('appData'), newAppName));

      app.setPath('userCache', path.join(app.getPath('cache'), newAppName));
      debug('setupUserDirectory: set userCacheDir to', path.join(app.getPath('appData'), newAppName));
    } else {
      debug('setupUserDirectory: NODE_ENV development: Uhoh... NODE_ENV development but on stable channel...');
    }
  } else if (process.env.NODE_ENV === 'production') {
    debug('setupUserDirectory: NODE_ENV production!');
    // If we are on windows we need to look for the registry key that tells us
    // where Commpass is installed. If they key exists, we need to change the user
    // data directory to a subfolder of that.
    if (process.platform === 'win32') {
      debug('setupUserDirectory: NODE_ENV production: its windows');
      const vsWinReg = require('vscode-windows-registry');
      debug('setupUserDirectory: NODE_ENV production: checking for registry values set by .msi...');
      /* eslint new-cap: 0 */
      const installDir = vsWinReg.GetStringRegKey('HKEY_LOCAL_MACHINE', `SOFTWARE\\MongoDB\\${app.getName()}`, 'directory');
      if (installDir) {
        debug('setupUserDirectory: NODE_ENV production: using installDir from registry', installDir);
        app.setPath('userData', path.join(installDir, 'UserData'));
        debug('setupUserDirectory: NODE_ENV production: set userData to', path.join(installDir, 'UserData'));
        app.setPath('userCache', path.join(installDir, 'Cache'));
        debug('setupUserDirectory: NODE_ENV production: set userCache to', path.join(installDir, 'Cache'));
      }
    } else {
      debug('setupUserDirectory: NODE_ENV production: not windows so nothing special needed.');
    }
  }
};

Application._instance = null;

Application.main = function() {
  debug('main() called!');
  debug('electron-squirrel-startup check...');
  if (require('electron-squirrel-startup')) {
    /* eslint no-console: 0 */
    return console.log('electron-squirrel-startup event handled sucessfully.');
  }

  if (!Application._instance) {
    debug('no Application singleton yet! instantiating...');
    Application._instance = new Application();
  } else {
    debug('already have Application singleton instance to use.');
  }
  return Application._instance;
};

module.exports = Application;
