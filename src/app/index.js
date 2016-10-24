/* eslint no-console:0 */
console.time('app/index.js');

if (process.env.NODE_ENV === 'development') {
  require('devtron').install();
  var devtools = require('electron-devtools-installer');
  devtools.default(devtools.REACT_DEVELOPER_TOOLS)
    .then((name) => console.log(`Added Extension:  ${name}`))
    .catch((err) => console.log('An error occurred trying to install devtools: ', err));
}

var Environment = require('../environment');
Environment.init();

var path = require('path');
var resourcePath = path.join(__dirname, '..', '..');

var ModuleCache = require('hadron-module-cache');
ModuleCache.register(resourcePath);
ModuleCache.add(resourcePath);

var AppRegistry = require('hadron-app-registry');
var PackageManager = require('hadron-package-manager').PackageManager;

var pkg = require('../../package.json');
var CompileCache = require('hadron-compile-cache');
CompileCache.setHomeDirectory(resourcePath);
CompileCache.digestMappings = pkg._compileCacheMappings || {};

/**
 * The main entrypoint for the application!
 */
var electron = require('electron');
var shell = electron.shell;
var dialog = electron.dialog;
var app = require('ampersand-app');
var backoff = require('backoff');
var APP_VERSION = electron.remote.app.getVersion();

var _ = require('lodash');
var qs = require('qs');
var ViewSwitcher = require('ampersand-view-switcher');
var View = require('ampersand-view');
var localLinks = require('local-links');
var async = require('async');
var ipc = require('hadron-ipc');

var format = require('util').format;
var semver = require('semver');

var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var MongoDBInstance = require('./models/mongodb-instance');
var Preferences = require('./models/preferences');
var User = require('./models/user');

var ApplicationStore = require('hadron-reflux-store').ApplicationStore;
var Router = require('./router');
var migrateApp = require('./migrations');
var metricsSetup = require('./metrics');
var metrics = require('mongodb-js-metrics')();

var React = require('react');
var ReactDOM = require('react-dom');
var AutoUpdate = require('../auto-update');

var addInspectElementMenu = require('debug-menu').install;

window.jQuery = require('jquery');

ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

var debug = require('debug')('mongodb-compass:app');

var StyleManager = require('hadron-style-manager');
new StyleManager(
  path.join(__dirname, 'compiled-less'),
  __dirname
).use(document, path.join(__dirname, 'index.less'));

// @note: Durran: the registry and package manager are set up here in
//   order to ensure that the compile cache has already been loaded and
//   hooked into require.extensions. Otherwise, packages will not have
//   use of the compile cache.
app.appRegistry = new AppRegistry();
app.packageManager = new PackageManager(path.join(__dirname, '..', 'internal-packages'));
app.packageManager.activate();

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

  var call = backoff.call(_fetch, done);
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
 *   // What are the current query options?
 *   console.log('Query options are', app.queryOptions);
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
      '  <div data-hook="statusbar"></div>',
      '  <div data-hook="notifications"></div>',
      '  <div data-hook="layout-container"></div>',
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
     * query options in sync with the data, @see models/query-options.js
     */
    queryOptions: 'state',
    /**
     * temporary query options during query building, @see models/query-options.js
     */
    volatileQueryOptions: 'state',
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
  onHelpClicked: function(evt) {
    evt.preventDefault();
    evt.stopPropagation();
    var id = evt.target.dataset.hook;
    ipc.call('app:show-help-window', id);
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
    metrics.error(err);
    var StatusAction = app.appRegistry.getAction('Status.Actions');
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
      fragment += '?' + qs.stringify(options.params);
    }

    var hash = fragment.charAt(0) === '/' ? fragment.slice(1) : fragment;
    this.router.history.navigate(hash, {
      trigger: !options.silent
    });
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

    if (process.env.NODE_ENV !== 'production') {
      debug('Installing "Inspect Element" context menu');
      addInspectElementMenu();
    }
  },
  onPageChange: function(view) {
    metrics.track('App', 'viewed', view.screenName);
    this.pageSwitcher.set(view);
  },
  onLinkClick: function(event) {
    // ignore help links, they're handled in `onHelpClicked`
    if (event.target.className === 'help') {
      return;
    }
    var pathname = localLinks.getLocalPathname(event);
    if (pathname) {
      event.preventDefault();
      this.router.history.navigate(pathname);
      return;
    } else if (event.target.getAttribute('href') !== '#') {
      event.preventDefault();
      event.stopPropagation();
      shell.openExternal(event.target.href);
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
    var StatusAction = app.appRegistry.getAction('Status.Actions');
    StatusAction.configure({
      visible: true,
      message: 'Retrieving connection details...',
      progressbar: true,
      progress: 100,
      sidebar: true
    });

    state.connection = new Connection({
      _id: connectionId
    });

    debug('looking up connection `%s`...', connectionId);
    getConnection(state.connection, function(err) {
      if (err) {
        state.onFatalError('fetch connection', err);
        return;
      }
      StatusAction.setMessage('Connecting to MongoDB...');

      var DataService = require('mongodb-data-service');
      app.dataService = new DataService(state.connection)
        .on('error', state.onFatalError.bind(state, 'create client'));

      app.dataService.connect(function() {
        ApplicationStore.dataService = app.dataService;

        debug('initializing singleton models... ');
        state.queryOptions = new QueryOptions();
        state.volatileQueryOptions = new QueryOptions();
        state.instance = new MongoDBInstance();
        state.startRouter();
        StatusAction.hide();
        if (done) {
          done();
        }
      });
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
        dialog.showErrorBox('Error', format('There was an error during startup '
          + 'of MongoDB Compass. \n\n%s', err.message));
        throw err;
      }
      // set up metrics
      metricsSetup();

      electron.ipcRenderer.on('window:window:open-in-new-window', () => {
        var url = window.location.href;
        if (state.connection) {
          url += `?connectionId=${state.connection.getId()}`;
        }
        window.open(url);
      });

      // signal to main process that app is ready
      ipc.call('window:renderer-ready');

      // as soon as dom is ready, render and set up the rest
      state.render();
      state.startRouter();
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

Object.defineProperty(app, 'queryOptions', {
  get: function() {
    return state.queryOptions;
  }
});

Object.defineProperty(app, 'preferences', {
  get: function() {
    return state.preferences;
  }
});

Object.defineProperty(app, 'volatileQueryOptions', {
  get: function() {
    return state.volatileQueryOptions;
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

// add Reflux store method to listen to external stores
const Reflux = require('reflux');
const packageActivationCompleted = require('hadron-package-manager/lib/action').packageActivationCompleted;
Reflux.StoreMethods.listenToExternalStore = function(storeKey, callback) {
  this.listenTo(packageActivationCompleted, () => {
    const store = app.appRegistry.getStore(storeKey);
    this.listenTo(store, callback);
    this.stopListeningTo(packageActivationCompleted);
  });
};

app.init();

// expose app globally for debugging purposes
window.app = app;

console.timeEnd('app/index.js');
