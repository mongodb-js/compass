import { ObjectId } from 'bson';
import { getObjectStore } from 'utils/indexed-db';

const PREFIX = 'aggregations/saved-pipeline';

// constants for save state modal
export const SAVED_PIPELINES_LIST_TOGGLED = `${PREFIX}/LIST_TOGGLED`;
export const PIPELINE_NAME_INVALID = `${PREFIX}/PIPELINE_NAME_INVALID`;

export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;

export const INITIAL_STATE = {
  pipelines: [],
  isLoaded: false,
  isListVisible: false,
  isNameValid: true
};

const copyState = (state) => Object.assign({}, state);

const toggleSavedPipelinesList = (state, action) => {
  const newState = copyState(state);
  newState.isListVisible = !!action.index;
  return newState;
};

const doPipelineNameInvalid = (state, action) => {
  return { ...state, isNameValid: action.isValid };
};

const addSavedPipeline = (state, action) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const MAPPINGS = {};

MAPPINGS[SAVED_PIPELINES_LIST_TOGGLED] = toggleSavedPipelinesList;
MAPPINGS[SAVED_PIPELINE_ADD] = addSavedPipeline;
MAPPINGS[PIPELINE_NAME_INVALID] = doPipelineNameInvalid;

export default function reducer(state = INITIAL_STATE, action) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

/**
 * Action creators for toggling actions in the save m0dal
 *
 * @returns {Object} The action.
 */
export const savedPipelinesListToggle = (index) => ({
  type: SAVED_PIPELINES_LIST_TOGGLED,
  index: index
});

export const savedPipelineAdd = (pipelines) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines: pipelines
});

export const pipelineNameValid = (isValid) => ({
  type: PIPELINE_NAME_INVALID,
  isValid: isValid
});

export const getSavedPipelines = () => {
  return (dispatch, getState) => {
    if (!getState().savedPipeline.isLoaded) {
      dispatch(updatePipelineList());
    }
  };
};

/**
 * Update the pipeline list.
 *
 * @returns {Function} The thunk function.
 */
export const updatePipelineList = () => {
  return (dispatch, getState) => {
    const state = getState();

    getObjectStore('readwrite', (store) => {
      const index = store.index('namespace');
      index.getAll(state.namespace).onsuccess = (e) => {
        const pipelines = e.target.result;
        dispatch(savedPipelineAdd(pipelines));
      };
    });
  };
};

/**
 * Save the current state of your pipeline
 *
 * @returns {Object} The action.
 */
export const saveCurrentPipeline = () => {
  return (dispatch, getState) => {
    const state = getState();

    if (state.name.trim() === '') {
      return dispatch(pipelineNameValid(false));
    }
    dispatch(pipelineNameValid(true));

    const id = state.id || new ObjectId().toHexString();

    const pipeline = state.pipeline.map((stage) => {
      return { ...stage, previewDocuments: [] };
    });

    const stateRecord = Object.assign({}
      , { namespace: state.namespace }
      , { pipeline: pipeline }
      , { view: state.view }
      , { name: state.name }
      , { id: id }
    );

    getObjectStore('readwrite', (store) => {
      const putRequest = store.put(stateRecord, id);

      putRequest.onsuccess = () => {
        dispatch(updatePipelineList());
      };
    });
  };
};
