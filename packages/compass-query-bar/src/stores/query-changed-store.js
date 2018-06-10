import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { pick, isEqual, cloneDeep } from 'lodash';

import QUERY_PROPERTIES from 'constants/query-properties';
import QueryBarStore from './query-bar-store';

const debug = require('debug')('mongodb-compass:stores:query-changed-store');

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

      // Call onQueryChanged lifecycle method
      const registry = global.hadronApp.appRegistry;
      if (registry) {
        registry.emit('query-changed', newState);
      } else {
        debug('Error: AppRegistry not available for query-changed-store');
      }
      this.setState(newState);
    }
  }
});

export default QueryChangedStore;
export { QueryChangedStore };
