import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import LicenseActions from 'actions';
import ipc from 'hadron-ipc';

/**
 * License store.
 */
const LicenseStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   *
   * If you call `this.setState({...})` this will cause the store to trigger
   * and push down its state as props to connected components.
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: LicenseActions,

  /**
   * Agree to the license terms.
   */
  agree() {
    global.hadronApp.preferences.save({ agreedToLicense: true }, {
      success: () => {
        this.setState({ isVisible: false, isAgreed: true });
      }
    });
  },

  /**
   * Disagree with the license terms.
   */
  disagree() {
    global.hadronApp.preferences.save({ agreedToLicense: false }, {
      success: () => {
        ipc.call('license:disagree');
      }
    });
  },

  /**
   * Show the license.
   */
  show() {
    this.setState({ isVisible: true });
  },

  /**
   * Hide the license.
   */
  hide() {
    this.setState({ isVisible: false });
  },

  /**
   * Initialize the License store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      isVisible: false,
      isAgreed: false
    };
  }
});

export default LicenseStore;
export { LicenseStore };
