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
    this.setState({namespace: namespace});
    const ns = toNS(namespace);
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
