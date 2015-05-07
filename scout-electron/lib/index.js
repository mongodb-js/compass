var app = require('app'),
  debug = require('debug')('scout-electron');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

module.exports = {
  autoupdater: require('./auto-updater'),
  crashreporter: require('./crash-reporter'),
  windows: require('./window-manager'),
  menu: require('./menu'),
};
