import { combineReducers } from 'redux';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import inputDocuments, { INITIAL_STATE as INPUT_INITIAL_STATE } from './input-documents';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE, NAMESPACE_CHANGED } from './namespace';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import stages, { INITIAL_STATE as STAGE_INITIAL_STATE } from './stages';
import savedPipelines, { INITIAL_STATE as SP_INITIAL_STATE } from './saved-pipelines';
import view, { INITIAL_STATE as VIEW_INITIAL_STATE } from './view';

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
 * constant for saving current state
 */
export const SAVE_STATE = 'aggregations/save-state';

/**
 * constant for restoring previous state
 */
export const RESTORE_STATE = 'aggregations/restore-state';

/**
 * The main application reducer.
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
 * @param {Object} state - current state
 *
 * @returns {object} state - adjusted copy of the current state for indexeddb
 * to save
 */
export const savedState = (state = INITIAL_STATE) => {
  return Object.assign({}
    , { inputDocuments: state.inputDocuments }
    , { savedPipelines: state.savedPipelines }
    , { namespace: state.namespace }
    , { stages: state.stages }
    , { view: state.view }
  );
};

/**
 * Given stateId, query indexeddb and get the current state object
 * @param {Object} state - current state
 * @param {string} stateId - the id of the state you want to restore
 *
 * @returns {object} state - adjusted copy of the current state for indexeddb
 * to save
 */
export const restoredState = (state = INITIAL_STATE, stateId) => {
  // this is what the object would look like as we get it from indexeddb
  const saved = {
    inputDocuments: {},
    savedPipelines: {},
    namespace: {},
    stages: {},
    view: '',
    stateId: stateId
  };

  return Object.assign({}, state, saved);
};

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
      return restoredState(INITIAL_STATE, action.stateId);
    case SAVE_STATE:
      return savedState(state);
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

/**
 * Save the current state of your pipeline
 *
 * @returns {Object} The action.
 */
export const saveState = () => ({
  type: SAVE_STATE
});

/**
 * Restore the state we get from indexeddb
 *
 * @param {string} stateId - key to retrieve the object from indexeddb
 *
 * @returns {Object} The action.
 */
export const restoreState = (stateId) => ({
  type: RESTORE_STATE,
  stateId: stateId
});
