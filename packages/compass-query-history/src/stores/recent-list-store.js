const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const Query = require('../models/query');
const QueryCollection = require('../models/query-collection');
const FilteredCollection = require('ampersand-filtered-subcollection');

const electron = require('electron');
const remote = electron.remote;
const Clipboard = remote.clipboard;

const TOTAL_RECENTS = 30;
const ALLOWED = ['filter', 'project', 'sort', 'skip', 'limit'];

/**
 * Query History Recent List store.
 */
const RecentListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  addRecent(recent) {
    // TODO: Integrate with Compass: determine the format that queries will come in
    if (this.state.recents.length >= TOTAL_RECENTS) {
      QueryCollection.remove(this.state.recents.at(TOTAL_RECENTS - 1)._id);
    }

    const query = new Query(recent);
    QueryCollection.add(query);
    this.trigger(this.state);
  },

  deleteRecent(query) {
    QueryCollection.remove(query._id);
    this.trigger(this.state);
  },

  copyQuery(query) {
    const attributes = query.serialize();


    Object.keys(attributes)
      .filter(key => !ALLOWED.includes(key))
      .forEach(key => delete attributes[key]);

    Clipboard.writeText(JSON.stringify(attributes, null, ' '));
  },

  getInitialState() {
    const recentQueries = new FilteredCollection(QueryCollection, {
      where: {
        isFavorite: false
      },
      comparator: (model) => {
        return -model.lastExecuted;
      }
    });
    return {
      recents: recentQueries
    };
  }
});

module.exports = RecentListStore;
