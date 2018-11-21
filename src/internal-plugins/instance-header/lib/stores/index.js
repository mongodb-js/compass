const Reflux = require('reflux');
const InstanceHeaderActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const debug = require('debug')('mongodb-compass:stores:instance-header');

const CLUSTER = 'My Cluster';

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
    appRegistry.on('data-service-initialized', this.onDataServiceInit.bind(this));
    appRegistry.on('collection-changed', this.onCollectionChanged.bind(this));
    appRegistry.on('database-changed', this.onDatabaseChanged.bind(this));
  },

  /**
   * Initialize the Instance Header store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      connection: null,
      name: 'Retrieving connection information',
      activeNamespace: ''
    };
  },

  onDataServiceInit(dataService) {
    this.setState({ connection: dataService.client.model });
  },

  onConnectStateChanged(connectState) {
    this.setState({ connection: connectState.currentConnection });
  },

  /**
   * @note: Durran: COMPASS-834. Getting instance details does not necessarily mean that
   * the active namespace is the instance itself. The user can refresh the instance while
   * being on a database or collection view.
   *
   * @param {Object} description - The topology description.
   */
  fetchInstanceDetails() {
    const connection = this.state.connection;
    this.setState({
      name: connection.is_favorite ? connection.name : CLUSTER,
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
