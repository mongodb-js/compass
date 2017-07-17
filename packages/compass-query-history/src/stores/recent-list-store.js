const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
// const { Query, QueryCollection } = require('../../');
// const FilteredCollection = require('ampersand-filtered-subcollection');

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
    // @note: Durran: To save the recent query:
    //   const query = new Query({ filter: '', projection: '', sort: '', skip: 0, limit: 0, lastExecuted: new Date() });
    //   query.save();
    this.setState({
      recents: this.state.recents.push(recent)
    });
  },

  getInitialState() {
    // const queries = QueryCollection.fetch();
    // var recentQueries = new FilteredCollection(queries, {
      // where: {
        // isFavorite: false
      // },
      // comparator: (model) => {
        // return -model.lastExecuted;
      // }
    // });
    return {
      recents: []
    };
  },

  storeDidUpdate(prevState) {
    debug('RecentListStore changed from', prevState, 'to', this.state);
  }
});

module.exports = RecentListStore;
