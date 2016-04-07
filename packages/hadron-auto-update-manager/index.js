var electron = require('electron');
var app = electron.app;
var dialog = electron.dialog;
var format = require('util').format;
var State = require('ampersand-state');
var autoUpdater = require('./auto-updater');
var debug = require('debug')('hadron-auto-update-manager');

const ENOSIGNATURE = 'Could not get code signature for running application';

var AutoUpdateManager = State.extend({
  properties: {
    version: {
      type: 'string',
      required: true
    },
    /**
     * e.g. 'https://compass-mongodb-com.herokuapp.com'
     */
    endpoint: {
      type: 'string',
      required: true
    },
    platform: {
      type: 'string',
      default: function() {
        return process.platform;
      }
    },
    arch: {
      type: 'string',
      default: function() {
        return process.arch;
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
        'update-available',
        'unsupported'
      ],
      default: 'idle'
    },
    new_release_version: {
      type: 'string'
    },
    new_release_notes: {
      type: 'string'
    },
    /**
     * Application .png to use for electron.dialogs.
     */
    icon_path: {
      type: 'string'
    },
    error_message: {
      type: 'string'
    }
  },
  derived: {
    feed_url: {
      deps: ['endpoint', 'version'],
      fn: function() {
        return format('%s/updates?version=%s&platform=%s&arch=%s',
          this.endpoint, this.version, this.platform, this.arch);
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
    this.listenTo(this, 'change:state', () => {
      this.trigger(this.state);
    });

    autoUpdater.on('error', (event, message) => {
      if (message === ENOSIGNATURE) {
        this.state = 'unsupported';
        return;
      }
      this.state = 'error';
      this.error_message = message;
      /* eslint no-console: 0 */
      console.error('Error Downloading Update: ' + message);
    })
    .on('checking-for-update', () => {
      this.state = 'checking';
    })
    .on('update-not-available', () => {
      this.state = 'no-update-available';
    })
    .on('update-available', () => {
      this.state = 'downloading';
    })
    .on('update-downloaded', (event, releaseNotes, releaseVersion) => {
      this.new_release_version = releaseVersion;
      this.new_release_notes = releaseNotes;
      this.state = 'update-available';
    });

    this.version = app.getVersion();
    debug('Channel is `%s`', this.channel);

    debug('Feed URL', this.feed_url);
    autoUpdater.setFeedURL(this.feed_url);

    debug('Ready and waiting! %j', this);
  },
  onUpdateNotAvailable: function() {
    autoUpdater.removeListener('error', this.onUpdateError);
    dialog.showMessageBox({
      type: 'info',
      buttons: ['OK'],
      icon: this.icon_path,
      message: 'No update available.',
      title: 'No Update Available',
      detail: format('Version %s is the latest version.', this.version)
    });
  },
  onUpdateError: function(event, message) {
    autoUpdater.removeListener(
      'update-not-available', this.onUpdateNotAvailable);
    dialog.showMessageBox({
      type: 'warning',
      buttons: ['OK'],
      icon: this.icon_path,
      message: 'There was an error checking for updates.',
      title: 'Update Error',
      detail: message
    });
  },
  /**
   * @api private
   * @return {Boolean} Check scheduled?
   */
  scheduleUpdateCheck: function() {
    if (this.checkForUpdatesIntervalID) {
      debug('Update check already scheduled');
      return false;
    }

    var fourHours = 1000 * 60 * 60 * 4;
    var checkForUpdates = this.checkForUpdates.bind(this, {
      hidePopups: true
    });
    this.checkForUpdatesIntervalID = setInterval(checkForUpdates, fourHours);
    checkForUpdates();
    return true;
  },
  /**
   * @api private
   * @return {Boolean} Scheduled check cancelled?
   */
  cancelScheduledUpdateCheck: function() {
    if (this.checkForUpdatesIntervalID) {
      clearInterval(this.checkForUpdatesIntervalID);
      this.checkForUpdatesIntervalID = null;
      debug('cancelled scheduled update check');
      return true;
    }
    return false;
  },
  checkForUpdates: function(opts) {
    opts = opts || {};
    if (!opts.hidePopups) {
      autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
      autoUpdater.once('error', this.onUpdateError);
    }
    debug('checking for updates...');
    autoUpdater.checkForUpdates();
    return true;
  },
  /**
   * @api public
   * @return {Boolean} Auto updates enabled?
   */
  enable: function() {
    if (this.state === 'unsupported') {
      debug('Not scheduling because updates are not supported.');
      return false;
    }
    return this.scheduleUpdateCheck();
  },
  /**
   * @api public
   */
  disable: function() {
    this.cancelScheduledUpdateCheck();
  },
  /**
   * @api public
   * @return {Boolean} Quit and install update?
   */
  install: function() {
    if (this.state !== 'update-available') {
      debug('No update to install');
      return false;
    }

    debug('installing via autoUpdater.quitAndInstall()');
    autoUpdater.quitAndInstall();
    return true;
  },
  /**
   * Check for updates now bypassing scheduled check.
   * @api public
   * @return {Boolean} Update check requested?
   */
  check: function() {
    if (this.state === 'unsupported') {
      debug('Updates are not supported.');
      return false;
    }
    return this.checkForUpdates();
  }
});

module.exports = AutoUpdateManager;
