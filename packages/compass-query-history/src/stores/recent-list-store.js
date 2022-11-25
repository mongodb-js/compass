import Reflux from 'reflux';
import StateMixin from 'reflux-state-mixin';
import _ from 'lodash';
import { formatQuery, comparableQuery } from '../utils';
import { RecentQuery, RecentQueryCollection } from '../models';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track } = createLoggerAndTelemetry('COMPASS-QUERY-HISTORY-UI');

const TOTAL_RECENTS = 30;
const ALLOWED = ['filter', 'project', 'sort', 'skip', 'limit', 'collation'];

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
    _filterDefaults(_attributes) {
      // don't mutate the passed in parameter
      const attributes = _.clone(_attributes);
      for (const key in attributes) {
        if (Object.prototype.hasOwnProperty.call(attributes, key)) {
          if (!attributes[key] || ALLOWED.indexOf(key) === -1) {
            delete attributes[key];
          } else if (
            _.isObject(attributes[key]) &&
            _.isEmpty(attributes[key])
          ) {
            delete attributes[key];
          }
        }
      }
      return attributes;
    },

    onConnected() {
      this.state.items.fetch({
        success: () => {
          this.trigger(this.state);
        },
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
      recent = this._filterDefaults(recent);
      if (_.isEmpty(recent)) {
        return;
      }

      const filtered = this.state.items.filter((r) => {
        return r._ns === ns;
      });

      /* Ignore duplicate queries */
      const existingQuery = filtered.find((item) =>
        _.isEqual(comparableQuery(item), recent)
      );
      if (existingQuery) {
        if (!existingQuery._host) {
          existingQuery._host = this.state.currentHost;
        }
        // update the existing query's lastExecuted to move it to the top
        existingQuery._lastExecuted = Date.now();
        existingQuery.save();
        return;
      }

      /* Keep length of each recent list to TOTAL_RECENTS */
      if (filtered.length >= TOTAL_RECENTS) {
        const lastRecent = filtered[TOTAL_RECENTS - 1];
        this.state.items.remove(lastRecent._id);
        lastRecent.destroy();
      }

      const query = new RecentQuery({
        ...recent,
        _lastExecuted: Date.now(),
        _ns: ns,
        _host: this.state.currentHost,
      });
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
        },
      });
    },

    runQuery(query) {
      if (
        this.state.items
          .map((item) => comparableQuery(item))
          .some((item) => {
            return _.isEqual(item, query);
          })
      ) {
        track('Query History Recent Used');
      }
      this.localAppRegistry.emit('compass:query-history:run-query', query);
    },

    copyQuery(query) {
      const attributes = query.getAttributes({ props: true });

      Object.keys(attributes)
        .filter((key) => key.charAt(0) === '_')
        .forEach((key) => delete attributes[key]);

      navigator.clipboard.writeText(formatQuery(attributes));
    },

    getInitialState() {
      return {
        items: new RecentQueryCollection(),
        currentHost:
          options.dataProvider?.dataProvider
            ?.getConnectionString?.()
            .hosts.join(',') ?? null,
      };
    },
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
