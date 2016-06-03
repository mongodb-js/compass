var View = require('ampersand-view');
var app = require('ampersand-app');
var ipc = require('hadron-ipc');
var metrics = require('mongodb-js-metrics')();

var debug = require('debug')('mongodb-compass:notification-update-available');

var indexTemplate = require('./index.jade');

var NotificationUpdateAvailable = View.extend({
  props: {
    visible: {
      type: 'boolean',
      default: false
    },
    step: {
      type: 'string',
      default: 'download',
      values: ['download', 'install']
    }
  },
  derived: {
    message: {
      deps: ['step'],
      fn: function() {
        return this.step === 'download' ?
          'A newer version of Compass is now available. Would you like to download and install it now?' :
          'The new version is installed and available on next restart. Do you want to restart Compass now?';
      }
    }
  },
  bindings: {
    message: {
      type: 'innerHTML',
      hook: 'message'
    },
    visible: {
      type: 'booleanClass',
      yes: 'visible',
      no: 'hidden'
    }
  },
  template: indexTemplate,
  events: {
    'click a[data-hook=cancel]': 'cancel',
    'click a[data-hook=confirm]': 'confirm'
  },
  initialize: function() {
    ipc.on('app:checking-for-update', function() {
      debug('checking for update');
      metrics.track('Auto Update', 'checking');
    });

    ipc.on('app:update-not-available', function() {
      metrics.track('Auto Update', 'uptodate');
    });

    ipc.on('app:update-available', function(_opts) {
      debug('new update available!  wanna update to', _opts, '?');
      metrics.track('Auto Update', 'available', {
        releaseVersion: _opts.releaseVersion
      });
      this.step = 'download';
      this.visible = true;
    }.bind(this));

    ipc.on('app:update-downloaded', function() {
      debug('the update has been downloaded.');
      this.step = 'install';
      this.visible = true;
      metrics.track('Auto Update', 'downloaded');
    }.bind(this));

    this.listenToAndRun(app.preferences, 'change:autoUpdates', function() {
      if (app.isFeatureEnabled('autoUpdates')) {
        ipc.call('app:enable-auto-update');
      } else {
        ipc.call('app:disable-auto-update');
      }
    });
  },
  cancel: function() {
    if (this.step === 'download') {
      // user doesn't want to update now, disable auto-update until next restart
      ipc.call('app:disable-auto-update');
      metrics.track('Auto Update', 'cancelled', {
        step: this.step
      });
    }
    this.visible = false;
  },
  confirm: function() {
    this.visible = false;
    if (this.step === 'download') {
      ipc.call('app:download-update');
    } else {
      ipc.call('app:install-update');
    }
    metrics.track('Auto Update', 'confirmed', {
      step: this.step
    });
  },
  checkForUpdate: function() {
    ipc.call('app:check-for-update');
  }
});

module.exports = NotificationUpdateAvailable;
