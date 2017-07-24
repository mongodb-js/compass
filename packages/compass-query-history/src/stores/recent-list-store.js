const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const RecentQuery = require('../models/recent-query');
const RecentQueryCollection = require('../models/recent-query-collection');

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
    if (this.state.recents.length >= TOTAL_RECENTS) {
      this.state.recents.remove(this.state.recents.at(TOTAL_RECENTS - 1)._id);
    }

    const query = new RecentQuery(recent);
    this.state.recents.add(query);
    this.trigger(this.state);
  },

  deleteRecent(query) {
    this.state.recents.remove(query._id);
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
    const recents = new RecentQueryCollection();
    return {
      recents: recents
    };
  }
});

module.exports = RecentListStore;
