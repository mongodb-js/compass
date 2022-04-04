import { createId } from './id';
import { setIsModified } from './is-modified';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { getDirectory } from '../utils/get-directory';
import { PipelineStorage } from '../utils/pipeline-storage';

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
 * @param {Number} index
 * @returns {import('redux').AnyAction} The action.
 */
export const savedPipelinesListToggle = (index) => ({
  type: SAVED_PIPELINES_LIST_TOGGLED,
  index: index
});

export const savedPipelineAdd = (pipelines) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines: pipelines
});

/**
 * 
 * @returns {import('redux').AnyAction}
 */
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
    const pipelineStorage = new PipelineStorage();
    const state = getState();
    pipelineStorage.loadAll()
      .then(pipelines => {
        const thisNamespacePipelines = pipelines.filter(({namespace}) => namespace === state.namespace);
        dispatch(setIsModified(false));
        dispatch(savedPipelineAdd(thisNamespacePipelines));
        dispatch(globalAppRegistryEmit('agg-pipeline-saved', { name: state.name }));
      })
      .catch(err => {
        debug('Failed to load pipelines', err);
      });
  };
};

/**
 * Save the current state of your pipeline
 *
 * @returns {import('redux').AnyAction} The action.
 */
export const saveCurrentPipeline = () => {
  return (dispatch, getState) => {
    const asyncr = require('async');
    const fs = require('fs');
    const path = require('path');

    const state = getState();

    if (state.id === '') {
      dispatch(createId());
    }
    const id = getState().id;

    const pipeline = state.pipeline.map((stage) => {
      return { ...stage, previewDocuments: [] };
    });
    track('Aggregation Saved', { id, num_stages: pipeline.length });

    const stateRecord = Object.assign({}
      , { namespace: state.namespace }
      , { env: state.env }
      , { isTimeSeries: state.isTimeSeries }
      , { isReadonly: state.isReadonly }
      , { sourceName: state.sourceName }
      , { pipeline: pipeline }
      , { name: state.name }
      , { id: id }
      , { comments: state.comments }
      , { sample: state.sample }
      , { autoPreview: state.autoPreview }
      , { collation: state.collation }
      , { collationString: state.collationString }
    );

    const dirname = getDirectory();
    asyncr.series([
      (callback) => {
        fs.mkdir(dirname, { recursive: true }, () => {
          callback();
        });
      },
      (callback) => {
        const fileName = path.join(dirname, `${stateRecord.id}.json`);
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

export const showSavedPipelines = () => {
  return (dispatch) => {
    dispatch(getSavedPipelines());
    dispatch(savedPipelinesListToggle(1));
  };
};