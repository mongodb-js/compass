import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import app from 'hadron-app';
import { pick, isEqual, cloneDeep } from 'lodash';

import { QueryBarStore, QUERY_PROPERTIES } from './query-bar-store';

const EXTENDED_QUERY_PROPERTIES = QUERY_PROPERTIES.concat([
  'maxTimeMS',
  'queryState',
  'ns'
]);

/**
 * This is a convenience store that only triggers when the actual query
 * object (stored as `QueryBarStore.lastExecutedQuery`) has changed, e.g.
 * the user hits apply / reset. The collection tabs can listen to this
 * store instead.
 */
const QueryChangedStore = Reflux.createStore({
  mixins: [StateMixin.store],

  /**
   * listen to QueryBarStore for any changes.
   */
  init: function() {
    QueryBarStore.listen(this.onQueryBarStoreChanged.bind(this));
    this.lastExecutedQuery = QueryBarStore.state.lastExecutedQuery;
    this.namespace = QueryBarStore.state.ns;
  },

  onActivated(appRegistry) {
    this.loadIndexes = appRegistry.getAction('Indexes.LoadIndexes');
  },

  /**
   * Initialize the store state.
   *
   * @return {Object} the initial store state.
   */
  getInitialState() {
    return pick(QueryBarStore.getInitialState(), EXTENDED_QUERY_PROPERTIES);
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
      newState.maxTimeMS = state.maxTimeMS;
      newState.ns = state.ns;
      this.setState(newState);

      // reload indexes if this convenience store has changed
      this.loadIndexes();

      // Call onQueryChanged lifecycle method
      const registry = app.appRegistry;
      if (registry) {
        registry.callOnStores(function(store) {
          if (store.onQueryChanged) {
            store.onQueryChanged(newState);
          }
        });
      } else {
        debug('Error: AppRegistry not available for query-changed-store');
      }
    }
  }
});

export default QueryChangedStore;
export { QueryChangedStore };
