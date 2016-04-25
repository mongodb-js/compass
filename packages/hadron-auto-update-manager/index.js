'use strict';
/* eslint eqeqeq: 1, no-console:0 no-else-return: 1, no-cond-assign: 1, consistent-return: 1 */
const path = require('path');
const fs = require('fs');
const electron = require('electron');
const dialog = electron.dialog;
const _ = require('lodash');
const EventEmitter = require('events').EventEmitter;
const autoUpdater = require('./auto-updater');
const debug = require('debug')('hadron-auto-update-manager');
const BrowserWindow = require('electron').BrowserWindow;
const ENOSIGNATURE = 'Could not get code signature for running application';
const app = electron.app;

const IdleState = 'idle';
const CheckingState = 'checking';
const DownloadingState = 'downloading';
const UpdateAvailableState = 'update-available';
const NoUpdateAvailableState = 'no-update-available';
const UnsupportedState = 'unsupported';
const ErrorState = 'error';

function AutoUpdateManager(endpointURL, iconURL) {
  if (!endpointURL) {
    throw new TypeError('endpointURL is required!');
  }
  this.endpointURL = endpointURL;
  this.iconURL = iconURL;
  this.version = app.getVersion();
  this.onUpdateError = _.bind(this.onUpdateError, this);
  this.onUpdateNotAvailable = _.bind(this.onUpdateNotAvailable, this);
  this.state = IdleState;
  this.feedURL = `${endpointURL}/updates?version=${this.version}`;

  debug('auto updater ready and waiting.', {
    version: this.version,
    feedURL: this.feedURL
  });

  process.nextTick(() => {
    this.setupAutoUpdater();
  });
}
_.extend(AutoUpdateManager.prototype, EventEmitter.prototype);

AutoUpdateManager.prototype.setupAutoUpdater = function() {
  // Need to set error event handler before setting feedURL.
  // Else we get the default node.js error event handling:
  // die hard if errors are unhandled.
  autoUpdater.on('error', (event, message) => {
    if (message === ENOSIGNATURE) {
      debug('no auto updater for unsigned builds');
      return this.setState('unsupported');
    }
    debug('Error Downloading Update: ' + message);
    return this.setState(ErrorState);
  });

  autoUpdater.setFeedURL(this.feedURL);

  autoUpdater.on('checking-for-update', () => {
    this.setState(CheckingState);
  });

  autoUpdater.on('update-not-available', () => {
    this.setState(NoUpdateAvailableState);
  });
  autoUpdater.on('update-available', () => {
    this.setState(DownloadingState);
  });
  autoUpdater.on('update-downloaded', (event, releaseNotes, releaseVersion) => {
    this.releaseNotes = releaseNotes;
    this.releaseVersion = releaseVersion;
    this.setState(UpdateAvailableState);
    this.emitUpdateAvailableEvent();
  });
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
},
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

AutoUpdateManager.prototype.emitUpdateAvailableEvent = function() {
  if (!this.releaseVersion) {
    return;
  }
  BrowserWindow.getAllWindows().each((_browserWindow) => {
    debug('sending app:update-available');
    if (_browserWindow.webContents) {
      _browserWindow.webContents.send('app:update-available', {
        releaseVersion: this.releaseVersion,
        releaseNotes: this.releaseNotes
      });
    }
  });
};

AutoUpdateManager.prototype.setState = function(state) {
  if (this.state === state) {
    return;
  }
  this.state = state;
  debug('state is now', state);
  return this.emit('state-changed', this.state);
};

AutoUpdateManager.prototype.getState = function() {
  return this.state;
};

AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
  autoUpdater.removeListener('error', this.onUpdateError);
  return dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    icon: this.iconURL,
    message: 'No update available.',
    title: 'No Update Available',
    detail: 'You\'re running the latest version of N1 (' + this.version + ').'
  });
};

AutoUpdateManager.prototype.onUpdateError = function(event, message) {
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
