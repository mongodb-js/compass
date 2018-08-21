const metrics = require('mongodb-js-metrics')();
const resources = require('mongodb-js-metrics').resources;
const pkg = require('../../../../package.json');
const app = require('hadron-app');
const _ = require('lodash');
const format = require('util').format;
const ipc = require('hadron-ipc');
const intercom = require('./intercom');
const features = require('./features');
const Notifier = require('node-notifier');

const path = require('path');
const ICON_PATH = path.join(__dirname, '..', 'images', 'compass-dialog-icon.png');

const debug = require('debug')('mongodb-compass:metrics:setup');

const INTERCOM_KEY = 'p57suhg7';
const BUGSNAG_KEY = '0d11ab5f4d97452cc83d3365c21b491c';

module.exports = function() {
  let intercomBlocked = false;

  metrics.configure({
    stitch: {
      appId: 'datawarehouseprod-compass-nqnxw',
      enabled: app.preferences.trackUsageStatistics
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

  if (process.env.HADRON_PRODUCT !== 'mongodb-compass-community' && app.preferences.enableFeedbackPanel) {
    const request = new XMLHttpRequest();
    request.onreadystatechange = () => {
      try {
        if (request.readyState === XMLHttpRequest.DONE) {
          if (request.status < 400) {
            metrics.configure({
              intercom: {
                appId: INTERCOM_KEY,
                enabled: app.preferences.trackUsageStatistics,
                panelEnabled: app.preferences.enableFeedbackPanel
              }
            });
          } else {
            intercomBlocked = true;
          }
        }
      } catch (e) {
        intercomBlocked = true;
      }
    };
    try {
      request.open('GET', format('https://widget.intercom.io/widget/%s', INTERCOM_KEY), true);
      request.send();
    } catch (e) {
      intercomBlocked = true;
    }
  }

  // create an app resource with name and version
  const appResource = new resources.AppResource({
    appName: pkg.productName,
    appVersion: pkg.version,
    appPlatform: process.platform,
    appStage: process.env.NODE_ENV
  });

  // create a user resource with client id (UUID v4 recommended)
  const userResource = new resources.UserResource({
    userId: app.user.id,
    createdAt: app.user.createdAt,
    name: app.user.name,
    email: app.user.email,
    twitter: app.user.twitter,
    developer: process.env.NODE_ENV === 'development'
  });

  // create a user resource with client id (UUID v4 recommended)
  const errorResource = new resources.ErrorResource();

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

  // TODO (thomas) this doesn't always seem to trigger. Perhaps racy?
  ipc.once('app:quit', function() {
    metrics.track('App', 'quit');
  });

  window.addEventListener('error', function(err) {
    debug('error encountered, notify trackers', err);
    // Notify user that error occurred
    if (process.env.NODE_ENV !== 'production') {
      if (!_.includes(err.message, 'MongoError')) {
        Notifier.notify({
          'icon': ICON_PATH,
          'message': 'Unexpected error occurred: ' + err.message,
          'title': 'MongoDB Compass Exception',
          'wait': true
        });
      }
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
      const container = document.querySelector('#intercom-container');
      if (container) {
        container.classList.add('hidden');
      }
    }
    // metrics.trackers.get('mixpanel').enabled = enabled;
  });
  app.preferences.on('change:enableFeedbackPanel', function(prefs, enabled) {
    // enable/disable product feedback
    metrics.trackers.get('intercom').panelEnabled = enabled;
    if (Window && document.querySelector('#intercom-container')) {
      const container = document.querySelector('#intercom-container');
      if (container) {
        if (enabled) {
          container.classList.remove('hidden');
        } else {
          container.classList.add('hidden');
        }
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
  if (process.env.HADRON_PRODUCT !== 'mongodb-compass-community' &&
      !intercomBlocked &&
      app.preferences.enableFeedbackPanel) {
    intercom.configure();
  }

  app.metrics = metrics;
};
