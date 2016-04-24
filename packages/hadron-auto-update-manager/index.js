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

function AutoUpdateManager(endpointURL) {
  this.endpointURL = endpointURL;
  this.version = app.getVersion();
  this.onUpdateError = _.bind(this.onUpdateError, this);
  this.onUpdateNotAvailable = _.bind(this.onUpdateNotAvailable, this);
  this.state = IdleState;
  this.feedURL = `${endpointURL}/updates?version=${this.version}`;
  debug('auto updater ready and waiting.', {
    version: this.version,
    feedURL: this.feedURL
  });

  process.nextTick( () => this.setupAutoUpdater());
}
_.extend(AutoUpdateManager.prototype, EventEmitter.prototype);

AutoUpdateManager.prototype.setupAutoUpdater = function() {
  autoUpdater.setFeedURL(this.feedURL);
  autoUpdater.on('error', (event, message) => {
    if (message === ENOSIGNATURE) {
      return debug('no auto updater for unsigned builds');
    }
    debug('Error Downloading Update: ' + message);
    return this.setState(ErrorState);
  });

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

  this.check({
    hidePopups: true
  });
  setInterval((function(_this) {
    return function() {
      var ref;
      if ((ref = _this.state) === UpdateAvailableState || ref === UnsupportedState) {
        console.log('Skipping update check... update ready to install, or updater unavailable.');
        return;
      }
      return _this.check({
        hidePopups: true
      });
    };
  })(this), 1000 * 60 * 30);
  if (autoUpdater.supportsUpdates != null) {
    if (!autoUpdater.supportsUpdates()) {
      return this.setState(UnsupportedState);
    }
  }
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
  return this.emit('state-changed', this.state);
};

AutoUpdateManager.prototype.getState = function() {
  return this.state;
};

AutoUpdateManager.prototype.check = function(arg) {
  var hidePopups;
  hidePopups = (arg != null ? arg : {}).hidePopups;
  if (!hidePopups) {
    autoUpdater.once('update-not-available', this.onUpdateNotAvailable);
    autoUpdater.once('error', this.onUpdateError);
  }
  if (process.platform === 'win32') {
    return autoUpdater.downloadAndInstallUpdate();
  } else {
    return autoUpdater.checkForUpdates();
  }
};

AutoUpdateManager.prototype.install = function() {
  if (process.platform === 'win32') {
    return autoUpdater.restartN1();
  } else {
    return autoUpdater.quitAndInstall();
  }
};

AutoUpdateManager.prototype.iconURL = function() {
  var url;
  url = path.join(process.resourcesPath, 'app', 'nylas.png');
  if (!fs.existsSync(url)) {
    return void 0;
  }
  return url;
};

AutoUpdateManager.prototype.onUpdateNotAvailable = function() {
  autoUpdater.removeListener('error', this.onUpdateError);
  return dialog.showMessageBox({
    type: 'info',
    buttons: ['OK'],
    icon: this.iconURL(),
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
    icon: this.iconURL(),
    message: 'There was an error checking for updates.',
    title: 'Update Error',
    detail: message
  });
};

module.exports = AutoUpdateManager;
