'use strict';

const path = require('path');
const electron = require('electron');
const app = electron.app;
const dialog = electron.dialog;
const BrowserWindow = electron.BrowserWindow;
const Model = require('ampersand-model');
const _ = require('lodash');
const AutoUpdateManager = require('hadron-auto-update-manager');
const ApplicationMenu = require('hadron-application-menu');
const ipc = require('hadron-ipc');
const debug = require('debug')('mongodb-compass:main:application');

/**
* The outer dimensions to use for new windows.
*/
var DEFAULT_WIDTH = 1280;
var DEFAULT_HEIGHT = 800;

/**
* The outer window dimensions to use for new dialog
* windows like the connection and setup dialogs.
*/
var DEFAULT_WIDTH_DIALOG = 900;
var DEFAULT_HEIGHT_DIALOG = 760;

/**
* Adjust the heights to account for platforms
* that use a single menu bar at the top of the screen.
*/
if (process.platform === 'linux') {
  DEFAULT_HEIGHT_DIALOG -= 30;
  DEFAULT_HEIGHT -= 30;
} else if (process.platform === 'darwin') {
  DEFAULT_HEIGHT_DIALOG -= 60;
  DEFAULT_HEIGHT -= 60;
}

var CONNECT_URL = 'file://' + path.join(app.getAppPath(), 'static', 'index.html#connect');

var Application = Model.extend({
  helpWindow: null,
  connectWindow: null,
  launched: false,
  initialize: function() {
    this.setupUserDataDirectory();
    this.setupJavaScriptArguments();
    this.setupLifecycleEventHandlers();
    this.setupCommandHandlers();

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

    this.applicationMenu = new ApplicationMenu({
      autoUpdateManager: this.autoUpdateManager
    });
    this.loadApplicationMenu();
  },
  setupUserDataDirectory: function() {
    // For testing set a clean slate for the user data.
    if (process.env.NODE_ENV === 'testing') {
      app.setPath('userData', path.join(app.getAppPath(), '.user-data'));
    }

    debug('User data directory is `%s`', app.getPath('userData'));
  },
  setupJavaScriptArguments: function() {
    app.commandLine.appendSwitch('js-flags', '--harmony');
  },
  setupLifecycleEventHandlers: function() {
    app.on('window-all-closed', app.quit);
    app.on('before-quit', function() {
      _.first(BrowserWindow.getAllWindows())
        .webContents.send('message', 'app:quit');
    });
  },
  setupCommandHandlers: function() {
    ipc.respondTo({
      'app:renderer-ready': (arg, event) => {
        /**
         * Can't use webContents `did-finish-load` event here because
         * metrics aren't set up at that point. renderer app sends custom event
         * `renderer ready` when metrics are set up. If first app launch, send back
         * `app launched` message at that point.
         */
        if (this.launched) return;
        this.launched = true;
        event.sender.send('app:launched');
      },
      'app:open-about': () => {
        // TODO (imlucas) Icon + window title fixes.
        dialog.showMessageBox({
          type: 'info',
          message: `MongoDB Compass Version: ${app.getVersion()}`,
          buttons: []
        });
      },
      'app:install-update': () => this.autoUpdateManager.install(),
      'app:check-for-update': () => this.autoUpdateManager.checkForUpdate(),
      'app:auto-update-manager': () => this.autoUpdateManager.serialize(),
      'app:open-connect': () => this.openConnectWindow(),
      'app:close-connect': () => this.closeConnectWindow(),
      'app:open-help': () => this.openHelp(),
      'app:hide-menu-item': () => this.applicationMenu.hideMenuItem(),
      'app:show-menu-item': () => this.applicationMenu.showMenuItem(),
      'window:toggle-full-screen': () => this.windowToggleFullScreen(),
      'window:reload': () => this.windowReload(),
      'window:toggle-developer-tools': () => this.windowToggleDeveloperTools()
    });
  },
  /**
   * @see https://github.com/atom/electron/blob/master/docs/api/app.md
   *
   * @param {BrowserWindow} _window
   * @returns {Boolean}
   */
  isSingleInstance: function(_window) {
    var isNotSingle = app.makeSingleInstance(function(argv, dir) {
      /**
       * TODO (imlucas) To make clicking on a `mongodb://` URL in chrome
       * open Compass w/ connection dialog filled out, we can check if
       * any argv[i] starts w/ `mongodb://` and if so, call
       * `require('mongodb-connection-model').from(argv[i])` to parse the
       * URL an get back an instance of the Connection model.
       */
      debug('Someone tried to run a second instance! We should focus our window', {
        argv: argv,
        dir: dir
      });

      if (_window) {
        if (_window.isMinimized()) {
          _window.restore();
        }
        _window.focus();
      }
      return true;
    });

    return !isNotSingle;
  },
  openConnectWindow: function() {
    if (this.connectWindow) {
      if (this.connectWindow.isMinimized()) {
        this.connectWindow.restore();
      }
      this.connectWindow.show();
      return;
    }

    this.connectWindow = this.createDialogWindow(CONNECT_URL);

    this.connectWindow.on('closed', function() {
      debug('connect window closed.');
      this.connectWindow = null;
    }.bind(this));
  },
  closeConnectWindow: function() {
    if (!this.connectWindow) {
      return;
    }
    this.connectWindow.close();
  },
  createDialogWindow: function(url) {
    var opts = {
      width: DEFAULT_WIDTH_DIALOG,
      height: DEFAULT_HEIGHT_DIALOG,
      url: url
    };
    return this.createWindow(opts);
  },
  /**
   * Call me instead of using `new BrowserWindow()` directly because i'll:
   *
   * 1. Make sure the window is the right size
   * 2. Doesn't load a blank screen
   * 3. Overrides `window.open` so we have control over message passing via URL's
   *
   *
   * @param {Object} opts - Smaller subset of [`BrowserWindow#options`][0].
   * @return {BrowserWindow}
   * [0]: http://git.io/vnwTY
   */
  createWindow: function(opts) {
    opts = _.defaults(opts || {}, {
      width: DEFAULT_WIDTH,
      height: DEFAULT_HEIGHT,
      url: CONNECT_URL
    });

    debug('creating new window: ' + opts.url);
    var _window = new BrowserWindow({
      width: opts.width,
      height: opts.height,
      webPreferences: {
        subpixelFontScaling: true,
        directWrite: true
      }
    });
    this.applicationMenu.load(_window);

    if (!this.isSingleInstance(_window)) {
      app.quit();
      return null;
    }

    _window.loadURL(opts.url);

    _window.webContents.on('new-window', function(event, url) {
      debug('intercepting new-window (disregard the "error" message '
        + 'preventDefault is about to cause)');
      event.preventDefault();

      module.exports.create({
        url: `file://${app.getAppPath()}/static/index.html${decodeURIComponent(url.replace('file://', ''))}`
      });
    });

    /**
     * Open devtools for this window when it's opened.
     *
     * @example DEVTOOLS=1 npm start
     * @see scripts/start.js
     */
    if (process.env.DEVTOOLS) {
      _window.webContents.on('devtools-opened', function() {
        _window.webContents.addWorkSpace(app.getAppPath());
      });
      _window.webContents.openDevTools({
        detach: true
      });
    }
    return _window;
  },
  open: function() {
    this.openConnectWindow();
  },
  openHelp: function(id) {
    if (this.helpWindow) {
      this.helpWindow.focus();
      if (id) {
        this.helpWindow.webContents.send('message', 'show-help-entry', id);
      }
      return;
    }

    var url = 'file://' + path.join(app.getAppPath(), 'static', 'index.html#help');
    if (id) {
      url += '/' + id;
    }

    this.helpWindow = this.createDialogWindow(url);
    this.helpWindow.on('closed', function() {
      this.helpWindow = null;
    }.bind(this));
  }
});

Application._instance = null;

Application.main = function() {
  if (require('electron-squirrel-startup')) {
    /* eslint no-console: 0 */
    return console.log('electron-squirrel-startup event handled sucessfully.');
  }

  if (!Application._instance) {
    Application._instance = new Application();
  }
  Application._instance.open();
};

var _app = null;
Application.get = function(opts) {
  if (!_app) {
    _app = new Application(opts);
  }
  return _app;
};

module.exports = Application;
