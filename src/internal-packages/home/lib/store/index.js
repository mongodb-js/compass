const app = require('ampersand-app');
const Reflux = require('reflux');
const HomeActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const toNS = require('mongodb-ns');
const InstanceActions = app.appRegistry.getAction('App.InstanceActions');
const qs = require('qs');

const debug = require('debug')('mongodb-compass:stores:home');

const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [InstanceActions, HomeActions],

  /**
   * Initialize home store
   */
  init() {
    NamespaceStore.listen(HomeActions.switchContent);
  },

  getInitialState() {
    return {
      // mode can be one of instance, database, collection
      mode: 'instance',
      namespace: '',
      tab: ''
    };
  },

  setInstance() {
    this.updateTitle();
  },

  /**
   * change content based on namespace
   * @param  {string} namespace current namespace context
   */
  switchContent(namespace) {
    const ns = toNS(namespace);
    if (ns.database === '') {
      // top of the side bar was clicked, render server stats
      this.setState({mode: 'instance', namespace: namespace});
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      this.setState({mode: 'database', namespace: namespace});
    } else {
      // show collection view
      this.setState({mode: 'collection', namespace: namespace});
    }
    this.updateTitle(ns);
  },

  /**
   * based on the tab provided navigate to the correct route
   * @param {string} tab render the tab param of route
   */
  navigateRoute(tab) {
    // mode determines root of the route
    const root = this.state.mode;
    const hash = app.router.history.location.hash;
    const fragments = hash.split('?');
    // keep the connectionID param
    const params = qs.parse(fragments[1]);
    app.navigate(root + '/' + tab, {silent: false, params: params});
  },

  /**
   * render the home view based on route fragments passed
   * @param {string} tab render the tab param of route
   */
  renderRoute(tab) {
    this.setState({tab: tab});
  },

  updateTitle: function(ns) {
    let title = 'MongoDB Compass - ' + app.connection.instance_id;
    if (ns) {
      title += '/' + ns;
    }
    document.title = title;
  },

  /**
  * log changes to the store as debug messages.
  * @param  {Object} prevState   previous state.
  */
  storeDidUpdate(prevState) {
    debug('Home store changed from', prevState, 'to', this.state);
  }
});

module.exports = HomeStore;
