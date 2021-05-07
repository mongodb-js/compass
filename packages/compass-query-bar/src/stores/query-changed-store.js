import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { pick, isEqual, cloneDeep } from 'lodash';

import QUERY_PROPERTIES from 'constants/query-properties';

const debug = require('debug')('mongodb-compass:stores:query-changed-store');

const EXTENDED_QUERY_PROPERTIES = QUERY_PROPERTIES.concat([
  'queryState',
  'ns'
]);

/**
 * This is a convenience store that only triggers when the actual query
 * object (stored as `QueryBarStore.lastExecutedQuery`) has changed, e.g.
 * the user hits apply / reset. The collection tabs can listen to this
 * store instead.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],

    /**
     * listen to QueryBarStore for any changes.
     */
    init: function() {
      this.queryBarStore = options.store;
      this.queryBarStore.listen(this.onQueryBarStoreChanged.bind(this));
      this.lastExecutedQuery = this.queryBarStore.state.lastExecutedQuery;
      this.namespace = options.namespace;
    },

    /**
     * Initialize the store state.
     *
     * @return {Object} the initial store state.
     */
    getInitialState() {
      return pick(options.store.getInitialState(), EXTENDED_QUERY_PROPERTIES);
    },

    _detectChange(state) {
      const hasChanged =
        !isEqual(this.lastExecutedQuery, state.lastExecutedQuery) ||
        !isEqual(this.namespace, state.ns);
      if (hasChanged) {
        this.lastExecutedQuery = cloneDeep(state.lastExecutedQuery);
        this.namespace = state.ns;
      }
      return hasChanged;
    },

    /**
     * only trigger if lastExecutedQuery has changed
     *
     * @param {Object} state    the new state of QueryBarStore
     */
    onQueryBarStoreChanged(state) {
      if (this._detectChange(state)) {
        // @note: Durran: Cloning does not have the ability to retain the prototype methods
        //   of the original object - it only copies properties. This results in BSON types
        //   such as Long to lose their prototype methods and fail during BSON serialization.
        const newState = {};
        const copyable = state.lastExecutedQuery || this.getInitialState();

        for (const key in copyable) {
          if (copyable.hasOwnProperty(key)) {
            newState[key] = copyable[key];
          }
        }

        newState.queryState = state.queryState;
        newState.ns = state.ns;

        // Call onQueryChanged lifecycle method
        const registry = this.localAppRegistry;
        const globalRegistry = this.globalAppRegistry;
        if (registry) {
          registry.emit('query-changed', newState);
        } else {
          debug('Error: AppRegistry not available for query-changed-store');
        }
        if (globalRegistry) {
          globalRegistry.emit('compass:query-bar:query-changed', newState);
        }
        this.setState(newState);
      }
    }
  });

  if (options.localAppRegistry) {
    store.localAppRegistry = options.localAppRegistry;
  }

  if (options.globalAppRegistry) {
    store.globalAppRegistry = options.globalAppRegistry;
  }

  return store;
};

export default configureStore;
