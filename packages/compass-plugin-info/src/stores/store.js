import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import SecurityActions from 'actions';
import { load, save } from 'models/trust-dao';
import { Action as PluginManagerActions } from 'hadron-plugin-manager';

/**
 * Security store.
 */
const SecurityStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: SecurityActions,

  /**
   * Setup the security store.
   *
   * @param {String} applicationName - The application name.
   * @param {PluginManager} pluginManager - The plugin manager.
   * @param {AppRegistry} appRegistry - The app registry.
   */
  setup(applicationName, pluginManager, appRegistry) {
    load(applicationName).then((trust) => {
      PluginManagerActions.pluginActivationCompleted.listen(() => {
        appRegistry.onActivated();
        this.setState({ plugins: pluginManager.plugins, trust: trust });
      });
      pluginManager.activate(appRegistry);
    });
  },

  /**
   * Show the security panel.
   */
  show() {
    this.setState({ isVisible: true });
  },

  /**
   * Hide the security panel.
   */
  hide() {
    this.setState({ isVisible: false });
  },

  /**
   * Trust a plugin with the provided name.
   *
   * @param {String} applicationName - The application name.
   * @param {String} pluginName - The plugin name.
   */
  trust(applicationName, pluginName) {
    this.state.trust[pluginName] = true;
    save(applicationName, this.state.trust).then(() => {
      this.trigger(this.state);
    });
  },

  /**
   * Untrust a plugin with the provided name.
   *
   * @param {String} applicationName - The application name.
   * @param {String} pluginName - The plugin name.
   */
  untrust(applicationName, pluginName) {
    this.state.trust[pluginName] = false;
    save(applicationName, this.state.trust).then(() => {
      this.trigger(this.state);
    });
  },

  /**
   * Initialize the Security store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      plugins: [],
      trust: {},
      isVisible: false
    };
  }
});

export default SecurityStore;
export { SecurityStore };
