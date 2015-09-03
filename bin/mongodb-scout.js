/**
 * The main entrypoint Electron will run when launching the application.
 */
if (!process.atomBinding) {
  console.error('mongodb-scout.js must be run in electron!');
  process.exit(0);
}

if (process.env.NODE_ENV === 'development') {
  process.env.DEBUG = 'mon*,sco*';
}

var debug = require('debug')('scout:bin:mongodb-scout');

// @see http://npm.im/electron-squirrel-startup
if (require('electron-squirrel-startup')) {
  debug('Handled Squirrel.Windows event.  Bye!');
} else {
  debug('require ../src/electron');
  require('../src/electron');
}
