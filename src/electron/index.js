var app = require('app');
var serverctl = require('./scout-server-ctl');
var debug = require('debug')('scout-electron');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

app.on('quit', function() {
  debug('app quitting!  stopping server..');
  serverctl.stop(function(err) {
    if (err) {
      debug('Error stopping server...', err);
    }
    debug('Server stopped!  Bye!');
  });
});

serverctl.start(function(err) {
  if (err) {
    debug('Error starting server...', err);
  } else {
    debug('Server started!');
  }
});

require('./auto-updater');
require('./crash-reporter');
require('./menu');
require('./window-manager');
