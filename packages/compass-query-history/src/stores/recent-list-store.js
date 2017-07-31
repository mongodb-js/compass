const Reflux = require('reflux');
const Actions = require('../actions');
const _ = require('lodash');

const StateMixin = require('reflux-state-mixin');
const electron = require('electron');
const remote = electron.remote;
const clipboard = remote.clipboard;

const RecentQuery = require('../models/recent-query');
const RecentQueryCollection = require('../models/recent-query-collection');


const TOTAL_RECENTS = 30;
const ALLOWED = ['filter', 'project', 'sort', 'skip', 'limit'];

/**
 * Query History Recent List store.
 */
const RecentListStore = Reflux.createStore({
  mixins: [StateMixin.store],

  listenables: Actions,

  /**
   * Filter attributes that aren't query fields or have default/empty values.
   * @param {object} attributes
   */
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

  /**
   * Plugin lifecycle method that is called when Compass is connected.
   * Fetches the saved recent queries from disk.
   */
  onConnected() {
    this.state.recents.fetch({
      success: () => {
        this.trigger(this.state);
      }
    });
  },

  onQueryApplied(query) {
    this.addRecent(query);
  },

  addRecent(recent) {
    /* Ignore queries that don't have a namespace. */
    if (!('ns' in recent)) {
      console.log(
        'Warning: query added without namespace: ' + JSON.stringify(recent, null, ' '));
      return;
    }
    const ns = recent.ns;

    /* Ignore empty or default queries */
    this._filterDefaults(recent);
    if (_.isEmpty(recent)) {
      return;
    }

    const filtered = this.state.recents.filter((r) => {
      return r._ns === ns;
    });

    /* Keep length of each recent list to TOTAL_RECENTS */
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

    clipboard.writeText(JSON.stringify(attributes, null, ' '));
  },

  getInitialState() {
    return {
      recents: new RecentQueryCollection()
    };
  }
});

module.exports = RecentListStore;
