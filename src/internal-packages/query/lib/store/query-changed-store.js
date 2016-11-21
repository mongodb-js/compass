const Reflux = require('reflux');
const QueryStore = require('./query-store');
const StateMixin = require('reflux-state-mixin');

const _ = require('lodash');

const debug = require('debug')('mongodb-compass:stores:query-changed');

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
  },

  /**
   * Initialize the store state.
   *
   * @return {Object} the initial store state.
   */
  getInitialState() {
    return {
      query: null,
      sort: {},
      limit: 0,
      skip: 0,
      project: {},
      maxTimeMS: 0
    };
  },

  /**
   * only trigger if lastExecutedQuery has changed
   *
   * @param {Object} state    the new state of QueryStore
   */
  onQueryStoreChanged(state) {
    if (!_.isEqual(this.state.query, state.lastExecutedQuery)) {
      this.setState({
        query: state.lastExecutedQuery,
        sort: state.sort,
        limit: state.limit,
        skip: state.skip,
        project: state.project,
        maxTimeMS: state.maxTimeMS
      });
    }
  },

  storeDidUpdate(prevState) {
    debug('query store changed from', prevState, 'to', this.state);
  }

});

module.exports = QueryChangedStore;
