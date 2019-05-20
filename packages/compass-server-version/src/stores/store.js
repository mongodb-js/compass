import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { ENTERPRISE, COMMUNITY } from 'constants/server-version';

/**
 * Server Version store.
 */
const ServerVersionStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * This method is called when all plugins are activated. You can register
   * listeners to other plugins' stores here, e.g.
   *
   * appRegistry.getStore('OtherPlugin.Store').listen(this.otherStoreChanged.bind(this));
   *
   * If this plugin does not depend on other stores, you can delete the method.
   *
   * @param {Object} appRegistry - app registry containing all stores and components
   */
  onActivated(appRegistry) {
    this.appRegistry = appRegistry;
    appRegistry.on('instance-refreshed', this.onInstanceFetched.bind(this));
  },

  /**
   * Handle an instance fetch.
   *
   * @param {Object} state - The instance store state.
   */
  onInstanceFetched(state) {
    if (this.appRegistry) {
      this.appRegistry.emit('server-version-changed', state.instance.build.version);
    }
    this.setState({
      versionDistro: state.instance.build.enterprise_module ? ENTERPRISE : COMMUNITY,
      versionNumber: state.instance.build.version,
      isDataLake: state.instance.dataLake ? state.instance.dataLake.isDataLake : false,
      dataLakeVersion: state.instance.dataLake ? state.instance.dataLake.version : null
    });
  },

  /**
   * Initialize the Server Version store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      versionDistro: '',
      versionNumber: '',
      isDataLake: false,
      dataLakeVersion: ''
    };
  }
});

export default ServerVersionStore;
export { ServerVersionStore };
