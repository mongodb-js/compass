import { createSlice, createSelector, createAction } from '@reduxjs/toolkit';
import { useCallback, useEffect, useMemo } from 'react';
import type { DataService } from '../services/data-service-manager';
import type { LoadingStatus } from '../util';
import { areSameIds, areSameIdsOrdered } from '../util';
import {
  actionManager,
  createAsyncThunk,
  shouldFetch,
  useDispatch,
  useSelector,
} from '../util';
import { loadInstanceInfo } from './instance-info';
import type { RootState } from './root-store';

export type Database = {
  name: string;
};

export type DatabaseStats = {
  status: LoadingStatus;
  error: string | null;
  data: {
    dataSize: number;
    storageSize: number;
    indexSize: number;
    collectionCount: number;
    documentCount: number;
    indexCount: number;
  } | null;
};

function createDatabaseEntry(name: string): Database {
  return { name };
}

function createDatabaseStatsEntry(): DatabaseStats {
  return { status: 'Initial', error: null, data: null };
}

// NB: Every single source of data that can get an independent update should be
// separated in Redux otherwise it is impossible to get any performance out of
// this library. Furthermore if any sort of collection data type is stored in
// the state, a separately maintained collection of the item ids should be
// provided: deriving values from the collection itself would mean that it is
// not possible to have a dependency only on collection item ids without
// updating every time any item in the collection changes even if id stays the
// same which might degrade the performance of the application significantly
// with noticeable multi-second lags on updates
export type DatabasesState = {
  databases: {
    items: Record<string, Database | undefined>;
    ids: string[];
    status: LoadingStatus;
    error: string | null;
  };
  stats: Record<string, DatabaseStats | undefined>;
  sortedDatabasesIds: {
    ids: string[];
    sortBy: keyof Database | keyof DatabaseStats['data'];
    order: 1 | -1;
  };
};

const initialState: DatabasesState = {
  databases: {
    items: {},
    ids: [],
    status: 'Initial',
    error: null,
  },
  stats: {},
  // Sorted state is kept separate because computing it in the render is not
  // possible due to performance reasons
  sortedDatabasesIds: {
    ids: [],
    sortBy: 'name',
    order: 1,
  },
};

export const loadDatabases = actionManager.debounce(
  createAsyncThunk(
    'databases/loadDatabases',
    async (_: undefined, { extra, getState, dispatch }) => {
      // Ensure that we got priveleges for db / coll listing commands. Maybe
      // data-service is a better place for this logic
      await dispatch(loadInstanceInfo());
      // Implicit type annotation to fix recursive references
      const ds: DataService =
        await extra.dataServiceManager.getCurrentConnection();
      return await ds.listDatabases(
        {
          nameOnly: true,
          privileges: getState().instanceInfo.auth.privileges,
        }
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(_, { getState }) {
        return selectShouldFetchDatabases(getState());
      },
    }
  )
);

const loadDatabaseStats = actionManager.debounce(
  createAsyncThunk(
    'databases/loadDatabaseStats',
    async (databaseName: string, { extra, signal }) => {
      const ds = await extra.dataServiceManager.getCurrentConnection();
      return await ds.databaseStats(
        databaseName
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(databaseName, { getState }) {
        return selectShouldFetchDatabaseStats(getState(), databaseName);
      },
    }
  )
);

function getSortedDatabasesIds(state: DatabasesState): string[] {
  const { sortBy, order } = state.sortedDatabasesIds as {
    // TODO: hacking it together so I can switch between mobx and redux easier
    sortBy:
      | 'name'
      | 'stats.data.storageSize'
      | 'stats.data.collectionCount'
      | 'stats.data.indexCount';
    order: 1 | -1;
  };
  const sortedIds = [...state.databases.ids].sort((a, b) => {
    const { data: aStats } = (state.stats[a] ?? {}) as DatabaseStats;
    const { data: bStats } = (state.stats[b] ?? {}) as DatabaseStats;
    switch (sortBy) {
      case 'name':
        return a.localeCompare(b) * order;
      case 'stats.data.storageSize':
        return (
          ((aStats?.storageSize ?? 0) - (bStats?.storageSize ?? 0)) * order
        );
      case 'stats.data.collectionCount':
        return (
          ((aStats?.collectionCount ?? 0) - (bStats?.collectionCount ?? 0)) *
          order
        );
      case 'stats.data.indexCount':
        return ((aStats?.indexCount ?? 0) - (bStats?.indexCount ?? 0)) * order;
    }
  });
  return sortedIds;
}

const sortDatabases = createAction<{ name: string; order: number }>(
  'databases/sortDatabases'
);

const databases = createSlice({
  name: 'databases',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(sortDatabases, (state, action) => {
      // Only update when changed to avoid re-renders
      if (state.sortedDatabasesIds.order !== action.payload.order) {
        state.sortedDatabasesIds.order = action.payload.order as any;
      }
      // Only update when changed to avoid re-renders
      if (state.sortedDatabasesIds.sortBy !== action.payload.name) {
        state.sortedDatabasesIds.sortBy = action.payload.name as any;
      }
      const sortedIds = getSortedDatabasesIds(state);
      if (!areSameIdsOrdered(sortedIds, state.sortedDatabasesIds.ids)) {
        // Only update if ids changed to avoid re-rendering issues
        state.sortedDatabasesIds.ids = sortedIds;
      }
    });

    builder.addCase(loadDatabases.pending, (state) => {
      state.databases.status =
        state.databases.status === 'Stale' ? 'Refreshing' : 'Fetching';
    });
    builder.addCase(loadDatabases.fulfilled, (state, action) => {
      state.databases.status = 'Ready';
      const dbs = new Set(action.payload.map((item) => item._id));
      // For databases it's safe to assume that if ids are the same, nothing
      // changed in the list and so we can short circuit and avoid any state
      // mutations
      if (areSameIds(state.databases.ids, Array.from(dbs))) {
        return;
      }
      // NB: For performance reasons we are keeping ids list separately. We need
      // this value to be able to detach re-rendering of lists of items from
      // other items metadata like stats, info or any other information that can
      // be part of the collection item object. Without this it is impossible to
      // get any acceptable performance out of react-redux integration
      state.databases.ids = Array.from(dbs);
      const sortedIds = getSortedDatabasesIds(state);
      if (!areSameIdsOrdered(sortedIds, state.sortedDatabasesIds.ids)) {
        // Only update if ids changed to avoid re-rendering issues
        state.sortedDatabasesIds.ids = sortedIds;
      }
      // Clean-up non-existent databases from items and stats
      for (const key of Object.keys(state.databases.items)) {
        if (!dbs.has(key)) {
          delete state.databases.items[key];
          delete state.stats[key];
        }
      }
      // Add initial state items for the new ids returned from the list command
      for (const db of action.payload) {
        state.databases.items[db._id] ??= createDatabaseEntry(db._id);
        state.stats[db._id] ??= createDatabaseStatsEntry();
      }
    });
    builder.addCase(loadDatabases.rejected, (state, action) => {
      state.databases.status = 'Error';
      state.databases.error = action.error.message ?? null;
    });

    builder.addCase(loadDatabaseStats.pending, (state, action) => {
      const databaseName = action.meta.arg;
      state.stats[databaseName] ??= createDatabaseStatsEntry();
      // NB: We just created it above, but the way state should be typed
      // requires a non-null assertion
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[databaseName]!.status = 'Fetching';
    });
    builder.addCase(loadDatabaseStats.fulfilled, (state, action) => {
      const databaseName = action.meta.arg;
      state.stats[databaseName] ??= createDatabaseStatsEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[databaseName]!.status = 'Ready';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[databaseName]!.data = {
        dataSize: action.payload.data_size,
        storageSize: action.payload.storage_size,
        indexSize: action.payload.index_size,
        collectionCount: action.payload.collection_count,
        documentCount: action.payload.document_count,
        indexCount: action.payload.index_count,
      };
      const sortedIds = getSortedDatabasesIds(state);
      if (!areSameIdsOrdered(sortedIds, state.sortedDatabasesIds.ids)) {
        // Only update
        state.sortedDatabasesIds.ids = sortedIds;
      }
    });
    builder.addCase(loadDatabaseStats.rejected, (state, action) => {
      const databaseName = action.meta.arg;
      state.stats[databaseName] ??= createDatabaseStatsEntry();
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[databaseName]!.status = 'Error';
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      state.stats[databaseName]!.error = action.error.message ?? null;
    });
  },
});

const selectShouldFetchDatabases = createSelector(
  (state: RootState) => {
    return state.databases.databases.status;
  },
  (status) => {
    return shouldFetch(status);
  }
);

const selectShouldFetchDatabaseStats = createSelector(
  [
    (state: RootState) => {
      return state.databases.stats;
    },
    (_state, databaseName: string) => {
      return databaseName;
    },
  ],
  (databaseStats, databaseName) => {
    return (
      !databaseStats[databaseName] ||
      // See above
      // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
      shouldFetch(databaseStats[databaseName]!.status)
    );
  }
);

const selectDatabases = createSelector(
  (state: RootState) => {
    return state.databases;
  },
  (databasesState) => {
    return databasesState.databases;
  }
);

// NB: Optimisation to avoid depending in actual Database items in the state
const selectDatabasesIds = createSelector(
  (state: RootState) => {
    return state.databases.databases.ids;
  },
  (state: RootState) => {
    return state.databases.databases.status;
  },
  (state: RootState) => {
    return state.databases.databases.error;
  },
  (items, status, error) => {
    return { items, status, error };
  }
);

const selectDatabaseStats = createSelector(
  [
    (state: RootState) => {
      return state.databases.stats;
    },
    (_state, databaseName: string) => {
      return databaseName;
    },
  ],
  (databaseStats, databaseName): DatabaseStats | null => {
    return databaseStats[databaseName] ?? null;
  }
);

export const useDatabases = (): DatabasesState['databases'] => {
  const dbs = useSelector(selectDatabases);
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadDatabases());
  }, []);
  return dbs;
};

export const useDatabasesIds = (): {
  items: string[];
  status: LoadingStatus;
  error: string | null;
} => {
  const dbs = useSelector(selectDatabasesIds);
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadDatabases());
  }, []);
  return dbs;
};

export const useDatabaseStats = (
  databaseName: string
): DatabasesState['stats'][string] | null => {
  const selector = useCallback(
    (state: RootState) => {
      return selectDatabaseStats(state, databaseName);
    },
    [databaseName]
  );
  const stats = useSelector(selector);
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadDatabaseStats(databaseName));
  }, [databaseName]);
  return stats ?? null;
};

export const useSortedDatabaseIds = () => {
  const { status, error } = useDatabasesIds();
  const {
    order,
    sortBy,
    ids: items,
  } = useSelector((state) => state.databases.sortedDatabasesIds);
  const dispatch = useDispatch();
  return useMemo(() => {
    return {
      status,
      error,
      items,
      order,
      sortValue: { name: sortBy, order },
      onSortBy(payload: { name: string; order: -1 | 1 }) {
        return dispatch(sortDatabases(payload));
      },
    };
  }, [status, error, items, order, sortBy]);
};

export default databases.reducer;
