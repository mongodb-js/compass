import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useEffect } from 'react';
import { DataService } from '../services/data-service-manager';
import {
  actionManager,
  createAsyncThunk,
  LoadingStatus,
  shouldFetch,
  useDispatch,
  useSelector,
} from '../util';
import { loadInstanceInfo } from './instance-info';
import { RootState } from './root-store';

export type Database = {
  name: string;
  stats: {
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
};

function createDatabaseEntry(name: string): Database {
  return {
    name,
    stats: { status: 'Initial', error: null, data: null },
  };
}

export type DatabasesState = {
  items: Record<string, Database>;
  status: LoadingStatus;
  error: string | null;
};

const initialState: DatabasesState = {
  items: {},
  status: 'Initial',
  error: null,
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
    async (dbName: string, { extra, signal }) => {
      const ds = await extra.dataServiceManager.getCurrentConnection();
      return await ds.databaseStats(
        dbName
        // TODO: Add support for signals in dataService
        // , { signal }
      );
    },
    {
      condition(dbName, { getState }) {
        return selectShouldFetchDatabaseStats(getState(), dbName);
      },
    }
  )
);

const databases = createSlice({
  name: 'databases',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadDatabases.pending, (state) => {
      state.status = state.status === 'Stale' ? 'Refreshing' : 'Fetching';
    });
    builder.addCase(loadDatabases.fulfilled, (state, action) => {
      state.status = 'Ready';
      const dbs = new Set(action.payload.map((item) => item._id));
      // Clean-up non-existent databases first
      for (const key of Object.keys(state.items)) {
        if (!dbs.has(key)) {
          delete state.items[key];
        }
      }
      // Add new ids returned from loadDatabase (and just preserve existing ones)
      for (const db of action.payload) {
        if (!state.items[db._id]) {
          state.items[db._id] = createDatabaseEntry(db._id);
        }
      }
    });
    builder.addCase(loadDatabases.rejected, (state, action) => {
      state.status = 'Error';
      state.error = action.error.message ?? null;
    });

    builder.addCase(loadDatabaseStats.pending, (state, action) => {
      const dbName = action.meta.arg;
      state.items[dbName] ??= createDatabaseEntry(dbName);
      state.items[dbName].stats.status = 'Fetching';
    });
    builder.addCase(loadDatabaseStats.fulfilled, (state, action) => {
      const dbName = action.meta.arg;
      state.items[dbName] ??= createDatabaseEntry(dbName);
      state.items[dbName].stats.status = 'Ready';
      state.items[dbName].stats.data = {
        dataSize: action.payload.data_size,
        storageSize: action.payload.storage_size,
        indexSize: action.payload.index_size,
        collectionCount: action.payload.collection_count,
        documentCount: action.payload.document_count,
        indexCount: action.payload.index_count,
      };
    });
    builder.addCase(loadDatabaseStats.rejected, (state, action) => {
      const dbName = action.meta.arg;
      state.items[dbName] ??= createDatabaseEntry(dbName);
      state.items[dbName].stats.status = 'Error';
      state.items[dbName].stats.error = action.error.message ?? null;
    });
  },
});

const selectDatabases = createSelector(
  (state: RootState) => {
    return state.databases;
  },
  (dbsState) => {
    return dbsState.items;
  }
);

const selectDatabasesArray = createSelector((state: RootState) => {
  return state.databases
}, (databasesState) => {
  return {
    items: Object.keys(databasesState.items),
    status: databasesState.status,
    error: databasesState.error,
  };
})

const selectShouldFetchDatabases = createSelector(
  (state: RootState) => {
    return state.databases.status;
  },
  (status) => {
    return shouldFetch(status);
  }
);

const selectDatabaseStats = createSelector(
  [
    selectDatabases,
    (_state: RootState, dbName: string) => {
      return dbName;
    },
  ],
  (databases, dbName) => {
    return databases[dbName].stats;
  }
);

const selectShouldFetchDatabaseStats = createSelector(
  selectDatabaseStats,
  (stats) => {
    return !stats || shouldFetch(stats.status);
  }
);

const useLoadDatabases = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadDatabases());
  }, []);
};

export const useDatabases = (): {
  items: string[];
  status: LoadingStatus;
  error: string | null;
} => {
  const dbs = useSelector(selectDatabasesArray);
  useLoadDatabases();
  return dbs;
};

const useLoadDatabaseStats = (dbName: string) => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadDatabaseStats(dbName));
  }, [dbName]);
};

export const useDatabaseStats = (dbName: string): Database['stats'] | null => {
  const stats = useSelector((state) => selectDatabaseStats(state, dbName));
  useLoadDatabaseStats(dbName);
  return stats ?? null;
};

export default databases.reducer;
