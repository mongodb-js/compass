import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { DataService } from '../services/data-service-manager';
import {
  actionManager,
  createAsyncThunk,
  LoadingStatus,
  shouldFetch,
  toNS,
  useDispatch,
  useSelector,
} from '../util';
import { loadDatabases } from './databases';
import { loadInstanceInfo } from './instance-info';
import { RootState } from './root-store';
import { Document } from 'bson';

export type CollectionInfo = {
  readOnly: boolean;
  viewOn: string | null;
  pipeline: Document[] | null;
  collation: Document | null;
  clustered: boolean;
  fle2: boolean;
  validation: {
    validator: Document;
    validationAction: string;
    validationLevel: string;
  } | null;
};

export type CollectionStats = {
  capped: boolean;
  documentCount: number;
  documentSize: number;
  avgDocumentSize: number;
  indexCount: number;
  indexSize: number;
  size: number;
  storageSize: number;
  freeStorageSize: number;
};

export type Collection = {
  name: string;
  type: string;
  info: {
    status: LoadingStatus;
    error: string | null;
    data: CollectionInfo | null;
  };
  stats: {
    status: LoadingStatus;
    error: string | null;
    data: CollectionStats | null;
  };
};

function createCollectionEntry(
  name: string,
  type: string = 'collection'
): Collection {
  return {
    name,
    type,
    info: { status: 'Initial', error: null, data: null },
    stats: { status: 'Initial', error: null, data: null },
  };
}

export type CollectionsState = {
  items: Record<string, Collection>;
  // TODO: Also store error
  status: Record<string, LoadingStatus>;
};

const initialState: CollectionsState = {
  items: {},
  status: {},
};

// function asyncIdleCallback<T extends (...args: unknown[]) => unknown>(cb: T, options?: IdleRequestOptions | undefined): Promise<ReturnType<T>> {
//   return new Promise(resolve => {
//     requestIdleCallback((deadline) => {
//       resolve(cb(deadline));
//     }, options);
//   })
// }

export const loadCollectionsForDatabase = actionManager.debounce(
  createAsyncThunk(
    'collections/loadCollectionsForDatabase',
    async (database: string, { extra, getState, dispatch }) => {
      // Ensure that we got priveleges for db / coll listing commands. Maybe
      // data-service is a better place for this logic
      await dispatch(loadInstanceInfo());
      // Implicit type annotation to fix recursive references
      const ds: DataService =
        await extra.dataServiceManager.getCurrentConnection();
      return await ds.listCollections(
        database,
        {},
        {
          nameOnly: true,
          privileges: getState().instanceInfo.auth.privileges,
        }
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(database, { getState }) {
        return selectShouldFetchCollections(getState(), database);
      },
    }
  )
);

export const loadCollections = actionManager.debounce(
  createAsyncThunk(
    'collections/loadCollections',
    async (_: undefined, { extra, getState, dispatch }) => {
      // Ensure that we got priveleges for db / coll listing commands. Maybe
      // data-service is a better place for this logic
      await dispatch(loadInstanceInfo());
      // Ensure that databases are listed before loading all collections
      await dispatch(loadDatabases());
      const { items: databases } = getState().databases;
      await Promise.all(
        Object.keys(databases).map((dbName) => {
          return dispatch(loadCollectionsForDatabase(dbName));
        })
      );
    }
  )
);

export const loadCollectionInfo = actionManager.debounce(
  createAsyncThunk(
    'collections/loadCollectionInfo',
    async (namespace: string, { extra, signal }) => {
      const ds: DataService =
        await extra.dataServiceManager.getCurrentConnection();
      const { database, collection } = toNS(namespace);
      return await ds.collectionInfo(
        database,
        collection
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(namespace, { getState }) {
        return selectShouldFetchCollectionInfo(getState(), namespace);
      },
    }
  )
);

export const loadCollectionStats = actionManager.debounce(
  createAsyncThunk(
    'collections/loadStats',
    async (namespace: string, { extra, signal }) => {
      const ds: DataService =
        await extra.dataServiceManager.getCurrentConnection();
      const { database, collection } = toNS(namespace);
      return await ds.collectionStatsAsync(
        database,
        collection
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(namespace, { getState }) {
        return selectShouldFetchCollectionStats(getState(), namespace);
      },
    }
  )
);

const collections = createSlice({
  name: 'collections',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadCollectionsForDatabase.pending, (state, action) => {
      const dbName = action.meta.arg;
      state.status[dbName] =
        state.status[dbName] === 'Stale' ? 'Refreshing' : 'Fetching';
    });
    builder.addCase(loadCollectionsForDatabase.fulfilled, (state, action) => {
      const dbName = action.meta.arg;
      state.status[dbName] = 'Ready';
      const colls = new Set(action.payload.map((item) => item._id));
      // Clean-up non-existent collections first
      for (const key of Object.keys(state.items)) {
        const {database} = toNS(key);
        if (database === dbName && !colls.has(key)) {
          delete state.items[key];
        }
      }
      // Add new ids returned from loadCollections (and preserve existing ones)
      for (const coll of action.payload) {
        if (!state.items[coll._id]) {
          state.items[coll._id] = createCollectionEntry(coll._id, coll.type);
        }
      }
    });
    builder.addCase(loadCollectionsForDatabase.rejected, (state, action) => {
      const dbName = action.meta.arg;
      state.status[dbName] = 'Error';
    });

    builder.addCase(loadCollectionInfo.pending, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(collName);
      state.items[collName].info.status =
        state.items[collName].info.status === 'Stale'
          ? 'Refreshing'
          : 'Fetching';
    });
    builder.addCase(loadCollectionInfo.fulfilled, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(
        collName,
        action.payload?.type
      );
      state.items[collName].info.status = 'Ready';
      state.items[collName].info.data = {
        readOnly: action.payload?.readonly ?? false,
        viewOn: action.payload?.view_on ?? null,
        pipeline: action.payload?.pipeline ?? null,
        collation: action.payload?.collation ?? null,
        clustered: action.payload?.clustered ?? false,
        fle2: action.payload?.fle2 ?? false,
        validation: action.payload?.validation ?? null,
      };
    });
    builder.addCase(loadCollectionInfo.rejected, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(collName);
      state.items[collName].info.status = 'Error';
      state.items[collName].info.error = action.error.message ?? null;
    });

    builder.addCase(loadCollectionStats.pending, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(collName);
      state.items[collName].stats.status =
        state.items[collName].stats.status === 'Stale'
          ? 'Refreshing'
          : 'Fetching';
    });
    builder.addCase(loadCollectionStats.fulfilled, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(collName);
      state.items[collName].stats.status = 'Ready';
      state.items[collName].stats.data = {
        capped: action.payload.is_capped ?? false,
        documentCount: action.payload.document_count ?? 0,
        documentSize: action.payload.document_size ?? 0,
        avgDocumentSize: action.payload.avg_document_size ?? 0,
        indexCount: action.payload.index_count ?? 0,
        indexSize: action.payload.index_size ?? 0,
        size: action.payload.size ?? 0,
        storageSize: action.payload.storage_size ?? 0,
        freeStorageSize: action.payload.free_storage_size ?? 0,
      };
    });
    builder.addCase(loadCollectionStats.rejected, (state, action) => {
      const collName = action.meta.arg;
      state.items[collName] ??= createCollectionEntry(collName);
      state.items[collName].stats.status = 'Error';
      state.items[collName].stats.error = action.error.message ?? null;
    });
  },
});

const selectCollections = createSelector(
  (state: RootState) => {
    return state.collections;
  },
  (collsState) => {
    return collsState.items;
  }
);

const selectCollectionsForDatabase = createSelector(
  [
    (state: RootState) => {
      return state.collections.items;
    },
    (state: RootState) => {
      return state.collections.status;
    },
    (_state: RootState, databaseName: string) => {
      return databaseName;
    },
  ],
  (collections, status, databaseName) => {
    const items = Object.values(collections).filter((coll) => {
      const { database } = toNS(coll.name);
      return databaseName === database;
    });
    return { items, status: status[databaseName] ?? 'Initial' };
  }
);

const selectCollectionsLoadingStatus = createSelector(
  [
    (state: RootState) => {
      return state.collections.status;
    },
    (_state: RootState, dbName: string) => {
      return dbName;
    },
  ],
  (status, dbName) => {
    return status[dbName] ?? 'Initial';
  }
);

const selectCollection = createSelector(
  [
    (state: RootState) => {
      return state.collections.items;
    },
    (_state, namespace: string) => {
      return namespace;
    },
  ],
  (collections, namespace) => {
    return collections[namespace];
  }
);

const selectCollectionStats = createSelector(
  selectCollection,
  (collection) => {
    return collection?.stats ?? null;
  }
);

const selectCollectionInfo = createSelector(
  selectCollection,
  (collection) => {
    return collection?.info ?? null;
  }
);

const selectShouldFetchCollections = createSelector(
  selectCollectionsLoadingStatus,
  (status) => {
    return shouldFetch(status);
  }
);

const selectShouldFetchCollectionInfo = createSelector(
  selectCollectionInfo,
  (info) => {
    return !info || shouldFetch(info.status);
  }
);

const selectShouldFetchCollectionStats = createSelector(
  selectCollectionStats,
  (stats) => {
    return !stats || shouldFetch(stats.status);
  }
);

export const useLoadAllCollections = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollections());
  }, []);
};

const useLoadCollectionsForDatabase = (dbName: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollectionsForDatabase(dbName));
  }, [dbName]);
};

export const useCollectionsForDatabase = (dbName: string) => {
  const items = useSelector((state) =>
    selectCollectionsForDatabase(state, dbName)
  );
  useLoadCollectionsForDatabase(dbName);
  return items;
};

const useLoadCollectionStats = (namespace: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollectionStats(namespace));
  }, [namespace]);
};

export const useCollectionStats = (namespace: string) => {
  const stats = useSelector((state) => selectCollectionStats(state, namespace));
  useLoadCollectionStats(namespace);
  return stats;
};

const useLoadCollectionInfo = (namespace: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollectionInfo(namespace));
  }, [namespace]);
};

export const useCollectionInfo = (namespace: string) => {
  const info = useSelector((state) => selectCollectionInfo(state, namespace));
  useLoadCollectionInfo(namespace);
  return info;
};

export const useCollection = (namespace: string) => {
  const coll = useSelector(state => selectCollection(state, namespace))
  useLoadCollectionInfo(namespace);
  useLoadCollectionStats(namespace);
  return coll;
}

export default collections.reducer;
