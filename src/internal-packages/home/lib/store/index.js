const app = require('hadron-app');
const Reflux = require('reflux');
const HomeActions = require('../action');
const StateMixin = require('reflux-state-mixin');
const NamespaceStore = require('hadron-reflux-store').NamespaceStore;
const toNS = require('mongodb-ns');
const electronApp = require('electron').remote.app;

const debug = require('debug')('mongodb-compass:stores:home');

const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [HomeActions],

  /**
   * Initialize home store
   */
  init() {
    NamespaceStore.listen(HomeActions.switchContent);
    this.listenToExternalStore('App.InstanceStore', this.onInstanceChanged.bind(this));
  },

  getInitialState() {
    return {
      // mode can be one of instance, database, collection
      mode: 'instance',
      namespace: ''
    };
  },

  onInstanceChanged() {
    this.updateTitle();
  },

  /**
   * change content based on namespace
   * @param  {object} namespace current namespace context
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

  updateTitle: function(ns) {
    let title = `${electronApp.getName()} - ${app.connection.instance_id}`;
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
    debug('Sidebar store changed from', prevState, 'to', this.state);
  }
});

module.exports = HomeStore;
