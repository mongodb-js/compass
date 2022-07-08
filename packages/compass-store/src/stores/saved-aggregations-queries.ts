import { createSlice, createSelector } from '@reduxjs/toolkit';
import { useCallback, useEffect } from 'react';
import type {
  AggregationItem,
  AggregationQueryItem,
  QueryItem,
} from '../services/saved-aggregations-queries';
import { actionManager, LoadingStatus } from '../util';
import { createAsyncThunk } from '../util';
import { useDispatch, useSelector } from '../util';
import type { RootState } from './root-store';

export type SavedAggregationsQueriesState = {
  status: LoadingStatus;
  items: AggregationQueryItem[];
};

const initialState: SavedAggregationsQueriesState = {
  status: 'Initial',
  items: [],
};

export const loadSavedItems = actionManager.debounce(
  createAsyncThunk(
    'savedAggregationsQueries/loadSavedItems',
    async (_: undefined, { extra }) => {
      return extra.savedAggregationsQueriesService.load();
    },
    {
      condition(_, api) {
        return selectShouldFetchSavedAggregationsQueries(api.getState());
      },
    }
  )
);

export const updateSavedItem = createAsyncThunk<
  AggregationQueryItem,
  AggregationQueryItem
>('savedAggregationsQueries/updateSavedItem', (item, { extra }) => {
  try {
    void extra.savedAggregationsQueriesService.save(item);
  } catch (e) {
    // Use logger or global toast or something like this
  }
  return item;
});

export const deleteSavedItem = createAsyncThunk<string, string>(
  'savedAggregationsQueries/deleteSavedItem',
  (id, { extra }) => {
    try {
      void extra.savedAggregationsQueriesService.delete(id);
    } catch {
      //
    }
    return id;
  }
);

const savedAggregationsQueries = createSlice({
  name: 'savedAggregationsQueries',
  initialState,
  reducers: {},
  extraReducers(builder) {
    builder.addCase(loadSavedItems.pending, (state) => {
      state.status = 'Fetching';
    });
    builder.addCase(loadSavedItems.fulfilled, (state, action) => {
      state.status = 'Ready';
      state.items = action.payload;
    });
    builder.addCase(loadSavedItems.rejected, (state) => {
      state.status = 'Error';
    });
    builder.addCase(updateSavedItem.fulfilled, (state, action) => {
      const idx = state.items.findIndex(
        (item) => item.id === action.payload.id
      );
      if (idx !== -1) {
        state.items[idx] = action.payload;
      }
    });
    builder.addCase(deleteSavedItem.fulfilled, (state, action) => {
      state.items = state.items.filter((item) => item.id !== action.payload);
    });
  },
});

export const selectSavedAggregationsQueriesItems = createSelector(
  [
    (state: RootState) => {
      return state.savedAggregationsQueries;
    },
    (_state, namespace?: string) => {
      return namespace;
    },
  ],
  (savedAggregationsQueries, namespace) => {
    if (!namespace) {
      return savedAggregationsQueries.items;
    }
    return savedAggregationsQueries.items.filter(
      (item) => namespace === `${item.database}.${item.collection}`
    );
  }
);

export const selectSavedQueryItems = createSelector(
  selectSavedAggregationsQueriesItems,
  (items) => {
    return items.filter((item) => item.type === 'query') as QueryItem[];
  }
);

export const selectRecentQueryItems = createSelector(
  selectSavedQueryItems,
  (items) => {
    return items.filter((item) => typeof item.query._name === 'undefined');
  }
);

export const selectFavouriteQueryItems = createSelector(
  selectSavedQueryItems,
  (items) => {
    return items.filter((item) => typeof item.query._name === 'string');
  }
);

export const selectSavedAggregationItems = createSelector(
  selectSavedAggregationsQueriesItems,
  (items) => {
    return items.filter(
      (item) => item.type === 'aggregation'
    ) as AggregationItem[];
  }
);

export const selectAreSavedAggregationsQueriesReady = createSelector(
  (state: RootState) => {
    return state.savedAggregationsQueries;
  },
  (savedAggregationsQueries) => {
    return savedAggregationsQueries.status === 'Ready';
  }
);

export const selectShouldFetchSavedAggregationsQueries = createSelector(
  (state: RootState) => {
    return state.savedAggregationsQueries;
  },
  (savedAggregationsQueries) => {
    return savedAggregationsQueries.status === 'Initial';
  }
);

export const selectSavedItemById = createSelector(
  [
    selectSavedAggregationsQueriesItems,
    (_state, id: string) => {
      return id;
    },
  ],
  (items, id) => {
    return items.find((item) => item.id === id) ?? null;
  }
);

const useLoadSavedItems = () => {
  const dispatch = useDispatch();
  useEffect(() => {
    void dispatch(loadSavedItems());
  }, []);
};

export const useSavedAggregationsQueriesItems = (
  namespace?: string
): {
  items: AggregationQueryItem[];
  loaded: boolean;
} => {
  const items = useSelector((state) =>
    selectSavedAggregationsQueriesItems(state, namespace)
  );
  const loaded = useSelector(selectAreSavedAggregationsQueriesReady);
  useLoadSavedItems();
  return { items, loaded };
};

export const useSavedQueries = (namespace?: string): QueryItem[] => {
  useLoadSavedItems();
  return useSelector((state) => selectSavedQueryItems(state, namespace));
};

export const useRecentQueries = (namespace?: string): QueryItem[] => {
  useLoadSavedItems();
  return useSelector((state) => selectRecentQueryItems(state, namespace));
};

export const useFavoriteQueries = (namespace?: string): QueryItem[] => {
  useLoadSavedItems();
  return useSelector((state) => selectFavouriteQueryItems(state, namespace));
};

export const useSavedAggregations = (namespace?: string): AggregationItem[] => {
  useLoadSavedItems();
  return useSelector((state) => selectSavedAggregationItems(state, namespace));
};

export const useSavedItemById = (id: string): AggregationQueryItem | null => {
  useLoadSavedItems();
  return useSelector((state) => selectSavedItemById(state, id));
};

export const useUpdateSavedItem = (): ((
  item: AggregationQueryItem
) => void) => {
  const dispatch = useDispatch();
  return useCallback((item) => {
    void dispatch(updateSavedItem(item));
  }, []);
};

export const useDeleteSavedItem = (): ((id: string) => void) => {
  const dispatch = useDispatch();
  return useCallback((id) => {
    void dispatch(deleteSavedItem(id));
  }, []);
};

export default savedAggregationsQueries.reducer;
