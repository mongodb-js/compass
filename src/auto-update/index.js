var View = require('ampersand-view');
var app = require('hadron-app');
var ipc = require('hadron-ipc');
var debug = require('debug')('mongodb-compass:notification-update-available');

var indexTemplate = require('./index.jade');

var NotificationUpdateAvailable = View.extend({
  props: {
    visible: {
      type: 'boolean',
      default: false
    }
  },
  bindings: {
    visible: {
      type: 'booleanClass',
      yes: 'visible',
      no: 'hidden'
    }
  },
  template: indexTemplate,
  events: {
    'click a[data-hook=cancel]': 'cancel',
    'click a[data-hook=confirm]': 'installUpdate'
  },
  initialize: function() {
    ipc.on('app:checking-for-update', function() {
      debug('checking for update');
    });

    ipc.on('app:update-not-available', function() {
    });

    ipc.on('app:update-available', function(_opts) {
      debug('new update available!  wanna update to', _opts, '?');
      this.visible = true;
    }.bind(this));

    ipc.on('app:update-downloaded', function() {
      debug('the update has been downloaded.');
    });

    this.listenToAndRun(app.preferences, 'change:autoUpdates', function() {
      if (app.isFeatureEnabled('autoUpdates')) {
        ipc.call('app:enable-auto-update');
      } else {
        ipc.call('app:disable-auto-update');
      }
    });
  },
  cancel: function(evt) {
    evt.preventDefault();
    this.visible = false;
    return false;
  },
  installUpdate: function() {
    ipc.call('app:install-update');
  },
  checkForUpdate: function() {
    ipc.call('app:check-for-update');
  }
});

module.exports = NotificationUpdateAvailable;
