if (process.env.NODE_ENV === 'development') {
  process.env.DEBUG = 'mon*,sco*';
}
if(require('electron-squirrel-startup')){
  return console.log('Squirrel.Windows event handled.');
}
var serverctl = require('./scout-server-ctl');
var app = require('app');
var debug = require('debug')('scout-electron');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

app.on('ready', function(){
  process.nextTick(function(){
    process.nextTick(function(){
      console.log('starting scout-server...');
      serverctl.start(function(err){
        if(err) return console.error(err);
        console.log('Server started!');
      });
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
