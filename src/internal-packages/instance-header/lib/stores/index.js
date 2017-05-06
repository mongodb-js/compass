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
      activeNamespace: ''
    };
  },

  /**
   * @note: Durran: COMPASS-834. Getting instance details does not necessarily mean that
   * the active namespace is the instance itself. The user can refresh the instance while
   * being on a database or collection view.
   *
   * @param {Object} state    the new state containing the instance details
   */
  fetchInstanceDetails(state) {
    this.setState({
      hostname: state.instance.hostname,
      port: state.instance.port,
      processStatus: 'TODO: Get Replica Set Status',
      activeNamespace: NamespaceStore.ns || ''
    });
  },

  /**
   * change active namespace when user clicks on the instance area
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
