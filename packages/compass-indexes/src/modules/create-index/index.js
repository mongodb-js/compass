import { EJSON } from 'bson';
import { combineReducers } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

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
import isCustomCollation, {
  INITIAL_STATE as IS_CUSTOM_COLLATION_INITIAL_STATE,
} from '../create-index/is-custom-collation';
import isVisible, {
  toggleIsVisible,
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE,
} from '../is-visible';
import collation, {
  INITIAL_STATE as COLLATION_INITIAL_STATE,
} from '../create-index/collation';
import fields, {
  INITIAL_STATE as FIELDS_INITIAL_STATE,
} from '../create-index/fields';
import showOptions, {
  INITIAL_STATE as SHOW_OPTIONS_INITIAL_STATE,
} from '../create-index/show-options';
import isBackground, {
  INITIAL_STATE as IS_BACKGROUND_INITIAL_STATE,
} from '../create-index/is-background';
import isUnique, {
  INITIAL_STATE as IS_UNIQUE_INITIAL_STATE,
} from '../create-index/is-unique';
import isTtl, {
  INITIAL_STATE as IS_TTL_INITIAL_STATE,
} from '../create-index/is-ttl';
import isWildcard, {
  INITIAL_STATE as IS_WILDCARD_INITIAL_STATE,
} from '../create-index/is-wildcard';
import isColumnstore, {
  INITIAL_STATE as IS_COLUMNSTORE_INITIAL_STATE,
} from '../create-index/is-columnstore';
import isPartialFilterExpression, {
  INITIAL_STATE as IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
} from '../create-index/is-partial-filter-expression';
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
import { RESET_FORM } from '../reset-form';
import { RESET, reset } from '../reset';
import { parseErrorMsg } from '../indexes';

const { track } = createLoggerAndTelemetry('COMPASS-INDEXES-UI');

/**
 * The main reducer.
 */
const reducer = combineReducers({
  dataService,
  appRegistry,
  collation,
  fields,
  inProgress,
  isCustomCollation,
  schemaFields,
  showOptions,
  isVisible,
  error,
  isBackground,
  isUnique,
  isTtl,
  isWildcard,
  isColumnstore,
  isPartialFilterExpression,
  ttl,
  wildcardProjection,
  columnstoreProjection,
  partialFilterExpression,
  name,
  namespace,
  serverVersion,
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  if (action.type === RESET || action.type === RESET_FORM) {
    return {
      ...state,
      collation: COLLATION_INITIAL_STATE,
      fields: FIELDS_INITIAL_STATE,
      inProgress: IN_PROGRESS_INITIAL_STATE,
      isCustomCollation: IS_CUSTOM_COLLATION_INITIAL_STATE,
      showOptions: SHOW_OPTIONS_INITIAL_STATE,
      isVisible: IS_VISIBLE_INITIAL_STATE,
      error: ERROR_INITIAL_STATE,
      isBackground: IS_BACKGROUND_INITIAL_STATE,
      isUnique: IS_UNIQUE_INITIAL_STATE,
      isTtl: IS_TTL_INITIAL_STATE,
      isWildcard: IS_WILDCARD_INITIAL_STATE,
      isColumnstore: IS_COLUMNSTORE_INITIAL_STATE,
      isPartialFilterExpression: IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
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
  return (dispatch, getState) => {
    const state = getState();
    const spec = {};

    // check for errors
    if (state.fields.some((field) => field.name === '' || field.type === '')) {
      dispatch(handleError('You must select a field name and type'));
      return;
    }

    state.fields.forEach((field) => {
      let type = field.type;
      if (type === '1 (asc)') type = 1;
      if (type === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options = {};
    options.background = state.isBackground;
    options.unique = state.isUnique;
    // The server will generate a name when we don't provide one.
    if (state.name !== '') {
      options.name = state.name;
    }
    if (state.isCustomCollation) {
      options.collation = state.collation;
    }
    if (state.isTtl) {
      options.expireAfterSeconds = Number(state.ttl);
      if (isNaN(options.expireAfterSeconds)) {
        dispatch(handleError(`Bad TTL: "${state.ttl}"`));
        return;
      }
    }
    if (state.isWildcard) {
      try {
        options.wildcardProjection = EJSON.parse(state.wildcardProjection);
      } catch (err) {
        dispatch(handleError(`Bad WildcardProjection: ${String(err)}`));
        return;
      }
    }
    if (state.isColumnstore) {
      try {
        options.columnstoreProjection = EJSON.parse(
          state.columnstoreProjection
        );
      } catch (err) {
        dispatch(handleError(`Bad ColumnstoreProjection: ${String(err)}`));
        return;
      }
    }
    if (state.isPartialFilterExpression) {
      try {
        options.partialFilterExpression = EJSON.parse(
          state.partialFilterExpression
        );
      } catch (err) {
        dispatch(handleError(`Bad PartialFilterExpression: ${String(err)}`));
        return;
      }
    }
    dispatch(toggleInProgress(true));
    const ns = state.namespace;

    state.dataService.createIndex(ns, spec, options, (createErr) => {
      if (!createErr) {
        const trackEvent = {
          background: state.isBackground,
          unique: state.isUnique,
          ttl: state.isTtl,
          columnstore: state.isColumnstore,
          wildcard: state.isWildcard,
          custom_collation: state.isCustomCollation,
          geo:
            state.fields.filter(({ type }) => type === '2dsphere').length > 0,
        };
        track('Index Created', trackEvent);
        dispatch(reset());
        dispatch(localAppRegistryEmit('refresh-data'));
        dispatch(
          globalAppRegistryEmit('compass:indexes:created', {
            isCollation: state.isCustomCollation,
            isBackground: state.isBackground,
            isPartialFilterExpression: state.isPartialFilterExpression,
            isTTL: state.isTtl,
            isUnique: state.isUnique,
            isColumnstore: state.isColumnstore,
            isWildcard: state.isWildcard,
            collation: state.collation,
            ttl: state.ttl,
          })
        );
        dispatch(clearError());
        dispatch(toggleInProgress(false));
        dispatch(toggleIsVisible(false));
      } else {
        dispatch(toggleInProgress(false));
        dispatch(handleError(parseErrorMsg(createErr)));
      }
    });
  };
};
