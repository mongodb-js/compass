import { EJSON } from 'bson';
import { combineReducers } from 'redux';
import type { AnyAction, Dispatch } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import queryParser from 'mongodb-query-parser';
import type { IndexSpecification, CreateIndexesOptions, IndexDirection, AnyError } from 'mongodb';

import dataService from '../data-service';
import appRegistry, {
  localAppRegistryEmit,
  globalAppRegistryEmit,
} from '@mongodb-js/mongodb-redux-common/app-registry';
import error, {
  clearError,
  handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE,
} from '../error';
import inProgress, {
  toggleInProgress,
  INITIAL_STATE as IN_PROGRESS_INITIAL_STATE,
} from '../in-progress';
import useCustomCollation, {
  INITIAL_STATE as IS_CUSTOM_COLLATION_INITIAL_STATE,
} from '../create-index/use-custom-collation';
import useIndexName, {
  INITIAL_STATE as HAS_INDEX_NAME_INITIAL_STATE,
} from '../create-index/use-index-name';
import isVisible, {
  toggleIsVisible,
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import collationString, {
  INITIAL_STATE as COLLATION_INITIAL_STATE,
} from '../create-index/collation-string';
import fields, {
  INITIAL_STATE as FIELDS_INITIAL_STATE,
} from '../create-index/fields';
import type { IndexField } from '../create-index/fields';
import isUnique, {
  INITIAL_STATE as IS_UNIQUE_INITIAL_STATE,
} from '../create-index/is-unique';
import useTtl, {
  INITIAL_STATE as IS_TTL_INITIAL_STATE,
} from '../create-index/use-ttl';
import useWildcardProjection, {
  INITIAL_STATE as HAS_WILDCARD_PROJECTION_INITIAL_STATE,
} from './use-wildcard-projection';
import useColumnstoreProjection, {
  INITIAL_STATE as HAS_COLUMNSTORE_PROJECTION_INITIAL_STATE,
} from '../create-index/use-columnstore-projection';
import usePartialFilterExpression, {
  INITIAL_STATE as IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
} from '../create-index/use-partial-filter-expression';
import ttl, { INITIAL_STATE as TTL_INITIAL_STATE } from '../create-index/ttl';
import wildcardProjection, {
  INITIAL_STATE as WILDCARD_PROJECTION_INITIAL_STATE,
} from '../create-index/wildcard-projection';
import columnstoreProjection, {
  INITIAL_STATE as COLUMNSTORE_PROJECTION_INITIAL_STATE,
} from '../create-index/columnstore-projection';
import partialFilterExpression, {
  INITIAL_STATE as PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
} from '../create-index/partial-filter-expression';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE,
} from '../create-index/name';
import namespace from '../namespace';
import serverVersion from '../server-version';

import schemaFields from '../create-index/schema-fields';
import newIndexField from '../create-index/new-index-field';
import { RESET_FORM } from '../reset-form';
import { RESET, reset } from '../reset';

const { track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

/**
 * The main reducer.
 */
const reducer = combineReducers({
  dataService,
  appRegistry,
  collationString,
  fields,
  inProgress,
  useCustomCollation,
  useIndexName,
  schemaFields,
  newIndexField,
  isVisible,
  error,
  isUnique,
  useTtl,
  useWildcardProjection,
  useColumnstoreProjection,
  usePartialFilterExpression,
  ttl,
  wildcardProjection,
  columnstoreProjection,
  partialFilterExpression,
  name,
  namespace,
  serverVersion,
});

export type RootState = ReturnType<typeof reducer>;

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state: RootState, action: AnyAction): RootState => {
  if (action.type === RESET || action.type === RESET_FORM) {
    return {
      ...state,
      collationString: COLLATION_INITIAL_STATE,
      fields: FIELDS_INITIAL_STATE,
      inProgress: IN_PROGRESS_INITIAL_STATE,
      useCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
      useIndexName: HAS_INDEX_NAME_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      isUnique: IS_UNIQUE_INITIAL_STATE,
      useTtl: IS_TTL_INITIAL_STATE,
      useWildcardProjection: HAS_WILDCARD_PROJECTION_INITIAL_STATE,
      useColumnstoreProjection: HAS_COLUMNSTORE_PROJECTION_INITIAL_STATE,
      usePartialFilterExpression: IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
      ttl: TTL_INITIAL_STATE,
      columnstoreProjection: COLUMNSTORE_PROJECTION_INITIAL_STATE,
      wildcardProjection: WILDCARD_PROJECTION_INITIAL_STATE,
      partialFilterExpression: PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
      name: NAME_INITIAL_STATE,
    };
  }
  return reducer(state, action);
};

export default rootReducer;

/**
 * The create index action.
 *
 * @returns {Function} The thunk function.
 */
export const createIndex = () => {
  return (dispatch: Dispatch, getState: () => RootState) => {
    const state = getState();
    const spec: IndexSpecification = {};

    // Check for field errors.
    if (
      state.fields.some(
        (field: IndexField) => field.name === '' || field.type === ''
      )
    ) {
      dispatch(handleError('You must select a field name and type'));
      return;
    }

    // Check for collaction errors.
    const collation = queryParser.isCollationValid(state.collationString) || undefined;
    if (state.useCustomCollation && !collation) {
      dispatch(handleError('You must provide a valid collation object'));
      return;
    }

    state.fields.forEach((field: IndexField) => {
      let type = field.type as IndexDirection;
      if ((type as string) === '1 (asc)') type = 1;
      if ((type as string) === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options: CreateIndexesOptions = {};
    options.unique = state.isUnique;
    // The server will generate a name when we don't provide one.
    if (state.name !== '') {
      options.name = state.name;
    }
    if (state.useCustomCollation) {
      options.collation = collation;
    }
    if (state.useTtl) {
      options.expireAfterSeconds = Number(state.ttl);
      if (isNaN(options.expireAfterSeconds)) {
        dispatch(handleError(`Bad TTL: "${String(state.ttl)}"`));
        return;
      }
    }
    if (state.useWildcardProjection) {
      try {
        options.wildcardProjection = EJSON.parse(state.wildcardProjection) as Document;
      } catch (err) {
        dispatch(handleError(`Bad WildcardProjection: ${String(err)}`));
        return;
      }
    }

    const hasColumnstoreIndex = state.fields.some(
      (field: IndexField) => field.type === 'columnstore'
    );
    if (hasColumnstoreIndex) {
      // Index type 'columnstore' does not support the 'unique' option.
      delete options.unique;
    }

    if (state.useColumnstoreProjection) {
      try {
        // columnstoreProjection is not part of CreateIndexesOptions yet
        (options as any).columnstoreProjection = EJSON.parse(
          state.columnstoreProjection
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }
    if (state.usePartialFilterExpression) {
      try {
        options.partialFilterExpression = EJSON.parse(
          state.partialFilterExpression
        ) as Document;
      } catch (err) {
        dispatch(handleError(`Bad PartialFilterExpression: ${String(err)}`));
        return;
      }
    }
    dispatch(toggleInProgress(true));
    const ns = state.namespace;

    state.dataService?.createIndex(ns, spec, options, (createErr: any) => {
      if (!createErr) {
        const trackEvent = {
          unique: state.isUnique,
          ttl: state.useTtl,
          columnstore_index: hasColumnstoreIndex,
          has_columnstore_projection: state.useColumnstoreProjection,
          has_wildcard_projection: state.useWildcardProjection,
          custom_collation: state.useCustomCollation,
          geo:
            state.fields.filter(
              ({ type }: { type: string }) => type === '2dsphere'
            ).length > 0,
        };
        track('Index Created', trackEvent);
        dispatch(reset());
        dispatch(localAppRegistryEmit('refresh-data'));
        dispatch(
          globalAppRegistryEmit('compass:indexes:created', {
            isCollation: state.useCustomCollation,
            usePartialFilterExpression: state.usePartialFilterExpression,
            useTtl: state.useTtl,
            isUnique: state.isUnique,
            hasColumnstoreIndex,
            useColumnstoreProjection: state.useColumnstoreProjection,
            useWildcardProjection: state.useWildcardProjection,
            collation: state.collationString,
            ttl: state.ttl,
          })
        );
        dispatch(clearError());
        dispatch(toggleInProgress(false));
        dispatch(toggleIsVisible(false));
      } else {
        dispatch(toggleInProgress(false));
        dispatch(handleError(createErr));
      }
    });
  };
};
