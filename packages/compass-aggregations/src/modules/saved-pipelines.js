const Nanoidb = require('nanoidb');
const BSON = require('bson');

const PREFIX = 'aggregations/saved-pipelines';

// constants for save state modal
export const SAVED_PIPELINES_LIST_TOGGLED = `${PREFIX}/SAVED_PIPELINES_LIST_TOGGLED`;
export const SAVE_PIPELINE_MODAL_TOGGLED = `${PREFIX}/SAVE_PIPELINE_MODAL_TOGGLED`;
export const SAVE_MODAL_ERROR_TOGGLED = `${PREFIX}/SAVE_MODAL_ERROR_TOGGLED`;

export const SAVED_PIPELINES_ADD = `${PREFIX}/ADD_SAVED_PIPELINES`;

// constants for indexeddb
export const SAVED_STATE_OBJECT_STORE = 'aggregation-pipeline-plugin-saved-state';
export const INDEXED_DB = 'aggregation-pipeline-plugin';

export const INITIAL_STATE = {
  pipelines: [],
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

const addSavedPipelines = (state, action) => {
  return { ...state, pipelines: action.pipelines };
};

const MAPPINGS = {};

MAPPINGS[SAVED_PIPELINES_LIST_TOGGLED] = toggleSavedPipelinesList;
MAPPINGS[SAVE_PIPELINE_MODAL_TOGGLED] = toggleSavePipelineModal;
MAPPINGS[SAVE_MODAL_ERROR_TOGGLED] = toggleSaveModalError;
MAPPINGS[SAVED_PIPELINES_ADD] = addSavedPipelines;

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

export const savedPipelinesAdd = (pipelines) => ({
  type: SAVED_PIPELINES_ADD,
  pipelines: pipelines
});

export const getSavedPipelines = () => {
  return (dispatch) => {
    const db = Nanoidb(INDEXED_DB, 1);

    db.on('upgrade', (diffData) => {
      diffData.db.createObjectStore(SAVED_STATE_OBJECT_STORE);
    });

    db.on('open', (stores) => {
      getAllOp(stores[SAVED_STATE_OBJECT_STORE]);

      function getAllOp(store) {
        store.getAll((err, results) => {
          if (err) console.log(err);

          const pipelines = [];
          results.forEach((result) => {
            const pipeline = {
              recordKey: result.recordKey,
              pipelineName: result.pipelineName
            };
            pipelines.push(pipeline);
          });

          dispatch(savedPipelinesAdd(pipelines));
        });
      }
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

    const db = Nanoidb(INDEXED_DB, 1);

    const ObjectID = BSON.ObjectID;
    const key = ObjectID(100).toHexString();

    const stateRecord = Object.assign({}
      , { inputDocuments: state.inputDocuments }
      , { savedPipelines: state.savedPipelines }
      , { namespace: state.namespace }
      , { stages: state.stages }
      , { view: state.view }
      , { pipelineName: pipelineName }
      , { recordKey: key }
    );

    db.on('upgrade', (diffData) => {
      diffData.db.createObjectStore(SAVED_STATE_OBJECT_STORE);
    });

    db.on('open', (stores) => {
      putOp(stores[SAVED_STATE_OBJECT_STORE]);

      function putOp(store) {
        store.put(key, stateRecord, (err) => {
          // how do we store/handle errors?
          if (err) return dispatch(saveModalErrorToggle(1, err));
          // how do we handle success messages
          // no error should do two things: call close modal action-creator and saved pipelines in open action creator
          dispatch(savedPipelinesListToggle(1));
          dispatch(savePipelineModalToggle(0));
          dispatch(getSavedPipelines());
          // do a get request to indexeddb to get all the info
          // do a dispatch to write info to initial state's pipeline array
        });
      }
    });
  };
};
