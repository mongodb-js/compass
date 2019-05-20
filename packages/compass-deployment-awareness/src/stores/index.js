import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';

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
    appRegistry.on('data-service-initialized', this.onDataServiceInitialized.bind(this));
    appRegistry.on('instance-refreshed', (state) => {
      if (state.instance.dataLake && state.instance.dataLake.isDataLake) {
        this.setState({isDataLake: true});
      }
    });
  },

  /**
   * When the data service is initialized this is called in order to set up
   * listeners for SDAM events.
   *
   * @param {DataService} dataService - The data service.
   */
  onDataServiceInitialized(dataService) {
    dataService.on('topologyDescriptionChanged', this.topologyDescriptionChanged.bind(this));
  },

  /**
   * When the topology description changes, we should trigger the store with the data.
   *
   * @param {Event} evt - The topologyDescriptionChanged event.
   */
  topologyDescriptionChanged(evt) {
    this.setState(evt.newDescription);
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
      isDataLake: false
    };
  }
});

export default DeploymentAwarenessStore;
