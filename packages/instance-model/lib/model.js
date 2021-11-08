const AmpersandModel = require('ampersand-model');
const {
  Collection: MongoDbDatabaseCollection,
} = require('mongodb-database-model');

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

function isLoading(status) {
  return ['fetching', 'refreshing'].includes(status);
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

const InstanceModel = AmpersandModel.extend({
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
    loadingModels: { type: 'array', default: () => [] },
    isRefreshing: { type: 'boolean', default: false },
  },
  derived: {
    isAtlas: {
      deps: ['hostname'],
      fn() {
        return /mongodb.net$/i.test(this.hostname);
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

  initialize() {
    const toggle = (id, status) => {
      if (isLoading(status)) {
        this.set({ loadingModels: this.loadingModels.concat(id) });
      } else {
        this.set({
          loadingModels: this.loadingModels.filter((modelId) => modelId !== id),
        });
      }
    };

    this.on('change:databases.collectionsStatus', (model, status) => {
      // Collections don't have their own cid
      toggle(`${model.cid}$$coll`, status);
    });

    this.on('change:databases.status', (model, status) => {
      toggle(model.cid, status);
    });

    this.on('change:collections.status', (model, status) => {
      toggle(model.cid, status);
    });
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
      this.set({ databasesStatus: 'error', databasesStatusError: err.message });
      throw err;
    }
  },

  async refresh({
    dataService,
    fetchDatabases = true,
    fetchDbStats = true,
    fetchCollections = false,
    fetchCollInfo = false,
    fetchCollStats = false,
  }) {
    this.set({ isRefreshing: true });

    try {
      // First fetch instance info and databases list, these are the essentials
      // that we need to make Compass somewhat usable
      await Promise.all([
        this.fetch({ dataService }),
        fetchDatabases && this.fetchDatabases({ dataService }),
      ]);

      // Then collection list for every database, namespace is the main thing
      // needed to be able to interact with any collection related tab
      await Promise.all(
        this.databases.map((db) => {
          // We only refresh collections if fetchAll is true or we fetched them
          // before (this is an actual refresh)
          if (fetchCollections || db.collectionsStatus !== 'initial') {
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
              fetchDbStats &&
                db.fetch({ dataService }).catch(() => {
                  /* we don't care if this fails, it just means less stats in the UI */
                }),
              ...db.collections.map((coll) => {
                // We only refresh collections if they were fetched before
                // (based on status) or fetchCollStats is true
                if (fetchCollStats || coll.status !== 'initial') {
                  return coll
                    .fetch({
                      dataService,
                      // When fetchAll is true, we skip collection info returned
                      // by listCollections command as we already did that in
                      // the previous step
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
    } finally {
      this.set({ isRefreshing: false });
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
});

module.exports = InstanceModel;
