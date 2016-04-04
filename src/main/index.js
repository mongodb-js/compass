if (!process.env.NODE_ENV) {
  process.env.NODE_ENV = 'production';
}

var electron = require('electron');
var app = electron.app;

function main() {
  if (require('electron-squirrel-startup')) {
    return;
  }

  app.on('ready', function() {
    var Application = require('./application');
    Application.open();
  });
}

main();
