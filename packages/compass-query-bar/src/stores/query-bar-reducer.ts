import type { Action, Reducer } from 'redux';
import { cloneDeep, isEmpty } from 'lodash';
import type { Document } from 'mongodb';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryBarThunkAction } from './query-bar-store';
import { AIQueryActionTypes } from './ai-query-reducer';
import type { AIQuerySucceededAction } from './ai-query-reducer';
import type {
  QueryProperty,
  BaseQuery,
  QueryFormFields,
  FormField,
} from '../constants/query-properties';
import {
  mapFormFieldsToQuery,
  mapQueryToFormFields,
  isQueryFieldsValid,
  validateField,
  isEqualDefaultQuery,
  doesQueryHaveExtraOptionsSet,
} from '../utils/query';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { changeFilter } from '../modules/change-filter';
import { getQueryAttributes, isQueryEqual } from '../utils';
import { isAction } from '@mongodb-js/compass-utils';
import type {
  RecentQuery,
  FavoriteQuery,
} from '@mongodb-js/my-queries-storage';

type QueryBarState = {
  isReadonlyConnection: boolean;
  fields: QueryFormFields;
  expanded: boolean;
  serverVersion: string;
  lastAppliedQuery: {
    source: string | null;
    query: Record<string, BaseQuery | null>;
  };
  /**
   * For testing purposes only, allows to track whether or not apply button was
   * clicked or not
   */
  applyId: number;
  namespace: string;
  host?: string;
  recentQueries: RecentQuery[];
  favoriteQueries: FavoriteQuery[];
};

export const INITIAL_STATE: QueryBarState = {
  isReadonlyConnection: false,
  fields: mapQueryToFormFields({}, DEFAULT_FIELD_VALUES),
  expanded: false,
  serverVersion: '3.6.0',
  lastAppliedQuery: { source: null, query: {} },
  applyId: 0,
  namespace: '',
  recentQueries: [],
  favoriteQueries: [],
};

export enum QueryBarActions {
  ChangeReadonlyConnectionStatus = 'compass-query-bar/ChangeReadonlyConnectionStatus',
  ToggleQueryOptions = 'compass-query-bar/ToggleQueryOptions',
  ChangeField = 'compass-query-bar/ChangeField',
  SetQuery = 'compass-query-bar/SetQuery',
  ApplyQuery = 'compass-query-bar/ApplyQuery',
  ResetQuery = 'compass-query-bar/ResetQuery',
  ApplyFromHistory = 'compass-query-bar/ApplyFromHistory',
  RecentQueriesFetched = 'compass-query-bar/RecentQueriesFetched',
  FavoriteQueriesFetched = 'compass-query-bar/FavoriteQueriesFetched',
}

type ChangeReadonlyConnectionStatusAction = {
  type: QueryBarActions.ChangeReadonlyConnectionStatus;
  readonly: boolean;
};

type ToggleQueryOptionsAction = {
  type: QueryBarActions.ToggleQueryOptions;
  force?: boolean;
};

export const toggleQueryOptions = (
  force?: boolean
): ToggleQueryOptionsAction => {
  return { type: QueryBarActions.ToggleQueryOptions, force };
};

type ChangeFieldAction<T = QueryProperty> = {
  type: QueryBarActions.ChangeField;
  name: T;
  value: FormField<T>;
};

export const changeField = (
  name: QueryProperty,
  stringValue: string
): QueryBarThunkAction<void, ChangeFieldAction> => {
  return (dispatch, getState, { preferences }) => {
    const parsedValue = validateField(name, stringValue, {
      maxTimeMS: preferences.getPreferences().maxTimeMS ?? undefined,
    });
    const isValid = parsedValue !== false;
    dispatch({
      type: QueryBarActions.ChangeField,
      name,
      value: {
        string: stringValue,
        valid: isValid,
        value: isValid ? parsedValue : getState().queryBar.fields[name].value,
      },
    });
  };
};

type ApplyQueryAction = {
  type: QueryBarActions.ApplyQuery;
  query: BaseQuery;
  source: string;
};

export const applyQuery = (
  source: string
): QueryBarThunkAction<false | BaseQuery, ApplyQueryAction> => {
  return (dispatch, getState, { preferences }) => {
    const {
      queryBar: { fields, favoriteQueries },
    } = getState();
    if (!isQueryFieldsValid(fields, preferences.getPreferences())) {
      return false;
    }
    const query = mapFormFieldsToQuery(fields);
    dispatch({ type: QueryBarActions.ApplyQuery, query, source });
    const queryAttributes = getQueryAttributes(query);
    const existingFavoriteQuery = favoriteQueries.find((favoriteQuery) => {
      return isQueryEqual(getQueryAttributes(favoriteQuery), queryAttributes);
    });
    if (existingFavoriteQuery) {
      void dispatch(updateFavoriteQuery(existingFavoriteQuery));
    } else {
      void dispatch(saveRecentQuery(query));
    }
    return query;
  };
};

type ResetQueryAction = {
  type: QueryBarActions.ResetQuery;
  fields: QueryFormFields;
  source: string;
};

export const resetQuery = (
  source: string
): QueryBarThunkAction<false | Record<string, unknown>> => {
  return (dispatch, getState, { preferences }) => {
    if (isEqualDefaultQuery(getState().queryBar.fields)) {
      return false;
    }
    const fields = mapQueryToFormFields(
      { maxTimeMS: preferences.getPreferences().maxTimeMS },
      DEFAULT_FIELD_VALUES
    );
    dispatch({ type: QueryBarActions.ResetQuery, fields, source });
    return cloneDeep(DEFAULT_QUERY_VALUES);
  };
};

type SetQueryAction = {
  type: QueryBarActions.SetQuery;
  fields: QueryFormFields;
};

export const setQuery = (
  query: BaseQuery
): QueryBarThunkAction<void, SetQueryAction> => {
  return (dispatch, getState, { preferences }) => {
    const fields = mapQueryToFormFields(
      { maxTimeMS: preferences.getPreferences().maxTimeMS },
      query
    );
    dispatch({ type: QueryBarActions.SetQuery, fields });
  };
};

export const applyFilterChange = (
  event: ChangeFilterEvent
): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const currentFilterValue = getState().queryBar.fields.filter.value;
    dispatch(
      setQuery({
        filter: changeFilter(
          event.type,
          currentFilterValue,
          event.payload
        ) as Document,
      })
    );
  };
};

export const openExportToLanguage = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    localAppRegistry?.emit(
      'open-query-export-to-language',
      Object.fromEntries(
        Object.entries(getState().queryBar.fields).map(([key, field]) => {
          return [key, field.string];
        })
      ),
      'Query'
    );
  };
};

type ApplyFromHistoryAction = {
  type: QueryBarActions.ApplyFromHistory;
  fields: QueryFormFields;
};

export const applyFromHistory = (
  query: BaseQuery & { update?: Document }
): QueryBarThunkAction<void, ApplyFromHistoryAction> => {
  return (dispatch, getState, { localAppRegistry, preferences }) => {
    const fields = mapQueryToFormFields(
      { maxTimeMS: preferences.getPreferences().maxTimeMS },
      {
        ...DEFAULT_FIELD_VALUES,
        ...query,
      }
    );
    dispatch({
      type: QueryBarActions.ApplyFromHistory,
      fields,
    });

    if (query.update) {
      localAppRegistry?.emit('favorites-open-bulk-update-favorite', query);
    }
  };
};

type RecentQueriesFetchedAction = {
  type: QueryBarActions.RecentQueriesFetched;
  recents: RecentQuery[];
};
export const fetchRecents = (): QueryBarThunkAction<
  Promise<void>,
  RecentQueriesFetchedAction
> => {
  return async (
    dispatch,
    _getState,
    { recentQueryStorage, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { namespace },
      } = _getState();
      const recents = (await recentQueryStorage?.loadAll(namespace)) ?? [];
      dispatch({
        type: QueryBarActions.RecentQueriesFetched,
        recents,
      });
    } catch (e) {
      debug('Failed to fetch recent queries', e);
    }
  };
};

export const fetchSavedQueries = (): QueryBarThunkAction<void> => {
  return (dispatch) => {
    void dispatch(fetchRecents());
    void dispatch(fetchFavorites());
  };
};

type FavoriteQueriesFetchedAction = {
  type: QueryBarActions.FavoriteQueriesFetched;
  favorites: FavoriteQuery[];
};
export const fetchFavorites = (): QueryBarThunkAction<
  Promise<void>,
  FavoriteQueriesFetchedAction
> => {
  return async (
    dispatch,
    _getState,
    { favoriteQueryStorage, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { namespace },
      } = _getState();
      const favorites = (await favoriteQueryStorage?.loadAll(namespace)) ?? [];
      dispatch({
        type: QueryBarActions.FavoriteQueriesFetched,
        favorites,
      });
    } catch (e) {
      debug('Failed to fetch favorite queries', e);
    }
  };
};

export const explainQuery = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const {
      queryBar: { fields },
    } = getState();
    const { project, ...query } = mapFormFieldsToQuery(fields);
    localAppRegistry?.emit('open-explain-plan-modal', {
      query: { ...query, projection: project },
    });
  };
};

export const saveRecentAsFavorite = (
  recentQuery: RecentQuery,
  name: string
): QueryBarThunkAction<Promise<boolean>> => {
  return async (
    dispatch,
    getState,
    { favoriteQueryStorage, logger: { debug } }
  ) => {
    try {
      const now = new Date();
      const { _id, _host, _lastExecuted, _ns, ...baseQuery } = recentQuery;
      const favoriteQuery: FavoriteQuery = {
        ...getQueryAttributes(baseQuery),
        _id,
        _ns,
        _lastExecuted,
        _host: _host ?? getState().queryBar.host,
        _name: name,
        _dateSaved: now,
        _dateModified: now,
      };

      // add it in the favorite
      await favoriteQueryStorage?.updateAttributes(
        favoriteQuery._id,
        favoriteQuery
      );

      // update favorites
      void dispatch(fetchFavorites());

      // remove from recents
      void dispatch(deleteRecentQuery(_id));

      return true;
    } catch (e) {
      debug('Failed to save recent query as favorite', e);
      return false;
    }
  };
};

export const deleteRecentQuery = (
  id: string
): QueryBarThunkAction<Promise<void>> => {
  return async (
    dispatch,
    _getState,
    { recentQueryStorage, logger: { debug } }
  ) => {
    try {
      await recentQueryStorage?.delete(id);
      return dispatch(fetchRecents());
    } catch (e) {
      debug('Failed to delete recent query', e);
    }
  };
};

export const deleteFavoriteQuery = (
  id: string
): QueryBarThunkAction<Promise<void>> => {
  return async (
    dispatch,
    _getState,
    { favoriteQueryStorage, logger: { debug } }
  ) => {
    try {
      await favoriteQueryStorage?.delete(id);
      return dispatch(fetchFavorites());
    } catch (e) {
      debug('Failed to delete favorite query', e);
    }
  };
};

const saveRecentQuery = (
  query: Omit<BaseQuery, 'maxTimeMS'>
): QueryBarThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { recentQueryStorage, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { recentQueries, host, namespace },
      } = getState();

      const queryAttributes = getQueryAttributes(query);
      // Ignore empty or default queries
      if (isEmpty(queryAttributes)) {
        return;
      }

      // Ignore duplicate queries
      const existingQuery = recentQueries.find((recentQuery) => {
        return isQueryEqual(getQueryAttributes(recentQuery), queryAttributes);
      });

      if (existingQuery) {
        // update the existing query's lastExecuted to move it to the top
        const updateAttributes = {
          _host: existingQuery._host ?? host,
          _lastExecuted: new Date(),
        };
        await recentQueryStorage?.updateAttributes(
          existingQuery._id,
          updateAttributes
        );
        dispatch(fetchSavedQueries());
        return;
      }

      await recentQueryStorage?.saveQuery({
        ...queryAttributes,
        _ns: namespace,
        _host: host ?? '',
      });
      dispatch(fetchSavedQueries());
    } catch (e) {
      debug('Failed to save recent query', e);
    }
  };
};

const updateFavoriteQuery = (
  query: FavoriteQuery
): QueryBarThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { favoriteQueryStorage, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { host },
      } = getState();

      const queryAttributes = getQueryAttributes(query);
      // Ignore empty or default queries
      if (isEmpty(queryAttributes)) {
        return;
      }

      const updateAttributes = {
        _host: query._host ?? host,
        _lastExecuted: new Date(),
      };
      await favoriteQueryStorage?.updateAttributes(query._id, updateAttributes);
      // update favorites
      void dispatch(fetchFavorites());
    } catch (e) {
      debug('Failed to update favorite query', e);
    }
  };
};

export const queryBarReducer: Reducer<QueryBarState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<ChangeReadonlyConnectionStatusAction>(
      action,
      QueryBarActions.ChangeReadonlyConnectionStatus
    )
  ) {
    return {
      ...state,
      isReadonlyConnection: action.readonly,
    };
  }

  if (
    isAction<ToggleQueryOptionsAction>(
      action,
      QueryBarActions.ToggleQueryOptions
    )
  ) {
    return {
      ...state,
      expanded: action.force ?? !state.expanded,
    };
  }

  if (isAction<ChangeFieldAction>(action, QueryBarActions.ChangeField)) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [action.name]: action.value,
      },
    };
  }

  if (isAction<SetQueryAction>(action, QueryBarActions.SetQuery)) {
    return {
      ...state,
      fields: {
        ...state.fields,
        ...action.fields,
      },
    };
  }

  if (isAction<ApplyQueryAction>(action, QueryBarActions.ApplyQuery)) {
    return {
      ...state,
      lastAppliedQuery: {
        source: action.source,
        query: {
          ...state.lastAppliedQuery.query,
          [action.source]: action.query,
        },
      },
      applyId: (state.applyId + 1) % Number.MAX_SAFE_INTEGER,
    };
  }

  if (isAction<ResetQueryAction>(action, QueryBarActions.ResetQuery)) {
    return {
      ...state,
      fields: action.fields,
      lastAppliedQuery: {
        source: action.source,
        query: {
          ...state.lastAppliedQuery.query,
          [action.source]: null,
        },
      },
    };
  }

  if (
    isAction<ApplyFromHistoryAction>(action, QueryBarActions.ApplyFromHistory)
  ) {
    return {
      ...state,
      expanded: state.expanded || doesQueryHaveExtraOptionsSet(action.fields),
      fields: action.fields,
    };
  }

  if (
    isAction<AIQuerySucceededAction>(
      action,
      AIQueryActionTypes.AIQuerySucceeded
    )
  ) {
    return {
      ...state,
      expanded: state.expanded || doesQueryHaveExtraOptionsSet(action.fields),
      fields: action.fields,
    };
  }

  if (
    isAction<RecentQueriesFetchedAction>(
      action,
      QueryBarActions.RecentQueriesFetched
    )
  ) {
    return {
      ...state,
      recentQueries: action.recents,
    };
  }

  if (
    isAction<FavoriteQueriesFetchedAction>(
      action,
      QueryBarActions.FavoriteQueriesFetched
    )
  ) {
    return {
      ...state,
      favoriteQueries: action.favorites,
    };
  }

  return state;
};
