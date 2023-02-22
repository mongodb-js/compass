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
import {
  showConfirmation,
  ConfirmationModalVariant,
} from '@mongodb-js/compass-components';

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

const MAPPINGS = {
  [SET_SHOW_SAVED_PIPELINES]: setShowSavedPipelinesList,
  [SAVED_PIPELINE_ADD]: addSavedPipeline,
  [RESTORE_PIPELINE]: doRestoreSavedPipeline,
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

export const confirmOpenPipeline =
  (pipelineId: string): PipelineBuilderThunkAction<void> =>
  async (dispatch, getState) => {
    const isModified = getState().isModified;
    if (isModified) {
      track('Screen', { name: 'restore_pipeline_modal' });
      const confirmed = await showConfirmation({
        title: 'Are you sure you want to open this pipeline?',
        description:
          'Opening this project will abandon unsaved changes to the current pipeline you are building.',
      });
      if (!confirmed) {
        return;
      }
    }
    track('Aggregation Opened', {
      id: pipelineId,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
      screen: 'aggregations',
    });
    void dispatch(openPipelineById(pipelineId));
  };

export const confirmDeletePipeline =
  (pipelineId: string): PipelineBuilderThunkAction<void> =>
  async (dispatch, getState, { pipelineStorage }) => {
    track('Screen', { name: 'delete_pipeline_modal' });
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to delete this pipeline?',
      description:
        'Deleting this pipeline will remove it from your saved pipelines.',
      variant: ConfirmationModalVariant.Danger,
    });
    if (!confirmed) {
      return;
    }
    track('Aggregation Deleted', {
      id: pipelineId,
      editor_view_type: mapPipelineModeToEditorViewType(getState()),
      screen: 'aggregations',
    });
    await pipelineStorage.delete(pipelineId);
    dispatch(updatePipelineList());
  };
