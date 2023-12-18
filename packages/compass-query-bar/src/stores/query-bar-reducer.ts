import type { Reducer } from 'redux';
import { cloneDeep, isEmpty } from 'lodash';
import type { Document } from 'mongodb';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

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
import { getQueryAttributes, isAction, isQueryEqual } from '../utils';
import type {
  RecentQuery,
  FavoriteQuery,
} from '@mongodb-js/my-queries-storage';
const { debug } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

type QueryBarState = {
  isReadonlyConnection: boolean;
  fields: QueryFormFields;
  expanded: boolean;
  serverVersion: string;
  schemaFields: unknown[];
  lastAppliedQuery: BaseQuery | null;
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
  fields: mapQueryToFormFields(DEFAULT_FIELD_VALUES),
  expanded: false,
  serverVersion: '3.6.0',
  schemaFields: [],
  lastAppliedQuery: null,
  applyId: 0,
  namespace: '',
  recentQueries: [],
  favoriteQueries: [],
};

export enum QueryBarActions {
  ChangeReadonlyConnectionStatus = 'compass-query-bar/ChangeReadonlyConnectionStatus',
  ToggleQueryOptions = 'compass-query-bar/ToggleQueryOptions',
  ChangeField = 'compass-query-bar/ChangeField',
  ChangeSchemaFields = 'compass-query-bar/ChangeSchemaFields',
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

type ChangeFieldAction = {
  type: QueryBarActions.ChangeField;
  name: QueryProperty;
  value: string;
};

/**
 * NB: this should only be called in apply or reset methods, doing this in any
 * other logical place will break a ton of logic in Compass that relies on this
 * not actually happening when query changed while user was typing
 */
const emitOnQueryChange = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const {
      queryBar: { lastAppliedQuery, fields },
    } = getState();
    const query = mapFormFieldsToQuery(fields);
    if (lastAppliedQuery === null || !isQueryEqual(lastAppliedQuery, query)) {
      localAppRegistry?.emit('query-changed', query);
    }
  };
};

export const changeField = (
  name: QueryProperty,
  value: string
): ChangeFieldAction => {
  return { type: QueryBarActions.ChangeField, name, value };
};

type ChangeSchemaFieldsAction = {
  type: QueryBarActions.ChangeSchemaFields;
  fields: unknown[];
};

export const changeSchemaFields = (
  fields: unknown[]
): ChangeSchemaFieldsAction => {
  return { type: QueryBarActions.ChangeSchemaFields, fields };
};

type ApplyQueryAction = {
  type: QueryBarActions.ApplyQuery;
  query: BaseQuery;
};

export const applyQuery = (): QueryBarThunkAction<
  false | BaseQuery,
  ApplyQueryAction
> => {
  return (dispatch, getState) => {
    const {
      queryBar: { fields },
    } = getState();
    if (!isQueryFieldsValid(fields)) {
      return false;
    }
    const query = mapFormFieldsToQuery(fields);
    dispatch(emitOnQueryChange());
    dispatch({ type: QueryBarActions.ApplyQuery, query });

    void dispatch(saveRecentQuery(query));
    return query;
  };
};

type ResetQueryAction = {
  type: QueryBarActions.ResetQuery;
};

export const resetQuery = (): QueryBarThunkAction<
  false | Record<string, unknown>
> => {
  return (dispatch, getState, { localAppRegistry }) => {
    if (isEqualDefaultQuery(getState().queryBar.fields)) {
      return false;
    }
    dispatch({ type: QueryBarActions.ResetQuery });
    dispatch(emitOnQueryChange());
    const defaultQuery = cloneDeep(DEFAULT_QUERY_VALUES);
    localAppRegistry?.emit('query-reset', defaultQuery);
    return defaultQuery;
  };
};

type SetQueryAction = {
  type: QueryBarActions.SetQuery;
  query: BaseQuery;
};

export const setQuery = (query: BaseQuery): SetQueryAction => {
  return { type: QueryBarActions.SetQuery, query };
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
  query: BaseQuery;
};

export const applyFromHistory = (
  query: BaseQuery & { update?: Document }
): QueryBarThunkAction<void, ApplyFromHistoryAction> => {
  return (dispatch, getState, { localAppRegistry }) => {
    dispatch({
      type: QueryBarActions.ApplyFromHistory,
      query,
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
  return async (dispatch, _getState, { recentQueryStorage }) => {
    try {
      const recents = await recentQueryStorage.loadAll();
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
  return async (dispatch, _getState, { favoriteQueryStorage }) => {
    try {
      const favorites = await favoriteQueryStorage.loadAll();
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
  return async (dispatch, getState, { favoriteQueryStorage }) => {
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
      await favoriteQueryStorage.updateAttributes(
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
  return async (dispatch, _getState, { recentQueryStorage }) => {
    try {
      await recentQueryStorage.delete(id);
      return dispatch(fetchRecents());
    } catch (e) {
      debug('Failed to delete recent query', e);
    }
  };
};

export const deleteFavoriteQuery = (
  id: string
): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { favoriteQueryStorage }) => {
    try {
      await favoriteQueryStorage.delete(id);
      return dispatch(fetchFavorites());
    } catch (e) {
      debug('Failed to delete favorite query', e);
    }
  };
};

const saveRecentQuery = (
  query: Omit<BaseQuery, 'maxTimeMS'>
): QueryBarThunkAction<Promise<void>> => {
  return async (_dispatch, getState, { recentQueryStorage }) => {
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
        await recentQueryStorage.updateAttributes(
          existingQuery._id,
          updateAttributes
        );
        return;
      }

      await recentQueryStorage.saveQuery({
        ...queryAttributes,
        _ns: namespace,
        _host: host ?? '',
      });
    } catch (e) {
      debug('Failed to save recent query', e);
    }
  };
};

export const queryBarReducer: Reducer<QueryBarState> = (
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
    const newValue = validateField(action.name, action.value);
    const valid = newValue !== false;
    return {
      ...state,
      fields: {
        ...state.fields,
        [action.name]: {
          string: action.value,
          valid: valid,
          value: valid ? newValue : state.fields[action.name].value,
        },
      },
    };
  }

  if (isAction<SetQueryAction>(action, QueryBarActions.SetQuery)) {
    return {
      ...state,
      fields: {
        ...state.fields,
        ...mapQueryToFormFields(action.query),
      },
    };
  }

  if (isAction<ApplyQueryAction>(action, QueryBarActions.ApplyQuery)) {
    return {
      ...state,
      lastAppliedQuery: action.query,
      applyId: (state.applyId + 1) % Number.MAX_SAFE_INTEGER,
    };
  }

  if (isAction<ResetQueryAction>(action, QueryBarActions.ResetQuery)) {
    return {
      ...state,
      lastAppliedQuery: null,
      fields: mapQueryToFormFields(DEFAULT_FIELD_VALUES),
    };
  }

  if (
    isAction<ChangeSchemaFieldsAction>(
      action,
      QueryBarActions.ChangeSchemaFields
    )
  ) {
    return {
      ...state,
      schemaFields: action.fields,
    };
  }

  if (
    isAction<ApplyFromHistoryAction>(action, QueryBarActions.ApplyFromHistory)
  ) {
    return {
      ...state,
      fields: mapQueryToFormFields({
        ...DEFAULT_FIELD_VALUES,
        ...(action.query ?? {}),
      }),
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
