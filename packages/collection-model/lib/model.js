const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-collection');
const { promisify } = require('util');
const toNs = require('mongodb-ns');

const NamespaceCache = new Map();

function getNamespaceInfo(ns) {
  if (!NamespaceCache.has(ns)) {
    NamespaceCache.set(ns, toNs(ns));
  }
  return NamespaceCache.get(ns);
}

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

function pickCollectionInfo({ readonly, collation, pipeline, validation }) {
  return { readonly, collation, pipeline, validation };
}

const CollectionModel = AmpersandModel.extend({
  modelType: 'Collection',
  idAttribute: '_id',
  props: {
    _id: 'string',
    status: { type: 'string', default: 'initial' },
    statusError: { type: 'string', default: null },

    // Normalized values from collectionInfo command
    readonly: 'boolean',
    collation: 'object',
    pipeline: 'array',
    validation: 'object',

    // Normalized values from collStats command
    is_capped: 'boolean',
    max: 'number',
    is_power_of_two: 'boolean',
    index_sizes: 'object',
    document_count: 'number',
    document_size: 'number',
    storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
    padding_factor: 'number',
    extent_count: 'number',
    extent_last_size: 'number',
    flags_user: 'number',
    max_document_size: 'number',
    size: 'number',
    index_details: 'object',
    wired_tiger: 'object',
  },
  derived: {
    ns: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).ns;
      },
    },
    name: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).collection;
      },
    },
    database: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).database;
      },
    },
    type: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).type;
      },
    },
    system: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).system;
      },
    },
    oplog: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).oplog;
      },
    },
    command: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).command;
      },
    },
    special: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).special;
      },
    },
    specialish: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).specialish;
      },
    },
    normal: {
      deps: ['_id'],
      fn() {
        return getNamespaceInfo(this._id).normal;
      },
    },
  },

  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  async fetch({ dataService, fetchInfo = true }) {
    const collectionStatsAsync = promisify(
      dataService.collectionStats.bind(dataService)
    );
    try {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ status: newStatus });
      const [collStats, collectionInfo] = await Promise.all([
        collectionStatsAsync(this.database, this.name),
        fetchInfo ? dataService.collectionInfo(this.database, this.name) : {},
      ]);
      this.set({
        status: 'ready',
        statusError: null,
        ...collStats,
        ...pickCollectionInfo(collectionInfo),
      });
    } catch (err) {
      this.set({ status: 'error', statusError: err.message });
      throw err;
    }
  },

  toJSON(opts = { derived: true }) {
    return this.serialize(opts);
  },
});

const CollectionCollection = AmpersandCollection.extend(
  propagateCollectionEvents('collections'),
  {
    modelType: 'CollectionCollection',
    mainIndex: '_id',
    indexes: ['name'],
    comparator: '_id',
    model: CollectionModel,

    /**
     * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
     * @returns {Promise<void>}
     */
    async fetch({ dataService, fetchInfo = false }) {
      const listCollectionsAsync = promisify(
        dataService.listCollections.bind(dataService)
      );
      const listCollectionsNameOnlyAsync = promisify(
        dataService.listCollectionsNamesOnly.bind(dataService)
      );

      const databaseName = this.parent && this.parent.getId();

      if (!databaseName) {
        throw new Error(
          "Trying to fetch MongoDBCollectionCollection that doesn't have the parent model"
        );
      }

      let collections = [];

      // When trying to fetch additional information about collections during
      // collection list fetch we want to fallback to the nameOnly method that
      // requires less privileges in case user is missing some required ones
      if (fetchInfo) {
        try {
          collections = await listCollectionsAsync(databaseName, {});
        } catch (e) {
          collections = await listCollectionsNameOnlyAsync(databaseName);
        }
      } else {
        collections = await listCollectionsNameOnlyAsync(databaseName);
      }

      this.set(
        collections
          .filter((coll) => {
            // TODO: This is not the best place to do this kind of
            // filtering, but for now this preserves the current behavior
            // and changing it right away will expand the scope of the
            // refactor significantly. We can address this in COMPASS-5211
            return getNamespaceInfo(coll._id).system === false;
          })
          .map(({ _id, ...rest }) => {
            return {
              _id,
              ...(fetchInfo && pickCollectionInfo(rest)),
            };
          })
      );
    },

    toJSON(opts = { derived: true }) {
      return this.map((item) => item.toJSON(opts));
    },
  }
);

module.exports = CollectionModel;
module.exports.Collection = CollectionCollection;
