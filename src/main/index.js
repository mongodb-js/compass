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
var path = require('path');

(function() {
  if (!require('electron-squirrel-startup')) {
    var app = electron.app;

    // For testing set a clean slate for the user data.
    if (process.env.NODE_ENV === 'testing') {
      var userDataDir = path.resolve(path.join(__dirname, '..', '..', '.user-data'));
      app.setPath('userData', userDataDir);
    }

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
