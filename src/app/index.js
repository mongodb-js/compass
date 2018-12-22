/* eslint no-console:0 */
const marky = require('marky');
const EventEmitter = require('events');
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

EventEmitter.defaultMaxListeners = 100;

document.addEventListener('dragover', evt => evt.preventDefault());
document.addEventListener('drop', evt => evt.preventDefault());

require('../setup-hadron-distribution');

window.jQuery = require('jquery');
require('bootstrap/js/modal');
require('bootstrap/js/transition');

/**
 * Set hadron-app as a global so plugins can use it.
 */
const app = require('hadron-app');
global.hadronApp = app;

require('./setup-hadron-caches');

/**
 * The main entrypoint for the application!
 */
var electron = require('electron');
var APP_VERSION = electron.remote.app.getVersion();

var _ = require('lodash');
var View = require('ampersand-view');
var async = require('async');
var ipc = require('hadron-ipc');

var semver = require('semver');

var Preferences = require('./models/preferences');
var User = require('./models/user');

require('./menu-renderer');
var Router = require('./router');
marky.mark('Migrations');
var migrateApp = require('./migrations');
marky.stop('Migrations');

var React = require('react');
var ReactDOM = require('react-dom');
var { Action } = require('hadron-plugin-manager');


ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

var debug = require('debug')('mongodb-compass:app');

/**
 * The top-level application singleton that brings everything together!
 */
var Application = View.extend({
  template: function() {
    return [
      '<div id="application">',
      '  <div data-hook="auto-update"></div>',
      '  <div data-hook="statusbar" data-test-id="status-bar"></div>',
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
     * @see models/connection.js
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
  events: {
    'click a': 'onLinkClick'
  },
  initialize: function() {
    ipc.on('window:show-compass-tour', this.showTour.bind(this, true));
    ipc.on('window:show-network-optin', this.showOptIn.bind(this));
    ipc.on('window:show-security-panel', this.showSecurity.bind(this));
  },
  startRouter: function() {
    if (this.router) {
      return debug('router already started!');
    }
    this.router = new Router();

    debug('Starting router...');
    this.router.history.start({
      pushState: false,
      root: '/'
    });
  },
  onFatalError: function(id, err) {
    console.error('Fatal Error!: ', id, err);
    const metrics = require('mongodb-js-metrics')();
    metrics.error(err);
    const StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.setMessage(err);
  },
  /**
   * When you want to go to a different page in the app or just save
   * state via the URL.
   * @param {String} fragment - To update the location bar with.
   * @param {Object} [options] - `silent` and `params`
   */
  navigate: function(fragment, options) {
    options = _.defaults(options || {}, {
      silent: false,
      params: null
    });
    if (options.params) {
      const qs = require('qs');
      fragment += '?' + qs.stringify(options.params);
    }

    var hash = fragment.charAt(0) === '/' ? fragment.slice(1) : fragment;
    this.router.history.navigate(hash, {
      trigger: !options.silent
    });
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
    require('./models/mongodb-instance');
    marky.stop('Pre-loading additional modules required to connect');
  },
  /**
   * Called a soon as the DOM is ready so we can
   * start showing status indicators as
   * quickly as possible.
   */
  render: function() {
    debug('Rendering app container...');

    this.el = document.querySelector('#application');
    this.renderWithTemplate(this);
    debug('rendering statusbar...');
    this.statusComponent = app.appRegistry.getRole('Application.Status')[0].component;
    ReactDOM.render(React.createElement(this.statusComponent), this.queryByHook('statusbar'));

    this.securityComponent = app.appRegistry.getRole('Application.Security')[0].component;
    ReactDOM.render(React.createElement(this.securityComponent), this.queryByHook('security'));

    this.autoUpdatesRoles = app.appRegistry.getRole('App.AutoUpdate');
    if (this.autoUpdatesRoles) {
      ReactDOM.render(React.createElement(this.autoUpdatesRoles[0].component), this.queryByHook('auto-update'));
    }

    const handleTour = () => {
      if (app.preferences.showFeatureTour) {
        this.showTour(false);
      } else {
        this.tourClosed();
      }
    };

    /**
     * If we're in Compass community and the license has not been agreed, we need
     * to show it first and force the user to agree or disagree.
     */
    if (process.env.HADRON_PRODUCT === 'mongodb-compass-community' && !app.preferences.agreedToLicense) {
      const licenseComponent = app.appRegistry.getRole('Application.License')[0].component;
      const licenseStore = app.appRegistry.getStore('License.Store');
      const licenseActions = app.appRegistry.getAction('License.Actions');

      ReactDOM.render(React.createElement(licenseComponent), this.queryByHook('license'));

      licenseStore.listen((state) => {
        if (state.isAgreed) {
          handleTour();
        }
      });

      licenseActions.show();
    } else {
      handleTour();
    }

    if (process.env.NODE_ENV !== 'production') {
      debug('Installing "Inspect Element" context menu');
      const addInspectElementMenu = require('debug-menu').install;
      addInspectElementMenu();
    }
  },
  showTour: function(force) {
    const TourView = require('./tour');
    const tourView = new TourView({force: force});
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
  onLinkClick: function(event) {
    const localLinks = require('local-links');
    const pathname = localLinks.getLocalPathname(event);
    if (pathname) {
      event.preventDefault();
      this.router.history.navigate(pathname);
      return;
    } else if (event.target.getAttribute('href') !== '#') {
      event.preventDefault();
      event.stopPropagation();
      electron.shell.openExternal(event.target.href);
    }
  },
  fetchUser: function(done) {
    debug('preferences fetched, now getting user');
    User.getOrCreate(this.preferences.currentUserId, function(err, user) {
      if (err) {
        return done(err);
      }
      this.user.set(user.serialize());
      this.user.trigger('sync');
      this.preferences.save({
        currentUserId: user.id
      });
      debug('user fetch successful', user.serialize());
      done(null, user);
    }.bind(this));
  },
  fetchPreferences: function(done) {
    this.preferences.once('sync', function(prefs) {
      prefs.trigger('page-refresh');
      var oldVersion = _.get(prefs, 'lastKnownVersion', '0.0.0');
      var currentVersion = APP_VERSION;
      var save = false;
      if (semver.lt(oldVersion, currentVersion)) {
        prefs.showFeatureTour = oldVersion;
        save = true;
      }
      if (semver.neq(oldVersion, currentVersion)) {
        prefs.lastKnownVersion = currentVersion;
        save = true;
      }
      if (process.env.HADRON_PRODUCT === 'mongodb-compass-community') {
        prefs.enableMaps = false;
        prefs.enableFeedbackPanel = false;
        save = true;
      }
      if (save) {
        prefs.save(null, {
          success: done.bind(null, null)
        });
      } else {
        done(null);
      }
    });

    app.preferences.fetch();
  }
});

var state = new Application();

app.extend({
  client: null,
  navigate: state.navigate.bind(state),
  isFeatureEnabled: function(feature) {
    // proxy to preferences for now
    return this.preferences.isFeatureEnabled(feature);
  },
  init: function() {
    async.series([
      // check if migrations are required
      migrateApp.bind(state),
      // get preferences from IndexedDB
      state.fetchPreferences.bind(state),
      // get user from IndexedDB
      state.fetchUser.bind(state)
    ], function(err) {
      if (err) {
        throw err;
      }
      Action.pluginActivationCompleted.listen(() => {
        global.hadronApp.appRegistry.onActivated();
        global.hadronApp.appRegistry.emit('application-initialized', APP_VERSION, process.env.HADRON_PRODUCT_NAME);
        global.hadronApp.appRegistry.emit('preferences-loaded', state.preferences);
        // signal to main process that app is ready
        ipc.call('window:renderer-ready');
        // catch a data refresh coming from window-manager
        ipc.on('app:refresh-data', () => global.hadronApp.appRegistry.emit('refresh-data'));
        // as soon as dom is ready, render and set up the rest
        const MongoDBInstance = require('./models/mongodb-instance');
        state.instance = new MongoDBInstance();
        state.render();
        marky.stop('Time to Connect rendered');
        state.startRouter();
        state.postRender();
        marky.stop('Time to user can Click Connect');
      });
      require('./setup-plugin-manager');
    });
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

marky.mark('Loading styles');
const setupStyleManager = require('./setup-style-manager');
setupStyleManager('index.less', () => {
  require('./reflux-listen-to-external-store');
  app.init();
  // expose app globally for debugging purposes
  window.app = app;
  marky.stop('Loading styles');
});
