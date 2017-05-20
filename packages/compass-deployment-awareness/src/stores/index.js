const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

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
      dataService.on('topologyDescriptionChanged', this.topologyDescriptionChanged.bind(this));
    }
  },

  /**
   * When the topology description changes, we should trigger the store with the data.
   *
   * @param {Event} evt - The topologyDescriptionChanged event.
   */
  topologyDescriptionChanged(evt) {
    const description = evt.newDescription;
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
      topologyType: undefined,
      setName: undefined,
      servers: []
    };
  },
});

module.exports = DeploymentAwarenessStore;
