var metrics = require('mongodb-js-metrics')();
var resources = require('mongodb-js-metrics').resources;
var pkg = require('../../../package.json');
var app = require('hadron-app');
var _ = require('lodash');
var format = require('util').format;
var ipc = require('hadron-ipc');
var intercom = require('./intercom');
var features = require('./features');
var Notifier = require('node-notifier');

var path = require('path');
var ICON_PATH = path.join(__dirname, '..', 'images', 'compass-dialog-icon.png');

var debug = require('debug')('mongodb-compass:metrics');


var INTERCOM_KEY = 'p57suhg7';
var BUGSNAG_KEY = '0d11ab5f4d97452cc83d3365c21b491c';

module.exports = function() {
  metrics.configure({
    intercom: {
      appId: INTERCOM_KEY,
      enabled: app.preferences.trackUsageStatistics,
      panelEnabled: app.preferences.enableFeedbackPanel
    },
    bugsnag: {
      apiKey: BUGSNAG_KEY,
      metaData: {
        user: {
          'User Profile in Intercom': format('https://app.intercom.io/apps'
            + '/%s/users/show?user_id=%s', INTERCOM_KEY, app.user.id)
        }
      },
      enabled: app.preferences.trackErrors
    }
  });

  // create an app resource with name and version
  var appResource = new resources.AppResource({
    appName: pkg.productName,
    appVersion: pkg.version,
    appPlatform: process.platform,
    appStage: process.env.NODE_ENV
  });

  // create a user resource with client id (UUID v4 recommended)
  var userResource = new resources.UserResource({
    userId: app.user.id,
    createdAt: app.user.createdAt,
    name: app.user.name,
    email: app.user.email,
    twitter: app.user.twitter,
    developer: process.env.NODE_ENV === 'development'
  });

  // create a user resource with client id (UUID v4 recommended)
  var errorResource = new resources.ErrorResource();

  // add all resources
  metrics.addResource(appResource, userResource, errorResource);
  metrics.addResource.apply(metrics, _.values(features));

  debug('metrics configured with trackers %j and resources %j',
    _.pluck(metrics.trackers.filter('enabled'), 'id'),
    metrics.resources.pluck('id'));

  // track app launch and quit events
  ipc.once('app:launched', function() {
    // bug in electron (?) causes the event to be triggered twice even though
    // it is only emitted once. only track app launch once.
    metrics.track('App', 'launched');
    app.preferences.trigger('app-restart');
    if (app.preferences.lastKnownVersion !== pkg.version) {
      metrics.track('App', 'upgraded', app.preferences.lastKnownVersion);
      app.preferences.trigger('app-version-mismatch');
    }
  });

  ipc.once('app:quit', function() {
    metrics.track('App', 'quit');
  });

  window.addEventListener('error', function(err) {
    debug('error encountered, notify trackers', err);
    // Notify user that error occurred
    if (!_.includes(err.message, 'MongoError')) {
      Notifier.notify({
        'icon': ICON_PATH,
        'message': 'Unexpected error occurred: ' + err.message,
        'title': 'MongoDB Compass Exception',
        'wait': true
      });
    }
    metrics.error(err);
    // hide progress bar when an unknown error occurs.
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.hide();
  });

  // listen to preference changes
  app.preferences.on('change:trackUsageStatistics', function(prefs, enabled) {
    // enable/disable event tracking
    metrics.trackers.get('ga').enabled = enabled;
    metrics.trackers.get('intercom').enabled = enabled;
    if (enabled && !app.preferences.enableFeedbackPanel) {
      document.querySelector('#intercom-container').classList.add('hidden');
    }
    // metrics.trackers.get('mixpanel').enabled = enabled;
  });
  app.preferences.on('change:enableFeedbackPanel', function(prefs, enabled) {
    // enable/disable product feedback
    metrics.trackers.get('intercom').panelEnabled = enabled;
    if (Window && document.querySelector('#intercom-container')) {
      if (enabled) {
        document.querySelector('#intercom-container').classList.remove('hidden');
      } else {
        document.querySelector('#intercom-container').classList.add('hidden');
      }
    }
  });
  app.preferences.on('change:trackErrors', function(prefs, enabled) {
    // enable/disable error reports
    /* eslint new-cap:0 */
    metrics.trackers.get('bugsnag').enabled = enabled;
  });

  /**
   * Listen for links in the Intercom chat window
   * such that when a link is clicked, the event is properly
   * passed off to `app.router` and a web page actually opens.
   */
  intercom.configure();

  app.metrics = metrics;
};
