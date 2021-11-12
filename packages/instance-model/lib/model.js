const AmpersandModel = require('ampersand-model');
const {
  Collection: MongoDbDatabaseCollection,
} = require('mongodb-database-model');

const Inflight = new Map();

function debounceInflight(fn) {
  return function (...args) {
    const callId = this.isCollection
      ? `${this.parent.cid}$$coll$$${fn.name}`
      : `${this.cid}$$${fn.name}`;
    if (Inflight.has(callId)) {
      return Inflight.get(callId);
    }
    const promise = fn.call(this, ...args).finally(() => {
      Inflight.delete(callId);
    });
    Inflight.set(callId, promise);
    return promise;
  };
}

function debounceActions(actions) {
  return {
    initialize() {
      actions.forEach((key) => {
        if (key in this && typeof this[key] === 'function') {
          const origFn = this[key];
          this[key] = debounceInflight(origFn);
        }
      });
    },
  };
}

const VisitedModels = new WeakSet();

function removeListenersRec(model) {
  if (!model || !model.off || VisitedModels.has(model)) {
    return;
  }
  VisitedModels.add(model);
  model.off();
  if (model.isCollection) {
    model.forEach((item) => {
      removeListenersRec(item);
    });
  }
  for (const prop of Object.values(model)) {
    removeListenersRec(prop);
  }
}

const HostInfo = AmpersandModel.extend({
  props: {
    arch: 'string',
    cpu_cores: 'number',
    cpu_frequency: 'number',
    memory_bits: 'number',
    os: 'string',
    os_family: 'string',
    kernel_version: 'string',
    kernel_version_string: 'string',
  },
});

const BuildInfo = AmpersandModel.extend({
  props: {
    isEnterprise: 'boolean',
    version: 'string',
  },
});

const GenuineMongoDB = AmpersandModel.extend({
  props: {
    isGenuine: { type: 'boolean', default: true },
    dbType: 'string',
  },
});

const DataLake = AmpersandModel.extend({
  props: {
    isDataLake: { type: 'boolean', default: false },
    version: 'string',
  },
});

function shouldRefresh(status, force) {
  return force || status !== 'initial';
}

const InstanceModel = AmpersandModel.extend(
  debounceActions(['fetch', 'fetchDatabases', 'refresh']),
  {
    modelType: 'Instance',
    idAttribute: '_id',
    props: {
      _id: { type: 'string', required: true },
      hostname: { type: 'string', required: true },
      port: 'number',
      status: { type: 'string', default: 'initial' },
      statusError: { type: 'string', default: null },
      databasesStatus: { type: 'string', default: 'initial' },
      databasesStatusError: { type: 'string', default: null },
      refreshingStatus: { type: 'string', default: 'initial' },
      refreshingStatusError: { type: 'string', default: null },
    },
    derived: {
      isAtlas: {
        deps: ['hostname'],
        fn() {
          return /mongodb.net$/i.test(this.hostname);
        },
      },
      isRefreshing: {
        deps: ['refreshingStatus'],
        fn() {
          return ['fetching', 'refreshing'].includes(this.refreshingStatus);
        },
      },
    },
    children: {
      host: HostInfo,
      build: BuildInfo,
      genuineMongoDB: GenuineMongoDB,
      dataLake: DataLake,
    },
    collections: {
      databases: MongoDbDatabaseCollection,
    },

    /**
     * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
     * @returns {Promise<void>}
     */
    async fetch({ dataService }) {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ status: newStatus });
      try {
        const instanceInfo = await dataService.instance();
        this.set({ status: 'ready', statusError: null, ...instanceInfo });
      } catch (err) {
        this.set({ status: 'error', statusError: err.message });
        throw err;
      }
    },

    /**
     * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
     * @returns {Promise<void>}
     */
    async fetchDatabases({ dataService }) {
      const newStatus =
        this.databasesStatus === 'initial' ? 'fetching' : 'refreshing';
      this.set({ databasesStatus: newStatus });
      try {
        await this.databases.fetch({ dataService });
        this.set({ databasesStatus: 'ready', databasesStatusError: null });
      } catch (err) {
        this.set({
          databasesStatus: 'error',
          databasesStatusError: err.message,
        });
        throw err;
      }
    },

    async refresh({
      dataService,
      fetchDatabases = false,
      fetchDbStats = false,
      fetchCollections = false,
      fetchCollInfo = false,
      fetchCollStats = false,
    }) {
      this.set({
        refreshingStatus:
          this.refreshingStatus === 'initial' ? 'fetching' : 'refreshing',
      });

      console.log({
        refreshingStatus: this.refreshingStatus,
        fetchDatabases,
        fetchDbStats,
        fetchCollections,
        fetchCollInfo,
        fetchCollStats,
      });

      try {
        // First fetch instance info and databases list, these are the essentials
        // that we need to make Compass somewhat usable
        await Promise.all([
          this.fetch({ dataService }),
          shouldRefresh(this.databasesStatus, fetchDatabases) &&
            this.fetchDatabases({ dataService }),
        ]);

        // Then collection list for every database, namespace is the main thing
        // needed to be able to interact with any collection related tab
        await Promise.all(
          this.databases.map((db) => {
            if (shouldRefresh(db.collectionsStatus, fetchCollections)) {
              return db.fetchCollections({
                dataService,
                fetchInfo: fetchCollInfo,
              });
            }
          })
        );

        // Then all the stats. They are super low prio and we generally don't
        // really care if any of those requests failed
        await Promise.all(
          this.databases
            .map((db) => {
              return [
                shouldRefresh(db.status, fetchDbStats) &&
                  db.fetch({ dataService }).catch(() => {
                    /* we don't care if this fails, it just means less stats in the UI */
                  }),
                ...db.collections.map((coll) => {
                  if (shouldRefresh(coll.status, fetchCollStats)) {
                    return coll
                      .fetch({
                        dataService,
                        // When fetchCollInfo is true, we skip fetching collection
                        // info returned by listCollections command as we already
                        // did that in the previous step
                        fetchInfo: !fetchCollInfo,
                      })
                      .catch(() => {
                        /* we don't care if this fails, it just means less stats in the UI */
                      });
                  }
                }),
              ];
            })
            .flat()
        );

        this.set({ refreshingStatus: 'ready', refreshingStatusError: null });
      } catch (err) {
        this.set({
          refreshingStatus: 'error',
          refreshingStatusError: err.message,
        });
        throw err;
      }
    },

    removeAllListeners() {
      removeListenersRec(this);
      VisitedModels.deleteAll();
    },

    toJSON(opts = { derived: true }) {
      return {
        ...this.serialize(opts),
        databases: this.databases.toJSON(opts),
      };
    },
  }
);

module.exports = InstanceModel;
