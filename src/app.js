var _ = require('lodash');
var app = require('ampersand-app');
var pkg = require('../package.json');
var domReady = require('domready');
var qs = require('qs');
var createClient = require('scout-client');
var State = require('ampersand-state');

var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var MongoDBInstance = require('./models/mongodb-instance');

var Router = require('./router');
var Layout = require('./layout');
var Statusbar = require('./statusbar');
var debug = require('debug')('scout-ui:app');

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
var Application = State.extend({
  props: {
    version: {
      type: 'string',
      default: pkg.version
    }
  },
  children: {
    /**
     * @see http://learn.humanjavascript.com/react-ampersand/creating-a-router-and-pages
     */
    router: Router,
    /**
     * @see models/query-options.js
     */
    queryOptions: QueryOptions,
    /**
     * @see statusbar.js
     */
    statusbar: Statusbar,
    /**
     * The connection details for the MongoDB Instance we want to/are currently connected to.
     * @see models/connection.js
     */
    connection: Connection,
    /**
     * Details of the MongoDB Instance we're currently connected to.
     */
    instance: MongoDBInstance
  },
  derived: {
    /**
     * Based on the active connection, this is how models will talk to `scout-server`.
     * @see scout-client
     */
    client: {
      deps: ['connection.uri'],
      fn: function() {
        var c = createClient({
          seed: this.connection.uri
        });
        debug('created scout client', c);
        return c;
      }
    }
  },
  initialize: function(opts) {
    opts = opts || {};
    debug('initializing with options', opts);
    if (opts.uri) {
      this.connection.use(opts.uri);
    }
    domReady(this._onDOMReady.bind(this));
  },
  /**
   * We have what we need, we can now start our router and show the appropriate page!
   */
  _onDOMReady: function() {
    var head = document.getElementsByTagName('head')[0];
    var script = document.createElement('script');
    script.type = 'text/javascript';
    script.src = 'http://localhost:35729/livereload.js';
    head.appendChild(script);

    new Layout({
      el: document.querySelector('[data-hook="application"]'),
      app: this
    }).render();

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
  }
});

var params = qs.parse(window.location.search.replace('?', ''));
var uri = params.uri || 'mongodb://localhost:27017';
var state = new Application({
  uri: uri
});

// Copy the instance of `Application` on to the `ampersand-app` instance.
app.extend({
  init: function() {
    _.each(_.methods(Application.prototype), function(name) {
      this[name] = _.bind(state[name], state);
    }, this);

    _.each(_.keys(Application.prototype._children), function(name) {
      this[name] = state[name];
    }, this);

    _.each(_.keys(Application.prototype._collections), function(name) {
      this[name] = state[name];
    }, this);

    _.each(_.keys(Application.prototype._derived), function(name) {
      Object.defineProperty(this, name, {
        get: function() {
          return state.get(name);
        }
      });
    }, this);
  }
});
app.init();

module.exports = window.app = app;
