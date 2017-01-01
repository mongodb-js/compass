const app = require('ampersand-app');
const Reflux = require('reflux');
const HomeActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const ipc = require('hadron-ipc');
const toNS = require('mongodb-ns');
const InstanceActions = app.appRegistry.getAction('App.InstanceActions');

const qs = require('qs');

const debug = require('debug')('mongodb-compass:stores:home');

const INSTANCE = 'instance';
const DATABASE = 'database';
const COLLECTION = 'collection';

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
    this.listenToExternalStore('App.InstanceStore', this.onInstanceChange.bind(this));
    this.CollectionStore = app.appRegistry.getStore('App.CollectionStore');
  },

  getInitialState() {
    return {
      // mode can be one of instance, database, collection
      mode: 'instance',
      instance: {},
      namespace: '',
      tab: ''
    };
  },

  onInstanceChange(state) {
    this.setState({
      instance: state.instance
    });
  },

  // TODO @KeyboardTsundoku move update title up to on instance change and remove lisenting to instanceactions
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
      this.setState({mode: INSTANCE, namespace: namespace});
    } else if (ns.collection === '') {
      // a database was clicked, render collections table
      this.setState({mode: DATABASE, namespace: namespace});
    } else {
      // show collection view
      this.setState({mode: COLLECTION, namespace: namespace});
    }
    this.updateTitle(ns);
  },

  /**
   * based on the tab provided navigate to the correct route
   * @param {string} route the current route before it is changed ()
   * @param {string} namespace provided namespace for route
   * @param {string} tab render the tab param of route
   */
  navigateRoute(route, namespace, tab) {
    // extract any parameters from router hash
    const fragments = route.split('?');
    const options = {silent: false, params: qs.parse(fragments[1])};
    // set route based on namespace
    const ns = toNS(namespace);
    if (ns.database === '') {
      app.navigate(`${INSTANCE}/${tab}`, options);
    } else if (ns.collection === '') {
      app.navigate(`${DATABASE}/${namespace}`, options);
    } else {
      // TODO @keyboard this might be something that should be pushed down to collection rendering
      // if tab is blank set to schema by default
      const selectedTab = tab === '' ? 'schema' : tab;
      app.navigate(`${COLLECTION}/${namespace}/${selectedTab}`, options);
    }
  },

  _setCollection(namespace) {
    const dbName = toNS(namespace).database;
    const databases = this.state.instance.databases;
    const database = databases.models.filter((db) => {
      return db._id === dbName;
    });
    const coll = database[0].collections.models.filter((col) => {
      return col._id === namespace;
    });
    this.CollectionStore.setCollection(coll[0]);
  },

  /**
   * render the home view based on route fragments passed
   * @param {string} mode can be one of INSTANCE, DATABASE, COLLECTION
   * @param {string} namespace field for route
   * @param {string} tab render the tab param of route
   */
  renderRoute(mode, namespace, tab) {
    if (mode === DATABASE) {
      this.CollectionStore.setCollection({});
      NamespaceStore.ns = namespace;
      ipc.call('window:hide-collection-submenu');
    } else if (mode === COLLECTION) {
      this._setCollection(namespace);
      ipc.call('window:show-collection-submenu');
    }
    this.setState({mode: mode, namespace: namespace, tab: tab});
    this.updateTitle(toNS(namespace));
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
