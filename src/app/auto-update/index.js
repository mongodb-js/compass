var View = require('ampersand-view');
var app = require('ampersand-app');
var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:notification-update-available');

/**
 * TODO (imlucas)
 * - use metrics
 */
var indexTemplate = require('./index.jade');

var NotificationUpdateAvailable = View.extend({
  properties: {
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
    'click a[data-hook=install-update]': 'installUpdate'
  },
  initialize: function() {
    app.onMessageReceived('app:checking-for-update', function() {
      debug('checking for update');
    });

    app.onMessageReceived('app:update-not-available', function() {

    });

    app.onMessageReceived('app:update-available', function(opts) {
      debug('new update available!  wanna update to', opts, '?');
      this.visible = true;
    }.bind(this));

    app.onMessageReceived('app:update-downloaded', function() {
      debug('the update has been downloaded.');
    });

    if (app.isFeatureEnabled('autoUpdates')) {
      this.listenToAndRun(app.preferences, 'change:autoUpdate', function() {
        if (app.isFeatureEnabled('autoUpdates')) {
          app.sendMessage('app:enable-auto-update');
        } else {
          app.sendMessage('app:disable-auto-update');
        }
      });
    }
  },
  cancel: function() {
    this.visible = false;
    return false;
  },
  installUpdate: function() {
    app.sendMessage('app:install-update');
    return false;
  }
});

module.exports = NotificationUpdateAvailable;
