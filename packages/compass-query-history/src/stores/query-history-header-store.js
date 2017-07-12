const Reflux = require('reflux');
const QueryHistoryActions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:stores:query-history-header-store');

/**
 * Query History Header store.
 */
const QueryHistoryHeaderStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: QueryHistoryActions,

  init() {
  },

  showFavorites() {
    this.setState({
      showing: 'favorites'
    });
  },

  showRecent() {
    this.setState({
      showing: 'recent'
    });
  },

  getInitialState() {
    return {
      showing: 'recent'
    };
  },

  storeDidUpdate(prevState) {
    debug('QueryHistoryHeaderStore changed from', prevState, 'to', this.state);
  }
});

module.exports = QueryHistoryHeaderStore;
