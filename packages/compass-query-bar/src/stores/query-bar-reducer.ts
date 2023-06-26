import type { Reducer, AnyAction, Store } from 'redux';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryProperty, BaseQuery } from '../constants/query-properties';
import { QUERY_PROPERTIES } from '../constants/query-properties';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import type AppRegistry from 'hadron-app-registry';
import queryParser from 'mongodb-query-parser';
import preferences from 'compass-preferences-model';
import { cloneDeep, isEqual } from 'lodash';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { changeFilter } from '../modules/change-filter';
import {
  type FavoriteQueryStorage,
  type RecentQueryStorage,
  type RecentQuery,
  type FavoriteQuery,
  getQueryAttributes,
} from '../utils';
import _ from 'lodash';
import uuid from 'uuid';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { debug } = createLoggerAndTelemetry('COMPASS-QUERY-BAR-UI');

const TOTAL_RECENTS_ALLOWED = 30;

export function isQueryValid(state: QueryBarState) {
  return QUERY_PROPERTIES.every((prop) => {
    return state.fields[prop].valid;
  });
}

export function isQueryProperty(field: string): field is QueryProperty {
  return (QUERY_PROPERTIES as readonly string[]).includes(field);
}

export function validateField(field: string, value: string) {
  const validated = queryParser.validate(field, value, { validate: false });
  if (field === 'filter' && validated === '') {
    // TODO(COMPASS-5205): Things like { i: $} confuses queryParser and
    // ultimately it sets filter to '' whereas it has to be a {} (if valid) or
    // false (if invalid). Should probably be fixed in mongodb-query-parser,
    // though.
    return false;
  }

  // Additional validation for maxTimeMS to make sure that we are not over the
  // upper bound set in preferences
  if (field === 'maxTimeMS') {
    const preferencesMaxTimeMS = preferences.getPreferences().maxTimeMS;
    if (
      typeof preferencesMaxTimeMS !== 'undefined' &&
      value &&
      Number(value) >
        (preferencesMaxTimeMS ?? DEFAULT_FIELD_VALUES['maxTimeMS'])
    ) {
      return false;
    }
  }

  return validated;
}

export function isQueryFieldsValid(fields: Record<string, QueryBarFormField>) {
  return Object.entries(fields).every(
    ([key, value]) => validateField(key, value.string) !== false
  );
}

export function pickValuesFromFields(
  fields: Record<QueryProperty, QueryBarFormField>
): BaseQuery {
  // We always want filter field to be in the query, even if the field
  // is empty. Probably would be better to handle where the query is
  // actually used, but a lot of code in Compass relies on this
  return {
    filter: {},
    ...Object.fromEntries(
      Object.entries(fields)
        .map(([key, field]) => {
          return [key, field.value];
        })
        .filter(([, value]) => {
          return typeof value !== 'undefined';
        })
    ),
  };
}

/**
 * Map query document to the query fields state only preserving valid values
 */
export function mapQueryToValidQueryFields(query?: unknown, onlyValid = true) {
  return Object.fromEntries(
    Object.entries(query ?? {})
      .map(([key, _value]) => {
        if (!isQueryProperty(key)) {
          return null;
        }
        const valueAsString =
          typeof _value === 'undefined' ? '' : queryParser.stringify(_value);
        const value = validateField(key, valueAsString);
        const valid: boolean = value !== false;
        if (onlyValid && !valid) {
          return null;
        }
        return [
          key,
          { string: valueAsString, value: valid ? value : null, valid },
        ] as const;
      })
      .filter((value) => {
        return value !== null;
      }) as [string, unknown][]
  ) as Record<QueryProperty, QueryBarFormField>;
}

export type QueryBarExtraArgs = {
  globalAppRegistry?: AppRegistry;
  localAppRegistry?: AppRegistry;
  favoriteQueryStorage: FavoriteQueryStorage;
  recentQueryStorage: RecentQueryStorage;
};

export type QueryBarThunkAction<
  R,
  A extends AnyAction = AnyAction
> = ThunkAction<R, QueryBarState, QueryBarExtraArgs, A>;

export type QueryBarThunkDispatch<A extends AnyAction = AnyAction> =
  ThunkDispatch<QueryBarState, QueryBarExtraArgs, A>;

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

export type QueryBarFormField = {
  value: unknown;
  string: string;
  valid: boolean;
};

export type QueryBarState = {
  fields: Record<QueryProperty, QueryBarFormField>;
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
  host: string | null;
  recentQueries: RecentQuery[];
  favoriteQueries: FavoriteQuery[];
};

export const INITIAL_STATE: QueryBarState = {
  fields: mapQueryToValidQueryFields(DEFAULT_FIELD_VALUES),
  expanded: false,
  serverVersion: '3.6.0',
  schemaFields: [],
  lastAppliedQuery: null,
  applyId: 0,
  namespace: '',
  host: null,
  recentQueries: [],
  favoriteQueries: [],
};

enum QueryBarActions {
  ToggleQueryOptions = 'compass-query-bar/ToggleQueryOptions',
  ChangeField = 'compass-query-bar/ChangeField',
  ChangeSchemaFields = 'compass-query-bar/ChangeSchemaFields',
  SetQuery = 'compass-query-bar/SetQuery',
  ApplyQuery = 'compass-query-bar/ApplyQuery',
  ResetQuery = 'compass-query-bar/ResetQuery',
  ApplyFromHistory = 'compass-query-bar/ApplyFromHistory',
  RecentQueriesFetched = 'compass-query-bar/recentQueriesFetched',
  FavoriteQueriesFetched = 'compass-query-bar/favoriteQueriesFetched',
}

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
    const { lastAppliedQuery, fields } = getState();
    const query = pickValuesFromFields(fields);
    if (lastAppliedQuery === null || !isEqual(lastAppliedQuery, query)) {
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
    const { fields } = getState();
    if (!isQueryFieldsValid(fields)) {
      return false;
    }
    const query = pickValuesFromFields(fields);
    dispatch(emitOnQueryChange());
    dispatch({ type: QueryBarActions.ApplyQuery, query });

    // we save query without maxTimeMS
    /* eslint-disable @typescript-eslint/no-unused-vars */
    const { maxTimeMS: _maxTimeMS, ...restOfQuery } = query;
    void dispatch(saveRecentQuery(restOfQuery));
    return query;
  };
};

type ResetQueryAction = {
  type: QueryBarActions.ResetQuery;
};

export function isEqualDefaultQuery(state: QueryBarState): boolean {
  return isEqual(pickValuesFromFields(state.fields), DEFAULT_QUERY_VALUES);
}

export const resetQuery = (): QueryBarThunkAction<
  false | Record<string, unknown>
> => {
  return (dispatch, getState, { localAppRegistry }) => {
    if (isEqualDefaultQuery(getState())) {
      return false;
    }
    dispatch({ type: QueryBarActions.ResetQuery });
    dispatch(emitOnQueryChange());
    localAppRegistry?.emit('query-reset', cloneDeep(DEFAULT_QUERY_VALUES));
    return cloneDeep(DEFAULT_QUERY_VALUES);
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
    const currentFilterValue = getState().fields.filter.value;
    dispatch(
      setQuery({
        filter: changeFilter(event.type, currentFilterValue, event.payload),
      })
    );
  };
};

export const openExportToLanguage = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    localAppRegistry?.emit(
      'open-query-export-to-language',
      Object.fromEntries(
        Object.entries(getState().fields).map(([key, field]) => {
          return [key, field.string];
        })
      )
    );
  };
};

type ApplyFromHistoryAction = {
  type: QueryBarActions.ApplyFromHistory;
  query: BaseQuery;
};

export const applyFromHistory = (query: BaseQuery): ApplyFromHistoryAction => {
  return { type: QueryBarActions.ApplyFromHistory, query };
};

type RecentQueriesFetchedAction = {
  type: QueryBarActions.RecentQueriesFetched;
  recents: RecentQuery[];
};
export const fetchRecents = (): QueryBarThunkAction<
  Promise<void>,
  RecentQueriesFetchedAction
> => {
  return async (dispatch, getState, { recentQueryStorage }) => {
    try {
      const namespace = getState().namespace;
      const recents = await recentQueryStorage.loadAll();
      dispatch({
        type: QueryBarActions.RecentQueriesFetched,
        recents: recents.filter((x) => x._ns === namespace),
      });
    } catch (e) {
      debug('Failed to fetch recent queries', e);
    }
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
  return async (dispatch, getState, { favoriteQueryStorage }) => {
    try {
      const namespace = getState().namespace;
      const favorites = await favoriteQueryStorage.loadAll();
      dispatch({
        type: QueryBarActions.FavoriteQueriesFetched,
        favorites: favorites.filter((x) => x._ns === namespace),
      });
    } catch (e) {
      debug('Failed to fetch favorite queries', e);
    }
  };
};

export const explainQuery = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const { fields } = getState();
    const query = pickValuesFromFields(fields);
    localAppRegistry?.emit('open-explain-plan-modal', { query });
  };
};

export const saveRecentAsFavorite = (
  recentQuery: RecentQuery,
  name: string
): QueryBarThunkAction<Promise<void>> => {
  return async (
    dispatch,
    getState,
    { recentQueryStorage, favoriteQueryStorage }
  ) => {
    try {
      const now = new Date();
      const favoriteQuery: FavoriteQuery = {
        ...recentQuery,
        _host: recentQuery._host ?? getState().host,
        _name: name,
        _dateSaved: now,
        _dateModified: now,
      };

      // add it in the favorite
      await favoriteQueryStorage.updateAttributes(
        favoriteQuery._id,
        favoriteQuery
      );
      // remove from recents
      await recentQueryStorage.delete(recentQuery._id);

      // update the lists
      void dispatch(fetchRecents());
      void dispatch(fetchFavorites());

      // todo: navigate user to favorites tab ???
      console.log('Navigate user to favorites');
    } catch (e) {
      debug('Failed to save recent query as favorite', e);
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
      const { recentQueries, host, namespace } = getState();

      const queryAttributes = getQueryAttributes(query);
      // Ignore empty or default queries
      if (_.isEmpty(queryAttributes)) {
        return;
      }

      // Ignore duplicate queries
      const existingQuery = recentQueries.find((recentQuery) =>
        _.isEqual(getQueryAttributes(recentQuery), queryAttributes)
      );

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

      // Keep length of each recent list to TOTAL_RECENTS_ALLOWED
      if (recentQueries.length >= TOTAL_RECENTS_ALLOWED) {
        const lastRecent = recentQueries[recentQueries.length - 1];
        await recentQueryStorage.delete(lastRecent._id);
      }

      const _id = uuid.v4();
      const recentQuery: RecentQuery = {
        ...query,
        _id,
        _lastExecuted: new Date(),
        _ns: namespace,
        _host: host ?? '',
      };

      await recentQueryStorage.updateAttributes(_id, recentQuery);
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
        ...mapQueryToValidQueryFields(action.query),
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
      fields: mapQueryToValidQueryFields(DEFAULT_FIELD_VALUES),
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
      fields: mapQueryToValidQueryFields({
        ...DEFAULT_FIELD_VALUES,
        ...(action.query ?? {}),
      }),
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

export type QueryBarRootStore = Store<QueryBarState>;
