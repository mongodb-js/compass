if (process.env.NODE_ENV === 'development') {
  process.env.DEBUG = 'mon*,sco*';
}
if(require('electron-squirrel-startup')){
  console.log('Squirrel.Windows event handled.');
  return;
}
var app = require('app');
var debug = require('debug')('scout-electron');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

app.on('ready', function(){
  if (process.env.NODE_ENV === 'development') {
    require('./livereload');
  }

  // @todo (imlucas): Use subprocess instead?
  process.nextTick(function(){
    console.log('requiring scout-server...');
    var server = require('scout-server');
    process.nextTick(function(){
      console.log('starting scout-server...');
      server.start();
    });
  });
});

debug('requiring auto-updater...');
require('./auto-updater');

debug('requiring crash-reporter...');
require('./crash-reporter');

debug('requiring window-manager...');
require('./window-manager');

debug('requiring menu...');
require('./menu');
