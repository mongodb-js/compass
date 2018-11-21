const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const DeploymentAwarenessStore = require('./index');
const TopologyType = require('../models/topology-type');

/**
 * The default description.
 */
const DEFAULT_DESCRIPTION = 'Topology type not yet discovered.';

/**
 * Read State store.
 */
const ReadStateStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * Initialize by listening to topology changes.
   */
  init() {
    DeploymentAwarenessStore.listen(this.topologyChanged.bind(this));
  },

  /**
   * Hook into the app registry when activated.
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.on('data-service-initialized', this.onDataServiceInit.bind(this));
  },

  /**
   * When the data service initialises, update the connection in the state here.
   *
   * @param {Object} dataService - The data service.
   */
  onDataServiceInit(dataService) {
    this.setState({ connection: dataService.client.model });
  },

  /**
   * Looks at the topology description and determines if Compass is in a
   * readable state.
   *
   * @param {Object} description - The topology description.
   */
  topologyChanged(description) {
    const topologyType = description.topologyType;
    const readPreference = this.state.connection.read_preference;
    const isReadable = TopologyType.isReadable(topologyType, readPreference);
    this.setState({
      isReadable: isReadable,
      description: this._getDescription(isReadable, topologyType, readPreference)
    });
  },

  /**
   * Initialize the Read State store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      isReadable: false,
      connection: null,
      description: DEFAULT_DESCRIPTION
    };
  },

  _getDescription(isReadable, topologyType, readPreference) {
    const topology = TopologyType.humanize(topologyType);
    const note = isReadable ? 'is readable' : 'is not readable';
    return `Topology type ${topology} in conjunction with read preference ${readPreference} ${note}`;
  }
});

module.exports = ReadStateStore;
