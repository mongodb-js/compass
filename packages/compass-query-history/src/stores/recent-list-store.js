import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import { remote } from 'electron';
import _ from 'lodash';
import { isDeepStrictEqual } from 'util';

import { formatQuery } from '../utils';
import { RecentQuery, RecentQueryCollection } from '../models';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

const TOTAL_RECENTS = 30;
const ALLOWED = ['filter', 'project', 'sort', 'skip', 'limit', 'collation'];

function comparableQuery(item) {
  const query = {};
  for (const [k, v] of Object.entries(item.serialize())) {
    if (k.startsWith('_')) {
      continue;
    }
    query[k] = v;
  }
  return query;
}

/**
 * Query History Recent List store.
 */
const configureStore = (options = {}) => {
  const store = Reflux.createStore({
    mixins: [StateMixin.store],

    listenables: options.actions,

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

      /* Ignore duplicate queries */
      const existingQuery = this.state.items.find((item) => _.isEqual(comparableQuery(item), recent));
      if (existingQuery) {
        return;
      }

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

    runQuery(query) {
      // Loosely match queries against known history entries, because
      // currently we do not distinguish between favorites and recents
      // when running queries. This way, we do track some queries twice
      // (because there are more options than just .filter), but that
      // is probably fine as a temporary measure.
      // https://jira.mongodb.org/browse/COMPASS-5243
      if (this.state.items.map(item => item.serialize()).some(item => {
        return isDeepStrictEqual(item.filter, query.filter);
      })) {
        track('Query History Recent Used');
      }
      this.localAppRegistry.emit('compass:query-history:run-query', query);
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

  store.onConnected();

  if (options.localAppRegistry) {
    store.localAppRegistry = options.localAppRegistry;
    options.localAppRegistry.on('query-applied', (query) => {
      store.onQueryApplied(query);
    });
  }

  return store;
};

export default configureStore;
