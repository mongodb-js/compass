import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';

/**
 * Constants for various environments MongoDB can run in.
 */
const ATLAS = 'atlas';
const ADL = 'adl';
const ON_PREM = 'on-prem';

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
   * Setup listeners to the app registry.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    this.appRegistry = appRegistry;
    appRegistry.on('data-service-connected', this.onDataServiceConnected.bind(this));
    appRegistry.on('instance-created', ({ instance }) => {
      instance.on('change:status', this.onInstanceStatusChange.bind(this));
    });
  },

  onInstanceStatusChange({ isAtlas, dataLake }, newStatus) {
    if (newStatus === 'ready') {
      if (isAtlas) {
        const env = dataLake.isDataLake ? ADL : ATLAS;
        this.setState({ isDataLake: dataLake.isDataLake, env });
        this.appRegistry.emit('compass:deployment-awareness:topology-changed', {
          topologyType: this.state.topologyType,
          setName: this.state.setName,
          servers: this.state.servers,
          env
        });
      }
    }
  },

  /**
   * When the data service is connected this is called in order to set up
   * listeners for SDAM events.
   *
   * @param {Error | null} _ - The error that might have occurred when connecting.
   * @param {DataService} dataService - The data service.
   */
  onDataServiceConnected(_, dataService) {
    dataService.on('topologyDescriptionChanged', this.topologyDescriptionChanged.bind(this));

    const topologyDescription = dataService.getLastSeenTopology();
    if (topologyDescription !== null) {
      this._onNewTopologyDescription(topologyDescription);
    }
  },

  /**
   * When the topology description changes, we should trigger the
   * store with the data.
   *
   * @param {Event} evt - The topologyDescriptionChanged event.
   */
  topologyDescriptionChanged(evt) {
    this._onNewTopologyDescription(evt.newDescription);
  },

  /**
   * @param {TopologyDescription} topologyDescription - The new topology description
   * to load.
   * https://github.com/mongodb/specifications/blob/master/source/server-discovery-and-monitoring/server-discovery-and-monitoring-monitoring.rst#topology-description
   */
  _onNewTopologyDescription(topologyDescription) {
    const servers = [];
    for (const desc of topologyDescription.servers.values()) {
      servers.push({
        address: desc.address,
        type: desc.type,
        tags: desc.tags
      });
    }
    if (this.state.topologyType !== topologyDescription.type) {
      this.appRegistry.emit(
        'compass:deployment-awareness:topology-changed',
        {
          topologyType: topologyDescription.type,
          setName: topologyDescription.setName,
          servers: servers,
          env: this.state.env
        }
      );
    }
    this.setState({
      topologyType: topologyDescription.type,
      setName: topologyDescription.setName,
      servers: servers
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
      topologyType: 'Unknown',
      setName: '',
      servers: [],
      isDataLake: false,
      env: ON_PREM
    };
  }
});

export default DeploymentAwarenessStore;
