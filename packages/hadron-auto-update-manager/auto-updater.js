'use strict';

const EventEmitter = require('events').EventEmitter;
const got = require('got');
const debug = require('debug')('hadron-auto-update-manager:linux');

/**
 * Electron can't currently provide a consistent upgrade path for linux users.
 * Instead, provide a stub class for linux so the auto update service is
 * still called which allows us to know how many Linux users exist.
*/
class LinuxAutoUpdater extends EventEmitter {
  setFeedURL(feedURL) {
    this.feedURL = feedURL;
    debug('feedURL is `%s`', this.feedURL);
  }
  checkForUpdates() {
    if (!this.feedURL) {
      debug('No feedURL set.');
      return;
    }
    got(this.feedURL)
      .then(response => {
        debug('got response %j', response);
      })
      .catch(error => {
        debug('error from updater service', error);
      });
  }

  quitAndInstall() {
    return false;
  }
}

if (process.platform === 'linux') {
  module.exports = new LinuxAutoUpdater();
} else {
  module.exports = require('electron').autoUpdater;
}
