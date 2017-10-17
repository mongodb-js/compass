import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import CollectionStatsActions from 'actions';

const debug = require('debug')('mongodb-compass:stores:collection-stats');

/**
 * Collection Stats store.
 */
const CollectionStatsStore = Reflux.createStore({
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
  listenables: CollectionStatsActions,

  /**
   * Initialize everything that is not part of the store's state.
   */
  init() {
  },

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
  // eslint-disable-next-line no-unused-vars
  onActivated(appRegistry) {
    // Events emitted from the app registry:
    // appRegistry.on('application-intialized', (version) => return true);
    // appRegistry.on('data-service-intialized', (dataService) => return true);
    // appRegistry.on('data-service-connected', (error, dataService) => return true);
    // appRegistry.on('collection-changed', (namespace) => return true);
    // appRegistry.on('database-changed', (namespace) => return true);
    // appRegistry.on('query-applied', (queryState) => return true);
  },

  /**
   * Initialize the Collection Stats store state. The returned object must
   * contain all keys that you might want to modify with this.setState().
   *
   * @return {Object} initial store state.
   */
  getInitialState() {
    return {
      status: 'enabled'
    };
  },

  /**
   * handlers for each action defined in ../actions/index.jsx, for example:
   */
  toggleStatus() {
    this.setState({
      status: this.state.status === 'enabled' ? 'disabled' : 'enabled'
    });
  },

  /**
   * log changes to the store as debug messages.
   * @param  {Object} prevState   previous state.
   */
  storeDidUpdate(prevState) {
    debug('collection-stats store changed from', prevState, 'to', this.state);
  }
});

export default CollectionStatsStore;
export { CollectionStatsStore };
