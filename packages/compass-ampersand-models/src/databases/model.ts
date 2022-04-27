import AmpersandModel from 'ampersand-model';
import AmpersandCollection from 'ampersand-collection';
import { CollectionCollection as MongoDbCollectionCollection } from '../collections/model';
import {
  debounceActions,
  mergeInit,
  propagateCollectionEvents,
  getParentByType,
} from '../util';

const DatabaseModel = AmpersandModel.extend(
  debounceActions(['fetch', 'fetchCollections']),
  {
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
      data_size: 'number',
      index_count: 'number',
      index_size: 'number',
    },
    derived: {
      // Either returns a collection count from database stats or from real
      // collections length. We want to fallback to collection_count from stats
      // if possible if we haven't fetched collections yet, but use the real
      // number if real collections info is available
      collectionsLength: {
        deps: ['collection_count', 'collectionsStatus'],
        fn() {
          return ['ready', 'refreshing'].includes(this.collectionsStatus)
            ? this.collections.length
            : this.collection_count ?? 0;
        },
      },
    },
    collections: {
      collections: MongoDbCollectionCollection,
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
    async fetchCollections({ dataService, fetchInfo = false, force = false }) {
      if (!shouldFetch(this.collectionsStatus, force)) {
        return;
      }

      try {
        const newStatus =
          this.collectionsStatus === 'initial' ? 'fetching' : 'refreshing';
        this.set({ collectionsStatus: newStatus });
        await this.collections.fetch({ dataService, fetchInfo, force });
        this.set({ collectionsStatus: 'ready', collectionsStatusError: null });
      } catch (err) {
        this.set({
          collectionsStatus: 'error',
          collectionsStatusError: err.message,
        });
        throw err;
      }
    },

    async fetchCollectionsDetails({
      dataService,
      nameOnly = false,
      force = false,
    }) {
      await this.fetchCollections({
        dataService,
        fetchInfo: !nameOnly,
        force,
      });

      if (nameOnly) {
        return;
      }

      // We don't care if this fails, it just means less stats in the UI, hence
      // the allSettled call here
      await Promise.allSettled(
        this.collections.map((coll) => {
          return coll.fetch({ dataService, fetchInfo: false, force });
        })
      );
    },

    toJSON(opts = { derived: true }) {
      return this.serialize(opts);
    },
  }
);

const DatabaseCollection = AmpersandCollection.extend(
  mergeInit(debounceActions(['fetch']), propagateCollectionEvents('databases')),
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
      const instanceModel = getParentByType(this, 'Instance');

      if (!instanceModel) {
        throw new Error(
          `Trying to fetch ${this.modelType} that doesn't have the Instance parent model`
        );
      }

      const dbs = await dataService.listDatabases({
        nameOnly: true,
        privileges: instanceModel.auth.privileges,
        roles: instanceModel.auth.roles,
      });

      this.set(dbs.map(({ _id, name }) => ({ _id, name })));
    },

    toJSON(opts = { derived: true }) {
      return this.map((item) => item.toJSON(opts));
    },
  }
);

DatabaseCollection.prototype[Symbol.iterator] = function* () {
  for (let i = 0, len = this.length; i < len; i++) {
    yield this.at(i);
  }
};

export { DatabaseModel, DatabaseCollection };
