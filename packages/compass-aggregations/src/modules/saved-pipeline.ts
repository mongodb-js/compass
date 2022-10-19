import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { AnyAction } from 'redux';
import { createId } from './id';
import { setIsModified } from './is-modified';
import type { PipelineBuilderThunkAction } from '.';
import type { StoredPipeline } from '../utils/pipeline-storage';
import { loadPreviewForStagesFrom } from './pipeline-builder/stage-editor';
import { getPipelineFromBuilderState, getPipelineStringFromBuilderState } from './pipeline-builder/builder-helpers';

const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const PREFIX = 'aggregations/saved-pipeline';

export const SET_SHOW_SAVED_PIPELINES = `${PREFIX}/SET_SHOW`;
export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;
export const RESTORE_PIPELINE = `${PREFIX}/RESTORE_PIPELINE`;

export type SavedPipelineState = {
  pipelines: StoredPipeline[];
  isLoaded: boolean;
  isListVisible: boolean;
};

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
  (show: boolean): PipelineBuilderThunkAction<void> =>
  (dispatch) => {
    if (show) {
      dispatch(getSavedPipelines());
    }
    dispatch({
      type: SET_SHOW_SAVED_PIPELINES,
      show
    });
  };

export const savedPipelineAdd = (pipelines: StoredPipeline[]) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines
});

export const getSavedPipelines = (): PipelineBuilderThunkAction<void> => 
  (dispatch, getState) => {
    if (!getState().savedPipeline.isLoaded) {
      dispatch(updatePipelineList());
    }
  };

/**
 * Update the pipeline list.
 */
export const updatePipelineList = (): PipelineBuilderThunkAction<void> =>
  (dispatch, getState, { pipelineStorage }) => {
    const state = getState();
    pipelineStorage.loadAll()
      .then((pipelines: StoredPipeline[]) => {
        const thisNamespacePipelines = pipelines.filter(
          ({ namespace }) => namespace === state.namespace
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
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineStorage }) => {
    await pipelineStorage.delete(pipelineId);
    dispatch(updatePipelineList());
  };
};

/**
 * Restore pipeline by an ID
 */
export const openPipelineById = (
  id: string
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineBuilder, pipelineStorage }) => {
    try {
      const data = await pipelineStorage.load(id);
      if (!data) {
        throw new Error(`Pipeline with id ${id} not found`);
      }
      pipelineBuilder.reset(data.pipelineText);
      dispatch({
        type: RESTORE_PIPELINE,
        stages: pipelineBuilder.stages,
        source: pipelineBuilder.source,
        restoreState: data
      });
      dispatch(loadPreviewForStagesFrom(0));
    } catch (e: unknown) {
      debug(e);
    }
  };
};

/**
 * Save the current state of your pipeline
 */
export const saveCurrentPipeline = (): PipelineBuilderThunkAction<void> => async (
  dispatch, getState, { pipelineBuilder, pipelineStorage }
) => {
  if (getState().id === '') {
    dispatch(createId());
  }

  const {
    id,
    name,
    namespace,
    comments,
    autoPreview,
    collationString: { text },
    dataService
  } = getState();

  const savedPipeline = {
    id,
    name,
    namespace,
    comments,
    autoPreview,
    collationString: text,
    pipelineText: getPipelineStringFromBuilderState(
      getState(),
      pipelineBuilder
    ),
    host:
      dataService.dataService?.getConnectionString().hosts.join(',') ?? null
  };

  await pipelineStorage.updateAttributes(savedPipeline.id, savedPipeline);

  track('Aggregation Saved', {
    id: savedPipeline.id,
    num_stages: getPipelineFromBuilderState(getState(), pipelineBuilder).length
  });

  dispatch(updatePipelineList());
};
