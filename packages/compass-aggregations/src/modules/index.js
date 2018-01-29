import { combineReducers } from 'redux';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE, NAMESPACE_CHANGED } from './namespace';
import results, { INITIAL_STATE as RESULTS_INITIAL_STATE } from './results';
import sample, { INITIAL_STATE as SAMPLE_INITIAL_STATE } from './sample';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import stages, { INITIAL_STATE as STAGE_INITIAL_STATE } from './stages';
import view, { INITIAL_STATE as VIEW_INITIAL_STATE } from './view';

/**
 * The intial state of the root reducer.
 */
export const INITIAL_STATE = {
  dataService: DS_INITIAL_STATE,
  fields: FIELDS_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  results: RESULTS_INITIAL_STATE,
  sample: SAMPLE_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  stages: STAGE_INITIAL_STATE,
  view: VIEW_INITIAL_STATE
};

/**
 * The main application reducer.
 *
 * @returns {Function} The reducer function.
 */
const appReducer = combineReducers({
  dataService,
  fields,
  namespace,
  results,
  sample,
  serverVersion,
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
 * @returns {Function} The reducer.
 */
const rootReducer = (state, action) => {
  if (action.type === NAMESPACE_CHANGED) {
    return appReducer(INITIAL_STATE, action);
  }
  return appReducer(state, action);
};

export default rootReducer;
