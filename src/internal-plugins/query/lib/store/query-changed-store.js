const Reflux = require('reflux');
const QueryStore = require('./query-store');
const StateMixin = require('reflux-state-mixin');
const app = require('hadron-app');

const _ = require('lodash');
const debug = require('debug')('mongodb-compass:stores:query-changed');

const QUERY_PROPERTIES = QueryStore.QUERY_PROPERTIES;
const EXTENDED_QUERY_PROPERTIES = QUERY_PROPERTIES.concat([
  'maxTimeMS',
  'queryState',
  'ns'
]);
/**
 * This is a convenience store that only triggers when the actual query
 * object (stored as `QueryStore.lastExecutedQuery`) has changed, e.g.
 * the user hits apply / reset. The collection tabs can listen to this
 * store instead.
 */
const QueryChangedStore = Reflux.createStore({
  mixins: [StateMixin.store],

  /**
   * listen to QueryStore for any changes.
   */
  init: function() {
    QueryStore.listen(this.onQueryStoreChanged.bind(this));
    this.lastExecutedQuery = QueryStore.state.lastExecutedQuery;
    this.namespace = QueryStore.state.ns;
  },

  /**
   * Initialize the store state.
   *
   * @return {Object} the initial store state.
   */
  getInitialState() {
    return _.pick(QueryStore.getInitialState(), EXTENDED_QUERY_PROPERTIES);
  },

  _detectChange(state) {
    const hasChanged =
      !_.isEqual(this.lastExecutedQuery, state.lastExecutedQuery) ||
      !_.isEqual(this.namespace, state.ns);
    if (hasChanged) {
      this.lastExecutedQuery = _.cloneDeep(state.lastExecutedQuery);
      this.namespace = state.ns;
    }
    return hasChanged;
  },

  /**
   * only trigger if lastExecutedQuery has changed
   *
   * @param {Object} state    the new state of QueryStore
   */
  onQueryStoreChanged(state) {
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

      // Call onQueryChanged lifecycle method
      const registry = app.appRegistry;
      if (registry) {
        registry.emit('query-changed', newState);
      } else {
        debug('Error: AppRegistry not available for query-changed-store');
      }
    }
  }
});

module.exports = QueryChangedStore;
