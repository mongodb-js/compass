var app = require('app'),
  debug = require('debug')('scout-atom');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

module.exports = {
  autoupdater: require('./auto-updater'),
  crashreporter: require('./crash-reporter'),
  windows: require('./window-manager'),
};
