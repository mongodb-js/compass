const AmpersandModel = require('ampersand-model');
const {
  Collection: MongoDbDatabaseCollection,
} = require('mongodb-database-model');
const TopologyType = require('./topology-type');
const ServerType = require('./server-type');
const Environment = require('./environment');

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

const AuthInfo = AmpersandModel.extend({
  props: {
    user: { type: 'object', default: null },
    roles: { type: 'array', default: null },
    privileges: { type: 'array', default: null },
  },
});

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

const TopologyDescription = AmpersandModel.extend({
  props: {
    type: 'string',
    servers: 'array',
    setName: 'string'
  }
});

/**
 * Returns true if model was fetched before (or is currently being fetched) or
 * force fetch is requested
 */
function shouldRefresh(status, force) {
  return force || status !== 'initial';
}

/**
 * Returns true if model is not ready (was fetched before and is not updating at
 * the moment) or force fetch is requested
 */
function shouldFetch(status, force) {
  return force || status !== 'ready';
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
      isAtlas: { type: 'boolean', default: false },
      csfleMode: { type: 'string', default: 'unavailable' }
    },
    derived: {
      isRefreshing: {
        deps: ['refreshingStatus'],
        fn() {
          return ['fetching', 'refreshing'].includes(this.refreshingStatus);
        },
      },
      isTopologyWritable: {
        deps: ['topologyDescription'],
        fn() {
          return TopologyType.isWritable(this.topologyDescription.type)
        }
      },
      singleServerType: {
        deps: ['topologyDescription'],
        fn() {
          if (this.topologyDescription.type === TopologyType.SINGLE) {
            return this.topologyDescription.servers[0].type;
          }
          return null;
        }
      },
      isServerWritable: {
        deps: ['topologyDescription'],
        fn() {
          return this.singleServerType !== null && ServerType.isWritable(this.singleServerType);
        }
      },
      isWritable: {
        deps: ['topologyDescription'],
        fn() {
          if (this.isTopologyWritable) {
            if (this.topologyDescription.type === TopologyType.SINGLE) {
              return this.isServerWritable;
            } else {
              return true;
            }
          } else {
            return false;
          }
        }
      },
      description: {
        deps: ['topologyDescription'],
        fn() {
          const topologyType = this.topologyDescription.type;

          if (this.isTopologyWritable) {
            if (topologyType === TopologyType.SINGLE) {
              const message = this.isServerWritable ? 'is writable' : 'is not writable';
              return `Single connection to server type: ${ServerType.humanize(this.singleServerType)} ${message}`;
            }
            return `Topology type: ${TopologyType.humanize(topologyType)} is writable`;
          }
          return `Topology type: ${TopologyType.humanize(topologyType)} is not writable`;
        }
      },
      env: {
        deps: ['isAtlas', 'dataLake'],
        fn() {
          if (this.isAtlas) {
            if (this.dataLake.isDataLake) {
              return Environment.ADL;
            }
            return Environment.ATLAS;
          }
          return Environment.ON_PREM;
        }
      }
    },
    children: {
      host: HostInfo,
      build: BuildInfo,
      genuineMongoDB: GenuineMongoDB,
      dataLake: DataLake,
      auth: AuthInfo,
      topologyDescription: TopologyDescription
    },
    collections: {
      databases: MongoDbDatabaseCollection,
    },

    /**
     * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
     * @returns {Promise<void>}
     */
    async fetch({ dataService, force = false }) {
      if (!shouldFetch(this.status, force)) {
        return;
      }
      try {
        const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
        this.set({ status: newStatus });
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
    async fetchDatabases({ dataService, force = false }) {
      if (!shouldFetch(this.databasesStatus, force)) {
        return;
      }
      try {
        const newStatus =
          this.databasesStatus === 'initial' ? 'fetching' : 'refreshing';
        this.set({ databasesStatus: newStatus });
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

      try {
        // First fetch instance info ...
        await this.fetch({ dataService, force: true });

        // ... and databases list. These are the essentials that we need to make
        // Compass somewhat usable
        if (shouldRefresh(this.databasesStatus, fetchDatabases)) {
          await this.fetchDatabases({ dataService, force: true });
        }

        // Then collection list for every database, namespace is the main thing
        // needed to be able to interact with any collection related tab
        await Promise.all(
          this.databases.map((db) => {
            if (shouldRefresh(db.collectionsStatus, fetchCollections)) {
              return db.fetchCollections({
                dataService,
                fetchInfo: fetchCollInfo,
                force: true,
              });
            }
          })
        );

        // Then all the stats. They are super low prio and we generally don't
        // really care if any of those requests failed. We don't care if this
        // fails, it just means less stats in the UI
        await Promise.allSettled(
          this.databases
            .map((db) => {
              return [
                shouldRefresh(db.status, fetchDbStats) &&
                  db.fetch({ dataService, force: true }),
                ...db.collections.map((coll) => {
                  if (shouldRefresh(coll.status, fetchCollStats)) {
                    return coll.fetch({
                      dataService,
                      // When fetchCollInfo is true, we skip fetching collection
                      // info returned by listCollections command as we already
                      // did that in the previous step
                      fetchInfo: !fetchCollInfo,
                      force: true,
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

    async getNamespace({ dataService, database, collection }) {
      await this.fetchDatabases({ dataService });
      const db = this.databases.get(database);
      if (!db) {
        return null;
      }
      await db.fetchCollections({ dataService });
      const coll = db.collections.get(collection, 'name');
      if (!coll) {
        return null;
      }
      return coll;
    },

    removeAllListeners() {
      removeListenersRec(this);
      VisitedModels.deleteAll();
    },

    toJSON(opts = { derived: true }) {
      return this.serialize(opts);
    },
  }
);

module.exports = InstanceModel;
