const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const DeploymentAwarenessStore = require('./index');
const ServerType = require('../models/server-type');
const TopologyType = require('../models/topology-type');

/**
 * The default description.
 */
const DEFAULT_DESCRIPTION = 'Topology type not yet discovered.';

/**
 * Deployment State store.
 */
const DeploymentStateStore = Reflux.createStore({
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
   * Looks at the topology description and determines if Compass is in a
   * writable state.
   *
   * @param {Object} description - The topology description.
   */
  topologyChanged(description) {
    const topologyType = description.topologyType;
    if (TopologyType.isWritable(topologyType)) {
      if (topologyType === TopologyType.SINGLE) {
        const serverType = description.servers[0].type;
        const serverWritable = ServerType.isWritable(serverType);
        this.setState({
          isWritable: serverWritable,
          description: this._generateSingleMessage(serverWritable, serverType)
        });
      } else {
        this.setState({
          isWritable: true,
          description: this._generateNonSingleMessage(true, topologyType)
        });
      }
    } else {
      this.setState({
        isWritable: false,
        description: this._generateNonSingleMessage(false, topologyType)
      });
    }
  },

  /**
   * Initialize the Deployment State store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      isWritable: false,
      description: DEFAULT_DESCRIPTION
    };
  },

  _generateNonSingleMessage(isWritable, topologyType) {
    const message = isWritable ? 'is writable' : 'is not writable';
    return `Topology type: ${TopologyType.humanize(topologyType)} ${message}`;
  },

  _generateSingleMessage(isWritable, serverType) {
    const message = isWritable ? 'is writable' : 'is not writable';
    return `Single connection to server type: ${ServerType.humanize(serverType)} ${message}`;
  }
});

module.exports = DeploymentStateStore;
