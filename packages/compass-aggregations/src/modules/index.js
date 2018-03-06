import { combineReducers } from 'redux';
import deepMerge from 'deepmerge';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import inputDocuments, { INITIAL_STATE as INPUT_INITIAL_STATE } from './input-documents';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE, NAMESPACE_CHANGED } from './namespace';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import pipeline, { INITIAL_STATE as PIPELINE_INITIAL_STATE } from './pipeline';
import view, { INITIAL_STATE as VIEW_INITIAL_STATE } from './view';
import savedPipeline, {
  updatePipelineList,
  INITIAL_STATE as SP_INITIAL_STATE
} from './saved-pipeline';
import restorePipeline, { INITIAL_STATE as RESTORE_PIPELINE_STATE} from './restore-pipeline';
import { getObjectStore } from 'utils/indexed-db';

/**
 * The intial state of the root reducer.
 */
export const INITIAL_STATE = {
  dataService: DS_INITIAL_STATE,
  fields: FIELDS_INITIAL_STATE,
  inputDocuments: INPUT_INITIAL_STATE,
  namespace: NS_INITIAL_STATE,
  serverVersion: SV_INITIAL_STATE,
  pipeline: PIPELINE_INITIAL_STATE,
  savedPipeline: SP_INITIAL_STATE,
  view: VIEW_INITIAL_STATE,
  restorePipeline: RESTORE_PIPELINE_STATE
};

/**
 * Reset action constant.
 */
export const RESET = 'aggregations/reset';

export const CLEAR_PIPELINE = 'aggregations/CLEAR_PIPELINE';

/**
 * Restore action constant.
 */
export const RESTORE_PIPELINE = 'aggregations/RESTORE_PIPELINE';

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
  savedPipeline,
  restorePipeline,
  pipeline,
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
    case RESTORE_PIPELINE:
      return deepMerge(INITIAL_STATE, action.restoreState, { arrayMerge: overwriteMerge });
    case CLEAR_PIPELINE:
      return {
        ...state,
        pipeline: PIPELINE_INITIAL_STATE,
        savedPipeline: {
          ...state.savedPipeline,
          isListVisible: true
        }
      };
    default:
      return appReducer(state, action);
  }
};

// when restoring the pipeline, don't merge arrays (in our case, stages array)
function overwriteMerge(dest, src) {
  return src;
}

export default rootReducer;

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = () => ({
  type: RESET
});

export const clearPipeline = () => ({
  type: CLEAR_PIPELINE
});

/**
 * Get the restore action.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The action.
 */
export const restoreSavedPipeline = (restoreState) => ({
  type: RESTORE_PIPELINE,
  restoreState: restoreState
});

/**
 * Get the delete action.
 *
 * @param {String} id - The pipeline id.
 *
 * @returns {Function} The thunk function.
 */
export const deletePipeline = (id) => {
  return (dispatch) => {
    getObjectStore('readwrite', (store) => {
      store.delete(id).onsuccess = () => {
        dispatch(updatePipelineList());
        dispatch(clearPipeline());
      };
    });
  };
};

/**
 * Get a pipeline from the db.
 *
 * @param {String} id - The id.
 *
 * @returns {Function} The thunk function.
 */
export const getPipelineFromIndexedDB = (id) => {
  return (dispatch) => {
    getObjectStore('readwrite', (store) => {
      store.get(id).onsuccess = (e) => {
        const pipe = e.target.result;
        delete pipe.id;
        delete pipe.pipelineName;
        dispatch(restoreSavedPipeline(pipe));
      };
    });
  };
};
