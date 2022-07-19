import type { Instance } from 'mobx-state-tree';
import { getParentOfType, getRoot } from 'mobx-state-tree';
import { cast } from 'mobx-state-tree';
import { flow, toGenerator } from 'mobx-state-tree';
import { types } from 'mobx-state-tree';
import { useEffect } from 'react';
import {
  LoadableModel,
  shouldFetch,
  getServices,
  debounceInflight,
  toNS,
} from '../util';
import type { MongoDBInstanceInfo } from './instance-info';
import { useRootStoreContext } from './root-store-context';
import type { Document as BSONDocument } from 'bson';
import { DatabaseModel, useDatabases } from './databases';
import { DataService } from '../services/data-service-manager';

export const CollectionStatsModel = types
  .compose(
    'CollectionStats',
    LoadableModel,
    types.model({
      data: types.frozen({
        capped: false,
        documentCount: 0,
        documentSize: 0,
        avgDocumentSize: 0,
        indexCount: 0,
        indexSize: 0,
        size: 0,
        storageSize: 0,
        freeStorageSize: 0,
      }),
    })
  )
  .actions((self) => {
    const fetch = debounceInflight(
      flow(function* () {
        if (!shouldFetch(self.status)) {
          return;
        }
        self.status = self.status === 'Initial' ? 'Fetching' : 'Refreshing';
        try {
          const { dataServiceManager } = getServices(self);
          const ds = yield* toGenerator(
            dataServiceManager.getCurrentConnection()
          );
          const { name } = getParentOfType(self, CollectionModel) as {
            name: string;
          };
          const { database, collection } = toNS(name);
          const stats = yield* toGenerator(
            ds.collectionStatsAsync(database, collection)
          );
          self.data = {
            capped: !!stats.is_capped,
            documentCount: stats.document_count,
            documentSize: stats.document_size ?? 0,
            avgDocumentSize: stats.avg_document_size,
            indexCount: stats.index_count,
            indexSize: stats.index_size,
            size: stats.size ?? 0,
            storageSize: stats.storage_size ?? 0,
            freeStorageSize: stats.free_storage_size,
          };
          self.status = 'Ready';
        } catch (err) {
          self.status = 'Error';
          self.error = (err as Error).message;
          throw err;
        }
      })
    );

    return { fetch };
  });

export type CollectionStats = Instance<typeof CollectionStatsModel>;

type CollectionInfoData = {
  readOnly: boolean;
  viewOn: string | null;
  pipeline: BSONDocument[] | null;
  collation: BSONDocument | null;
  clustered: boolean;
  fle2: boolean;
  validation: {
    validator: BSONDocument;
    validationAction: string;
    validationLevel: string;
  } | null;
};

export const CollectionInfoModel = types
  .compose(
    'CollectionInfo',
    LoadableModel,
    types.model({
      // NB: Frozen can accept type when precise deriving from default value is
      // not possible
      data: types.frozen<CollectionInfoData>({
        readOnly: false,
        viewOn: null,
        pipeline: null,
        collation: null,
        clustered: false,
        fle2: false,
        validation: null,
      }),
    })
  )
  .actions((self) => {
    const fetch = debounceInflight(
      flow(function* () {
        if (!shouldFetch(self.status)) {
          return;
        }
        self.status = self.status === 'Initial' ? 'Fetching' : 'Refreshing';
        try {
          const { dataServiceManager } = getServices(self);
          const ds = yield* toGenerator(
            dataServiceManager.getCurrentConnection()
          );
          // NB: Recursive and requires assertion
          const { name } = getParentOfType(self, CollectionModel) as {
            name: string;
          };
          const { database, collection } = toNS(name);
          const info = yield* toGenerator(
            ds.collectionInfo(database, collection)
          );
          self.data = {
            readOnly: !!info?.readonly,
            viewOn: info?.view_on ?? null,
            pipeline: info?.pipeline ?? null,
            collation: info?.collation ?? null,
            clustered: !!info?.clustered,
            fle2: !!info?.fle2,
            validation: info?.validation ?? null,
          };
          self.status = 'Ready';
        } catch (err) {
          self.status = 'Error';
          self.error = (err as Error).message;
          throw err;
        }
      })
    );

    return { fetch };
  });

export type CollectionInfo = Instance<typeof CollectionInfoModel>;

export const CollectionModel = types.compose(
  'Collection',
  LoadableModel,
  types.model({
    name: types.identifier,
    type: types.string,
    stats: types.optional(CollectionStatsModel, {}),
    info: types.optional(CollectionInfoModel, {}),
  })
);

export type Collection = Instance<typeof CollectionModel>;

export const CollectionsModel = types
  .compose(
    'Collections',
    LoadableModel,
    types.model({
      items: types.map(CollectionModel),
    })
  )
  .actions((self) => {
    const fetch = debounceInflight(
      flow(function* () {
        if (!shouldFetch(self.status)) {
          return;
        }
        self.status = self.status === 'Initial' ? 'Fetching' : 'Refreshing';
        try {
          const { dataServiceManager } = getServices(self);
          const ds: DataService = yield* toGenerator(
            dataServiceManager.getCurrentConnection()
          );
          const { instance } = getRoot<{ instance: MongoDBInstanceInfo }>(self);
          yield* toGenerator(instance.fetch());
          // NB: Recursive and requires assertion
          const { name: dbName } = getParentOfType(self, DatabaseModel) as {
            name: string;
          };
          const items = yield* toGenerator(
            ds.listCollections(
              dbName,
              {},
              {
                nameOnly: true,
                privileges: instance.data?.auth.privileges,
              }
            )
          );
          const remove = new Set(self.items.keys());
          for (const item of items) {
            remove.delete(item._id);
            if (!self.items.has(item._id)) {
              self.items.put({ name: item._id, type: item.type });
            }
          }
          for (const name of remove) {
            self.items.delete(name);
          }
          self.status = 'Ready';
          return ds;
        } catch (err) {
          self.status = 'Error';
          self.error = (err as Error).message;
          throw err;
        }
      })
    );

    return { fetch };
  });

export type Collections = Instance<typeof CollectionsModel>;

export const useCollectionsForDatabase = (databaseName: string) => {
  const databases = useDatabases();
  const db = databases.items.get(databaseName);
  useEffect(() => {
    db?.collections.fetch();
  }, [db]);
  return db?.collections ?? null;
};

export const useListedCollection = (namespace: string) => {
  const { database } = toNS(namespace);
  const collections = useCollectionsForDatabase(database);
  const coll = collections?.items.get(namespace);
  return coll ?? null;
};

export const useCollectionStats = (namespace: string) => {
  const coll = useListedCollection(namespace);
  useEffect(() => {
    coll?.stats.fetch();
  }, [coll]);
  return coll?.stats ?? null;
};

export const useCollectionInfo = (namespace: string) => {
  const coll = useListedCollection(namespace);
  useEffect(() => {
    coll?.info.fetch();
  }, [coll]);
  return coll?.info ?? null;
};
