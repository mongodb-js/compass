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
    appRegistry.getStore('App.InstanceStore').listen(this.onInstanceFetched.bind(this));
  },

  /**
   * Handle an instance fetch.
   *
   * @param {Object} state - The instance store state.
   */
  onInstanceFetched(state) {
    this.setState({
      versionDistro: state.instance.build.enterprise_module ? ENTERPRISE : COMMUNITY,
      versionNumber: state.instance.build.version
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
      versionNumber: ''
    };
  }
});

export default ServerVersionStore;
export { ServerVersionStore };
