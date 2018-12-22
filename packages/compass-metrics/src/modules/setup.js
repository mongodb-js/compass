import Notifier from 'node-notifier';
import values from 'lodash.values';
import pluck from 'lodash.pluck';
import includes from 'lodash.includes';
import { resources } from 'mongodb-js-metrics';
import { format } from 'util';
import configureIntercom from 'modules/intercom';
import features from 'modules/features';
import ipc from 'hadron-ipc';

const metrics = require('mongodb-js-metrics')();
const debug = require('debug')('mongodb-compass:metrics:setup');

const INTERCOM_KEY = 'p57suhg7';
const BUGSNAG_KEY = '0d11ab5f4d97452cc83d3365c21b491c';
const STITCH_APP = 'datawarehouseprod-compass-nqnxw';
const COMMUNITY = 'mongodb-compass-community';

/**
 * Setup all the metrics resources to track.
 *
 * @param {AppRegistry} appRegistry - The app registry.
 * @param {String} productName - The name of the product.
 * @param {String} version - The version of the product.
 */
const setupMetrics = (appRegistry, productName, version) => {
  const app = global.hadronApp;
  let intercomBlocked = false;

  // Configure Stitch and Bugsnag as they are always configured
  // when metrics are in play.
  metrics.configure({
    stitch: {
      appId: STITCH_APP,
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

  // When using an App that can have Intercom support, we need to double check against
  // customers who have firewalls that block out intercom as it tries to make requests
  // when set up. Potential todo is to move Intercom into its own plugin as well.
  if (process.env.HADRON_PRODUCT !== COMMUNITY && app.preferences.enableFeedbackPanel) {
    try {
      metrics.configure({
        intercom: {
          appId: INTERCOM_KEY,
          enabled: app.preferences.enableFeedbackPanel,
          panelEnabled: app.preferences.enableFeedbackPanel
        }
      });
    } catch (e) {
      intercomBlocked = true;
    }
  }

  // create an app resource with name and version.
  const appResource = new resources.AppResource({
    appName: productName,
    appVersion: version,
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
  metrics.addResource.apply(metrics, values(features));

  debug('metrics configured with trackers %j and resources %j',
    pluck(metrics.trackers.filter('enabled'), 'id'),
    metrics.resources.pluck('id'));

  // track app launch and quit events
  ipc.once('app:launched', function() {
    // bug in electron (?) causes the event to be triggered twice even though
    // it is only emitted once. only track app launch once.
    metrics.track('App', 'launched');
    app.preferences.trigger('app-restart');
    if (app.preferences.lastKnownVersion !== version) {
      metrics.track('App', 'upgraded', app.preferences.lastKnownVersion);
      app.preferences.trigger('app-version-mismatch');
    }
  });

  // TODO (thomas) this doesn't always seem to trigger. Perhaps racy?
  ipc.once('app:quit', function() {
    metrics.track('App', 'quit');
  });

  // This is to send the error popup in the development or test environment
  // when an error occurs, to remind us to look in the console. Do we really
  // need this?
  window.addEventListener('error', function(err) {
    debug('error encountered, notify trackers', err);
    // Notify user that error occurred
    if (process.env.NODE_ENV !== 'production') {
      if (!includes(err.message, 'MongoError')) {
        Notifier.notify({
          'message': 'Unexpected error occurred: ' + err.message,
          'title': 'MongoDB Compass Exception',
          'wait': true
        });
      }
    }
    metrics.error(err);
    // hide progress bar when an unknown error occurs.
    const StatusAction = appRegistry.getAction('Status.Actions');
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
  if (process.env.HADRON_PRODUCT !== COMMUNITY &&
      !intercomBlocked &&
      app.preferences.enableFeedbackPanel) {
    configureIntercom();
  }

  app.metrics = metrics;
};

export default setupMetrics;
