import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import SecurityActions from 'actions';

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
   * Setup after activation.
   */
  onActivated() {
    this.setState({
      plugins: global.hadronApp.pluginManager.plugins
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
   * Initialize the Security store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      plugins: [],
      isVisible: false
    };
  }
});

export default SecurityStore;
export { SecurityStore };
