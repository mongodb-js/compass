import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { openToast, ToastVariant } from '@mongodb-js/compass-components';
import type { AnyAction } from 'redux';
import { createId } from './id';
import type { PipelineBuilderThunkAction } from '.';
import type { StoredPipeline } from '../utils/pipeline-storage';
import {
  getPipelineFromBuilderState,
  getPipelineStringFromBuilderState,
  mapPipelineModeToEditorViewType,
} from './pipeline-builder/builder-helpers';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';

const { track, debug } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

const PREFIX = 'aggregations/saved-pipeline';

export const SET_SHOW_SAVED_PIPELINES = `${PREFIX}/SET_SHOW`;
export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD`;
export const RESTORE_PIPELINE = `${PREFIX}/RESTORE_PIPELINE`;
export const SET_OPEN_PIPELINE_ID = `${PREFIX}/SET_OPEN_PIPELINE_ID`;
export const SET_DELETE_PIPELINE_ID = `${PREFIX}/SET_DELETE_PIPELINE_ID`;

export type SavedPipelineState = {
  pipelines: StoredPipeline[];
  isLoaded: boolean;
  isListVisible: boolean;
  openPipelineId?: string;
  deletePipelineId?: string;
};

export const INITIAL_STATE: SavedPipelineState = {
  pipelines: [],
  isLoaded: false,
  isListVisible: false,
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

const setOpenPipelineId = (state: SavedPipelineState, action: AnyAction) => ({
  ...state,
  openPipelineId: action.id,
});

const setDeletePipelineId = (state: SavedPipelineState, action: AnyAction) => ({
  ...state,
  deletePipelineId: action.id,
});

const MAPPINGS = {
  [SET_SHOW_SAVED_PIPELINES]: setShowSavedPipelinesList,
  [SAVED_PIPELINE_ADD]: addSavedPipeline,
  [RESTORE_PIPELINE]: doRestoreSavedPipeline,
  [SET_OPEN_PIPELINE_ID]: setOpenPipelineId,
  [SET_DELETE_PIPELINE_ID]: setDeletePipelineId,
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
      show,
    });
  };

export const savedPipelineAdd = (pipelines: StoredPipeline[]) => ({
  type: SAVED_PIPELINE_ADD,
  pipelines,
});

export const getSavedPipelines =
  (): PipelineBuilderThunkAction<void> => (dispatch, getState) => {
    if (!getState().savedPipeline.isLoaded) {
      dispatch(updatePipelineList());
    }
  };

/**
 * Update the pipeline list.
 */
export const updatePipelineList =
  (): PipelineBuilderThunkAction<void> =>
  (dispatch, getState, { pipelineStorage }) => {
    const state = getState();
    pipelineStorage
      .loadAll()
      .then((pipelines: StoredPipeline[]) => {
        const thisNamespacePipelines = pipelines.filter(
          ({ namespace }) => namespace === state.namespace
        );
        dispatch(savedPipelineAdd(thisNamespacePipelines));
        dispatch(
          globalAppRegistryEmit('agg-pipeline-saved', { name: state.name })
        );
      })
      .catch((err) => {
        debug('Failed to load pipelines', err);
      });
  };

/**
 * Get the delete action.
 */
export const deletePipelineById = (
  pipelineId: string
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineStorage }) => {
    track('Aggregation Deleted', {
      id: pipelineId,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
      screen: 'aggregations',
    });
    await pipelineStorage.delete(pipelineId);
    dispatch(updatePipelineList());
    dispatch(closeDeletePipeline());
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
      track('Aggregation Opened', {
        id,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
        screen: 'aggregations',
      });

      const data = await pipelineStorage.load(id);
      if (!data) {
        throw new Error(`Pipeline with id ${id} not found`);
      }
      pipelineBuilder.reset(data.pipelineText);
      dispatch({
        type: RESTORE_PIPELINE,
        stages: pipelineBuilder.stages,
        pipelineText: pipelineBuilder.source,
        pipeline: pipelineBuilder.pipeline,
        syntaxErrors: pipelineBuilder.syntaxError,
        restoreState: data,
      });
      dispatch(updatePipelinePreview());
      if (pipelineBuilder.syntaxError.length > 0) {
        let shortName = data.name.slice(0, 20);
        if (shortName.length < data.name.length) {
          shortName += '…';
        }
        openToast('restore-pipeline-with-errors', {
          title: "Can't parse pipeline source to stages",
          body: `Loaded pipeline "${shortName}" contains syntax errors`,
          variant: ToastVariant.Warning,
          timeout: 10000,
        });
      }
    } catch (e: unknown) {
      debug(e);
    } finally {
      dispatch(closeOpenPipeline());
    }
  };
};

/**
 * Save the current state of your pipeline
 */
export const saveCurrentPipeline =
  (): PipelineBuilderThunkAction<void> =>
  async (dispatch, getState, { pipelineBuilder, pipelineStorage }) => {
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
      dataService,
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
        dataService.dataService?.getConnectionString().hosts.join(',') ?? null,
    };

    await pipelineStorage.updateAttributes(savedPipeline.id, savedPipeline);

    const stagesLength = (() => {
      try {
        return getPipelineFromBuilderState(getState(), pipelineBuilder).length;
      } catch {
        // For the case where pipeline contains syntax errors
        return undefined;
      }
    })();

    track('Aggregation Saved', {
      id: savedPipeline.id,
      num_stages: stagesLength,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
    });

    dispatch(updatePipelineList());
  };

export const openPipeline = (id: string): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const isPipelineModified = getState().isModified;
    if (isPipelineModified) {
      dispatch({
        type: SET_OPEN_PIPELINE_ID,
        id,
      });
    } else {
      dispatch(openPipelineById(id));
    }
  };
};

export const closeOpenPipeline = () => ({
  type: SET_OPEN_PIPELINE_ID,
});

export const deletePipeline = (id: string) => ({
  type: SET_DELETE_PIPELINE_ID,
  id,
});

export const closeDeletePipeline = () => ({
  type: SET_DELETE_PIPELINE_ID,
});
