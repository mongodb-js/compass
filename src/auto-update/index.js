var View = require('ampersand-view');
var app = require('ampersand-app');
var ipc = require('hadron-ipc');
var metrics = require('mongodb-js-metrics')();
var debug = require('debug')('mongodb-compass:notification-update-available');
var AppEvent = require('hadron-events').AppEvent;

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
    'click a[data-hook=install-update]': 'installUpdate'
  },
  initialize: function() {
    if (!app.isFeatureEnabled('autoUpdates')) {
      return debug('autoUpdates feature flag off');
    }
    ipc.on(AppEvent.CHECKING_FOR_UPDATE, function() {
      debug('checking for update');
      metrics.track('Auto Update', 'checking-for-update');
    });

    ipc.on(AppEvent.UPDATE_NOT_AVAILABLE, function() {
      metrics.track('Auto Update', 'update-not-available');
    });

    ipc.on(AppEvent.UPDATE_AVAILABLE, function(_opts) {
      debug('new update available!  wanna update to', _opts, '?');
      metrics.track('Auto Update', 'update-available', {
        releaseNotes: _opts.releaseNotes,
        releaseVersion: _opts.releaseVersion
      });
      this.visible = true;
    }.bind(this));

    ipc.on(AppEvent.UPDATE_DOWNLOADED, function() {
      debug('the update has been downloaded.');
      metrics.track('Auto Update', 'update-downloaded');
    });

    this.listenToAndRun(app.preferences, 'change:autoUpdates', function() {
      if (app.isFeatureEnabled('autoUpdates')) {
        ipc.call(AppEvent.ENABLE_AUTO_UPDATE);
      } else {
        ipc.call(AppEvent.DISABLE_AUTO_UPDATE);
      }
    });
  },
  cancel: function() {
    this.visible = false;
    return false;
  },
  installUpdate: function() {
    ipc.call(AppEvent.INSTALL_UPDATE);
  },
  checkForUpdate: function() {
    ipc.call(AppEvent.CHECK_FOR_UPDATE);
  }
});

module.exports = NotificationUpdateAvailable;
