import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { remote } from 'electron';
import _ from 'lodash';

import { formatQuery } from 'utils';
import { RecentQuery, RecentQueryCollection } from 'models';
import Actions from 'actions';

const TOTAL_RECENTS = 30;
const ALLOWED = ['filter', 'project', 'sort', 'skip', 'limit', 'collation'];

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
   *
   * @param {AppRegistry} appRegistry - The app registry.
   */
  onActivated(appRegistry) {
    appRegistry.on('data-service-connected', this.onConnected.bind(this));
    appRegistry.on('query-applied', this.onQueryApplied.bind(this));
  },

  onConnected() {
    this.state.items.fetch({
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
      return;
    }

    const ns = recent.ns;

    /* Ignore empty or default queries */
    this._filterDefaults(recent);
    if (_.isEmpty(recent)) {
      return;
    }

    const filtered = this.state.items.filter((r) => {
      return r._ns === ns;
    });

    /* Keep length of each recent list to TOTAL_RECENTS */
    if (filtered.length >= TOTAL_RECENTS) {
      const lastRecent = filtered[TOTAL_RECENTS - 1];
      this.state.items.remove(lastRecent._id);
      lastRecent.destroy();
    }

    const query = new RecentQuery(recent);
    query._lastExecuted = Date.now();
    query._ns = ns;
    this.state.items.add(query);
    query.save();
    this.trigger(this.state);
  },

  deleteRecent(query) {
    query.destroy({
      success: () => {
        this.state.items.remove(query._id);
        this.trigger(this.state);
      }
    });
  },

  copyQuery(query) {
    const attributes = query.getAttributes({ props: true });

    Object.keys(attributes)
      .filter(key => key.charAt(0) === '_')
      .forEach(key => delete attributes[key]);

    remote.clipboard.writeText(formatQuery(attributes));
  },

  getInitialState() {
    return {
      items: new RecentQueryCollection()
    };
  }
});

export default RecentListStore;
export { RecentListStore };
