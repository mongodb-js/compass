const app = require('hadron-app');
const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:stores:server-version');

/**
 * Server Version store.
 */
const ServerVersionStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
  },

  /**
   * This method is called when all packages are activated. Can be
   * removed if not needed.
   */
  onActivated() {
    app.appRegistry.getStore('App.InstanceStore').listen(this.onInstanceFetched.bind(this));
  },

  /**
   * Initialize the Server Version store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      versionDistro: '',
      versionNumber: ''
    };
  },

  onInstanceFetched(state) {
    this.setState({
      versionDistro: state.instance.build.enterprise_module ? 'Enterprise' : 'Community',
      versionNumber: state.instance.build.version
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('ServerVersion store changed from %j to %j', prevState, this.state);
  }
});

module.exports = ServerVersionStore;
