'use strict';
const AmpersandModel = require('ampersand-model');
const AmpersandCollection = require('ampersand-collection');
const toNs = require('mongodb-ns');
const { getProperties } = require('./collection-properties');

const NamespaceCache = new Map();

function getNamespaceInfo(ns) {
  if (!NamespaceCache.has(ns)) {
    NamespaceCache.set(ns, toNs(ns));
  }
  return NamespaceCache.get(ns);
}

function mergeInit(...init) {
  return {
    initialize(...args) {
      init.forEach(({ initialize }) => {
        initialize.call(this, ...args);
      });
    },
  };
}

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

function getParentByType(model, type) {
  const parent = getParent(model);
  return parent
    ? parent.modelType === type
      ? parent
      : getParentByType(parent, type)
    : null;
}

function pickCollectionInfo({
  type,
  readonly,
  view_on,
  collation,
  pipeline,
  validation,
  clustered,
  fle2,
  is_non_existent,
}) {
  return { type, readonly, view_on, collation, pipeline, validation, clustered, fle2, is_non_existent };
}

/**
 * Returns true if model is not ready (was fetched before and is not updating at
 * the moment) or force fetch is requested
 */
function shouldFetch(status, force) {
  return force || status !== 'ready';
}

const CollectionModel = AmpersandModel.extend(debounceActions(['fetch']), {
  modelType: 'Collection',
  idAttribute: '_id',
  props: {
    _id: { type: 'string', required: true },
    type: { type: 'string', default: 'collection' },
    status: { type: 'string', default: 'initial' },
    statusError: { type: 'string', default: null },

    // Normalized values from collectionInfo command
    is_non_existent: 'boolean',
    readonly: 'boolean',
    clustered: 'boolean',
    fle2: 'boolean',
    view_on: 'string',
    collation: 'object',
    pipeline: 'array',
    validation: 'object',

    // Normalized values from collStats command
    is_capped: 'boolean',
    document_count: 'number',
    document_size: 'number',
    avg_document_size: 'number',
    storage_size: 'number',
    free_storage_size: 'number',
    index_count: 'number',
    index_size: 'number',
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
    isTimeSeries: {
      deps: ['type'],
      fn() {
        return this.type === 'timeseries';
      },
    },
    isView: {
      deps: ['type'],
      fn() {
        return this.type === 'view';
      },
    },
    sourceName: {
      deps: ['view_on'],
      fn() {
        return this.view_on ? `${this.database}.${this.view_on}` : null;
      },
    },
    source: {
      deps: ['sourceName'],
      fn() {
        return this.collection.get(this.sourceName) ?? null;
      },
    },
    properties: {
      deps: ['collation', 'type', 'is_capped', 'clustered', 'readonly', 'fle2'],
      fn() {
        return getProperties(this);
      },
    },
  },

  /**
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   * @returns
   */
  async fetch({ dataService, fetchInfo = true, force = false }) {
    if (!shouldFetch(this.status, force)) {
      return;
    }
    try {
      const newStatus = this.status === 'initial' ? 'fetching' : 'refreshing';
      this.set({ status: newStatus });
      const [collStats, collectionInfo] = await Promise.all([
        dataService.collectionStats(this.database, this.name),
        fetchInfo ? dataService.collectionInfo(this.database, this.name) : null,
      ]);
      this.set({
        status: 'ready',
        statusError: null,
        ...collStats,
        ...(collectionInfo && pickCollectionInfo(collectionInfo)),
      });
      // If the collection is not unprovisioned `is_non_existent` anymore,
      // let's update the parent database model to reflect the change.
      // This happens when a user tries to insert first document into a
      // collection that doesn't exist yet or creates a new collection 
      // for an unprovisioned database.
      if (!this.is_non_existent) {
        getParentByType(this, 'Database').set({
          is_non_existent: false,
        });
      }
    } catch (err) {
      this.set({ status: 'error', statusError: err.message });
      throw err;
    }
  },

  /**
   * Fetches collection info and returns a special format of collection metadata
   * that events like open-in-new-tab, select-namespace, edit-view require
   * @param {{ dataService: import('mongodb-data-service').DataService }} dataService
   */
  async fetchMetadata({ dataService }) {
    try {
      await this.fetch({ dataService });
    } catch (e) {
      if (e.name !== 'MongoServerError') {
        throw e;
      }
      // We don't care if it fails to get stats from server for any reason
    }

    const instance = getParentByType(this, 'Instance');

    /**
     * The support for search indexes is a feature of a server not a collection.
     * As this check can only be performed currently by running $listSearchIndexes
     * aggregation stage against a collection, so we run it from the collection model.
     * With this setup, when a user opens the first collection, we set this property
     * on the instance model and then from there its value is read avoiding call to server.
     */
    const isSearchIndexesSupported =
      !this.isView &&
      (await instance.getIsSearchSupported({
        dataService,
        ns: this.ns,
      }));

    const collectionMetadata = {
      namespace: this.ns,
      isReadonly: this.readonly,
      isTimeSeries: this.isTimeSeries,
      isClustered: this.clustered,
      isFLE: this.fle2,
      isSearchIndexesSupported,
      isDataLake: instance.dataLake.isDataLake,
      isAtlas: instance.env === 'atlas',
      serverVersion: instance.build.version,
    };

    if (this.sourceName) {
      Object.assign(collectionMetadata, {
        sourceName: this.sourceName,
        sourcePipeline: this.pipeline,
      });
    }

    return collectionMetadata;
  },

  toJSON(opts = { derived: true }) {
    const serialized = this.serialize(opts);
    if (serialized.source) {
      serialized.source = serialized.source.toJSON();
    }
    return serialized;
  },
});

const CollectionCollection = AmpersandCollection.extend(
  mergeInit(
    debounceActions(['fetch']),
    propagateCollectionEvents('collections')
  ),
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
    async fetch({ dataService }) {
      const databaseName = getParentByType(this, 'Database')?.getId();

      if (!databaseName) {
        throw new Error(
          `Trying to fetch ${this.modelType} that doesn't have the Database parent model`
        );
      }

      const instanceModel = getParentByType(this, 'Instance');

      if (!instanceModel) {
        throw new Error(
          `Trying to fetch ${this.modelType} that doesn't have the Instance parent model`
        );
      }

      const collections = await dataService.listCollections(
        databaseName,
        {},
        {
          // Always fetch collections with info
          nameOnly: false,
          privileges: instanceModel.auth.privileges,
        }
      );

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
              ...pickCollectionInfo(rest),
            };
          })
      );
    },

    toJSON(opts = { derived: true }) {
      return this.map((item) => item.toJSON(opts));
    },
  }
);

CollectionCollection.prototype[Symbol.iterator] = function* () {
  for (let i = 0, len = this.length; i < len; i++) {
    yield this.at(i);
  }
};

module.exports = CollectionModel;
module.exports.Collection = CollectionCollection;
