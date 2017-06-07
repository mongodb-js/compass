const Reflux = require('reflux');
const InstanceHeaderActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const debug = require('debug')('mongodb-compass:stores:instance-header');

/**
 * Instance Header store.
 */
const InstanceHeaderStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [InstanceHeaderActions],

  /**
   * Initialize everything that is not part of the store's state.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    this.NamespaceStore = appRegistry.getStore('App.NamespaceStore');
    appRegistry.getStore('DeploymentAwareness.Store').listen(this.fetchInstanceDetails.bind(this));
  },

  /**
   * Initialize the Instance Header store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      name: 'Retrieving connection information',
      activeNamespace: ''
    };
  },

  /**
   * @note: Durran: COMPASS-834. Getting instance details does not necessarily mean that
   * the active namespace is the instance itself. The user can refresh the instance while
   * being on a database or collection view.
   *
   * @param {Object} description - The topology description.
   */
  fetchInstanceDetails(description) {
    const { TopologyType } = require('@mongodb-js/compass-deployment-awareness');
    const connection = global.hadronApp.connection;
    const topology = `Topology: ${TopologyType.humanize(description.topologyType)}`;
    this.setState({
      name: connection.is_favorite ? connection.name : topology,
      activeNamespace: this.NamespaceStore.ns || ''
    });
  },

  /**
   * change active namespace when user clicks on the instance area
   */
  onCollectionChanged(ns) {
    this.setState({
      activeNamespace: ns || ''
    });
  },
  onDatabaseChanged(ns) {
    this.setState({
      activeNamespace: ns || ''
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('InstanceHeader store changed from %j to %j', prevState, this.state);
  }
});

module.exports = InstanceHeaderStore;
