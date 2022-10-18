const ipc = require('hadron-ipc');
const remote = require('@electron/remote');

const { preferencesAccess: preferences } = require('compass-preferences-model');

// Setup error reporting to main process before anything else.
window.addEventListener('error', (event) => {
  event.preventDefault();
  ipc.call(
    'compass:error:fatal',
    event.error
      ? { message: event.error.message, stack: event.error.stack }
      : { message: event.message, stack: '<no stack available>' }
  );
});

require('./index.less');
require('../setup-hadron-distribution');
require('source-code-pro/source-code-pro.css');

const marky = require('marky');
const EventEmitter = require('events');
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

EventEmitter.defaultMaxListeners = 100;

document.addEventListener('dragover', (evt) => evt.preventDefault());
document.addEventListener('drop', (evt) => evt.preventDefault());

/**
 * Set hadron-app as a global so plugins can use it.
 */
const app = require('hadron-app');
global.hadronApp = app;

/**
 * The main entrypoint for the application!
 */
const APP_VERSION = remote.app.getVersion() || '';

const View = require('ampersand-view');
const async = require('async');
const webvitals = require('web-vitals');

const User = require('compass-user-model');

require('./menu-renderer');
marky.mark('Migrations');
const migrateApp = require('./migrations');
marky.stop('Migrations');

const React = require('react');
const ReactDOM = require('react-dom');
const { Action } = require('@mongodb-js/hadron-plugin-manager');

const { enableDarkTheme, disableDarkTheme, loadTheme } = require('./theme');

const { setupIntercom } = require('./intercom');

ipc.once('app:launched', function () {
  console.log('in app:launched');
  if (process.env.NODE_ENV === 'development') {
    require('debug').enable('mon*,had*');
  }
});

const { log, mongoLogId, debug, track } =
  require('@mongodb-js/compass-logging').createLoggerAndTelemetry(
    'COMPASS-APP'
  );

/**
 * The top-level application singleton that brings everything together!
 */
const Application = View.extend({
  template: function () {
    return [
      '<div id="application">',
      '  <div data-hook="auto-update"></div>',
      '  <div data-hook="notifications"></div>',
      '  <div data-hook="layout-container"></div>',
      '  <div data-hook="license"></div>',
      '</div>',
    ].join('\n');
  },
  props: {
    version: {
      type: 'string',
      default: APP_VERSION,
    },
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
    router: 'object',
    /**
     * The previously shown app version.
     */
    previousVersion: {
      type: 'string',
      default: '0.0.0',
    },
  },
  children: {
    user: User,
  },
  initialize: function () {
    /**
     * @see NODE-4281
     * @todo: remove when NODE-4281 is merged.
     */
    Number.prototype.unref = () => {};

    function trackPerfEvent({ name, value }) {
      const fullName = {
        FCP: 'First Contentful Paint',
        LCP: 'Largest Contentful Paint',
        FID: 'First Input Delay',
        CLS: 'Cumulative Layout Shift',
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
  postRender: function () {
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
  render: async function ({ showWelcomeModal, networkTraffic }) {
    const getAutoConnectInfo = (await import('./auto-connect')).loadAutoConnectInfo(
      await preferences.refreshPreferences()
    );
    log.info(mongoLogId(1_001_000_092), 'Main Window', 'Rendering app container', {
      autoConnectEnabled: !!getAutoConnectInfo
    });

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);

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
        getAutoConnectInfo,
        showWelcomeModal,
        networkTraffic
      }),
      this.queryByHook('layout-container')
    );
    document.querySelector('#loading-placeholder')?.remove();
  },
  fetchUser: async function () {
    debug('getting user preferences');
    const {
      telemetryAnonymousId,
      lastKnownVersion
    } = preferences.getPreferences();

    // The main process ensured that `telemetryAnonymousId` contains the id of the User model
    const user = await User.getOrCreate(telemetryAnonymousId);

    this.user.set(user.serialize());
    this.user.trigger('sync');
    debug('user fetch successful', user.serialize());

    this.previousVersion = lastKnownVersion || '0.0.0';
    await preferences.savePreferences({ lastKnownVersion: APP_VERSION });
    return user;
  },
});

const state = new Application();

app.extend({
  client: null,
  init: async function () {
    await preferences.refreshPreferences();

    const {
      theme,
      showedNetworkOptIn,
      networkTraffic
    } = preferences.getPreferences();

    async.series(
      [
        // check if migrations are required
        migrateApp.bind(state),
        // get user
        state.fetchUser.bind(state),
      ],
      function (err) {
        if (err) {
          throw err;
        }

        // Get theme from the preferences and set accordingly.
        loadTheme(theme);
        ipc.on('app:darkreader-enable', () => {
          enableDarkTheme();
        });
        ipc.on('app:darkreader-disable', () => {
          disableDarkTheme();
        });
        ipc.on('app:save-theme', (_, theme) => {
          // Save the new theme on the user's preferences.
          if (theme) {
            preferences.savePreferences({ theme });
          }
        });

        Action.pluginActivationCompleted.listen(() => {
          global.hadronApp.appRegistry.onActivated();
          global.hadronApp.appRegistry.emit(
            'application-initialized',
            APP_VERSION,
            process.env.HADRON_PRODUCT_NAME
          );
          setupIntercom(state.user);
          // signal to main process that app is ready
          ipc.call('window:renderer-ready');
          // catch a data refresh coming from window-manager
          ipc.on('app:refresh-data', () =>
            global.hadronApp.appRegistry.emit('refresh-data')
          );
          // catch a toggle sidebar coming from window-manager
          ipc.on('app:toggle-sidebar', () =>
            global.hadronApp.appRegistry.emit('toggle-sidebar')
          );
          // as soon as dom is ready, render and set up the rest
          state.render({
            showWelcomeModal: !showedNetworkOptIn,
            networkTraffic
          });
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
  },
});

Object.defineProperty(app, 'autoUpdate', {
  get: function () {
    return state.autoUpdate;
  },
});

Object.defineProperty(app, 'instance', {
  get: function () {
    return state.instance;
  },
  set: function (instance) {
    state.instance = instance;
  },
});

Object.defineProperty(app, 'connection', {
  get: function () {
    return state.connection;
  },
});

Object.defineProperty(app, 'router', {
  get: function () {
    return state.router;
  },
});

Object.defineProperty(app, 'user', {
  get: function () {
    return state.user;
  },
});

Object.defineProperty(app, 'state', {
  get: function () {
    return state;
  },
});

require('./reflux-listen-to-external-store');
app.init();
