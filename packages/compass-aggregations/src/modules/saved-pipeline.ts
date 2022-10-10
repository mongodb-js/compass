import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AnyAction } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import { createId } from './id';
import { setIsModified } from './is-modified';
import { PipelineStorage } from '../utils/pipeline-storage';
import type { RootState } from '.';
import type { Pipeline } from './pipeline';
import { runStage } from './pipeline';

const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const PREFIX = 'aggregations/saved-pipeline';

export const SET_SHOW_SAVED_PIPELINES = `${PREFIX}/SET_SHOW`;
export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;
export const RESTORE_PIPELINE = `${PREFIX}/RESTORE_PIPELINE`;

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

const setShowSavedPipelinesList = (
  state: SavedPipelineState,
  action: AnyAction
) => {
  return { ...state, isListVisible: !!action.show };
};

const addSavedPipeline = (state: SavedPipelineState, action: AnyAction) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const doRestoreSavedPipeline = (state: SavedPipelineState) => {
  return { ...state, isListVisible: false };
};

const MAPPINGS = {
  [SET_SHOW_SAVED_PIPELINES]: setShowSavedPipelinesList,
  [SAVED_PIPELINE_ADD]: addSavedPipeline,
  [RESTORE_PIPELINE]: doRestoreSavedPipeline
};

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  const fn = MAPPINGS[action.type];
  return fn ? fn(state, action) : state;
}

export const setShowSavedPipelines =
  (show: boolean): ThunkAction<void, RootState, void, AnyAction> =>
  (dispatch) => {
    if (show) {
      dispatch(getSavedPipelines());
    }
    dispatch({
      type: SET_SHOW_SAVED_PIPELINES,
      show
    });
  };

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
 * Get the delete action.
 */
export const deletePipeline = (
  pipelineId: string
): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch) => {
    const pipelineStorage = new PipelineStorage();
    await pipelineStorage.delete(pipelineId);
    dispatch(updatePipelineList());
  };
};

/**
 * Get the restore action.
 *
 * @param {Object} restoreState - The state.
 *
 * @returns {Object} The action.
 */
export const restoreSavedPipeline = (restoreState: unknown): AnyAction => ({
  type: RESTORE_PIPELINE,
  restoreState: restoreState
});

/**
 * Restore pipeline
 */
export const openPipeline = (
  pipeline: unknown
): ThunkAction<void, RootState, void, AnyAction> => {
  return (dispatch) => {
    dispatch(restoreSavedPipeline(pipeline));
    dispatch(runStage(0, true /* force execute */));
  };
};

/**
 * Restore pipeline by an ID
 */
export const openPipelineById = (
  id: string
): ThunkAction<Promise<void>, RootState, void, AnyAction> => {
  return async (dispatch) => {
    try {
      const pipelineStorage = new PipelineStorage();
      const data = await pipelineStorage.load(id);
      dispatch(openPipeline(data));
    } catch (e: unknown) {
      debug(e);
    }
  };
};

/**
 * Save the current state of your pipeline
 *
 * @returns {import('redux').AnyAction} The action.
 */
export const saveCurrentPipeline = (): ThunkAction<void, RootState, void, AnyAction> => async (
  dispatch, getState
) => {
  const pipelineStorage = new PipelineStorage();
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
    dataService
  } = getState();

  const savedPipeline = {
    id,
    name,
    namespace,
    comments,
    sample,
    autoPreview,
    collationString: text,
    pipeline,
    host:
      dataService?.dataService?.getConnectionString?.().hosts.join(',') ??
      null
  };

  await pipelineStorage.updateAttributes(savedPipeline.id, savedPipeline);

  track('Aggregation Saved', {
    id: savedPipeline.id,
    num_stages: pipeline.length
  });

  dispatch(updatePipelineList());
};
