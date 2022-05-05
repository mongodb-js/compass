/* eslint eqeqeq: 1, no-console:0 no-else-return: 1, no-cond-assign: 1, consistent-return: 1 */
const electron = require('electron');
const dialog = electron.dialog;
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const autoUpdater = require('./auto-updater');

const {createLoggerAndTelemetry} = require('@mongodb-js/compass-logging');
const { log, mongoLogId, debug } = createLoggerAndTelemetry('COMPASS-AUTO-UPDATES');

const ENOSIGNATURE = 'Could not get code signature for running application';
const app = electron.app;

const IdleState = 'idle';
const CheckingState = 'checking';
const DownloadingState = 'downloading';
const UpdateAvailableState = 'update-available';
const NoUpdateAvailableState = 'no-update-available';
// const UnsupportedState = 'unsupported';
const ErrorState = 'error';


function AutoUpdateManager(endpointURL, iconURL, product, channel, platform) {
  if (!endpointURL) {
    throw new TypeError('endpointURL is required!');
  }

  if (typeof endpointURL === 'object') {
    const opts = endpointURL;
    endpointURL = opts.endpoint;
    iconURL = opts.icon;
    product = opts.product;
    channel = opts.channel;
    platform = opts.platform;
  }

  this.endpointURL = endpointURL;
  this.iconURL = iconURL;
  this.version = app.getVersion();
  this.onUpdateError = _.bind(this.onUpdateError, this);
  this.onUpdateNotAvailable = _.bind(this.onUpdateNotAvailable, this);
  this.state = IdleState;
  this.feedURL = `${endpointURL}/api/v2/update/${product}/${channel}/${platform}/${this.version}`;

  debug('auto updater ready and waiting.', {
    version: this.version,
    feedURL: this.feedURL
  });

  process.nextTick(() => {
    try {
      this.setupAutoUpdater();
    } catch (e) {
      log.error(mongoLogId(1001000134),
        'AutoUpdateManager',
        'Error while setting up the auto updater',
        {
          error: e.message
        }
      );
    }
  });
}
_.extend(AutoUpdateManager.prototype, EventEmitter.prototype);

AutoUpdateManager.prototype.setupAutoUpdater = function() {
  // Need to set error event handler before setting feedURL.
  // Else we get the default node.js error event handling:
  // die hard if errors are unhandled.
  autoUpdater.on('error', (event, message) => {
    log.error(mongoLogId(1001000129),
      'AutoUpdateManager',
      'Error Downloading Update',
      {
        event, message
      }
    );

    if (message === ENOSIGNATURE) {
      debug('no auto updater for unsigned builds');
      return this.setState('unsupported');
    }

    return this.setState(ErrorState);
  });

  autoUpdater.on('checking-for-update', () => {
    log.info(mongoLogId(1001000135), 'AutoUpdateManager', 'Checking for updates ...');
    this.setState(CheckingState);
  });

  autoUpdater.on('update-not-available', () => {
    log.info(mongoLogId(1001000126), 'AutoUpdateManager', 'Update not available');
    this.setState(NoUpdateAvailableState);
  });

  autoUpdater.on('update-available', () => {
    log.info(mongoLogId(1001000127), 'AutoUpdateManager', 'Update available');
    this.setState(DownloadingState);
  });

  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseVersion) => {
    log.info(mongoLogId(1001000128), 'AutoUpdateManager', 'Update downloaded', {
      releaseVersion
    });

    this.releaseNotes = releaseNotes;
    this.releaseVersion = releaseVersion;
    this.setState(UpdateAvailableState);
  });

  autoUpdater.setFeedURL(this.feedURL);
  log.info(mongoLogId(1001000136), 'AutoUpdateManager', 'Feed url set',
    {feedURL: this.feedURL});
};

/**
  * @api private
  * @return {Boolean} Check scheduled?
  */
AutoUpdateManager.prototype.scheduleUpdateCheck = function() {
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
};
/**
* @api private
* @return {Boolean} Scheduled check cancelled?
*/
AutoUpdateManager.prototype.cancelScheduledUpdateCheck = function() {
  if (this.checkForUpdatesIntervalID) {
    clearInterval(this.checkForUpdatesIntervalID);
    this.checkForUpdatesIntervalID = null;
    debug('cancelled scheduled update check');
    return true;
  }
  return false;
};

AutoUpdateManager.prototype.checkForUpdates = function(opts) {
  debug('checkForUpdates with options', opts);
  opts = opts || {};

  if (opts.hidePopups !== false) {
    opts.hidePopups = true;
  }

  if (!opts.hidePopups) {
    autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
    autoUpdater.once('error', this.onUpdateError);
  }
  debug('checking for updates...');
  autoUpdater.checkForUpdates();
  return true;
};

/**
 * @api public
 * @return {Boolean} Auto updates enabled?
 */
AutoUpdateManager.prototype.enable = function() {
  if (this.state === 'unsupported') {
    debug('Not scheduling because updates are not supported.');
    return false;
  }
  return this.scheduleUpdateCheck();
};

/**
 * @api public
 */
AutoUpdateManager.prototype.disable = function() {
  this.cancelScheduledUpdateCheck();
};

/**
 * @api public
 * @return {Boolean} Quit and install update?
 */
AutoUpdateManager.prototype.install = function() {
  if (this.state !== 'update-available') {
    debug('No update to install');
    return false;
  }

  debug('removing all event listeners for app#all-windows-closed');
  app.removeAllListeners('all-windows-closed');

  debug('installing via autoUpdater.quitAndInstall()');
  autoUpdater.quitAndInstall();
  return true;
};

/**
 * Check for updates now bypassing scheduled check.
 * @api public
 * @return {Boolean} Update check requested?
 */
AutoUpdateManager.prototype.check = function() {
  if (this.state === 'unsupported') {
    debug('Updates are not supported.');
    return false;
  }
  return this.checkForUpdates();
};

AutoUpdateManager.prototype.setState = function(state) {
  if (this.state === state) {
    return;
  }
  this.state = state;
  debug('state is now', state);
  this.emit('state-changed', this.state);
};

AutoUpdateManager.prototype.getState = function() {
  return this.state;
};

AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
  debug('update not available', arguments);
  autoUpdater.removeListener('error', this.onUpdateError);
  return dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    icon: this.iconURL,
    message: 'No update available.',
    title: 'No Update Available',
    detail: 'You\'re running the latest version of ' + app.getName() + ' (' + this.version + ').'
  });
};

AutoUpdateManager.prototype.onUpdateError = function(event, message) {
  debug('update error', arguments);
  autoUpdater.removeListener('update-not-available', this.onUpdateNotAvailable);
  return dialog.showMessageBox({
    type: 'warning',
    buttons: ['OK'],
    icon: this.iconURL,
    message: 'There was an error checking for updates.',
    title: 'Update Error',
    detail: message
  });
};

module.exports = AutoUpdateManager;
