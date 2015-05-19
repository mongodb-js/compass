var app = require('app');
var debug = require('debug')('scout-electron');
var mongo = require('./mongo');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

mongo.start(function() {
  debug('mongo started!');
});

app.on('before-quit', function() {
  mongo.stop(function() {
    debug('mongo stopped');
  });
});

module.exports = {
  autoupdater: require('./auto-updater'),
  crashreporter: require('./crash-reporter'),
  windows: require('./window-manager'),
  menu: require('./menu'),
};
