import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { ENTERPRISE, COMMUNITY } from '../constants/server-version';

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
    appRegistry.on('instance-created', ({ instance }) => {
      this.onInstanceStatusChange(instance, instance.status);
      instance.on('change:status', this.onInstanceStatusChange.bind(this));
    });
    appRegistry.on('data-service-disconnected', () => {
      return this.setState(this.getInitialState());
    });
  },

  /**
   * Handle an instance fetch.
   *
   * @param {Object} instance instance
   * @param {string} newStatus Instance new fetch status
   */
  onInstanceStatusChange(instance, newStatus) {
    if (newStatus === 'ready') {
      const prevVersion = this.state.versionNumber;
      if (prevVersion !== instance.build.version) {
        this.appRegistry.emit('server-version-changed', instance.build.version);
      }
      this.setState({
        versionDistro: instance.build.isEnterprise ? ENTERPRISE : COMMUNITY,
        versionNumber: instance.build.version,
        isDataLake: instance.dataLake.isDataLake,
        dataLakeVersion: instance.dataLake.version || null
      });
    }
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
