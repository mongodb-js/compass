import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

import { createId } from './id';
import { setIsModified } from './is-modified';
import { getDirectory } from '../utils/get-directory';
import { PipelineStorage } from '../utils/pipeline-storage';
import type { Pipeline } from './pipeline';
import type { RootState } from '.';

const PREFIX = 'aggregations/saved-pipeline';

export const SET_SHOW_SAVED_PIPELINES = `${PREFIX}/SET_SHOW`;
export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;

export type SavedPipelineState = {
  pipelines: Pipeline[];
  isLoaded: boolean;
  isListVisible: boolean;
}

export const INITIAL_STATE: SavedPipelineState = {
  pipelines: [],
  isLoaded: false,
  isListVisible: false
};

const copyState = (state: SavedPipelineState) => Object.assign({}, state);

const setShowSavedPipelinesList = (state: SavedPipelineState, action: AnyAction) => {
  const newState = copyState(state);
  newState.isListVisible = !!action.show;
  return newState;
};

const addSavedPipeline = (state: SavedPipelineState, action: AnyAction) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const MAPPINGS = {
  [SET_SHOW_SAVED_PIPELINES]: setShowSavedPipelinesList,
  [SAVED_PIPELINE_ADD]: addSavedPipeline
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

export const setShowSavedPipelines = (show: boolean) => ({
  type: SET_SHOW_SAVED_PIPELINES,
  show
});

export const savedPipelineAdd = (pipelines: Pipeline[]) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines
});

/**
 * 
 * @returns {import('redux').AnyAction}
 */
export const getSavedPipelines = (): ThunkAction<void, RootState, void, AnyAction> => 
  (dispatch, getState) => {
    if (!getState().savedPipeline.isLoaded) {
      dispatch(updatePipelineList());
    }
  };

/**
 * Update the pipeline list.
 *
 * @returns {Function} The thunk function.
 */
export const updatePipelineList = (): ThunkAction<void, RootState, void, AnyAction> =>
  (dispatch, getState) => {
    const pipelineStorage = new PipelineStorage();
    const state = getState();
    pipelineStorage.loadAll()
      .then(pipelines => {
        const thisNamespacePipelines = pipelines.filter(
          ({namespace}) => namespace === state.namespace
        );
        dispatch(setIsModified(false));
        dispatch(savedPipelineAdd(thisNamespacePipelines));
        dispatch(globalAppRegistryEmit('agg-pipeline-saved', { name: state.name }));
      })
      .catch(err => {
        debug('Failed to load pipelines', err);
      });
  };

/**
 * Save the current state of your pipeline
 *
 * @returns {import('redux').AnyAction} The action.
 */
export const saveCurrentPipeline = (): ThunkAction<void, RootState, void, AnyAction> => async (
  dispatch, getState
) => {
  // We dynamically require these libraries as this file is used in cloud and
  // we don't want global imports of packages not available on the web.
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const { promises: fs } = require('fs');
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const path = require('path');

  const state = getState();

  if (getState().id === '') {
    dispatch(createId());
  }

  const pipeline = state.pipeline.map((stage) => {
    return { ...stage, previewDocuments: [] };
  });

  const {
    id,
    name,
    namespace,
    comments,
    sample,
    autoPreview,
    collationString: { text },
    limit,
    largeLimit,
    maxTimeMS,
    dataService
  } = getState();

  const stateRecord = {
    id,
    name,
    namespace,
    comments,
    sample,
    autoPreview,
    collationString: text,
    limit,
    largeLimit,
    maxTimeMS,
    pipeline,
    host:
      dataService?.dataService?.getConnectionString?.().hosts.join(',') ??
      null
  };

  track('Aggregation Saved', {
    id: stateRecord.id,
    num_stages: pipeline.length
  });

  const dirname = getDirectory();

  await fs.mkdir(dirname, { recursive: true });

  const fileName = path.join(dirname, `${stateRecord.id}.json`);
  const options = { encoding: 'utf8', flag: 'w' };

  await fs.writeFile(fileName, JSON.stringify(stateRecord), options);

  dispatch(updatePipelineList());
};

export const showSavedPipelines = (): ThunkAction<void, RootState, void, AnyAction> => 
  (dispatch) => {
    dispatch(getSavedPipelines());
    dispatch(setShowSavedPipelines(true));
  };
