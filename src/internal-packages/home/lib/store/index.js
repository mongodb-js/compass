const app = require('hadron-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const toNS = require('mongodb-ns');
const electronApp = require('electron').remote.app;
const { UI_STATES } = require('../constants');

const debug = require('debug')('mongodb-compass:stores:home');

const HomeStore = Reflux.createStore({

  mixins: [StateMixin.store],

  onActivated(appRegistry) {
    // set up listeners on external stores
    appRegistry.getStore('App.InstanceStore').listen(this.onInstanceChange.bind(this));
  },

  onCollectionChanged(namespace) {
    this.onNamespaceChange(namespace);
  },

  onDatabaseChanged(namespace) {
    this.onNamespaceChange(namespace);
  },

  getInitialState() {
    return {
      // mode can be one of instance, database, collection
      mode: 'instance',
      namespace: '',
      uiStatus: UI_STATES.LOADING
    };
  },

  onInstanceChange() {
    this.setState({uiStatus: UI_STATES.COMPLETE});
    this.updateTitle();
  },

  /**
   * change content based on namespace
   * @param {object} namespace - current namespace context
   */
  onNamespaceChange(namespace) {
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
