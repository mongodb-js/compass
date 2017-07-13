const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');

const debug = require('debug')('mongodb-compass:query-history:recent-store');

/**
 * Query History Recent List store.
 */
const RecentListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

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
    debug('RecentListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = RecentListStore;
