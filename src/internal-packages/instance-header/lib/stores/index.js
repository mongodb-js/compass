const Reflux = require('reflux');
const InstanceHeaderActions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const debug = require('debug')('mongodb-compass:stores:instance-header');
const { NamespaceStore } = require('hadron-reflux-store');

/**
 * Instance Header store.
 */

const InstanceHeaderStore = Reflux.createStore({
  /**
   * adds a state to the store, similar to React.Component's state
   * @see https://github.com/yonatanmn/Super-Simple-Flux#reflux-state-mixin
   */
  mixins: [StateMixin.store],

  /**
   * listen to all actions defined in ../actions/index.jsx
   */
  listenables: [InstanceHeaderActions],

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
    NamespaceStore.listen(this.clickInstance.bind(this));
    this.listenToExternalStore('App.InstanceStore', this.fetchInstanceDetails.bind(this));
  },

  /**
   * Initialize the Instance Header store state.
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      hostname: 'Retrieving host information',
      port: 27017,
      processStatus: '',
      versionDistro: null,
      versionNumber: '',
      activeNamespace: ''
    };
  },

  fetchInstanceDetails(state) {
    this.setState({
      hostname: state.instance.hostname,
      port: state.instance.port,
      processStatus: 'TODO: Get Replica Set Status',
      versionDistro: state.instance.build.enterprise_module ? 'Enterprise' : 'Community',
      versionNumber: state.instance.build.version,
      activeNamespace: ''
    });
  },

  /**
   * handlers for each action defined in ../actions/index.jsx, for example:
   */
  clickInstance() {
    this.setState({
      activeNamespace: NamespaceStore.ns || ''
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('InstanceHeader store changed from %j to %j', prevState, this.state);
  }
});

module.exports = InstanceHeaderStore;
