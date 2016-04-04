var electron = require('electron');
var app = electron.app;
var dialog = electron.dialog;
var autoUpdater = electron.autoUpdater;
var format = require('util').format;
var Model = require('ampersand-model');
var debug = require('debug')('mongodb-compass:main:auto-update-manager');

var AUTO_UPDATE_SERVICE = 'https://compass-mongodb-com.herokuapp.com';

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
        return format('%s/updates?version=%s',
          AUTO_UPDATE_SERVICE, this.version);
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
  initialize: function() {
    this.version = app.getVersion();
    debug('Channel is `%s`', this.channel);

    autoUpdater.on('error', this.onError.bind(this));
    debug('Feed URL', this.feed_url);
    autoUpdater.setFeedURL(this.feed_url);

    autoUpdater.on('checking-for-update',
      this.set.bind(this, {state: 'checking'}));

    autoUpdater.on('update-not-available',
      this.set.bind(this, {state: 'no-update-available'}));

    autoUpdater.on('update-available',
      this.set.bind(this, {state: 'downloading'}));

    autoUpdater.on('update-downloaded',
      this.onUpdateDownloaded.bind(this));

    if (process.platform === 'linux') {
      this.set({state: 'unsupported'});
    }

    this.listenTo(this, 'change:state', function() {
      debug('state is now `%s`', this.state);
    }.bind(this));
  },
  onUpdateNotAvailable: function() {
    autoUpdater.removeListener('error', this.onUpdateError);
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      icon: this.iconPath,
      message: 'No update available.',
      title: 'No Update Available',
      detail: format('Version %s is the latest version.', this.version)
    });
  },
  onError: function(event, message) {
    this.state = 'error';
    if (message === 'Could not get code signature for running application') {
      debug('This is an unsigned development build and does ' +
        'not support autoupdates.');
      return;
    }
    console.error('Error Downloading Update: ' + message);
  },
  onUpdateError: function(event, message) {
    autoUpdater.removeListener(
      'update-not-available', this.onUpdateNotAvailable);
    dialog.showMessageBox({
      type: 'warning',
      buttons: ['OK'],
      icon: this.iconPath,
      message: 'There was an error checking for updates.',
      title: 'Update Error',
      detail: message
    });
  },
  onUpdateDownloaded: function(event, releaseNotes, releaseVersion) {
    this.new_release_version = releaseVersion;
    this.new_release_notes = releaseNotes;
    this.state = 'update-available';
  },
  scheduleUpdateCheck: function() {
    if ((/\w{7}/.test(this.version) || !this.checkForUpdatesIntervalID)) {
      return;
    }

    var checkForUpdates = function() {
      this.checkForUpdates({
        hidePopups: true
      });
    }.bind(this);

    var fourHours = 1000 * 60 * 60 * 4;
    this.checkForUpdatesIntervalID = setInterval(checkForUpdates, fourHours);
    checkForUpdates();
  },
  cancelScheduledUpdateCheck: function() {
    if (this.checkForUpdatesIntervalID) {
      clearInterval(this.checkForUpdatesIntervalID);
      this.checkForUpdatesIntervalID = null;
    }
  },
  checkForUpdates: function(opts) {
    opts = opts || {};
    if (!opts.hidePopups) {
      autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
      autoUpdater.once('error', this.onUpdateError);
    }
    autoUpdater.checkForUpdates();
  },
  enable: function() {
    this.scheduleUpdateCheck();
  },
  disable: function() {
    this.cancelScheduledUpdateCheck();
  },
  install: function() {
    autoUpdater.quitAndInstall();
  }
});

module.exports = AutoUpdateManager;
