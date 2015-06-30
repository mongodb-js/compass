var app = require('ampersand-app');
var domReady = require('domready');
var qs = require('qs');
var Router = require('./router');
var QueryOptions = require('./models/query-options');
var Connection = require('./models/connection');
var Layout = require('./layout');
var Statusbar = require('./statusbar');
var createClient = require('../../scout-client');
var State = require('ampersand-state');
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
    connection: Connection
  },
  derived: {
    /**
     * Based on the active connection, this is how models will talk to `scout-server`.
     * @see scout-client
     */
    client: {
      deps: ['connection.uri'],
      fn: function(){
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
    if(opts.uri){
      this.connection.use(opts.uri);
    }
    domReady(this._onDOMReady.bind(this));
  },
  /**
   * We have what we need, we can now start our router and show the appropriate page!
   */
  _onDOMReady: function(){
    new Layout({el: document.querySelector('#application'), app: this}).render();

    this.router.history.start({
      pushState: false,
      root: '/'
    });
  },
  /**
   * When you want to go to a different page in the app.
   */
  navigate: function(fragment) {
    this.router.history.navigate(this._toHash(fragment), {
      trigger: true
    });
  },
  /**
   * Update the URL in the location bar and add a new history entry,
   * but don't bubble up to the router.  Required if your view is updating
   * the page state (e.g. selected items).
   *
   * @example
   *
   */
  url: function(fragment, data) {
    if (data) {
      fragment += '?' + qs.stringify(data);
    }
    this.router.history.navigate(this._toHash(fragment), {
      trigger: false
    });
  },
  permalink: function(fragment) {
    var origin = window.location.origin;
    return origin + '/#' + this._toHash(fragment);
  },
  _toHash: function(fragment) {
    return (fragment.charAt(0) === '/') ? fragment.slice(1) : fragment;
  }
});

var state = new Application({});
app.extend(state);
app.client = state.client;
module.exports = window.app = app;
