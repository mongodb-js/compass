const Reflux = require('reflux');
const DeploymentAwarenessActions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:stores:deployment-awareness');

/**
 * Deployment Awareness store.
 */
const DeploymentAwarenessStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: DeploymentAwarenessActions,

  /**
   * This method is called when the data service is finished connecting. You
   * receive either an error or the connected data service object, and if the
   * connection was successful you can now make calls to the database, e.g.
   *
   * dataService.command('admin', {connectionStatus: 1}, this.handleStatus.bind(this));
   *
   * If this plugin does not need to talk to the database, you can delete this
   * method.
   *
   * @param {Object} error         the error object if connection was unsuccessful
   * @param {Object} dataService   the dataService object if connection was successful
   *
   */
  onConnected(error, dataService) {
    if (!error) {
      this.initialTopology(dataService.client.database.topology);
      dataService.on('topologyOpening', this.topologyOpening.bind(this));
      dataService.on('topologyClosed', this.topologyClosed.bind(this));
      dataService.on('topologyDescriptionChanged', this.topologyDescriptionChanged.bind(this));
    }
  },

  initialTopology(topology) {
    const isMasterDoc = topology.isMasterDoc;
    this.setState({
      open: true,
      topologyType: this.getTopologyType(isMasterDoc),
      setName: this.getSetName(isMasterDoc),
      servers: this.getServers(isMasterDoc)
    });
  },

  getTopologyType(isMasterDoc) {
    return 'Standalone';
  },

  getSetName(isMasterDoc) {
    return 'RS';
  },

  getServers(isMasterDoc) {
    return [{ type: 'Standalone', address: '127.0.0.1:27017' }];
  },

  topologyOpening(evt) {
    this.setState({ open: true });
  },

  topologyClosed(evt) {
    this.setState({ open: false });
  },

  topologyDescriptionChanged(evt) {
    const description = evt.newDescription;
    this.setState({
      topologyType: description.topologyType,
      setName: description.setName,
      servers: description.servers
    });
  },

  /**
   * Initialize the Deployment Awareness store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      open: false,
      topologyType: null,
      setName: null,
      servers: []
    };
  },
});

module.exports = DeploymentAwarenessStore;
