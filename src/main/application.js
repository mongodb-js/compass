var path = require('path');
var electron = require('electron');
var app = electron.app;
var ipc = electron.ipcMain;
var dialog = electron.dialog;
var BrowserWindow = electron.BrowserWindow;

var Model = require('ampersand-model');
var _ = require('lodash');

var AutoUpdateManager = require('./auto-update-manager');
var ApplicationMenu = require('./application-menu');

var debug = require('debug')('mongodb-compass:main:application');

// @autoUpdateManager = new AutoUpdateManager(@version, options.test, @resourcePath, @config)
// @applicationMenu = new ApplicationMenu(@version, @autoUpdateManager)
// @atomProtocolHandler = new AtomProtocolHandler(@resourcePath, @safeMode)

/**
 * Constants for window sizes on multiple platforms
 */

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

var RESOURCES = path.resolve(__dirname, '../app/');
var DEFAULT_URL = 'file://' + path.join(RESOURCES, 'index.html#connect');

var Application = Model.extend({
  helpWindow: null,
  connectWindow: null,
  launched: false,
  initialize: function() {
    this.setupUserDataDirectory();
    this.setupJavaScriptArguments();

    this.autoUpdateManager = new AutoUpdateManager();
    this.applicationMenu = new ApplicationMenu();
  },
  setupUserDataDirectory: function() {
    // For testing set a clean slate for the user data.
    if (process.env.NODE_ENV === 'testing') {
      var userDataDir = path.resolve(path.join(
        __dirname, '..', '..', '.user-data'));

      app.setPath('userData', userDataDir);
    }
  },
  setupJavaScriptArguments: function() {
    app.commandLine.appendSwitch('js-flags', '--harmony');
  },
  handleEvents: function() {
    app.on('window-all-closed', app.quit);
    app.on('show about dialog', function() {
      dialog.showMessageBox({
        type: 'info',
        message: 'MongoDB Compass Version: ' + app.getVersion(),
        buttons: []
      });
    });

    app.on('show connect dialog', this.showConnectWindow.bind(this));
    app.on('close connect window', this.closeConnectWindow.bind(this));
    app.on('show help window', this.showHelpEntry.bind(this));

    app.on('show compass overview submenu',
      this.applicationMenu.showCompassOverview.bind(this.applicationMenu));

    app.on('hide share submenu',
      this.applicationMenu.hideShare.bind(this.applicationMenu));

    app.on('show share submenu',
      this.applicationMenu.showShare.bind(this.applicationMenu));

    app.on('renderer ready', this.onRenderReady.bind(this));

    app.on('before-quit', function() {
      debug('sending `app-quit` msg');
      BrowserWindow.getAllWindows()[0].webContents.send('message', 'app-quit');
    });

    app.on('ready', this.showConnectWindow.bind(this));

    ipc.on('message', function(event, msg, arg) {
      debug('message received in main process', msg, arg);
      app.emit(msg, arg, event);
    });
  },
  /**
   * Can't use webContents `did-finish-load` event here because
   * metrics aren't set up at that point. renderer app sends custom event
   * `renderer ready` when metrics are set up. If first app launch, send back
   * `app launched` message at that point.
   */
  onRenderReady: function(arg, event) {
    if (this.launched) return;
    this.launched = true;
    debug('sending `app-launched` msg back');
    event.sender.send('message', 'app-launched');
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
  showConnectWindow: function() {
    if (this.connectWindow) {
      if (this.connectWindow.isMinimized()) {
        this.connectWindow.restore();
      }
      this.connectWindow.show();
      return;
    }

    this.connectWindow = this.createDialogWindow({
      width: DEFAULT_WIDTH_DIALOG,
      height: DEFAULT_HEIGHT_DIALOG
    });

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
  showHelpEntry: function(id) {
    if (this.helpWindow) {
      this.helpWindow.focus();
      if (id) {
        this.helpWindow.webContents.send('message', 'show-help-entry', id);
      }
      return;
    }

    var url = 'file://' + path.join(RESOURCES, 'index.html#help');
    if (id) {
      url += '/' + id;
    }

    this.helpWindow = this.createDialogWindow(url);
    this.helpWindow.on('closed', function() {
      this.helpWindow = null;
    }.bind(this));
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
      url: DEFAULT_URL
    });

    debug('creating new window: ' + opts.url);
    var _window = new BrowserWindow({
      width: opts.width,
      height: opts.height,
      'web-preferences': {
        'subpixel-font-scaling': true,
        'direct-write': true
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
        url: 'file://' + RESOURCES + '/index.html' + decodeURIComponent(url.replace('file://', ''))
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
        _window.webContents.addWorkSpace(path.join(__dirname, '..', '..'));
      });
      _window.webContents.openDevTools({
        detach: true
      });
    }
    return _window;
  }
});

module.exports = Application;
