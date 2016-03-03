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
var electron = require('electron');

(function() {
  if (!require('electron-squirrel-startup')) {
    var app = electron.app;

    var shouldQuit = app.makeSingleInstance(function(commandLine) {
      debug('Second electron instance attempted:', commandLine);
      app.emit('show connect dialog');
      return true;
    });

    if (shouldQuit) {
      app.quit();
      return;
    }

    app.on('window-all-closed', function() {
      debug('All windows closed.  Quitting app.');
      app.quit();
    });

    app.on('quit', function() {
      debug('app quitting! Closing connection..');
      // TODO-DURRAN: Close connection.
    });

    if (process.platform !== 'linux') {
      require('./auto-updater');
    }
    var AppMenu = require('./menu');
    AppMenu.init();
    require('./window-manager');

    app.on('ready', function() {
      require('./help');
    });
  }
}());
