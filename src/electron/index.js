if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}
// Start crash-reporter asap so if anything goes
// wrong, we can at least view the crash reports
// locally.  When a crash occurs, a `.dmp` file
// will be created in `/tmp/Compass\ Crashes/completed`
// (`~\AppData\Local\Temp\Compass/ Crashes\completed` on Windows).
require('./crash-reporter');
var debug = require('debug')('electron:index');

if (!require('electron-squirrel-startup')) {
  var app = require('app');
  var serverctl = require('./scout-server-ctl');

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
  var AppMenu = require('./menu');
  AppMenu.init();
  require('./window-manager');
}
