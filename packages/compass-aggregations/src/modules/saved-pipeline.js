import { getObjectStore } from 'utils/indexed-db';
import { createId } from 'modules/id';
import { setIsModified } from 'modules/is-modified';
import { globalAppRegistryEmit } from 'mongodb-redux-common/app-registry';

const PREFIX = 'aggregations/saved-pipeline';

const DIRNAME = 'SavedPipelines';

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
 * @param {Number} index
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
    const asyncr = require('async');
    const fs = require('fs');
    const path = require('path');
    const { remote } = require('electron');

    const state = getState();
    const userDataDir = remote.app.getPath('userData');
    const dirname = path.join(userDataDir, DIRNAME);
    const pipelines = [];

    fs.readdir(dirname, (error, files) => {
      const validFiles = files.filter(file => file.endsWith('.json'));
      const tasks = validFiles.map((file) => {
        return (callback) => {
          fs.readFile(file, (err, data) => {
            const pipeline = JSON.parse(data);
            if (pipeline.namespace === state.namespace) {
              pipelines.push(pipeline);
            }
            callback(null);
          });
        };
      });
      asyncr.parallel(tasks, () => {
        dispatch(setIsModified(false));
        dispatch(savedPipelineAdd(pipelines));
        dispatch(globalAppRegistryEmit('agg-pipeline-saved', { name: state.name }));
      });
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
    const asyncr = require('async');
    const fs = require('fs');
    const path = require('path');
    const { remote } = require('electron');

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
      , { autoPreview: state.autoPreview }
      , { collation: state.collation }
      , { collationString: state.collationString }
    );

    const userDataDir = remote.app.getPath('userData');
    asyncr.series([
      (callback) => {
        const dirName = path.join(userDataDir, DIRNAME);
        fs.mkdir(dirName, { recursive: true }, () => {
          callback();
        });
      },
      (callback) => {
        const fileName = path.join(userDataDir, DIRNAME, `${pipeline.id}.json`);
        const options = { encoding: 'utf8', flag: 'w' };
        fs.writeFile(fileName, JSON.stringify(stateRecord), options, () => {
          callback(null);
        });
      }
    ], () => {
      dispatch(updatePipelineList());
    });
  };
};
