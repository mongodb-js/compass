import { openToast } from '@mongodb-js/compass-components';
import { createId } from './id';
import type { PipelineBuilderThunkAction } from '.';
import type { SavedPipeline } from '@mongodb-js/my-queries-storage';
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
import type { PipelineBuilder } from './pipeline-builder/pipeline-builder';
import type { AnyAction } from 'redux';

const PREFIX = 'aggregations/saved-pipeline';

export const SAVED_PIPELINE_ADD = `${PREFIX}/ADD` as const;
export const RESTORE_PIPELINE = `${PREFIX}/RESTORE_PIPELINE` as const;

export interface SavedPipelineAddAction {
  type: typeof SAVED_PIPELINE_ADD;
  pipelines: SavedPipeline[];
}
export type RestorePipelineAction = ReturnType<typeof restorePipeline>;
export type SavedPipelineAction =
  | SavedPipelineAddAction
  | RestorePipelineAction;

export type SavedPipelineState = {
  pipelines: SavedPipeline[];
  isLoaded: boolean;
};

export const INITIAL_STATE: SavedPipelineState = {
  pipelines: [],
  isLoaded: false,
};

const addSavedPipeline = (
  state: SavedPipelineState,
  action: SavedPipelineAddAction
) => {
  return { ...state, pipelines: action.pipelines, isLoaded: true };
};

const doRestoreSavedPipeline = (state: SavedPipelineState) => {
  return { ...state, isListVisible: false };
};

const MAPPINGS: {
  [Type in SavedPipelineAction['type']]: (
    state: SavedPipelineState,
    action: SavedPipelineAction & { type: Type }
  ) => SavedPipelineState;
} = {
  [SAVED_PIPELINE_ADD]: addSavedPipeline,
  [RESTORE_PIPELINE]: doRestoreSavedPipeline,
};

export default function reducer(
  state: SavedPipelineState = INITIAL_STATE,
  action: AnyAction
) {
  const fn = MAPPINGS[action.type as SavedPipelineAction['type']];
  return fn ? fn(state, action as any) : state;
}

export const savedPipelineAdd = (
  pipelines: SavedPipeline[]
): SavedPipelineAddAction => ({
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
  (
    dispatch,
    getState,
    { pipelineStorage, logger: { debug }, globalAppRegistry }
  ) => {
    const state = getState();
    pipelineStorage
      ?.loadAll()
      .then((pipelines: SavedPipeline[]) => {
        const thisNamespacePipelines = pipelines.filter(
          ({ namespace }) => namespace === state.namespace
        );
        dispatch(savedPipelineAdd(thisNamespacePipelines));
        globalAppRegistry.emit('agg-pipeline-saved', { name: state.name });
      })
      .catch((err) => {
        debug('Failed to load pipelines', err);
      });
  };

function restorePipeline(
  pipelineData: SavedPipeline,
  pipelineBuilder: PipelineBuilder
) {
  return {
    type: RESTORE_PIPELINE,
    stages: pipelineBuilder.stages,
    pipelineText: pipelineBuilder.source,
    pipeline: pipelineBuilder.pipeline,
    syntaxErrors: pipelineBuilder.syntaxError,
    storedOptions: {
      id: pipelineData.id,
      name: pipelineData.name,
      collationString: pipelineData.collationString,
      comments: pipelineData.comments,
      autoPreview: pipelineData.autoPreview,
    },
  };
}

/**
 * Restore pipeline by an ID
 */
export const openStoredPipeline = (
  pipelineData: SavedPipeline,
  updatePreview = true
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState, { pipelineBuilder, logger: { debug } }) => {
    try {
      pipelineBuilder.reset(pipelineData.pipelineText);
      dispatch(restorePipeline(pipelineData, pipelineBuilder));
      if (updatePreview) {
        dispatch(updatePipelinePreview());
      }
      if (pipelineBuilder.syntaxError.length > 0) {
        let shortName = pipelineData.name.slice(0, 20);
        if (shortName.length < pipelineData.name.length) {
          shortName += '…';
        }
        openToast('restore-pipeline-with-errors', {
          title: "Can't parse pipeline source to stages",
          description: `Loaded pipeline "${shortName}" contains syntax errors`,
          variant: 'warning',
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
  async (
    dispatch,
    getState,
    { pipelineBuilder, pipelineStorage, track, connectionInfoRef }
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

    await pipelineStorage?.createOrUpdate(savedPipeline.id, savedPipeline);

    const stagesLength = (() => {
      try {
        return getPipelineFromBuilderState(getState(), pipelineBuilder).length;
      } catch {
        // For the case where pipeline contains syntax errors
        return undefined;
      }
    })();

    track(
      'Aggregation Saved',
      {
        id: savedPipeline.id,
        num_stages: stagesLength,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
      },
      connectionInfoRef.current
    );

    dispatch(updatePipelineList());
  };

export const confirmOpenPipeline =
  (pipelineData: SavedPipeline): PipelineBuilderThunkAction<void> =>
  async (dispatch, getState, { track, connectionInfoRef }) => {
    const isModified = getState().isModified;
    const connectionInfo = connectionInfoRef.current;
    if (isModified) {
      track('Screen', { name: 'restore_pipeline_modal' }, connectionInfo);
      const confirmed = await showConfirmation({
        title: 'Are you sure you want to open this pipeline?',
        description:
          'Opening this project will abandon unsaved changes to the current pipeline you are building.',
        buttonText: 'Open Pipeline',
      });
      if (!confirmed) {
        return;
      }
    }
    track(
      'Aggregation Opened',
      {
        id: pipelineData.id,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
        screen: 'aggregations',
      },
      connectionInfo
    );
    void dispatch(openStoredPipeline(pipelineData));
  };

export const confirmDeletePipeline =
  (pipelineId: string): PipelineBuilderThunkAction<void> =>
  async (dispatch, getState, { pipelineStorage, track, connectionInfoRef }) => {
    const connectionInfo = connectionInfoRef.current;
    track('Screen', { name: 'delete_pipeline_modal' }, connectionInfo);
    const confirmed = await showConfirmation({
      title: 'Are you sure you want to delete this pipeline?',
      description:
        'Deleting this pipeline will remove it from your saved pipelines.',
      buttonText: 'Delete Pipeline',
      variant: ConfirmationModalVariant.Danger,
    });
    if (!confirmed) {
      return;
    }
    track(
      'Aggregation Deleted',
      {
        id: pipelineId,
        editor_view_type: mapPipelineModeToEditorViewType(getState()),
        screen: 'aggregations',
      },
      connectionInfo
    );
    await pipelineStorage?.delete(pipelineId);
    dispatch(updatePipelineList());
  };
