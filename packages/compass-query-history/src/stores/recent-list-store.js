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

  onConnected() {
    this.state.recents.fetch({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  addRecent(recent) {
    /* Ignore queries not triggered with 'apply' */
    if ('queryState' in recent && recent.queryState !== 'apply') {
      return;
    }
    /* Ignore queries that don't have a namespace. TODO: error? warn? */
    if (!('ns' in recent)) {
      console.log(
        'Warning: query added without namespace: ' + JSON.stringify(recent, null, ' '));
      return;
    }
    const ns = recent.ns;

    this._filterDefaults(recent);
    /* Ignore empty or default queries */
    if (_.isEmpty(recent)) {
      return;
    }

    const filtered = this.state.recents.filter((r) => {
      return r._ns === ns;
    });

    if (filtered.length >= TOTAL_RECENTS) {
      const lastRecent = filtered[TOTAL_RECENTS - 1];
      this.state.recents.remove(lastRecent._id);
      lastRecent.destroy();
    }

    const query = new RecentQuery(recent);
    query._lastExecuted = Date.now();
    query._ns = ns;
    this.state.recents.add(query);
    query.save();
    this.trigger(this.state);
  },

  deleteRecent(query) {
    query.destroy({
      success: () => {
        this.state.recents.remove(query._id);
        this.trigger(this.state);
      }
    });
  },

  copyQuery(query) {
    const attributes = query.serialize();

    Object.keys(attributes)
      .filter(key => key.charAt(0) === '_')
      .forEach(key => delete attributes[key]);

    Clipboard.writeText(JSON.stringify(attributes, null, ' '));
  },

  getInitialState() {
    return {
      recents: new RecentQueryCollection()
    };
  }
});

module.exports = RecentListStore;
