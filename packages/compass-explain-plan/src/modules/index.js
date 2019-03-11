import { combineReducers } from 'redux';

import appRegistry, { INITIAL_STATE as APP_REGISTRY_STATE } from 'modules/app-registry';
import dataService, { INITIAL_STATE as DS_STATE } from './data-service';
import namespace, { INITIAL_STATE as NAMESPACE_STATE, NAMESPACE_CHANGED } from './namespace';
import serverVersion, { INITIAL_STATE as SV_STATE } from './server-version';
import isEditable, { INITIAL_STATE as IS_EDITABLE_STATE } from './edit-mode';
import explain, { INITIAL_STATE as EXPLAIN_STATE } from './explain';
import indexes, { INITIAL_STATE as INDEXES_STATE } from './indexes';
import query, { INITIAL_STATE as QUERY_STATE } from './query';

/**
 * Reset action constant.
 */
export const RESET = 'explain/reset';

/**
 * The intial state of the root reducer.
 */
export const INITIAL_STATE = {
  appRegistry: APP_REGISTRY_STATE,
  dataService: DS_STATE,
  namespace: NAMESPACE_STATE,
  serverVersion: SV_STATE,
  isEditable: IS_EDITABLE_STATE,
  explain: EXPLAIN_STATE,
  indexes: INDEXES_STATE,
  query: QUERY_STATE
};

/**
 * The reducer.
 */
const appReducer = combineReducers({
  appRegistry,
  dataService,
  namespace,
  serverVersion,
  isEditable,
  explain,
  indexes,
  query
});

/**
 * Handle the reset.
 *
 * @returns {Object} The new state.
 */
const doReset = () => ({ ...INITIAL_STATE });

/**
 * Handle the namespace change.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doNamespaceChanged = (state, action) => {
  const newState = {
    ...INITIAL_STATE,
    dataService: state.dataService,
    appRegistry: state.appRegistry
  };

  return appReducer(newState, action);
};

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [NAMESPACE_CHANGED]: doNamespaceChanged,
  [RESET]: doReset
};

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = () => ({ type: RESET });

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const rootReducer = (state, action) => {
  const fn = MAPPINGS[action.type];

  return fn ? fn(state, action) : appReducer(state, action);
};

export default rootReducer;
