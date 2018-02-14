import { combineReducers } from 'redux';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import inputDocuments, { INITIAL_STATE as INPUT_INITIAL_STATE } from './input-documents';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE, NAMESPACE_CHANGED } from './namespace';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import stages, { INITIAL_STATE as STAGE_INITIAL_STATE } from './stages';
import savedPipelines, { INITIAL_STATE as SP_INITIAL_STATE } from './saved-pipelines';
import view, { INITIAL_STATE as VIEW_INITIAL_STATE } from './view';

import saveStateReducer, { SAVE_STATE } from './save-state';
import restoreStateReducer, { RESTORE_STATE } from './restore-state';

/**
 * The intial state of the root reducer.
 */
export const INITIAL_STATE = {
  dataService: DS_INITIAL_STATE,
  fields: FIELDS_INITIAL_STATE,
  inputDocuments: INPUT_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  stages: STAGE_INITIAL_STATE,
  savedPipelines: SP_INITIAL_STATE,
  view: VIEW_INITIAL_STATE
};

/**
 * Reset action constant.
 */
export const RESET = 'aggregations/reset';

/**
 * The main application reducer.
 *
 * this does not include save state and restore state reducers as those need to
 * be handled differently in the default reducer
 *
 * @returns {Function} The reducer function.
 */
const appReducer = combineReducers({
  dataService,
  fields,
  inputDocuments,
  namespace,
  serverVersion,
  savedPipelines,
  stages,
  view
});

/**
 * The root reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @note Handle actions that need to operate
 *  on more than one area of the state here.
 *
 * @todo: Durran Don't wipe out data service when namespace changes.
 *
 * @returns {Function} The reducer.
 */
const rootReducer = (state, action) => {
  switch (action.type) {
    case NAMESPACE_CHANGED:
      const newState = { ...INITIAL_STATE, dataService: state.dataService };
      return appReducer(newState, action);
    case RESET:
      return { ...INITIAL_STATE };
    case RESTORE_STATE:
      return restoreStateReducer(state, action.stateId);
    case SAVE_STATE:
      return saveStateReducer(state);
    default:
      return appReducer(state, action);
  }
};

export default rootReducer;

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = () => ({
  type: RESET
});
