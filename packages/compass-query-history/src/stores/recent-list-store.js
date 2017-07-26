const Reflux = require('reflux');
const Actions = require('../actions');
const StateMixin = require('reflux-state-mixin');
const _ = require('lodash');
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

  _filterDefaults(attributes) {
    for (const key in attributes) {
      if (attributes.hasOwnProperty(key)) {
        if (!attributes[key] || ALLOWED.indexOf(key) === -1) {
          delete attributes[key];
        } else if (_.isObject(attributes[key]) && _.isEmpty(attributes[key])) {
          delete attributes[key];
        }
      }
    }
  },

  addRecent(recent) {
    this._filterDefaults(recent);
    if (_.isEmpty(recent) || ('queryState' in recent && recent.queryState === 'reset')) {
      return;
    }

    if (this.state.recents.length >= TOTAL_RECENTS) {
      this.state.recents.remove(this.state.recents.at(TOTAL_RECENTS - 1)._id);
    }

    const query = new RecentQuery(recent);
    query._lastExecuted = Date.now();
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
      .filter(key => key.charAt(0) === '_')
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
