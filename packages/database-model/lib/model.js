const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-collection');
const { promisify } = require('util');
const {
  Collection: MongoDbCollectionCollection,
} = require('mongodb-collection-model');

function getParent(model) {
  return model.parent ?? model.collection ?? null;
}

function propagate(evtName, ...args) {
  let parent = getParent(this);
  while (parent) {
    parent.emit(evtName, ...args);
    parent = getParent(parent);
  }
}

function propagateCollectionEvents(namespace) {
  return {
    initialize() {
      if (this.isCollection) {
        this.on('add', propagate.bind(this, `add:${namespace}`));
        this.on('remove', propagate.bind(this, `remove:${namespace}`));
        this.on('change', propagate.bind(this, `change:${namespace}`));
        for (const key of Object.keys(this.model.prototype._definition)) {
          this.on(
            `change:${key}`,
            propagate.bind(this, `change:${namespace}.${key}`)
          );
        }
      }
    },
  };
}

const DatabaseModel = AmpersandModel.extend({
  modelType: 'Database',
  idAttribute: '_id',
  props: {
    _id: 'string',
    name: 'string',
    status: { type: 'string', default: 'initial' },
    statusError: { type: 'string', default: null },
    collectionsStatus: { type: 'string', default: 'initial' },
    collectionsStatusError: { type: 'string', default: null },

    collection_count: 'number',
    document_count: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
  },
  collections: {
    collections: MongoDbCollectionCollection,
  },
  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns {Promise<void>}
   */
  async fetch({ dataService }) {
    try {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ status: newStatus });
      const stats = await dataService.databaseStats(this.getId());
      this.set({ status: 'ready', statusError: null, ...stats });
    } catch (err) {
      this.set({ status: 'error', statusError: err.message });
      throw err;
    }
  },

  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns {Promise<void>}
   */
  async fetchCollections({ dataService, fetchInfo = false }) {
    try {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ collectionsStatus: newStatus });
      await this.collections.fetch({ dataService, fetchInfo });
      this.set({ collectionsStatus: 'ready', collectionsStatusError: null });
    } catch (err) {
      this.set({
        collectionsStatus: 'error',
        collectionsStatusError: err.message,
      });
      throw err;
    }
  },

  toJSON(opts = { derived: true }) {
    return {
      ...this.serialize(opts),
      collections: this.collections.map(coll => coll.toJSON(opts))
    };
  },
});

const DatabaseCollection = AmpersandCollection.extend(
  propagateCollectionEvents('databases'),
  {
    modelType: 'DatabaseCollection',
    mainIndex: '_id',
    indexes: ['name'],
    comparator: '_id',
    model: DatabaseModel,

    /**
     * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
     * @returns {Promise<void>}
     */
    async fetch({ dataService }) {
      const listDatabasesAsync = promisify(
        dataService.listDatabases.bind(dataService, { nameOnly: true })
      );
      const dbs = await listDatabasesAsync();
      this.set(dbs.map(({ _id, name }) => ({ _id, name })));
    },

    toJSON(opts = { derived: true }) {
      return this.map((item) => item.toJSON(opts));
    },
  }
);

module.exports = DatabaseModel;
module.exports.Collection = DatabaseCollection;
