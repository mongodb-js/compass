import { combineReducers } from 'redux';
const EJSON = require('mongodb-extended-json');

import dataService from 'modules/data-service';
import appRegistry, {
  globalAppRegistryEmit
} from 'mongodb-redux-common/app-registry';
import error, {
  clearError, handleError,
  INITIAL_STATE as ERROR_INITIAL_STATE
} from 'modules/error';
import inProgress, {
  toggleInProgress,
  INITIAL_STATE as IN_PROGRESS_INITIAL_STATE
} from 'modules/in-progress';
import isCustomCollation, {
  INITIAL_STATE as IS_CUSTOM_COLLATION_INITIAL_STATE
} from 'modules/create-index/is-custom-collation';
import isVisible, {
  toggleIsVisible,
  INITIAL_STATE as IS_VISIBLE_INITIAL_STATE
} from 'modules/is-visible';
import collation, {
  INITIAL_STATE as COLLATION_INITIAL_STATE
} from 'modules/create-index/collation';
import fields, {
  INITIAL_STATE as FIELDS_INITIAL_STATE
} from 'modules/create-index/fields';
import showOptions, {
  INITIAL_STATE as SHOW_OPTIONS_INITIAL_STATE
} from 'modules/create-index/show-options';
import isBackground, {
  INITIAL_STATE as IS_BACKGROUND_INITIAL_STATE
} from 'modules/create-index/is-background';
import isUnique, {
  INITIAL_STATE as IS_UNIQUE_INITIAL_STATE
} from 'modules/create-index/is-unique';
import isTtl, {
  INITIAL_STATE as IS_TTL_INITIAL_STATE
} from 'modules/create-index/is-ttl';
import isPartialFilterExpression, {
  INITIAL_STATE as IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE
} from 'modules/create-index/is-partial-filter-expression';
import ttl, {
  INITIAL_STATE as TTL_INITIAL_STATE
} from 'modules/create-index/ttl';
import partialFilterExpression, {
  INITIAL_STATE as PARTIAL_FILTER_EXPRESSION_INITIAL_STATE
} from 'modules/create-index/partial-filter-expression';
import name, {
  INITIAL_STATE as NAME_INITIAL_STATE
} from 'modules/create-index/name';

import schemaFields from 'modules/create-index/schema-fields';
import { RESET_FORM } from 'modules/reset-form';
import { RESET, reset } from 'modules/reset';
import { parseErrorMsg } from 'modules/indexes';

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
  isPartialFilterExpression,
  ttl,
  partialFilterExpression,
  name
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
      isPartialFilterExpression: IS_PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
      ttl: TTL_INITIAL_STATE,
      partialFilterExpression: PARTIAL_FILTER_EXPRESSION_INITIAL_STATE,
      name: NAME_INITIAL_STATE
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
    if (state.fields.some(field => (field.name === '' || field.type === ''))) {
      dispatch(handleError('You must select a field name and type'));
      return;
    }

    state.fields.forEach(field => {
      let type = field.type;
      if (type === '1 (asc)') type = 1;
      if (type === '-1 (desc)') type = -1;
      spec[field.name] = type;
    });

    const options = {};
    options.background = state.isBackground;
    options.unique = state.isUnique;
    options.name = state.name;
    if (state.name === '') {
      options.name = `${state.fields[0].name}_${spec[state.fields[0].name]}`;
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
    try {
      if (state.isPartialFilterExpression) {
        options.partialFilterExpression = EJSON.parse(state.partialFilterExpression);
      }
    } catch (err) {
      dispatch(handleError(`Bad PartialFilterExpression: ${String(err)}`));
      return;
    }
    dispatch(toggleInProgress(true));
    // const ns = state.appRegistry.getStore('App.NamespaceStore').ns;

    state.dataService.createIndex(ns, spec, options, (createErr) => {
      if (!createErr) {
        dispatch(reset());
        state.appRegistry.emit('refresh-data');
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
