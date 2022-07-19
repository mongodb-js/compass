import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useCallback, useEffect } from 'react';
import type { DataService } from '../services/data-service-manager';
import type { LoadingStatus } from '../util';
import {
  actionManager,
  areSameIds,
  createAsyncThunk,
  shouldFetch,
  toNS,
  useDispatch,
  useSelector,
} from '../util';
import { loadDatabases } from './databases';
import { loadInstanceInfo } from './instance-info';
import type { RootState } from './root-store';
import type { Document } from 'bson';

export type CollectionInfo = {
  status: LoadingStatus;
  data: {
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
  } | null;
  error: string | null;
};

export type CollectionStats = {
  status: LoadingStatus;
  data: {
    capped: boolean;
    documentCount: number;
    documentSize: number;
    avgDocumentSize: number;
    indexCount: number;
    indexSize: number;
    size: number;
    storageSize: number;
    freeStorageSize: number;
  } | null;
  error: string | null;
};

export type Collection = {
  name: string;
  type: string;
};

function createCollectionEntry(name: string, type = 'collection'): Collection {
  return { name, type };
}

function createCollectionStatsEntry(): CollectionStats {
  return { status: 'Initial', error: null, data: null };
}

function createCollectionInfoEntry(): CollectionInfo {
  return { status: 'Initial', error: null, data: null };
}

function createStatusEntry(): { status: LoadingStatus; error: null | string } {
  return { status: 'Initial', error: null };
}

export type CollectionsState = {
  collections: {
    items: Record<string, Collection | undefined>;
    idsByDatabase: Record<string, string[] | undefined>;
    statusByDatabase: Record<
      string,
      { status: LoadingStatus; error: string | null } | undefined
    >;
  };
  stats: Record<string, CollectionStats | undefined>;
  info: Record<string, CollectionInfo | undefined>;
  sortedCollectionsIds: {
    ids: string[];
    sortBy:
      | keyof Collection
      | keyof CollectionInfo['data']
      | keyof CollectionStats['data'];
    order: -1 | 1;
  };
};

const initialState: CollectionsState = {
  collections: {
    items: {},
    idsByDatabase: {},
    statusByDatabase: {},
  },
  stats: {},
  info: {},
  sortedCollectionsIds: {
    ids: [],
    sortBy: 'name',
    order: 1
  }
};

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
    // NB: Need to be explicitly undefined otherwise TS can't figure out types
    // correctly
    async (_: undefined, { getState, dispatch }) => {
      // Ensure that we got priveleges for db / coll listing commands. Maybe
      // data-service is a better place for this logic
      await dispatch(loadInstanceInfo());
      // Ensure that databases are listed before loading all collections
      await dispatch(loadDatabases());
      const { items: databases } = getState().databases.databases;
      await Promise.all(
        Object.keys(databases).map((databaseName) => {
          return dispatch(loadCollectionsForDatabase(databaseName));
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
    // When databases are re-fetched, clean up all state we have for database
    // names that don't exist anymore
    builder.addCase(loadDatabases.fulfilled, (state, action) => {
      const dbs = new Set(
        action.payload.map((db) => {
          return db._id;
        })
      );
      // Remove non-existent collections info
      for (const id of Object.keys(state.info)) {
        const { database } = toNS(id);
        if (!dbs.has(database)) {
          delete state.info[id];
        }
      }
      // Remove non-existent collections stats
      for (const id of Object.keys(state.stats)) {
        const { database } = toNS(id);
        if (!dbs.has(database)) {
          delete state.stats[id];
        }
      }
      // Remove non-existent collections
      for (const id of Object.keys(state.collections.items)) {
        const { database } = toNS(id);
        if (!dbs.has(database)) {
          delete state.collections.items[id];
        }
      }
      // Remove collection ids mapping
      for (const id of Object.keys(state.collections.idsByDatabase)) {
        if (!dbs.has(id)) {
          delete state.collections.idsByDatabase[id];
        }
      }
      // Remove collections loading status mapping
      for (const id of Object.keys(state.collections.statusByDatabase)) {
        if (!dbs.has(id)) {
          delete state.collections.statusByDatabase[id];
        }
      }
    });

    builder.addCase(loadCollectionsForDatabase.pending, (state, action) => {
      const databaseName = action.meta.arg;
      state.collections.statusByDatabase[databaseName] ??= createStatusEntry();
      // NB: We just created it above, but the way state should be typed
      // requires a non-null assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.collections.statusByDatabase[databaseName]!.status =
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.collections.statusByDatabase[databaseName]!.status === 'Stale'
          ? 'Refreshing'
          : 'Fetching';
    });
    builder.addCase(loadCollectionsForDatabase.fulfilled, (state, action) => {
      const databaseName = action.meta.arg;
      state.collections.statusByDatabase[databaseName] ??= createStatusEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.collections.statusByDatabase[databaseName]!.status = 'Ready';
      const colls = new Set(action.payload.map((item) => item._id));
      // Clean-up non-existent collections
      for (const id of Object.keys(state.collections.items)) {
        const { database } = toNS(id);
        if (database === databaseName && !colls.has(id)) {
          delete state.collections.items[id];
        }
      }
      // Clean-up stats for non-existent collections
      for (const id of Object.keys(state.stats)) {
        const { database } = toNS(id);
        if (database === databaseName && !colls.has(id)) {
          delete state.stats[id];
        }
      }
      // Clean-up info for non-existent collections
      for (const id of Object.keys(state.info)) {
        const { database } = toNS(id);
        if (database === databaseName && !colls.has(id)) {
          delete state.info[id];
        }
      }
      const collectionIds = action.payload.map((coll) => {
        return coll._id;
      });

      // Opposite to being able to short-circuit this in databases slice, with
      // collections there is a chance we got the new type when refreshing
      // collections, so after update we continue running the diff even if ids
      // are all the same
      if (
        !areSameIds(
          collectionIds,
          state.collections.idsByDatabase[databaseName] ?? []
        )
      ) {
        state.collections.idsByDatabase[databaseName] = collectionIds;
      }

      // Update or add new entries for items returned from listCollections
      for (const coll of action.payload) {
        // If no item exist, just create a new one
        if (!state.collections.items[coll._id]) {
          state.collections.items[coll._id] = createCollectionEntry(
            coll._id,
            coll.type
          );
        } else if (
          // If it does exist, check if the type is not changed and update if
          // needed, also reset stats and info as changed type is a clear
          // indicator that it's not the same item and we have to reset those
          // See above
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          state.collections.items[coll._id]!.type !== coll.type
        ) {
          // See above
          // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
          state.collections.items[coll._id]!.type = coll.type;
          state.info[coll._id] = createCollectionInfoEntry();
          state.stats[coll._id] = createCollectionStatsEntry();
        }
      }
    });
    builder.addCase(loadCollectionsForDatabase.rejected, (state, action) => {
      const databaseName = action.meta.arg;
      state.collections.statusByDatabase[databaseName] ??= createStatusEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.collections.statusByDatabase[databaseName]!.status = 'Error';
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.collections.statusByDatabase[databaseName]!.error =
        action.error.message ?? null;
    });

    builder.addCase(loadCollectionInfo.pending, (state, action) => {
      const collectionName = action.meta.arg;
      state.info[collectionName] ??= createCollectionInfoEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.info[collectionName]!.status === 'Stale'
        ? 'Refreshing'
        : 'Fetching';
    });
    builder.addCase(loadCollectionInfo.fulfilled, (state, action) => {
      const collectionName = action.meta.arg;
      state.info[collectionName] ??= createCollectionInfoEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.info[collectionName]!.status = 'Ready';
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.info[collectionName]!.data = {
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
      const collectionName = action.meta.arg;
      state.info[collectionName] ??= createCollectionInfoEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.info[collectionName]!.status = 'Error';
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.info[collectionName]!.error = action.error.message ?? null;
    });

    builder.addCase(loadCollectionStats.pending, (state, action) => {
      const collectionName = action.meta.arg;
      state.stats[collectionName] ??= createCollectionStatsEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[collectionName]!.status =
        // See above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        state.stats[collectionName]!.status === 'Stale'
          ? 'Refreshing'
          : 'Fetching';
    });
    builder.addCase(loadCollectionStats.fulfilled, (state, action) => {
      const collectionName = action.meta.arg;
      state.stats[collectionName] ??= createCollectionStatsEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[collectionName]!.status = 'Ready';
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[collectionName]!.data = {
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
      const collectionName = action.meta.arg;
      state.stats[collectionName] ??= createCollectionStatsEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[collectionName]!.status = 'Error';
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[collectionName]!.error = action.error.message ?? null;
    });
  },
});

const selectShouldFetchCollections = createSelector(
  [
    (state: RootState) => {
      return state.collections.collections.statusByDatabase;
    },
    (_state, databaseName: string) => {
      return databaseName;
    },
  ],
  (status, databaseName) => {
    return (
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      !status[databaseName]?.status || shouldFetch(status[databaseName]!.status)
    );
  }
);

const selectShouldFetchCollectionInfo = createSelector(
  [
    (state: RootState) => {
      return state.collections.info;
    },
    (_state, collectionName: string) => {
      return collectionName;
    },
  ],
  (info, collectionName) => {
    return (
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      !info[collectionName]?.status || shouldFetch(info[collectionName]!.status)
    );
  }
);

const selectShouldFetchCollectionStats = createSelector(
  [
    (state: RootState) => {
      return state.collections.stats;
    },
    (_state, collectionName: string) => {
      return collectionName;
    },
  ],
  (stats, collectionName) => {
    return (
      !stats[collectionName]?.status ||
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      shouldFetch(stats[collectionName]!.status)
    );
  }
);

const selectCollectionsForDatabase = createSelector(
  [
    (state: RootState) => {
      return state.collections.collections.items;
    },
    (state: RootState) => {
      return state.collections.collections.idsByDatabase;
    },
    (state: RootState) => {
      return state.collections.collections.statusByDatabase;
    },
    (_state, databaseName: string) => {
      return databaseName;
    },
  ],
  (collections, ids, status, databaseName) => {
    const toPick = ids[databaseName] ?? [];
    const items = Object.fromEntries(
      toPick.map((id) => {
        // See above
        // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
        return [id, collections[id]!];
      })
    );
    return {
      items,
      status: status[databaseName]?.status ?? 'Initial',
      error: status[databaseName]?.error ?? null,
    };
  }
);

const selectCollectionIdsForDatabase = createSelector(
  [
    (state: RootState) => {
      return state.collections.collections.idsByDatabase;
    },
    (state: RootState) => {
      return state.collections.collections.statusByDatabase;
    },
    (_state, databaseName: string) => {
      return databaseName;
    },
  ],
  (ids, status, databaseName) => {
    const items = ids[databaseName] ?? [];
    return {
      items,
      status: status[databaseName]?.status ?? 'Initial',
      error: status[databaseName]?.error ?? null,
    };
  }
);

const selectCollection = createSelector(
  [
    (state: RootState) => {
      return state.collections.collections.items;
    },
    (_state, collectionName) => {
      return collectionName;
    },
  ],
  (collections, collectionName) => {
    return collections[collectionName] ?? null;
  }
);

const selectCollectionStats = createSelector(
  [
    (state: RootState) => {
      return state.collections.stats;
    },
    (_state, collectionName) => {
      return collectionName;
    },
  ],
  (stats, collectionName) => {
    return stats[collectionName] ?? null;
  }
);

const selectCollectionInfo = createSelector(
  [
    (state: RootState) => {
      return state.collections.info;
    },
    (_state, collectionName) => {
      return collectionName;
    },
  ],
  (info, collectionName) => {
    return info[collectionName] ?? null;
  }
);

export const useLoadAllCollections = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollections());
  }, []);
};

const useLoadCollectionsForDatabase = (databaseName: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollectionsForDatabase(databaseName));
  }, [databaseName]);
};

export const useCollectionsForDatabase = (databaseName: string) => {
  const selector = useCallback(
    (state: RootState) => {
      return selectCollectionsForDatabase(state, databaseName);
    },
    [databaseName]
  );
  const items = useSelector(selector);
  useLoadCollectionsForDatabase(databaseName);
  return items;
};

export const useCollectionIdsForDatabase = (databaseName: string) => {
  const selector = useCallback(
    (state: RootState) => {
      return selectCollectionIdsForDatabase(state, databaseName);
    },
    [databaseName]
  );
  const items = useSelector(selector);
  useLoadCollectionsForDatabase(databaseName);
  return items;
};

export const useListedCollection = (namespace: string) => {
  const selector = useCallback(
    (state: RootState) => {
      return selectCollection(state, namespace);
    },
    [namespace]
  );
  const { database } = toNS(namespace);
  const items = useSelector(selector);
  useLoadCollectionsForDatabase(database);
  return items;
};

const useLoadCollectionStats = (namespace: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadCollectionStats(namespace));
  }, [namespace]);
};

export const useCollectionStats = (namespace: string) => {
  const selector = useCallback(
    (state: RootState) => {
      return selectCollectionStats(state, namespace);
    },
    [namespace]
  );
  const stats = useSelector(selector);
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
  const selector = useCallback(
    (state: RootState) => {
      return selectCollectionInfo(state, namespace);
    },
    [namespace]
  );
  const info = useSelector(selector);
  useLoadCollectionInfo(namespace);
  return info;
};

export default collections.reducer;
