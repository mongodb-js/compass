import { ObjectId } from 'bson';
import { getObjectStore } from 'utils/indexed-db';

const PREFIX = 'aggregations/saved-pipeline';

// constants for save state modal
export const SAVED_PIPELINES_LIST_TOGGLED = `${PREFIX}/LIST_TOGGLED`;
export const SAVE_PIPELINE_MODAL_TOGGLED = `${PREFIX}/MODAL_TOGGLED`;
export const SAVE_MODAL_ERROR_TOGGLED = `${PREFIX}/ERROR_TOGGLED`;

export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;

export const INITIAL_STATE = {
  pipelines: [],
  isLoaded: false,
  isListVisible: false,
  isModalVisible: false,
  isModalError: false
};

const copyState = (state) => Object.assign({}, state);

const toggleSavedPipelinesList = (state, action) => {
  const newState = copyState(state);
  newState.isListVisible = !!action.index;
  return newState;
};

const toggleSavePipelineModal = (state, action) => {
  const newState = copyState(state);
  newState.isModalVisible = !!action.index;
  return newState;
};

const toggleSaveModalError = (state, action) => {
  const newState = copyState(state);
  newState.isModalError = !!action.index;
  return newState;
};

const addSavedPipeline = (state, action) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const MAPPINGS = {};

MAPPINGS[SAVED_PIPELINES_LIST_TOGGLED] = toggleSavedPipelinesList;
MAPPINGS[SAVE_PIPELINE_MODAL_TOGGLED] = toggleSavePipelineModal;
MAPPINGS[SAVE_MODAL_ERROR_TOGGLED] = toggleSaveModalError;
MAPPINGS[SAVED_PIPELINE_ADD] = addSavedPipeline;

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

export const savePipelineModalToggle = (index) => ({
  type: SAVE_PIPELINE_MODAL_TOGGLED,
  index: index
});

export const saveModalErrorToggle = (index, err) => ({
  type: SAVE_MODAL_ERROR_TOGGLED,
  index: index,
  error: err
});

export const savedPipelineAdd = (pipelines) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines: pipelines
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
export const saveCurrentPipeline = (pipelineName) => {
  return (dispatch, getState) => {
    const state = getState();
    // don't want the modal that triggers this save to show up when the user
    // restores the pipeline o/
    state.savedPipeline.isModalVisible = false;
    const id = state.id || new ObjectId().toHexString();

    const pipeline = state.pipeline.map((stage) => {
      return { ...stage, previewDocuments: [] };
    });

    const stateRecord = Object.assign({}
      , { namespace: state.namespace }
      , { pipeline: pipeline }
      , { view: state.view }
      , { name: pipelineName }
      , { id: id }
    );

    getObjectStore('readwrite', (store) => {
      const putRequest = store.put(stateRecord, id);

      putRequest.onsuccess = () => {
        dispatch(savedPipelinesListToggle(1));
        dispatch(savePipelineModalToggle(0));
        dispatch(updatePipelineList());
      };

      putRequest.onerror = (error) => {
        dispatch(saveModalErrorToggle(1, error));
      };
    });
  };
};
