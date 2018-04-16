import { combineReducers } from 'redux';
import { ObjectId } from 'bson';

import dataService, { INITIAL_STATE as DS_INITIAL_STATE } from './data-service';
import fields, { INITIAL_STATE as FIELDS_INITIAL_STATE } from './fields';
import inputDocuments, { INITIAL_STATE as INPUT_INITIAL_STATE } from './input-documents';
import namespace, { INITIAL_STATE as NS_INITIAL_STATE, NAMESPACE_CHANGED } from './namespace';
import serverVersion, { INITIAL_STATE as SV_INITIAL_STATE } from './server-version';
import isModified, { INITIAL_STATE as IS_MODIFIED_INITIAL_STATE } from './is-modified';
import pipeline, {
  runStage,
  INITIAL_STATE as PIPELINE_INITIAL_STATE
} from './pipeline';
import name, { INITIAL_STATE as NAME_INITIAL_STATE } from './name';
import id, { INITIAL_STATE as ID_INITIAL_STATE } from './id';
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
  restorePipeline: RESTORE_PIPELINE_STATE,
  name: NAME_INITIAL_STATE,
  id: ID_INITIAL_STATE,
  isModified: IS_MODIFIED_INITIAL_STATE
};

/**
 * Reset action constant.
 */
export const RESET = 'aggregations/reset';

/**
 * Clear the pipeline name.
 */
export const CLEAR_PIPELINE = 'aggregations/CLEAR_PIPELINE';

/**
 * Restore action constant.
 */
export const RESTORE_PIPELINE = 'aggregations/RESTORE_PIPELINE';

/**
 * New pipeline action name.
 */
export const NEW_PIPELINE = 'aggregations/NEW_PIPELINE';

/**
 * Clone pipeline action name.
 */
export const CLONE_PIPELINE = 'aggregations/CLONE_PIPELINE';

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
  name,
  id,
  isModified
});

/**
 * Handle the namespace change.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doNamespaceChanged = (state, action) => {
  const newState = { ...INITIAL_STATE, dataService: state.dataService };
  return appReducer(newState, action);
};

/**
 * Handle the reset.
 *
 * @returns {Object} The new state.
 */
const doReset = () => ({
  ...INITIAL_STATE
});

/**
 * Handle the pipeline restore.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The new state.
 */
const doRestorePipeline = (state, action) => {
  const savedState = action.restoreState;
  return {
    ...INITIAL_STATE,
    namespace: savedState.namespace,
    pipeline: savedState.pipeline,
    name: savedState.name,
    id: savedState.id,
    fields: state.fields,
    serverVersion: state.serverVersion,
    dataService: state.dataService,
    inputDocuments: state.inputDocuments,
    savedPipeline: {
      ...state.savedPipeline,
      isListVisible: false
    },
    restorePipeline: {
      isModalVisible: false,
      pipelineObjectID: ''
    }
  };
};

/**
 * Handle the pipeline clear.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const doClearPipeline = (state) => ({
  ...state,
  savedPipeline: {
    ...state.savedPipeline,
    isListVisible: true
  }
});

/**
 * Create a new pipeline.
 *
 * @returns {Object} The new state.
 */
const createNewPipeline = (state) => ({
  ...INITIAL_STATE,
  namespace: state.namespace,
  fields: state.fields,
  serverVersion: state.serverVersion,
  dataService: state.dataService,
  inputDocuments: state.inputDocuments
});

/**
 * Create a cloned pipeline.
 *
 * @param {Object} state - The state.
 *
 * @returns {Object} The new state.
 */
const createClonedPipeline = (state) => ({
  ...state,
  id: new ObjectId().toHexString(),
  name: `${state.name} (copy)`
});

/**
 * The action to state modifier mappings.
 */
const MAPPINGS = {
  [ NAMESPACE_CHANGED ]: doNamespaceChanged,
  [ RESET ]: doReset,
  [ RESTORE_PIPELINE ]: doRestorePipeline,
  [ CLEAR_PIPELINE ]: doClearPipeline,
  [ NEW_PIPELINE ]: createNewPipeline,
  [ CLONE_PIPELINE ]: createClonedPipeline
};

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

/**
 * Reset the entire state.
 *
 * @returns {Object} The action.
 */
export const reset = () => ({
  type: RESET
});

/**
 * The clear pipeline action.
 *
 * @returns {Object} The action.
 */
export const clearPipeline = () => ({
  type: CLEAR_PIPELINE
});

/**
 * Get the restore action.
 *
 * @param {Object} restoreState - The state.
 *
 * @returns {Object} The action.
 */
export const restoreSavedPipeline = (restoreState) => ({
  type: RESTORE_PIPELINE,
  restoreState: restoreState
});

/**
 * The new pipeline action.
 *
 * @returns {Object} The action.
 */
export const newPipeline = () => ({
  type: NEW_PIPELINE
});

/**
 * The clone pipeline action.
 *
 * @returns {Object} The action.
 */
export const clonePipeline = () => ({
  type: CLONE_PIPELINE
});

/**
 * Get the delete action.
 *
 * @param {String} pipelineId - The pipeline id.
 *
 * @returns {Function} The thunk function.
 */
export const deletePipeline = (pipelineId) => {
  return (dispatch) => {
    getObjectStore('readwrite', (store) => {
      store.delete(pipelineId).onsuccess = () => {
        dispatch(updatePipelineList());
        dispatch(clearPipeline());
      };
    });
  };
};

/**
 * Get a pipeline from the db.
 *
 * @param {String} pipelineId - The id.
 *
 * @returns {Function} The thunk function.
 */
export const getPipelineFromIndexedDB = (pipelineId) => {
  return (dispatch) => {
    getObjectStore('readwrite', (store) => {
      store.get(pipelineId).onsuccess = (e) => {
        const pipe = e.target.result;
        dispatch(restoreSavedPipeline(pipe));
        dispatch(runStage(0));
      };
    });
  };
};
