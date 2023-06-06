import type { Reducer, AnyAction, Store } from 'redux';
import {
  DEFAULT_FIELD_VALUES,
  DEFAULT_QUERY_VALUES,
} from '../constants/query-bar-store';
import type { QueryProperty } from '../constants/query-properties';
import { QUERY_PROPERTIES } from '../constants/query-properties';
import type { ThunkAction, ThunkDispatch } from 'redux-thunk';
import React from 'react';
import type AppRegistry from 'hadron-app-registry';
import queryParser from 'mongodb-query-parser';
import preferences from 'compass-preferences-model';
import { cloneDeep, isEqual } from 'lodash';
import type { ChangeFilterEvent } from '../modules/change-filter';
import { changeFilter } from '../modules/change-filter';

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
  fields: Record<string, QueryBarFormField>
) {
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
  lastAppliedQuery: unknown | null;
  /**
   * For testing purposes only, allows to track whether or not apply button was
   * clicked or not
   */
  applyId: number;
};

export const INITIAL_STATE: QueryBarState = {
  fields: mapQueryToValidQueryFields(DEFAULT_FIELD_VALUES),
  expanded: false,
  serverVersion: '3.6.0',
  schemaFields: [],
  lastAppliedQuery: null,
  applyId: 0,
};

enum QueryBarActions {
  ToggleQueryOptions = 'compass-query-bar/ToggleQueryOptions',
  ChangeField = 'compass-query-bar/ChangeField',
  ChangeSchemaFields = 'compass-query-bar/ChangeSchemaFields',
  SetQuery = 'compass-query-bar/SetQuery',
  ApplyQuery = 'compass-query-bar/ApplyQuery',
  ResetQuery = 'compass-query-bar/ResetQuery',
  ApplyFromHistory = 'compass-query-bar/ApplyFromHistory',
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
  query: unknown;
};

export const applyQuery = (): QueryBarThunkAction<
  false | Record<string, unknown>,
  ApplyQueryAction
> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const { fields } = getState();
    if (!isQueryFieldsValid(fields)) {
      return false;
    }
    const query = pickValuesFromFields(fields);
    dispatch(emitOnQueryChange());
    dispatch({ type: QueryBarActions.ApplyQuery, query });
    localAppRegistry?.emit('query-applied', query);
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
  query: unknown;
};

export const setQuery = (query: unknown): SetQueryAction => {
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
  query: unknown;
};

export const applyFromHistory = (query: unknown): ApplyFromHistoryAction => {
  return { type: QueryBarActions.ApplyFromHistory, query };
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

  return state;
};

export const explainQuery = (): QueryBarThunkAction<void> => {
  return (dispatch, getState, { localAppRegistry }) => {
    const { fields } = getState();
    const query = pickValuesFromFields(fields);
    localAppRegistry?.emit('open-explain-plan-modal', { query });
  };
};

/**
 * This is arguably a total hack, but more or less the only easy way to get
 * components out of registry without passing the whole registry around or
 * inventing another one-off abstraction for this
 */
export const renderQueryHistoryComponent =
  (): QueryBarThunkAction<React.ReactElement | null> => {
    return (dispatch, getState, { globalAppRegistry, localAppRegistry }) => {
      const QueryHistory =
        globalAppRegistry?.getRole('Query.QueryHistory')?.[0].component;

      if (!QueryHistory) {
        return null;
      }

      const store = localAppRegistry?.getStore('Query.History');
      const actions = localAppRegistry?.getAction('Query.History.Actions');

      return React.createElement(QueryHistory, { store, actions });
    };
  };

export type QueryBarRootStore = Store<QueryBarState>;
