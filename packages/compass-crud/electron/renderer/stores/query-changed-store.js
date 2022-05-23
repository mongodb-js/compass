const Reflux = require('reflux');
const StateMixin = require('reflux-state-mixin');
const app = require('hadron-app');

const { pick, isEqual, cloneDeep } = require('lodash');
const debug = require('debug')('mongodb-compass:stores:query-changed');

const QUERY_PROPERTIES = ['filter', 'project', 'sort', 'skip', 'limit', 'sample', 'maxTimeMS'];
const EXTENDED_QUERY_PROPERTIES = QUERY_PROPERTIES.concat([
  'queryState',
  'ns'
]);

const DEFAULT_INITIAL_MAX_TIME_MS = 60000;

/**
 * This is a convenience store that only triggers when the actual query
 * object (stored as `QueryStore.lastExecutedQuery`) has changed, e.g.
 * the user hits apply / reset. The collection tabs can listen to this
 * store instead.
 */
const QueryChangedStore = Reflux.createStore({
  mixins: [StateMixin.store],

  /**
   * Initialize the store state.
   *
   * @return {Object} the initial store state.
   */
  getInitialState() {
    return pick(this.getInitialQueryStoreState(), EXTENDED_QUERY_PROPERTIES);
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
      newState.ns = state.ns;
      this.setState(newState);
      const registry = app.appRegistry;
      if (registry) {
        registry.emit('query-changed', newState);
      } else {
        debug('Error: AppRegistry not available for query-changed-store');
      }
    }
  },

  getInitialQueryStoreState() {
    return {
      // user-facing query properties
      filter: {},
      project: null,
      sort: null,
      skip: 0,
      limit: 0,
      sample: false,

      // internal query properties
      maxTimeMS: DEFAULT_INITIAL_MAX_TIME_MS,

      // string values for the query bar input fields
      filterString: '',
      projectString: '',
      sortString: '',
      skipString: '',
      limitString: '',
      maxTimeMSString: '',

      // whether Apply or Reset was clicked last
      queryState: 'reset', // either apply or reset

      // validation flags
      valid: true,
      filterValid: true,
      projectValid: true,
      sortValid: true,
      skipValid: true,
      limitValid: true,
      sampleValid: true,
      maxTimeMSValid: true,

      // last full query (contains user-facing and internal variables above)
      lastExecutedQuery: null,

      // is the user currently typing (debounced by USER_TYPING_DEBOUNCE_MS)
      userTyping: false,

      // if the value was populated from a click in the schema view or
      // query history view.
      autoPopulated: false,

      // is the query bar component expanded or collapsed?
      expanded: false,

      // set the namespace
      ns: '',

      // Schema fields to use for filter autocompletion
      schemaFields: null
    };
  }
});

module.exports = QueryChangedStore;
