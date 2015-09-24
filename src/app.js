var pkg = require('../package.json');
var app = require('ampersand-app');
app.extend({
  // @todo (imlucas) Move to config
  // `scout-server` to point at.
  endpoint: 'http://localhost:29017',
  meta: {
    'App Version': pkg.version
  }
});
require('./bugsnag').listen(app);

var _ = require('lodash');
var domReady = require('domready');
var qs = require('qs');
var getOrCreateClient = require('scout-client');
var ViewSwitcher = require('ampersand-view-switcher');
var View = require('ampersand-view');
var localLinks = require('local-links');
var debug = require('debug')('scout:app');

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
    statusbar: 'view',
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
    /**
     * Enable/Disable features with one global switch
     */
    features: 'object'
  },
  events: {
    'click a': 'onLinkClick'
  },
  /**
   * We have what we need, we can now start our router and show the appropriate page!
   */
  _onDOMReady: function() {
    this.el = document.querySelector('#application');
    this.render();

    this.listenTo(this.router, 'page', this.onPageChange);

    this.router.history.start({
      pushState: false,
      root: '/'
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
      fragment += '?' + qs.stringify(options.params);
    }

    var hash = fragment.charAt(0) === '/' ? fragment.slice(1) : fragment;
    this.router.history.navigate(hash, {
      trigger: !options.silent
    });
  },
  render: function() {
    this.renderWithTemplate(this);
    this.pageSwitcher = new ViewSwitcher(this.queryByHook('layout-container'), {
      show: function() {
        document.scrollTop = 0;
      }
    });

    this.statusbar.el = this.queryByHook('statusbar');
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
  },
  sendMessage: function(msg) {
    ipc.send('message', msg);
  },
  onMessageReceived: function(msg) {
    debug('message received from main process:', msg);
    this.trigger(msg);
  }
});

var params = qs.parse(window.location.search.replace('?', ''));
var connection_id = params.connection_id;
var state = new Application({
  connection_id: connection_id
});

var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var MongoDBInstance = require('./models/mongodb-instance');
var Router = require('./router');
var Statusbar = require('./statusbar');

function start() {
  state.router = new Router();
  domReady(state._onDOMReady.bind(state));
}

app.extend({
  client: null,
  init: function() {
    // feature flags
    this.features = {
      querybuilder: true
    };
    state.statusbar = new Statusbar();

    if (connection_id) {
      state.connection = new Connection({
        _id: connection_id
      });


      debug('looking up connection `%s`...', connection_id);
      state.connection.fetch({
        success: function() {
          debug('got connection `%j`...', state.connection.serialize());
          app.client = getOrCreateClient(app.endpoint, state.connection.serialize());

          state.queryOptions = new QueryOptions();
          state.volatileQueryOptions = new QueryOptions();
          state.instance = new MongoDBInstance();
          start();
        }
      });
    } else {
      start();
    }
    // set up ipc
    ipc.on('message', state.onMessageReceived.bind(this));
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

app.init();

// expose app globally for debugging purposes
window.app = app;
