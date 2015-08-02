require('./newrelic');

if (process.env.NODE_ENV === 'development') {
  require('./livereload');
}

var app = require('app');
var BrowserWindow = require('browser-window');
var ipc = require('ipc');
var windows = require('./window-manager');
var githubOauthFlow = require('./github-oauth-flow');
var setup = require('./setup');
var debug = require('debug')('scout:electron');

var settings;
try {
  settings = require('../../settings.json');
} catch (e) {
  debug('no settings file found.  external services disabled.');
  settings = {};
}

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

app.on('open-setup-dialog', windows.openSetupDialog);
app.on('open-connect-dialog', windows.openConnectDialog);

app.on('ready', function() {
  ipc.on('open-setup-dialog', app.emit.bind(app, 'open-setup-dialog'));
  ipc.on('open-connect-dialog', app.emit.bind(app, 'open-connect-dialog'));
  ipc.on('open-github-oauth-flow', function(event) {
    var sender = BrowserWindow.fromWebContents(event.sender);
    githubOauthFlow(settings, function(err, user) {
      if (err) {
        sender.send('github-oauth-flow-error', err);
      } else {
        sender.send('github-oauth-flow-complete', user);
      }
    });
  });

  ipc.on('mark-setup-complete', function() {
    setup.markComplete(function() {
      debug('setup marked complete');
    });
  });

  setup();
});
