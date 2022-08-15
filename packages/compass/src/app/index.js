const ipc = require('hadron-ipc');
const remote = require('@electron/remote');

// Setup error reporting to main process before anything else.
window.addEventListener('error', (event) => {
  event.preventDefault();
  ipc.call('compass:error:fatal',
    event.error ?
      { message: event.error.message, stack: event.error.stack } :
      { message: event.message, stack: '<no stack available>' });
});

require('./index.less');
require('../setup-hadron-distribution');

const marky = require('marky');
const EventEmitter = require('events');
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

EventEmitter.defaultMaxListeners = 100;

document.addEventListener('dragover', (evt) => evt.preventDefault());
document.addEventListener('drop', (evt) => evt.preventDefault());

require('bootstrap/js/modal');
require('bootstrap/js/transition');

/**
 * Set hadron-app as a global so plugins can use it.
 */
const app = require('hadron-app');
global.hadronApp = app;

/**
 * The main entrypoint for the application!
 */
var APP_VERSION = remote.app.getVersion();

var _ = require('lodash');
var View = require('ampersand-view');
var async = require('async');
var webvitals = require('web-vitals');

var semver = require('semver');

const Preferences = require('compass-preferences-model');
var User = require('compass-user-model');

require('./menu-renderer');
marky.mark('Migrations');
var migrateApp = require('./migrations');
marky.stop('Migrations');

var React = require('react');
var ReactDOM = require('react-dom');
var { Action } = require('@mongodb-js/hadron-plugin-manager');

const {
  enableDarkTheme,
  disableDarkTheme,
  loadTheme
} = require('./theme');

const { setupIntercom } = require('./intercom');

ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV === 'development') {
    require('debug').enable('mon*,had*');
  }
});

const { log, mongoLogId, debug, track } =
  require('@mongodb-js/compass-logging').createLoggerAndTelemetry('COMPASS-APP');

/**
 * The top-level application singleton that brings everything together!
 */
var Application = View.extend({
  template: function() {
    return [
      '<div id="application">',
      '  <div data-hook="auto-update"></div>',
      '  <div data-hook="notifications"></div>',
      '  <div data-hook="layout-container"></div>',
      '  <div data-hook="tour-container"></div>',
      '  <div data-hook="optin-container"></div>',
      '  <div data-hook="security"></div>',
      '  <div data-hook="license"></div>',
      '</div>'
    ].join('\n');
  },
  props: {
    version: {
      type: 'string',
      default: APP_VERSION
    }
  },
  session: {
    /**
     *
     * The connection details for the MongoDB Instance we want to/are currently connected to.
     * @see mongodb-connection-model.js
     */
    connection: 'state',
    /**
     * @see notifications.js
     */
    notifications: 'state',
    /**
     * Details of the MongoDB Instance we're currently connected to.
     */
    instance: 'state',
    /**
     * @see http://learn.humanjavascript.com/react-ampersand/creating-a-router-and-pages
     */
    router: 'object'
  },
  children: {
    user: User,
    preferences: Preferences
  },
  initialize: function() {
    /**
     * @see NODE-4281
     * @todo: remove when NODE-4281 is merged.
     */
    Number.prototype.unref = () => {};

    ipc.on('window:show-compass-tour', this.showTour.bind(this, true));
    ipc.on('window:show-network-optin', this.showOptIn.bind(this));
    ipc.on('window:show-security-panel', this.showSecurity.bind(this));

    function trackPerfEvent({ name, value }) {
      const fullName = {
        'FCP': 'First Contentful Paint',
        'LCP': 'Largest Contentful Paint',
        'FID': 'First Input Delay',
        'CLS': 'Cumulative Layout Shift'
      }[name];
      track(fullName, { value });
    }

    webvitals.getFCP(trackPerfEvent);
    webvitals.getLCP(trackPerfEvent);
    webvitals.getFID(trackPerfEvent);
    webvitals.getCLS(trackPerfEvent);
  },
  /**
   * Pre-load into the require cache a bunch of expensive modules while the
   * user is choosing which connection, so when the user clicks on Connect,
   * Compass can connect to the MongoDB instance faster.
   */
  postRender: function() {
    marky.mark('Pre-loading additional modules required to connect');
    // Seems like this doesn't have as much of an effect as we'd hoped as
    // most of the expense has already occurred. You can see it take 1700ms
    // or so if you move this to the top of the file.
    require('local-links');
    require('mongodb-instance-model');
    marky.stop('Pre-loading additional modules required to connect');
  },
  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  render: function() {
    log.info(mongoLogId(1_001_000_092), 'Main Window', 'Rendering app container');

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);

    this.securityComponent = app.appRegistry.getRole(
      'Application.Security'
    )[0].component;
    ReactDOM.render(
      React.createElement(this.securityComponent),
      this.queryByHook('security')
    );

    this.autoUpdatesRoles = app.appRegistry.getRole('App.AutoUpdate');
    if (this.autoUpdatesRoles) {
      ReactDOM.render(
        React.createElement(this.autoUpdatesRoles[0].component),
        this.queryByHook('auto-update')
      );
    }

    this.homeComponent = app.appRegistry.getComponent('Home.Home');
    ReactDOM.render(
      React.createElement(this.homeComponent, {
        appRegistry: app.appRegistry,
        appName: remote.app.getName(),
      }),
      this.queryByHook('layout-container')
    );

    const handleTour = () => {
      if (app.preferences.showFeatureTour) {
        this.showTour(false);
      } else {
        this.tourClosed();
      }
    };

    handleTour();
  },
  showTour: function(force) {
    const TourView = require('./tour');
    const tourView = new TourView({ force: force });
    if (tourView.features.length > 0) {
      tourView.on('close', this.tourClosed.bind(this));
      this.renderSubview(tourView, this.queryByHook('tour-container'));
    } else {
      this.tourClosed();
    }
  },
  showOptIn: function() {
    if (process.env.HADRON_ISOLATED !== 'true') {
      const NetworkOptInView = require('./network-optin');
      const networkOptInView = new NetworkOptInView();
      this.renderSubview(networkOptInView, this.queryByHook('optin-container'));
    }
  },
  showSecurity: function() {
    app.appRegistry.getAction('Security.Actions').show();
  },
  tourClosed: function() {
    app.preferences.unset('showFeatureTour');
    app.preferences.save();
    if (!app.preferences.showedNetworkOptIn) {
      this.showOptIn();
    }
  },
  fetchUser: function(done) {
    debug('preferences fetched, now getting user');
    User.getOrCreate(
      // Check if uuid was stored as currentUserId, if not pass telemetryAnonymousId to fetch a user.
      this.preferences.currentUserId || this.preferences.telemetryAnonymousId,
      function(err, user) {
        if (err) {
          return done(err);
        }
        this.user.set(user.serialize());
        this.user.trigger('sync');
        this.preferences.save({
          telemetryAnonymousId: user.id
        });
        ipc.call('compass:usage:identify', {
          currentUserId: this.preferences.currentUserId,
          telemetryAnonymousId: user.id
        });
        debug('user fetch successful', user.serialize());
        done(null, user);
      }.bind(this)
    );
  },
  fetchPreferences: function(done) {
    this.preferences.once('sync', function(prefs) {
      prefs.trigger('page-refresh');
      ipc.call(prefs.isFeatureEnabled('trackUsageStatistics') ?
        'compass:usage:enabled' : 'compass:usage:disabled');
      var oldVersion = _.get(prefs, 'lastKnownVersion', '0.0.0');
      var currentVersion = APP_VERSION;
      var save = false;
      if (
        semver.lt(oldVersion, currentVersion) ||
        // this is so we can test the tour modal in E2E tests where the version
        // is always the same
        process.env.SHOW_TOUR
      ) {
        prefs.showFeatureTour = oldVersion;
        save = true;
      }
      if (semver.neq(oldVersion, currentVersion)) {
        prefs.lastKnownVersion = currentVersion;
        save = true;
      }
      if (save) {
        prefs.save(null, {
          success: done.bind(null, null),
          error: done.bind(null, null)
        });
      } else {
        done(null);
      }
    });

    ipc.call('compass:loading:change-status', {
      status: 'loading preferences'
    });
    app.preferences.fetch();
  }
});

var state = new Application();

app.extend({
  client: null,
  isFeatureEnabled: function(feature) {
    // proxy to preferences for now
    return this.preferences.isFeatureEnabled(feature);
  },
  init: function() {
    async.series(
      [
        // check if migrations are required
        migrateApp.bind(state),
        // get preferences
        state.fetchPreferences.bind(state),
        // get user
        state.fetchUser.bind(state)
      ],
      function(err) {
        if (err) {
          throw err;
        }

        // Get theme from the preferences and set accordingly.
        loadTheme(app.preferences.theme);
        ipc.on('app:darkreader-enable', () => {
          enableDarkTheme();
        });
        ipc.on('app:darkreader-disable', () => {
          disableDarkTheme();
        });
        ipc.on('app:save-theme', (_, theme) => {
          // Save the new theme on the user's preferences.
          app.preferences.save({
            theme
          });
        });

        Action.pluginActivationCompleted.listen(() => {
          ipc.call('compass:loading:change-status', {
            status: 'activating plugins'
          });
          global.hadronApp.appRegistry.onActivated();
          ipc.call('compass:loading:change-status', {
            status: 'initializing'
          });
          global.hadronApp.appRegistry.emit(
            'application-initialized',
            APP_VERSION,
            process.env.HADRON_PRODUCT_NAME
          );
          ipc.call('compass:loading:change-status', {
            status: 'loading preferences'
          });
          global.hadronApp.appRegistry.emit(
            'preferences-loaded',
            state.preferences
          );

          setupIntercom(state.preferences, state.user);

          // signal to main process that app is ready
          ipc.call('window:renderer-ready');
          // catch a data refresh coming from window-manager
          ipc.on('app:refresh-data', () =>
            global.hadronApp.appRegistry.emit('refresh-data')
          );
          // as soon as dom is ready, render and set up the rest
          state.render();
          marky.stop('Time to Connect rendered');
          state.postRender();
          marky.stop('Time to user can Click Connect');
          if (process.env.MONGODB_COMPASS_TEST_UNCAUGHT_EXCEPTION) {
            queueMicrotask(() => {
              throw new Error('fake exception');
            });
          }
        });
        require('./setup-plugin-manager');
      }
    );
  }
});

Object.defineProperty(app, 'autoUpdate', {
  get: function() {
    return state.autoUpdate;
  }
});

Object.defineProperty(app, 'instance', {
  get: function() {
    return state.instance;
  },
  set: function(instance) {
    state.instance = instance;
  }
});

Object.defineProperty(app, 'preferences', {
  get: function() {
    return state.preferences;
  }
});

Object.defineProperty(app, 'connection', {
  get: function() {
    return state.connection;
  }
});

Object.defineProperty(app, 'router', {
  get: function() {
    return state.router;
  }
});

Object.defineProperty(app, 'user', {
  get: function() {
    return state.user;
  }
});

Object.defineProperty(app, 'state', {
  get: function() {
    return state;
  }
});

require('./reflux-listen-to-external-store');
app.init();
// expose app globally for debugging purposes
window.app = app;
