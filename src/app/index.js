/* eslint no-console:0 */
const marky = require('marky');
marky.mark('Time to Connect rendered');
marky.mark('Time to user can Click Connect');

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
var ViewSwitcher = require('ampersand-view-switcher');
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
var metricsSetup = require('./metrics');

var React = require('react');
var ReactDOM = require('react-dom');
var AutoUpdate = require('../auto-update');
var { Action } = require('hadron-package-manager');


ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

var debug = require('debug')('mongodb-compass:app');

function getConnection(model, done) {
  function _fetch(fn) {
    model.fetch({
      success: function() {
        debug('_fetch connection succeeded!');
        fn();
      },
      error: function() {
        debug('_fetch connection failed', arguments);
        fn(new Error('Error retrieving connection details'));
      }
    });
  }

  const backoff = require('backoff');
  const call = backoff.call(_fetch, done);
  call.setStrategy(new backoff.ExponentialStrategy({
    randomisationFactor: 0,
    initialDelay: 10,
    maxDelay: 500
  }));
  call.failAfter(10);
  call.start();
}

/**
 * The top-level application singleton that brings everything together!
 *
 * @example
 *   // Drive Compass from the chrome devtools console using the `app` window global:
 *   console.log(app);
 *   // Make API calls to `mongodb-scope-server` via `mongodb-scope-client`:
 *   app.dataService.instance(function(err, data){
 *     if(err) return console.error(err);
 *     console.log('Details of current MongoDB instance we\'re connected to: ', data)
 *   });
 *   // What connection config are we currently using?
 *   console.log('Current connection config: ', app.connection.toJSON());
 *
 * @see http://learn.humanjavascript.com/react-ampersand/application-pattern
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
    'click a': 'onLinkClick',
    'click i.help': 'onHelpClicked',
    'click a.help': 'onHelpClicked'
  },
  initialize: function() {
    ipc.on('window:show-compass-tour', this.showTour.bind(this, true));
    ipc.on('window:show-network-optin', this.showOptIn.bind(this));
  },
  onHelpClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var id = evt.target.dataset.hook;
    require('electron').shell.openExternal(id);
    // TODO: Clean up rest of help window stuff in COMPASS-1169
    // ipc.call('app:show-help-window', id);
  },
  startRouter: function() {
    if (this.router) {
      return debug('router already started!');
    }
    this.router = new Router();
    debug('Listening for page changes from the router...');
    this.listenTo(this.router, 'page', this.onPageChange);

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
  onInstanceFetched: function() {
    // TODO: Remove this line
    // Instead, set the instance inside InstanceStore.refreshInstance
    app.appRegistry.getAction('App.InstanceActions').setInstance(app.instance);
    debug('app.instance fetched', app.instance.serialize());
    const metrics = require('mongodb-js-metrics')();
    metrics.track('Deployment', 'detected', {
      'databases count': app.instance.databases.length,
      'namespaces count': app.instance.collections.length,
      'mongodb version': app.instance.build.version,
      'enterprise module': app.instance.build.enterprise_module,
      'longest database name length': Math.max(...app.instance.databases.map(function(db) {
        return db._id.length;
      })),
      'longest collection name length': Math.max(...app.instance.collections.map(function(col) {
        return col._id.split('.')[1].length;
      })),
      'server architecture': app.instance.host.arch,
      'server cpu cores': app.instance.host.cpu_cores,
      'server cpu frequency (mhz)': app.instance.host.cpu_frequency / 1000 / 1000,
      'server memory size (gb)': app.instance.host.memory_bits / 1024 / 1024 / 1024
    });
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
    require('backoff');
    require('local-links');
    require('./models/mongodb-instance');
    require('mongodb-data-service');
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
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('layout-container'), {
      show: function() {
        document.scrollTop = 0;
      }
    });
    debug('rendering statusbar...');
    this.statusComponent = app.appRegistry.getComponent('Status.ProgressBar');
    ReactDOM.render(React.createElement(this.statusComponent), this.queryByHook('statusbar'));

    this.autoUpdate = new AutoUpdate({
      el: this.queryByHook('auto-update')
    });
    this.autoUpdate.render();

    if (app.preferences.showFeatureTour) {
      this.showTour(false);
    } else {
      this.tourClosed();
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
    const NetworkOptInView = require('./network-optin');
    const networkOptInView = new NetworkOptInView();
    this.renderSubview(networkOptInView, this.queryByHook('optin-container'));
  },
  tourClosed: function() {
    app.preferences.unset('showFeatureTour');
    app.preferences.save();
    if (!app.preferences.showedNetworkOptIn) {
      this.showOptIn();
    }
  },
  onPageChange: function(view) {
    const metrics = require('mongodb-js-metrics')();
    // connect dialog
    if (view.screenName) {
      metrics.track('App', 'viewed', view.screenName);
      this.pageSwitcher.set(view);
    } else {
      metrics.track('App', 'viewed', view.displayName);
    }
  },
  onLinkClick: function(event) {
    // ignore help links, they're handled in `onHelpClicked`
    if (event.target.className === 'help') {
      return;
    }
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
  setConnectionId: function(connectionId, done) {
    if (state.connection && state.connection.getId() === connectionId) {
      debug('Already connected to connectionId', connectionId);
      return done();
    }
    var StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.showIndeterminateProgressBar();

    const Connection = require('./models/connection');
    state.connection = new Connection({
      _id: connectionId
    });

    debug('looking up connection `%s`...', connectionId);
    getConnection(state.connection, function(err) {
      if (err) {
        state.onFatalError('fetch connection', err);
        return;
      }
      StatusAction.showIndeterminateProgressBar();

      const { DataServiceStore, DataServiceActions } = require('mongodb-data-service');
      DataServiceStore.listen((error, ds) => {
        if (error) {
          state.onFatalError('create client');
        }
        app.dataService = ds.on('error', state.onFatalError.bind(state, 'create client'));
        debug('initializing singleton models... ');
        const MongoDBInstance = require('./models/mongodb-instance');
        state.instance = new MongoDBInstance();
        debug('fetching instance model...');
        app.instance.fetch({ success: state.onInstanceFetched });
        state.startRouter();
        StatusAction.hide();
        // Iterate through all the registered stores and if they require an
        // onConnected hook, call it.
        global.hadronApp.appRegistry.onConnected(error, ds);

        if (done) {
          done();
        }
      });
      DataServiceActions.connect(state.connection);
    });
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
      require('./setup-package-manager');
      Action.packageActivationCompleted.listen(() => {
        // set up metrics
        metricsSetup();
        global.hadronApp.appRegistry.onActivated();

        // signal to main process that app is ready
        ipc.call('window:renderer-ready');

        // as soon as dom is ready, render and set up the rest
        state.render();
        marky.stop('Time to Connect rendered');
        state.startRouter();
        state.postRender();
        marky.stop('Time to user can Click Connect');
      });
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
