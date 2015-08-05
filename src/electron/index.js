require('./newrelic');

if (process.env.NODE_ENV === 'development') {
  require('./livereload');
}

var app = require('app');
var BrowserWindow = require('browser-window');
var Menu = require('menu');
var ipc = require('ipc');
var windows = require('./window-manager');
var githubOauthFlow = require('./github-oauth-flow');
var setup = require('./setup');
var debug = require('debug')('scout:electron');

app.on('window-all-closed', function() {
  debug('All windows closed.  Quitting app.');
  app.quit();
});

app.on('open-setup-dialog', windows.openSetupDialog);
app.on('open-connect-dialog', windows.openConnectDialog);

app.on('ready', function() {
  ipc.on('devtools-inspect-element', function(event, opts) {
    debug('devtools-inspect-element', opts);
    var sender = BrowserWindow.fromWebContents(event.sender);
    if (!sender.isDevToolsOpened()) {
      debug('opening devtools');
      sender.openDevTools();
    }
    sender.inspectElement(opts.x, opts.y);
  });

  ipc.on('show-context-menu', function(event, opts) {
    debug('show-context-menu', opts);
    var sender = BrowserWindow.fromWebContents(event.sender);
    var template = opts.template.map(function(item) {
      debug('creating click handler for ipc', item.command, item.opts);
      item.click = function() {
        var msg = {
          command: item.command,
          opts: item.opts
        };
        debug('telling browser window to run command', msg);
        sender.send('run-command', msg);
      };
      return item;
    });
    debug('building and popping up', template);
    Menu.buildFromTemplate(template).popup(sender);
  });
  ipc.on('open-setup-dialog', app.emit.bind(app, 'open-setup-dialog'));
  ipc.on('open-connect-dialog', app.emit.bind(app, 'open-connect-dialog'));
  ipc.on('open-github-oauth-flow', function(event) {
    var sender = BrowserWindow.fromWebContents(event.sender);
    githubOauthFlow(function(err, user) {
      debug('Got github oauth response', err, user);
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
