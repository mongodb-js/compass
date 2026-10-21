import type { Action, Reducer } from 'redux';
import { cloneDeep, isEmpty, omit, omitBy, pick } from 'lodash';
import type { Document } from 'mongodb';
import { UUID } from 'bson';
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
import { QUERY_PROPERTIES } from '../constants/query-properties';
import {
  mapFormFieldsToQuery,
  mapQueryToFormFields,
  getDefaultFormFields,
  isEqualDefaultQuery,
  doesQueryHaveExtraOptionsSet,
} from '../utils/query';
import { isQueryFieldsValid, validateField } from '../utils/validate-query';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { changeFilter } from '../modules/change-filter';
import { getQueryAttributes, isAction, isQueryEqual } from '../utils';
import type {
  RecentQuery,
  FavoriteQuery,
} from '@mongodb-js/my-queries-storage';

type QueryBarState = {
  isReadonlyConnection: boolean;
  fields: QueryFormFields;
  pendingParseFieldRequestIds: Partial<Record<QueryProperty, string>>;
  // Tracked separately from the field requests so that cancelling a history
  // query never discards the validation of a field edited before it.
  pendingHistoryRequestId: string | null;
  lastFilterChangeRequestId: string | null;
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
  isInterpretLoading: boolean;
};

export const INITIAL_STATE: QueryBarState = {
  isReadonlyConnection: false,
  fields: getDefaultFormFields(),
  pendingParseFieldRequestIds: {},
  pendingHistoryRequestId: null,
  lastFilterChangeRequestId: null,
  expanded: false,
  serverVersion: '3.6.0',
  lastAppliedQuery: { source: null, query: {} },
  applyId: 0,
  namespace: '',
  recentQueries: [],
  favoriteQueries: [],
  isInterpretLoading: false,
};

export const QueryBarActions = {
  ChangeReadonlyConnectionStatus:
    'compass-query-bar/ChangeReadonlyConnectionStatus',
  ToggleQueryOptions: 'compass-query-bar/ToggleQueryOptions',
  ChangeFieldText: 'compass-query-bar/ChangeFieldText',
  ChangeField: 'compass-query-bar/ChangeField',
  QueryUnsafeIntegerReceived: 'compass-query-bar/QueryUnsafeIntegerReceived',
  SetQueryStarted: 'compass-query-bar/SetQueryStarted',
  SetQueryFinished: 'compass-query-bar/SetQueryFinished',
  FilterChangeStarted: 'compass-query-bar/FilterChangeStarted',
  ApplyQuery: 'compass-query-bar/ApplyQuery',
  ResetQuery: 'compass-query-bar/ResetQuery',
  ApplyFromHistoryStarted: 'compass-query-bar/ApplyFromHistoryStarted',
  ApplyFromHistoryFinished: 'compass-query-bar/ApplyFromHistoryFinished',
  RecentQueriesFetched: 'compass-query-bar/RecentQueriesFetched',
  FavoriteQueriesFetched: 'compass-query-bar/FavoriteQueriesFetched',
  InterpretStarted: 'compass-query-bar/InterpretStarted',
  InterpretFinished: 'compass-query-bar/InterpretFinished',
} as const;

type ChangeReadonlyConnectionStatusAction = {
  type: typeof QueryBarActions.ChangeReadonlyConnectionStatus;
  readonly: boolean;
};

type ToggleQueryOptionsAction = {
  type: typeof QueryBarActions.ToggleQueryOptions;
  force?: boolean;
};

export const toggleQueryOptions = (
  force?: boolean
): ToggleQueryOptionsAction => {
  return { type: QueryBarActions.ToggleQueryOptions, force };
};

type ChangeFieldTextAction = {
  type: typeof QueryBarActions.ChangeFieldText;
  name: QueryProperty;
  string: string;
  requestId: string;
};

type ChangeFieldValueAction<T = QueryProperty> = {
  type: typeof QueryBarActions.ChangeField;
  name: T;
  value: FormField<T>;
  requestId: string;
};

export function hasPendingFieldValidation(state: QueryBarState): boolean {
  return (
    Object.keys(state.pendingParseFieldRequestIds).length > 0 ||
    state.pendingHistoryRequestId !== null
  );
}

// Filter changes update `filter.value` right away, so only a pending text edit
// or query leaves it behind the text that is about to replace it
function isFilterValueOutdated(state: QueryBarState): boolean {
  const requestId = state.pendingParseFieldRequestIds.filter;
  return (
    requestId !== undefined && requestId !== state.lastFilterChangeRequestId
  );
}

type QueryUnsafeIntegerReceivedAction = {
  type: typeof QueryBarActions.QueryUnsafeIntegerReceived;
};

export function unsafeIntegerReceived(
  name: QueryProperty
): QueryBarThunkAction<void, QueryUnsafeIntegerReceivedAction> {
  return (dispatch) => {
    if (name === 'filter') {
      dispatch({
        type: QueryBarActions.QueryUnsafeIntegerReceived,
      });
    }
  };
}

export const changeField = (
  name: QueryProperty,
  stringValue: string
): QueryBarThunkAction<
  Promise<void>,
  ChangeFieldTextAction | ChangeFieldValueAction
> => {
  return async (dispatch, getState, { preferences }) => {
    const requestId = new UUID().toString();
    dispatch({
      type: QueryBarActions.ChangeFieldText,
      name,
      string: stringValue,
      requestId,
    });
    const parsedValue = await validateField(name, stringValue, {
      maxTimeMS: preferences.getPreferences().maxTimeMS ?? undefined,
      maxTimeMSEnvLimit: preferences.getPreferences().maxTimeMSEnvLimit,
    });
    const isValid = parsedValue !== false;
    dispatch({
      type: QueryBarActions.ChangeField,
      name,
      requestId,
      value: {
        string: stringValue,
        valid: isValid,
        value: isValid ? parsedValue : getState().queryBar.fields[name].value,
      },
    });
  };
};

type ApplyQueryAction = {
  type: typeof QueryBarActions.ApplyQuery;
  query: BaseQuery;
  source: string;
};

export const applyQuery = (
  source: string
): QueryBarThunkAction<Promise<false | BaseQuery>, ApplyQueryAction> => {
  return async (dispatch, getState, { preferences }) => {
    // While a field is being validated its parsed value still belongs to the
    // previous text, so applying now would run an outdated query
    if (hasPendingFieldValidation(getState().queryBar)) {
      return false;
    }
    const {
      queryBar: { fields, favoriteQueries },
    } = getState();
    if (!(await isQueryFieldsValid(fields, preferences.getPreferences()))) {
      return false;
    }
    // The form was edited, reset or started parsing a new query during
    // validation, so `fields` is outdated
    if (
      getState().queryBar.fields !== fields ||
      hasPendingFieldValidation(getState().queryBar)
    ) {
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
  type: typeof QueryBarActions.ResetQuery;
  fields: QueryFormFields;
  source: string;
};

export const resetQuery = (
  source: string
): QueryBarThunkAction<Promise<false | Record<string, unknown>>> => {
  return async (dispatch, getState, { preferences }) => {
    if (isEqualDefaultQuery(getState().queryBar.fields)) {
      return false;
    }
    const fields = await mapQueryToFormFields(
      preferences.getPreferences(),
      DEFAULT_FIELD_VALUES
    );
    dispatch({ type: QueryBarActions.ResetQuery, fields, source });
    return cloneDeep(DEFAULT_QUERY_VALUES);
  };
};

type SetQueryStartedAction = {
  type: typeof QueryBarActions.SetQueryStarted;
  names: QueryProperty[];
  requestId: string;
};

type SetQueryFinishedAction = {
  type: typeof QueryBarActions.SetQueryFinished;
  fields: QueryFormFields;
  requestId: string;
};

export const setQuery = (
  query: BaseQuery
): QueryBarThunkAction<
  Promise<void>,
  SetQueryStartedAction | SetQueryFinishedAction
> => {
  return async (dispatch, getState, { preferences }) => {
    const requestId = new UUID().toString();
    dispatch({
      type: QueryBarActions.SetQueryStarted,
      names: QUERY_PROPERTIES.filter((name) => name in query),
      requestId,
    });
    const fields = await mapQueryToFormFields(
      preferences.getPreferences(),
      query
    );
    dispatch({ type: QueryBarActions.SetQueryFinished, fields, requestId });
  };
};

type FilterChangeStartedAction = {
  type: typeof QueryBarActions.FilterChangeStarted;
  filter: Document;
  requestId: string;
};

export const applyFilterChange = (
  event: ChangeFilterEvent
): QueryBarThunkAction<
  Promise<void>,
  FilterChangeStartedAction | SetQueryFinishedAction
> => {
  return async (dispatch, getState, { preferences }) => {
    // Building on the outdated value would drop the pending edit once this
    // change replaces its request
    if (isFilterValueOutdated(getState().queryBar)) {
      return;
    }
    const filter = changeFilter(
      event.type,
      getState().queryBar.fields.filter.value,
      event.payload
    ) as Document;
    const requestId = new UUID().toString();
    dispatch({ type: QueryBarActions.FilterChangeStarted, filter, requestId });
    const fields = await mapQueryToFormFields(preferences.getPreferences(), {
      filter,
    });
    dispatch({ type: QueryBarActions.SetQueryFinished, fields, requestId });
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

type ApplyFromHistoryStartedAction = {
  type: typeof QueryBarActions.ApplyFromHistoryStarted;
  requestId: string;
};

type ApplyFromHistoryFinishedAction = {
  type: typeof QueryBarActions.ApplyFromHistoryFinished;
  fields: QueryFormFields;
  requestId: string;
  fieldsToRetain: QueryProperty[];
  // bulk update queries: the bulk update modal reads its
  // filter from the last applied query
  applyToSource?: string;
};

export const applyFromHistory = (
  query: BaseQuery & { update?: Document },
  currentQueryFieldsToRetain: QueryProperty[] = []
): QueryBarThunkAction<
  Promise<void>,
  ApplyFromHistoryStartedAction | ApplyFromHistoryFinishedAction
> => {
  return async (dispatch, getState, { localAppRegistry, preferences }) => {
    const requestId = new UUID().toString();
    dispatch({ type: QueryBarActions.ApplyFromHistoryStarted, requestId });
    const fields = await mapQueryToFormFields(preferences.getPreferences(), {
      ...DEFAULT_FIELD_VALUES,
      ...query,
    });
    const isLatestRequest =
      getState().queryBar.pendingHistoryRequestId === requestId;
    dispatch({
      type: QueryBarActions.ApplyFromHistoryFinished,
      fields,
      requestId,
      fieldsToRetain: currentQueryFieldsToRetain,
      applyToSource: query.update ? 'crud' : undefined,
    });

    if (isLatestRequest && query.update) {
      localAppRegistry?.emit('favorites-open-bulk-update-favorite', query);
    }
  };
};

type RecentQueriesFetchedAction = {
  type: typeof QueryBarActions.RecentQueriesFetched;
  recents: RecentQuery[];
};
export const fetchRecents = (): QueryBarThunkAction<
  Promise<void>,
  RecentQueriesFetchedAction
> => {
  return async (
    dispatch,
    _getState,
    { recentQueryStorage, logger: { debug }, preferences }
  ) => {
    try {
      // Check if My Queries feature is enabled
      const { enableMyQueries } = preferences.getPreferences();
      if (!enableMyQueries) {
        // If feature is disabled, dispatch empty array
        dispatch({
          type: QueryBarActions.RecentQueriesFetched,
          recents: [],
        });
        return;
      }

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
  return (dispatch, _getState, { preferences }) => {
    // Check if My Queries feature is enabled
    const { enableMyQueries } = preferences.getPreferences();
    if (!enableMyQueries) {
      // If feature is disabled, don't fetch anything
      return;
    }

    void dispatch(fetchRecents());
    void dispatch(fetchFavorites());
  };
};

type FavoriteQueriesFetchedAction = {
  type: typeof QueryBarActions.FavoriteQueriesFetched;
  favorites: FavoriteQuery[];
};
export const fetchFavorites = (): QueryBarThunkAction<
  Promise<void>,
  FavoriteQueriesFetchedAction
> => {
  return async (
    dispatch,
    _getState,
    { favoriteQueryStorage, logger: { debug }, preferences }
  ) => {
    try {
      // Check if My Queries feature is enabled
      const { enableMyQueries } = preferences.getPreferences();
      if (!enableMyQueries) {
        // If feature is disabled, dispatch empty array
        dispatch({
          type: QueryBarActions.FavoriteQueriesFetched,
          favorites: [],
        });
        return;
      }

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

export type ExplainMode = 'visual-tree' | 'raw-output' | 'interpret';

export const explainQuery = (
  mode: ExplainMode = 'visual-tree'
): QueryBarThunkAction<void> => {
  return (_dispatch, getState, { localAppRegistry }) => {
    const {
      queryBar: { fields },
    } = getState();
    const { project, ...query } = mapFormFieldsToQuery(fields);
    const payload = { query: { ...query, projection: project } };

    if (mode === 'interpret') {
      localAppRegistry?.emit('open-explain-plan-for-interpret', payload);
      return;
    }

    localAppRegistry?.emit('open-explain-plan-modal', {
      ...payload,
      ...(mode === 'raw-output' ? { initialViewType: 'json' as const } : {}),
    });
  };
};

export const explainQueryRawOutput = (): QueryBarThunkAction<void> =>
  explainQuery('raw-output');

export const explainQueryInterpret = (): QueryBarThunkAction<void> =>
  explainQuery('interpret');

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
      await favoriteQueryStorage?.saveQuery(favoriteQuery, favoriteQuery._id);

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

  if (
    isAction<ChangeFieldTextAction>(action, QueryBarActions.ChangeFieldText)
  ) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [action.name]: {
          ...state.fields[action.name],
          string: action.string,
        },
      },
      pendingParseFieldRequestIds: {
        ...state.pendingParseFieldRequestIds,
        [action.name]: action.requestId,
      },
      pendingHistoryRequestId: null,
    };
  }

  if (
    isAction<ChangeFieldValueAction>(action, QueryBarActions.ChangeField) &&
    state.pendingParseFieldRequestIds[action.name] === action.requestId
  ) {
    return {
      ...state,
      fields: {
        ...state.fields,
        [action.name]: action.value,
      },
      pendingParseFieldRequestIds: omit(
        state.pendingParseFieldRequestIds,
        action.name
      ),
    };
  }

  if (
    isAction<QueryUnsafeIntegerReceivedAction>(
      action,
      QueryBarActions.QueryUnsafeIntegerReceived
    )
  ) {
    return {
      ...state,
      fields: {
        ...state.fields,
        filter: {
          ...state.fields.filter,
          valid: false,
        },
      },
    };
  }

  if (
    isAction<SetQueryStartedAction>(action, QueryBarActions.SetQueryStarted)
  ) {
    return {
      ...state,
      pendingParseFieldRequestIds: {
        ...state.pendingParseFieldRequestIds,
        ...Object.fromEntries(
          action.names.map((name) => [name, action.requestId])
        ),
      },
      pendingHistoryRequestId: null,
    };
  }

  if (
    isAction<FilterChangeStartedAction>(
      action,
      QueryBarActions.FilterChangeStarted
    )
  ) {
    return {
      ...state,
      fields: {
        ...state.fields,
        filter: { ...state.fields.filter, value: action.filter },
      },
      pendingParseFieldRequestIds: {
        ...state.pendingParseFieldRequestIds,
        filter: action.requestId,
      },
      pendingHistoryRequestId: null,
      lastFilterChangeRequestId: action.requestId,
    };
  }

  if (
    isAction<SetQueryFinishedAction>(action, QueryBarActions.SetQueryFinished)
  ) {
    // Fields edited, reset or set by a newer query meanwhile no longer point
    // at this request, so they keep their newer value.
    const fieldsToUpdate = QUERY_PROPERTIES.filter(
      (name) => state.pendingParseFieldRequestIds[name] === action.requestId
    );
    if (fieldsToUpdate.length === 0) {
      return state;
    }
    return {
      ...state,
      fields: { ...state.fields, ...pick(action.fields, fieldsToUpdate) },
      pendingParseFieldRequestIds: omitBy(
        state.pendingParseFieldRequestIds,
        (requestId) => requestId === action.requestId
      ),
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
      pendingParseFieldRequestIds: {},
      pendingHistoryRequestId: null,
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
    isAction<ApplyFromHistoryStartedAction>(
      action,
      QueryBarActions.ApplyFromHistoryStarted
    )
  ) {
    return {
      ...state,
      pendingHistoryRequestId: action.requestId,
    };
  }

  if (
    isAction<ApplyFromHistoryFinishedAction>(
      action,
      QueryBarActions.ApplyFromHistoryFinished
    )
  ) {
    // Any newer edit, reset or query selection made while the history query
    // was parsed cancels it.
    if (state.pendingHistoryRequestId !== action.requestId) {
      return state;
    }
    // Retained fields are taken from the current state rather than parsed
    // with the history query, so an edit still being validated is kept
    const fields = {
      ...action.fields,
      ...pick(state.fields, action.fieldsToRetain),
    };
    return {
      ...state,
      expanded: state.expanded || doesQueryHaveExtraOptionsSet(fields),
      fields,
      pendingParseFieldRequestIds: pick(
        state.pendingParseFieldRequestIds,
        action.fieldsToRetain
      ),
      pendingHistoryRequestId: null,
      lastAppliedQuery: action.applyToSource
        ? {
            source: action.applyToSource,
            query: {
              ...state.lastAppliedQuery.query,
              [action.applyToSource]: mapFormFieldsToQuery(fields),
            },
          }
        : state.lastAppliedQuery,
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
      pendingParseFieldRequestIds: {},
      pendingHistoryRequestId: null,
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

  if (isAction<Action>(action, QueryBarActions.InterpretStarted)) {
    return { ...state, isInterpretLoading: true };
  }

  if (isAction<Action>(action, QueryBarActions.InterpretFinished)) {
    return { ...state, isInterpretLoading: false };
  }

  return state;
};
