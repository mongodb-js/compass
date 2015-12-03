var app = require('app');
var updater = module.exports = require('auto-updater');
var debug = require('debug')('mongodb-compass:auto-updater');

var FEED_URL = 'http://squirrel.mongodb.parts/mongodb-compass/releases/latest?version=' + app.getVersion();

debug('Using feed url', FEED_URL);

updater.on('checking-for-update', function() {
  debug('checking for update...');
});

updater.on('error', function() {
  debug('error checking for update');
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

app.on('check for updates', function() {
  debug('checking for updates...');
  updater.checkForUpdates();
});

// @todo (kangas) reenable update check after release-1
// app.on('ready', function() {
//   updater.setFeedUrl(FEED_URL);
//   app.emit('check for updates');
// });
