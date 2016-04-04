var electron = require('electron');
var app = electron.app;
var dialog = electron.dialog;
var autoUpdater = electron.autoUpdater;
var format = require('util').format;

var Model = require('ampersand-model');

var AUTO_UPDATE_SERVICE = 'https://compass-mongodb-com.herokuapp.com/';

var AutoUpdateManager = Model.extend({
  properties: {
    version: {
      type: 'string',
      default: function() {
        return app.getVersion();
      }
    },
    platform: {
      type: 'string',
      default: function() {
        return process.platform;
      }
    },
    state: {
      type: 'string',
      values: [
        'idle',
        'error',
        'no-update-available',
        'checking',
        'downloading',
        'update-available'
      ],
      default: 'idle'
    },
    new_release_version: {
      type: 'string'
    },
    new_release_notes: {
      type: 'string'
    }
  },
  derived: {
    feed_url: {
      deps: ['platform', 'channel'],
      fn: function() {
        return AUTO_UPDATE_SERVICE + '/';
      }
    },
    channel: {
      deps: ['version'],
      fn: function() {
        if (app.getVersion().indexOf('-dev') > -1) {
          return 'dev';
        } else if (app.getVersion().indexOf('-beta') > -1) {
          return 'beta';
        }
        return 'stable';
      },
      values: ['dev', 'beta', 'stable'],
      default: 'stable'
    }
  },
  onUpdateNotAvailable: function() {
    autoUpdater.removeListener('error', this.onUpdateError);
    return dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      icon: this.iconPath,
      message: 'No update available.',
      title: 'No Update Available',
      detail: format('Version %s is the latest version.', this.version);
    });
  },
  onError: function(event, message) {
    this.state = 'error';
    console.error('Error Downloading Update: ' + message);
  },
  onUpdateError: function(event, message) {
    autoUpdater.removeListener(
      'update-not-available', this.onUpdateNotAvailable);
    return dialog.showMessageBox({
      type: 'warning',
      buttons: ['OK'],
      icon: this.iconPath,
      message: 'There was an error checking for updates.',
      title: 'Update Error',
      detail: message
    });
  },
  start: function() {
      autoUpdater.on('error', this.onError.bind(this));
      autoUpdater.setFeedUrl(this.feed_url);

      autoUpdater.on('checking-for-update',
        this.set.bind(this, {state: 'checking'}));

      autoUpdater.on('update-not-available',
        this.set.bind(this, {state: 'no-update-available'}));

      autoUpdater.on('update-available',
        this.set.bind(this, {state: 'downloading'}));

      autoUpdater.on('update-downloaded',
        this.onUpdateDownloaded.bind(this));

      if (!autoUpdater.supportsUpdates()) {
        this.set({state: 'unsupported'});
      }
    },
    emitUpdateAvailableEvent: function() {
      var atomWindow, i, len, windows;
      windows = 1 <= arguments.length ? slice.call(arguments, 0) : [];
      if (this.releaseVersion == null) {
        return;
      }
      for (i = 0, len = windows.length; i < len; i++) {
        atomWindow = windows[i];
        atomWindow.sendMessage('update-available', {
          releaseVersion: this.releaseVersion
        });
      }
    },
    setState: function(state) {
      if (this.state === state) {
        return;
      }
      this.state = state;
      return this.emit('state-changed', this.state);
    },
    getState: function() {
      return this.state;
    },
    onUpdateDownloaded: function(event, releaseNotes, releaseVersion) {
      _this.releaseVersion = releaseVersion;
      _this.setState(UpdateAvailableState);
      return _this.emitUpdateAvailableEvent.apply(_this, _this.getWindows());
    },
    scheduleUpdateCheck: function() {
      var checkForUpdates, fourHours;
      if (!(/\w{7}/.test(this.version) || this.checkForUpdatesIntervalID)) {
        checkForUpdates = (function(_this) {
          return function() {
            return _this.check({
              hidePopups: true
            });
          };
        })(this);
        fourHours = 1000 * 60 * 60 * 4;
        this.checkForUpdatesIntervalID = setInterval(checkForUpdates, fourHours);
        return checkForUpdates();
      }
    },
    cancelScheduledUpdateCheck: function() {
      if (this.checkForUpdatesIntervalID) {
        clearInterval(this.checkForUpdatesIntervalID);
        this.checkForUpdatesIntervalID = null;
      }
    },
    check: function(opts) {
      opts = opts || {};
      if (!opts.hidePopups) {
        autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
        autoUpdater.once('error', this.onUpdateError);
      }
      return autoUpdater.checkForUpdates();
    },
    install: function() {
      return autoUpdater.quitAndInstall();
    }
});

module.exports = AutoUpdateManager;
