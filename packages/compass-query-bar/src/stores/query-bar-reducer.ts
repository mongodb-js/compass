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
import { getQueryAttributes, isAction, isQueryEqual } from '../utils';
import type {
  RecentQuery,
  FavoriteQuery,
} from '@mongodb-js/my-queries-storage';
import type {
  FilterCombinator,
  FilterRule,
  ProjectionEntry,
  SortEntry,
} from '../utils/visual-builder-serialize';
import {
  isFilterRepresentable,
  isProjectionRepresentable,
  isSortRepresentable,
  serializeFilter,
  serializeProjection,
  serializeSort,
} from '../utils/visual-builder-serialize';
import {
  getOperatorsForType,
  normalizeBsonType,
} from '../constants/visual-builder-operators';

export type VisualBuilderState = {
  isVisible: boolean;
  combinator: FilterCombinator;
  rules: FilterRule[];
  projection: ProjectionEntry[];
  sort: SortEntry[];
  representable: boolean;
};

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
  visualBuilder: VisualBuilderState;
};

const INITIAL_VISUAL_BUILDER_STATE: VisualBuilderState = {
  isVisible: false,
  combinator: '$and',
  rules: [],
  projection: [],
  sort: [],
  representable: true,
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
  visualBuilder: INITIAL_VISUAL_BUILDER_STATE,
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
  VisualBuilderToggle: 'compass-query-bar/VisualBuilderToggle',
  VisualBuilderUpdate: 'compass-query-bar/VisualBuilderUpdate',
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
};

export const applyFromHistory = (
  query: BaseQuery & { update?: Document },
  currentQueryFieldsToRetain: QueryProperty[] = []
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
    });

    if (query.update) {
      localAppRegistry?.emit('favorites-open-bulk-update-favorite', query);
    }
  };
};

type VisualBuilderToggleAction = {
  type: typeof QueryBarActions.VisualBuilderToggle;
  force?: boolean;
};

type VisualBuilderUpdateAction = {
  type: typeof QueryBarActions.VisualBuilderUpdate;
  state: VisualBuilderState;
};

function uniqueId(): string {
  // Crypto-quality not needed; collisions only have to be avoided within one
  // open panel session.
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
}

function pushFieldsForVisualBuilder(
  next: VisualBuilderState
): QueryBarThunkAction<void> {
  return (dispatch) => {
    const filterString = serializeFilter(next.rules, next.combinator);
    const projectionString = serializeProjection(next.projection);
    const sortString = serializeSort(next.sort);
    dispatch(changeField('filter', filterString));
    dispatch(changeField('project', projectionString));
    dispatch(changeField('sort', sortString));
  };
}

export const toggleVisualBuilder = (
  force?: boolean
): QueryBarThunkAction<void, VisualBuilderToggleAction> => {
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const prevVisible = getState().queryBar.visualBuilder.isVisible;
    dispatch({ type: QueryBarActions.VisualBuilderToggle, force });
    const nextVisible = getState().queryBar.visualBuilder.isVisible;
    if (!prevVisible && nextVisible) {
      track?.(
        'Visual Query Builder Opened',
        {
          has_existing_filter:
            getState().queryBar.fields.filter.string !== '' &&
            getState().queryBar.fields.filter.string !== '{}',
        },
        connectionInfoRef?.current
      );
    }
  };
};

export const addFilterRule = (options: {
  path: string;
  bsonType: string | string[] | undefined;
  // Optional pre-filled value (set by the cross-plugin value-drag drop). When
  // provided, the new rule is immediately re-validated and its serialized
  // filter contains the value. Empty string preserves the existing
  // sidebar-drag behaviour (rule starts blank).
  valueString?: string;
}): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const normalized = normalizeBsonType(options.bsonType);
    const operators = getOperatorsForType(normalized);
    const initialValueString = options.valueString ?? '';
    const seedRule: FilterRule = {
      id: uniqueId(),
      path: options.path,
      bsonType: normalized,
      operator: operators.default,
      valueString: initialValueString,
      value: undefined,
      valid: operators.default === '$exists',
    };
    const newRule = recomputeRuleValidity(seedRule);
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      rules: [...current.rules, newRule],
      representable: true,
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

function recomputeRuleValidity(rule: FilterRule): FilterRule {
  if (rule.operator === '$exists') {
    return { ...rule, valid: true };
  }
  const trimmed = rule.valueString.trim();
  if (trimmed === '') {
    return { ...rule, valid: false };
  }
  if (rule.operator === '$size') {
    const n = Number(trimmed);
    return { ...rule, valid: !Number.isNaN(n) };
  }
  return { ...rule, valid: true };
}

export const updateFilterRule = (
  id: string,
  patch: Partial<
    Pick<FilterRule, 'operator' | 'valueString' | 'value' | 'valid'>
  >
): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const rules = current.rules.map((r) => {
      if (r.id !== id) return r;
      const merged = { ...r, ...patch };
      return recomputeRuleValidity(merged);
    });
    const next: VisualBuilderState = { ...current, rules };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const removeFilterRule = (id: string): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      rules: current.rules.filter((r) => r.id !== id),
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const setCombinator = (
  combinator: FilterCombinator
): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = { ...current, combinator };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const addProjectionEntry = (options: {
  path: string;
}): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    if (current.projection.some((p) => p.path === options.path)) {
      return;
    }
    const next: VisualBuilderState = {
      ...current,
      projection: [
        ...current.projection,
        { id: uniqueId(), path: options.path, mode: 1 },
      ],
      representable: true,
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const toggleProjectionMode = (id: string): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      projection: current.projection.map((p) =>
        p.id === id ? { ...p, mode: p.mode === 1 ? 0 : 1 } : p
      ),
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const removeProjectionEntry = (
  id: string
): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      projection: current.projection.filter((p) => p.id !== id),
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const addSortEntry = (options: {
  path: string;
}): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    if (current.sort.some((s) => s.path === options.path)) {
      return;
    }
    const next: VisualBuilderState = {
      ...current,
      sort: [
        ...current.sort,
        { id: uniqueId(), path: options.path, direction: 1 },
      ],
      representable: true,
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const toggleSortDirection = (id: string): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      sort: current.sort.map((s) =>
        s.id === id ? { ...s, direction: s.direction === 1 ? -1 : 1 } : s
      ),
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const reorderSort = (
  activeId: string,
  overId: string
): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const oldIndex = current.sort.findIndex((s) => s.id === activeId);
    const newIndex = current.sort.findIndex((s) => s.id === overId);
    if (oldIndex < 0 || newIndex < 0 || oldIndex === newIndex) {
      return;
    }
    const sort = [...current.sort];
    const [moved] = sort.splice(oldIndex, 1);
    sort.splice(newIndex, 0, moved);
    const next: VisualBuilderState = { ...current, sort };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const removeSortEntry = (id: string): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      sort: current.sort.filter((s) => s.id !== id),
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

export const clearVisualBuilder = (): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    const current = getState().queryBar.visualBuilder;
    const next: VisualBuilderState = {
      ...current,
      rules: [],
      projection: [],
      sort: [],
      representable: true,
    };
    dispatch({ type: QueryBarActions.VisualBuilderUpdate, state: next });
    dispatch(pushFieldsForVisualBuilder(next));
  };
};

// Telemetry-only thunk fired when the user clicks the panel's RUN button. The
// actual apply (and the host plugin's grid refresh) is handled by calling the
// host's `onApply` callback (the same one the regular Find button uses) — that
// is the only path that goes all the way through to `store.refreshDocuments`.
export const applyVisualBuilder = (): QueryBarThunkAction<void> => {
  return (_dispatch, getState, { track, connectionInfoRef }) => {
    const vb = getState().queryBar.visualBuilder;
    track?.(
      'Visual Query Builder Applied',
      {
        rule_count: vb.rules.length,
        combinator: vb.combinator,
        projection_count: vb.projection.length,
        sort_count: vb.sort.length,
        used_operators: Array.from(new Set(vb.rules.map((r) => r.operator))),
      },
      connectionInfoRef?.current
    );
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

function computeRepresentable(fields: QueryFormFields, prev: boolean): boolean {
  // Only flip when every relevant field is valid; invalid parses are user
  // typing in progress and shouldn't disturb the panel.
  if (
    fields.filter?.valid === false ||
    fields.project?.valid === false ||
    fields.sort?.valid === false
  ) {
    return prev;
  }
  return (
    isFilterRepresentable(fields.filter?.value) &&
    isProjectionRepresentable(fields.project?.value) &&
    isSortRepresentable(fields.sort?.value)
  );
}

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
    const fields = { ...state.fields, [action.name]: action.value };
    let visualBuilder = state.visualBuilder;
    if (
      action.name === 'filter' ||
      action.name === 'project' ||
      action.name === 'sort'
    ) {
      visualBuilder = {
        ...visualBuilder,
        representable: computeRepresentable(
          fields,
          visualBuilder.representable
        ),
      };
    }
    return { ...state, fields, visualBuilder };
  }

  if (isAction<SetQueryAction>(action, QueryBarActions.SetQuery)) {
    const fields = { ...state.fields, ...action.fields };
    return {
      ...state,
      fields,
      visualBuilder: {
        ...state.visualBuilder,
        representable: computeRepresentable(
          fields,
          state.visualBuilder.representable
        ),
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
      visualBuilder: {
        ...state.visualBuilder,
        rules: [],
        projection: [],
        sort: [],
        representable: true,
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
      visualBuilder: {
        ...state.visualBuilder,
        representable: computeRepresentable(action.fields, true),
      },
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
      visualBuilder: {
        ...state.visualBuilder,
        representable: computeRepresentable(action.fields, true),
      },
    };
  }

  if (
    isAction<VisualBuilderToggleAction>(
      action,
      QueryBarActions.VisualBuilderToggle
    )
  ) {
    return {
      ...state,
      visualBuilder: {
        ...state.visualBuilder,
        isVisible: action.force ?? !state.visualBuilder.isVisible,
      },
    };
  }

  if (
    isAction<VisualBuilderUpdateAction>(
      action,
      QueryBarActions.VisualBuilderUpdate
    )
  ) {
    return {
      ...state,
      visualBuilder: action.state,
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
