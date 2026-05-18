import type { Action, Reducer } from 'redux';
import { cloneDeep, isEmpty } from 'lodash';
import { UUID } from 'bson';
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
import { getQueryAttributes, isAction, isQueryEqual } from '../utils';
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
  /**
   * Id of the currently loaded saved favorite, if the user opened one
   * from the query history popover. Drives the Save dropdown's "Save"
   * vs "Save as" behavior: when set, `Save` overwrites the loaded
   * favorite in place; when null, `Save` opens the modal to create a
   * new favorite. Cleared on Reset, on loading a Recent (not a
   * Favorite), and not affected by manual field edits.
   */
  loadedFavoriteId: string | null;
};

export const INITIAL_STATE: QueryBarState = {
  isReadonlyConnection: false,
  fields: mapQueryToFormFields({ maxTimeMSEnvLimit: 0 }, DEFAULT_FIELD_VALUES),
  expanded: false,
  serverVersion: '3.6.0',
  lastAppliedQuery: { source: null, query: {} },
  applyId: 0,
  namespace: '',
  recentQueries: [],
  favoriteQueries: [],
  loadedFavoriteId: null,
};

export const QueryBarActions = {
  ChangeReadonlyConnectionStatus:
    'compass-query-bar/ChangeReadonlyConnectionStatus',
  ToggleQueryOptions: 'compass-query-bar/ToggleQueryOptions',
  ChangeField: 'compass-query-bar/ChangeField',
  SetQuery: 'compass-query-bar/SetQuery',
  ApplyQuery: 'compass-query-bar/ApplyQuery',
  ResetQuery: 'compass-query-bar/ResetQuery',
  ApplyFromHistory: 'compass-query-bar/ApplyFromHistory',
  RecentQueriesFetched: 'compass-query-bar/RecentQueriesFetched',
  FavoriteQueriesFetched: 'compass-query-bar/FavoriteQueriesFetched',
  /**
   * Fired after a successful save-as / save-draft so the resulting
   * favorite immediately becomes the "loaded" favorite — clicking Save
   * again will then overwrite it in place rather than create yet another
   * duplicate.
   */
  LoadedFavoriteSet: 'compass-query-bar/LoadedFavoriteSet',
} as const;

type LoadedFavoriteSetAction = {
  type: typeof QueryBarActions.LoadedFavoriteSet;
  loadedFavoriteId: string | null;
};

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

type ChangeFieldAction<T = QueryProperty> = {
  type: typeof QueryBarActions.ChangeField;
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
      maxTimeMSEnvLimit: preferences.getPreferences().maxTimeMSEnvLimit,
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
  type: typeof QueryBarActions.ApplyQuery;
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
  type: typeof QueryBarActions.ResetQuery;
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
      preferences.getPreferences(),
      DEFAULT_FIELD_VALUES
    );
    dispatch({ type: QueryBarActions.ResetQuery, fields, source });
    return cloneDeep(DEFAULT_QUERY_VALUES);
  };
};

type SetQueryAction = {
  type: typeof QueryBarActions.SetQuery;
  fields: QueryFormFields;
};

export const setQuery = (
  query: BaseQuery
): QueryBarThunkAction<void, SetQueryAction> => {
  return (dispatch, getState, { preferences }) => {
    const fields = mapQueryToFormFields(preferences.getPreferences(), query);
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
  type: typeof QueryBarActions.ApplyFromHistory;
  fields: QueryFormFields;
  /**
   * Id of the saved favorite being loaded, or `null` when loading a
   * recent. Tracked in `state.loadedFavoriteId` so the Save dropdown
   * can offer in-place updates vs save-as-new.
   */
  loadedFavoriteId: string | null;
};

export const applyFromHistory = (
  query: BaseQuery & { update?: Document },
  currentQueryFieldsToRetain: QueryProperty[] = [],
  options: { favoriteId?: string | null } = {}
): QueryBarThunkAction<void, ApplyFromHistoryAction> => {
  return (dispatch, getState, { localAppRegistry, preferences }) => {
    const currentFields = getState().queryBar.fields;
    const currentQuery = currentQueryFieldsToRetain.reduce<
      Record<string, Document | number | string>
    >((acc, key) => {
      const { value } = currentFields[key];
      if (value) {
        acc[key] = value;
      }
      return acc;
    }, {});
    const fields = mapQueryToFormFields(preferences.getPreferences(), {
      ...DEFAULT_FIELD_VALUES,
      ...query,
      ...currentQuery,
    });
    dispatch({
      type: QueryBarActions.ApplyFromHistory,
      fields,
      loadedFavoriteId: options.favoriteId ?? null,
    });

    if (query.update) {
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

/**
 * Persist the user's current query-bar draft as a Favorite, without
 * requiring them to run it first (the previous flow only let you star a
 * Recent query after execution, which made the metadata-entry step
 * doubly opaque). Wired to the star IconButton in the query bar — that
 * button opens the SaveDraftAsFavoriteModal, which dispatches this
 * thunk on submit.
 *
 * Accepts an optional `description` + `mcpPromptName`; both feed the MCP
 * saved-queries catalog. The renderer-side write does NOT itself
 * enforce mcp-prompt-name uniqueness — the main-process storage adapter
 * dedupes on read, so a silently-conflicting prompt name is harmless
 * (the user can rename from the My Queries → Edit dialog).
 */
export const saveDraftAsFavorite = (input: {
  name: string;
  description?: string;
  mcpPromptName?: string;
}): QueryBarThunkAction<Promise<boolean>> => {
  return async (
    dispatch,
    getState,
    { favoriteQueryStorage, preferences, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { fields, host, namespace },
      } = getState();
      if (!isQueryFieldsValid(fields, preferences.getPreferences())) {
        return false;
      }
      const query = mapFormFieldsToQuery(fields);
      const queryAttributes = getQueryAttributes(query);
      if (isEmpty(queryAttributes)) {
        // Refuse to save a fully-default query — would surface as an
        // empty favorite in the My Queries list, which is just clutter.
        return false;
      }
      const now = new Date();
      const trimmedDescription = input.description?.trim();
      const trimmedPromptName = input.mcpPromptName?.trim();
      // Generate the id up front so we can dispatch LoadedFavoriteSet
      // with it after the write succeeds — that flips the bar's state
      // into "this is the favorite I'm editing", so the next `Save`
      // click updates this favorite in place instead of creating yet
      // another duplicate.
      const _id = new UUID().toString();
      const favoriteQuery: Partial<FavoriteQuery> = {
        ...queryAttributes,
        _id,
        _ns: namespace,
        _host: host ?? '',
        _name: input.name,
        _dateSaved: now,
        _dateModified: now,
        _authoredBy: 'human',
        ...(trimmedDescription ? { _description: trimmedDescription } : {}),
        ...(trimmedPromptName ? { _mcpPromptName: trimmedPromptName } : {}),
      };

      await favoriteQueryStorage?.saveQuery(
        favoriteQuery as Omit<FavoriteQuery, '_lastExecuted'>,
        _id
      );
      void dispatch(fetchFavorites());
      dispatch({
        type: QueryBarActions.LoadedFavoriteSet,
        loadedFavoriteId: _id,
      });
      return true;
    } catch (e) {
      debug('Failed to save draft as favorite', e);
      return false;
    }
  };
};

/**
 * Rename the loaded favorite in place. Drives the inline-edit
 * affordance on the breadcrumb chip — the user clicks the name in the
 * chip and retypes it without leaving the bar. Trims whitespace and
 * refuses empty names (returning `false` so the chip can revert).
 *
 * Bumps `_dateModified` so the renamed item bubbles to the top of
 * "Recent" — same convention every other in-place edit (description /
 * MCP prompt name) follows.
 */
export const renameLoadedFavorite = (
  newName: string
): QueryBarThunkAction<Promise<boolean>> => {
  return async (
    dispatch,
    getState,
    { favoriteQueryStorage, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { loadedFavoriteId },
      } = getState();
      if (!loadedFavoriteId) return false;
      const trimmed = newName.trim();
      if (!trimmed) return false;
      await favoriteQueryStorage?.updateAttributes(loadedFavoriteId, {
        _name: trimmed,
        _dateModified: new Date(),
      });
      void dispatch(fetchFavorites());
      return true;
    } catch (e) {
      debug('Failed to rename loaded favorite', e);
      return false;
    }
  };
};

/**
 * Save the current draft on top of the favorite the user loaded from
 * the query-history popover. Behaves like a file-style "Save" — same
 * id, refreshed body, `_dateModified` bumped, description /
 * `_mcpPromptName` left intact. Resolves `false` if there's no loaded
 * favorite or the draft is invalid / empty.
 */
export const updateLoadedFavorite = (): QueryBarThunkAction<
  Promise<boolean>
> => {
  return async (
    dispatch,
    getState,
    { favoriteQueryStorage, preferences, logger: { debug } }
  ) => {
    try {
      const {
        queryBar: { fields, host, loadedFavoriteId },
      } = getState();
      if (!loadedFavoriteId) return false;
      if (!isQueryFieldsValid(fields, preferences.getPreferences())) {
        return false;
      }
      const query = mapFormFieldsToQuery(fields);
      const queryAttributes = getQueryAttributes(query);
      if (isEmpty(queryAttributes)) return false;

      // Overwrite the body fields. We deliberately do NOT touch
      // `_name`, `_description`, `_mcpPromptName`, `_dateSaved`,
      // `_authoredBy` — those are user-curated metadata; only the body
      // and `_dateModified` change under a Save (vs. Save as).
      await favoriteQueryStorage?.updateAttributes(loadedFavoriteId, {
        ...queryAttributes,
        _host: host ?? '',
        _dateModified: new Date(),
      });
      void dispatch(fetchFavorites());
      return true;
    } catch (e) {
      debug('Failed to update loaded favorite', e);
      return false;
    }
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
      // Reset starts fresh — any previously-loaded favorite is no longer
      // the "context" the bar is editing against.
      loadedFavoriteId: null,
    };
  }

  if (
    isAction<ApplyFromHistoryAction>(action, QueryBarActions.ApplyFromHistory)
  ) {
    return {
      ...state,
      expanded: state.expanded || doesQueryHaveExtraOptionsSet(action.fields),
      fields: action.fields,
      // Recents are not editable in place; only loading a saved favorite
      // arms the "Save (update)" affordance.
      loadedFavoriteId: action.loadedFavoriteId,
    };
  }

  if (
    isAction<LoadedFavoriteSetAction>(action, QueryBarActions.LoadedFavoriteSet)
  ) {
    return {
      ...state,
      loadedFavoriteId: action.loadedFavoriteId,
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
