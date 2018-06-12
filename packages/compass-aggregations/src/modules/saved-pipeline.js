import { getObjectStore } from 'utils/indexed-db';
import { createId } from 'modules/id';
import { setIsModified } from 'modules/is-modified';
import { appRegistryEmit } from 'modules/app-registry';

const PREFIX = 'aggregations/saved-pipeline';

// constants for save state modal
export const SAVED_PIPELINES_LIST_TOGGLED = `${PREFIX}/LIST_TOGGLED`;

export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;

export const INITIAL_STATE = {
  pipelines: [],
  isLoaded: false,
  isListVisible: false
};

const copyState = (state) => Object.assign({}, state);

const toggleSavedPipelinesList = (state, action) => {
  const newState = copyState(state);
  newState.isListVisible = !!action.index;
  return newState;
};

const addSavedPipeline = (state, action) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const MAPPINGS = {};

MAPPINGS[SAVED_PIPELINES_LIST_TOGGLED] = toggleSavedPipelinesList;
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
        dispatch(setIsModified(false));
        dispatch(savedPipelineAdd(pipelines));
        dispatch(appRegistryEmit('agg-pipeline-saved', { name: state.name }));
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

    if (state.id === '') {
      dispatch(createId());
    }
    const id = getState().id;

    const pipeline = state.pipeline.map((stage) => {
      return { ...stage, previewDocuments: [] };
    });

    const stateRecord = Object.assign({}
      , { namespace: state.namespace }
      , { pipeline: pipeline }
      , { name: state.name }
      , { id: id }
      , { comments: state.comments }
      , { sample: state.sample }
    );

    getObjectStore('readwrite', (store) => {
      const putRequest = store.put(stateRecord, id);

      putRequest.onsuccess = () => {
        dispatch(updatePipelineList());
      };
    });
  };
};
