/* eslint no-console:0 */
console.time('app/index.js');

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

var StyleManager = require('./style-manager');
StyleManager.writeStyles();

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
var ApplicationStore = require('hadron-reflux-store').ApplicationStore;
var User = require('./models/user');
var Router = require('./router');
var Statusbar = require('./statusbar');
var migrateApp = require('./migrations');
var metricsSetup = require('./metrics');
var metrics = require('mongodb-js-metrics')();

var AutoUpdate = require('../auto-update');

var addInspectElementMenu = require('debug-menu').install;

ipc.once('app:launched', function() {
  console.log('in app:launched');
  if (process.env.NODE_ENV !== 'production') {
    require('debug').enable('mon*,had*');
    require('debug/browser');
  }
});

var debug = require('debug')('mongodb-compass:app');

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
     * @see statusbar.js
     */
    statusbar: 'state',
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
    router: 'object',
    clientStartedAt: 'date',
    clientStalledTimeout: 'number'
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
    var url = 'compass://help';
    if (id) {
      url += '/' + id;
    }

    ipc.call('app:show-help-window', id);
  },
  onClientReady: function() {
    debug('Client ready! Took %dms to become readable',
      new Date() - this.clientStartedAt);

    debug('clearing client stall timeout...');
    clearTimeout(this.clientStalledTimeout);

    debug('initializing singleton models... ');
    this.queryOptions = new QueryOptions();
    this.volatileQueryOptions = new QueryOptions();
    this.instance = new MongoDBInstance();

    this.startRouter();
  },
  fetchUser: function(done) {
    debug('preferences fetched, now getting user');
    User.getOrCreate(this.preferences.currentUserId, function(err, user) {
      if (err) {
        done(err);
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
  },
  startRouter: function() {
    this.router = new Router();
    debug('Listening for page changes from the router...');
    this.listenTo(this.router, 'page', this.onPageChange);

    debug('Starting router...');
    this.router.history.start({
      pushState: false,
      root: '/'
    });
    app.statusbar.hide();
  },
  onFatalError: function(id, err) {
    debug('clearing client stall timeout...');
    clearTimeout(this.clientStalledTimeout);

    console.error('Fatal Error!: ', id, err);
    metrics.error(err);
    app.statusbar.fatal(err);
  },
  // ms we'll wait for a `mongodb-scope-client` instance
  // to become readable before giving up and showing
  // a fatal error message.
  CLIENT_STALLED_REDLINE: 5 * 1000,
  startClientStalledTimer: function() {
    this.clientStartedAt = new Date();

    debug('Starting client stalled timer to bail in %dms...',
      this.CLIENT_STALLED_REDLINE);

    this.clientStalledTimeout = setTimeout(function() {
      this.onFatalError('client stalled',
        new Error('Error connecting to MongoDB.  '
          + 'Please reload the page.'));
    }.bind(this), this.CLIENT_STALLED_REDLINE);
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

    this.statusbar = new Statusbar({
      el: this.queryByHook('statusbar')
    });
    this.statusbar.render();

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
    } else if (event.currentTarget.getAttribute('href') !== '#') {
      event.preventDefault();
      event.stopPropagation();
      shell.openExternal(event.target.href);
    }
  }
});

var params = qs.parse(window.location.search.replace('?', ''));
var connectionId = params.connection_id;
var state = new Application({
  connection_id: connectionId
});

app.extend({
  client: null,
  navigate: state.navigate.bind(state),
  isFeatureEnabled: function(feature) {
    // proxy to preferences for now
    return this.preferences.isFeatureEnabled(feature);
  },
  onDomReady: function() {
    state.render();

    if (!connectionId) {
      // Not serving a part of the app which uses the client,
      // so we can just start everything up now.
      state.startRouter();
      return;
    }

    app.statusbar.show({
      message: 'Retrieving connection details...',
      staticSidebar: true
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
      app.statusbar.show({
        message: 'Connecting to MongoDB...'
      });

      var DataService = require('mongodb-data-service');
      app.dataService = new DataService(state.connection)
        .on('readable', state.onClientReady.bind(state))
        .on('error', state.onFatalError.bind(state, 'create client'));

      app.dataService.connect(function() {
        ApplicationStore.dataService = app.dataService;
        state.startClientStalledTimer();
      });
    });
  },
  init: function() {
    var self = this;
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

      // signal to main process that app is ready
      ipc.call('window:renderer-ready');

      // as soon as dom is ready, render and set up the rest
      self.onDomReady();
    });
  }
});

Object.defineProperty(app, 'statusbar', {
  get: function() {
    return state.statusbar;
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

app.init();

// expose app globally for debugging purposes
window.app = app;

console.timeEnd('app/index.js');
