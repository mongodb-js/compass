var app = require('app');
var ipc = require('ipc');
var updater = module.exports = require('auto-updater');
var debug = require('debug')('scout:electron:auto-updater');
var FEED_URL = 'http://squirrel.mongodb.parts/scout/releases/latest?version=' + app.getVersion();

debug('Using feed url', FEED_URL);
updater.on('checking-for-update', function() {
  debug('checking for update');
});

updater.on('error', function(err) {
  debug('error checking for update', err);
});

updater.on('update-available', function() {
  debug('update available and downloading...');
});

updater.on('update-not-available', function() {
  debug('No update available');
});

updater.on('update-downloaded', function(evt, releaseNotes, releaseName, releaseDate, updateUrl) {
  debug('Update downloaded!');
  ipc.send('update-downloaded', {
    notes: releaseNotes,
    name: releaseName,
    date: releaseDate,
    url: updateUrl
  });
});

// When the UI gets the `update-downloaded` message,
// it will show the "Restart to upgrade!" button which
// when clicked, sends the `install-update` message that
// we handle below to actually quit the app and install
// the update.
ipc.on('install-update', function() {
  debug('quitting app and updating...');
  app.quitAndUpdate();
});

updater.setFeedUrl(FEED_URL);

app.on('will-finish-launching', function() {
  debug('checking for updates...');
  updater.checkForUpdates();
});
