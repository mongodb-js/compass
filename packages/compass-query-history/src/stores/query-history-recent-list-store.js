const Reflux = require('reflux');
const QueryHistoryActions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:stores:query-history-recent--store');

/**
 * Query History Recent List store.
 */
const QueryHistoryRecentListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: QueryHistoryActions,

  init() {
  },

  addRecent(recent) {
    this.setState({
      recents: this.state.recents.push(recent)
    });
  },

  getInitialState() {
    return {
      recents: []
    };
  },

  storeDidUpdate(prevState) {
    debug('QueryHistoryRecentListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = QueryHistoryRecentListStore;
