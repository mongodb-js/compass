var app = require('app');
var updater = module.exports = require('auto-updater');
var debug = require('debug')('scout-electron:auto-updater');
var FEED_URL = 'http://squirrel.mongodb.parts/scout/releases/latest?version=' + app.getVersion();

debug('Using feed url', FEED_URL);

updater.on('checking-for-update', function() {
  debug('checking for update', arguments);
});

updater.on('error', function(err) {
  debug('error checking for update', err);
});

updater.on('update-available', function() {
  debug('update available', arguments);
});

updater.on('update-not-available', function() {
  debug('No update available', arguments);
});

updater.on('update-downloaded', function() {
  debug('Update downloaded', arguments);
});

updater.setFeedUrl(FEED_URL);

app.on('ready', function() {
  debug('checking for updates...');
  updater.checkForUpdates();
});
