/* eslint no-console:0 */

var pkg = require('../package.json');
var app = require('ampersand-app');
var backoff = require('backoff');

app.extend({
  // @todo (imlucas) Move to config
  // `scout-server` to point at.
  endpoint: 'http://localhost:29017',
  meta: {
    'App Version': pkg.version
  }
});

var metrics = require('mongodb-js-metrics');
var _ = require('lodash');
var domReady = require('domready');
var qs = require('qs');
var getOrCreateClient = require('mongodb-scope-client');
var ViewSwitcher = require('ampersand-view-switcher');
var View = require('ampersand-view');
var localLinks = require('local-links');

var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var MongoDBInstance = require('./models/mongodb-instance');
var User = require('./models/user');
var Router = require('./router');
var Statusbar = require('./statusbar');
var $ = require('jquery');

var debug = require('debug')('scout:app');

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


// Inter-process communication with main process (Electron window)
var ipc = window.require('ipc');

/**
 * The top-level application singleton that brings everything together!
 *
 * @example
 *   // Drive Compass from the chrome devtools console using the `app` window global:
 *   console.log(app);
 *   // What are the current query options?
 *   console.log('Query options are', app.queryOptions);
 *   // Make API calls to `scout-server` via `scout-client`:
 *   app.client.instance(function(err, data){
 *     if(err) return console.error(err);
 *     console.log('Details of current MongoDB instance we\'re connected to: ', data)
 *   });
 *   // What connection config are we currently using?
 *   console.log('Current connection config: ', app.connection.toJSON());
 *
 * @see http://learn.humanjavascript.com/react-ampersand/application-pattern
 */
var Application = View.extend({
  template: require('./app.jade'),
  props: {
    version: {
      type: 'string',
      default: pkg.version
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
    user: User
  },
  events: {
    'click a': 'onLinkClick',
    'click i.help': 'onHelpClicked'
  },
  onHelpClicked: function(evt) {
    var id = $(evt.target).attr('data-hook');
    app.sendMessage('show help window', id);
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
  startRouter: function() {
    this.router = new Router();
    debug('Listening for page changes from the router...');
    this.listenTo(this.router, 'page', this.onPageChange);

    debug('Starting router...');
    this.router.history.start({
      pushState: false,
      root: '/'
    });

    metrics.listen(app);

    User.getOrCreate(function(err, user) {
      if (err) {
        metrics.error(err, 'user: get or create');
        return;
      }
      this.user.set(user.serialize());
      this.user.trigger('sync');
    }.bind(this));

    app.statusbar.hide();
  },
  onFatalError: function(id, err) {
    debug('clearing client stall timeout...');
    clearTimeout(this.clientStalledTimeout);

    console.error('Fatal Error!: ', id, err);
    metrics.error(err, 'Fatal Error: ' + id);
    app.statusbar.fatal(err);
  },
  // ms we'll wait for a `scout-client` instance
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
  },
  onPageChange: function(view) {
    this.pageSwitcher.set(view);
  },
  onLinkClick: function(event) {
    var pathname = localLinks.getLocalPathname(event);
    if (pathname) {
      event.preventDefault();
      this.router.history.navigate(pathname);
    }
  }
});

var params = qs.parse(window.location.search.replace('?', ''));
var connectionId = params.connection_id;
var state = new Application({
  connection_id: connectionId
});

/**
 * @todo (imlucas): Feature flags can be overridden
 * via `window.localStorage`.
 */
var FEATURES = {
  querybuilder: true,
  keychain: true,
  'Google Map Minicharts': true,
  'Connect with SSL': false,
  'Connect with Kerberos': false,
  'Connect with LDAP': false,
  'Connect with X.509': false,
  intercom: true,
  bugsnag: true,
  'google-analytics': true
};

app.extend({
  client: null,
  config: {
    intercom: {
      app_id: 'p57suhg7'
    }
  },
  /**
   * Check whether a feature flag is currently enabled.
   *
   * @param {String} id - A key in `FEATURES`.
   * @return {Boolean}
   */
  isFeatureEnabled: function(id) {
    return FEATURES[id] === true;
  },
  /**
   * Enable or disable a feature programatically.
   *
   * @param {String} id - A key in `FEATURES`.
   * @param {Boolean} bool - whether to enable (true) or disable (false)
   */
  setFeature: function(id, bool) {
    FEATURES[id] = bool;
  },
  sendMessage: function(msg, arg) {
    ipc.send('message', msg, arg);
  },
  onMessageReceived: function(msg, arg) {
    debug('message received from main process:', msg, arg);
    this.trigger(msg, arg);
  },
  metrics: metrics,
  init: function() {
    domReady(function() {
      state.render();

      if (!connectionId) {
        // Not serving a part of the app which uses the client,
        // so we can just start everything up now.
        state.startRouter();
        return;
      }

      app.statusbar.show('Retrieving connection details...');

      state.connection = new Connection({
        _id: connectionId
      });

      debug('looking up connection `%s`...', connectionId);
      getConnection(state.connection, function(err) {
        if (err) {
          state.onFatalError('fetch connection', err);
          return;
        }
        app.statusbar.show('Connecting to MongoDB...');

        var endpoint = app.endpoint;
        var connection = state.connection.serialize();

        app.client = getOrCreateClient(endpoint, connection)
          .on('readable', state.onClientReady.bind(state))
          .on('error', state.onFatalError.bind(state, 'create client'));

        state.startClientStalledTimer();
      });
    });
    // set up ipc
    ipc.on('message', this.onMessageReceived.bind(this));
  },
  navigate: state.navigate.bind(state)
});

Object.defineProperty(app, 'statusbar', {
  get: function() {
    return state.statusbar;
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


app.init();

// expose app globally for debugging purposes
window.app = app;
