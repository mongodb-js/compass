var pkg = require('../package.json');
var app = require('ampersand-app');
app.extend({
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

/**
 * The top-level application singleton that brings everything together!
 *
 * @example
 *   // Drive Scout from the chrome devtools console using the `app` window global:
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
     * @see models/query-options.js
     */
    queryOptions: 'state',
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
  }
});

var params = qs.parse(window.location.search.replace('?', ''));
var uri = params.uri || 'mongodb://localhost:27017';
var state = new Application({
  uri: uri
});

var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var MongoDBInstance = require('./models/mongodb-instance');
var Router = require('./router');
var Statusbar = require('./statusbar');

app.extend({
  client: null,
  init: function() {
    state.statusbar = new Statusbar();
    this.connection = new Connection();
    this.connection.use(uri);
    this.queryOptions = new QueryOptions();
    this.instance = new MongoDBInstance();

    // feature flags
    this.features = {
      querybuilder: true
    };

    state.router = new Router();
  },
  navigate: state.navigate.bind(state)
});

Object.defineProperty(app, 'statusbar', {
  get: function() {
    return state.statusbar;
  }
});

Object.defineProperty(app, 'client', {
  get: function() {
    return getOrCreateClient({
      seed: app.connection.uri
    });
  }
});
app.init();

// expose app globally for debugging purposes
window.app = app;

function render_app() {
  state._onDOMReady();
}

domReady(render_app);

window.app = app;
