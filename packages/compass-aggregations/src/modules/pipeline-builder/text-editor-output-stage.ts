import type { Action, Reducer } from 'redux';
import type { AggregateOptions, MongoServerError } from 'mongodb';
import type { PipelineBuilderThunkAction } from '..';
import { DEFAULT_MAX_TIME_MS } from '../../constants';
import { isAction } from '../../utils/is-action';
import { EditorActionTypes, canRunPipeline } from './text-editor-pipeline';
import type { EditorValueChangeAction } from './text-editor-pipeline';
import type { NewPipelineConfirmedAction } from '../is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from '../is-new-pipeline-confirm';
import type { RestorePipelineAction } from '../saved-pipeline';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { gotoOutResults } from '../out-results-fn';
import type { PipelineModeToggledAction } from './pipeline-mode';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-mode';
import { AIPipelineActionTypes } from './pipeline-ai';
import type {
  LoadGeneratedPipelineAction,
  PipelineGeneratedFromQueryAction,
} from './pipeline-ai';
import { getDestinationNamespaceFromStage } from '../../utils/stage';

const enum OutputStageActionTypes {
  FetchStarted = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchStarted',
  FetchSucceded = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchSucceded',
  FetchFailed = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchFailed',
}

type OutputStageFetchStartedAction = {
  type: OutputStageActionTypes.FetchStarted;
};

type OutputStageFetchSuccededAction = {
  type: OutputStageActionTypes.FetchSucceded;
};

type OutputStageFetchFailedAction = {
  type: OutputStageActionTypes.FetchFailed;
  serverError: MongoServerError;
};

export type OutputStageAction =
  | OutputStageFetchStartedAction
  | OutputStageFetchSuccededAction
  | OutputStageFetchFailedAction;

export type OutputStageState = {
  isLoading: boolean;
  serverError: MongoServerError | null;
  isComplete: boolean;
};

const INITIAL_STATE: OutputStageState = {
  isLoading: false,
  isComplete: false,
  serverError: null,
};

const reducer: Reducer<OutputStageState, Action> = (
  state = INITIAL_STATE,
  action
) => {
  if (
    isAction<EditorValueChangeAction>(
      action,
      EditorActionTypes.EditorValueChange
    ) ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    ) ||
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    ) ||
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    ) ||
    isAction<RestorePipelineAction>(action, RESTORE_PIPELINE) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return { ...INITIAL_STATE };
  }

  if (
    isAction<OutputStageFetchStartedAction>(
      action,
      OutputStageActionTypes.FetchStarted
    )
  ) {
    return {
      isLoading: true,
      isComplete: false,
      serverError: null,
    };
  }

  if (
    isAction<OutputStageFetchSuccededAction>(
      action,
      OutputStageActionTypes.FetchSucceded
    )
  ) {
    return {
      isLoading: false,
      isComplete: true,
      serverError: null,
    };
  }

  if (
    isAction<OutputStageFetchFailedAction>(
      action,
      OutputStageActionTypes.FetchFailed
    )
  ) {
    return {
      isLoading: false,
      isComplete: false,
      serverError: action.serverError,
    };
  }

  return state;
};

export const runPipelineWithOutputStage = (): PipelineBuilderThunkAction<
  Promise<void>
> => {
  return async (
    dispatch,
    getState,
    { pipelineBuilder, preferences, connectionScopedAppRegistry }
  ) => {
    const {
      autoPreview,
      dataService: { dataService },
      namespace,
      maxTimeMS,
      collationString,
    } = getState();

    if (
      !dataService ||
      // Running output stage from preview is not allowed if "run pipeline"
      // feature is enabled
      preferences.getPreferences().enableAggregationBuilderRunPipeline
    ) {
      return;
    }

    if (!canRunPipeline(autoPreview, pipelineBuilder.syntaxError)) {
      return;
    }

    try {
      dispatch({ type: OutputStageActionTypes.FetchStarted });
      const pipeline = pipelineBuilder.getPipelineFromSource();
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collationString.value ?? undefined,
      };
      const { signal } = new AbortController();
      await aggregatePipeline({
        dataService,
        preferences,
        signal,
        namespace,
        pipeline,
        options,
      });
      dispatch({
        type: OutputStageActionTypes.FetchSucceded,
      });
      connectionScopedAppRegistry.emit(
        'agg-pipeline-out-executed',
        getDestinationNamespaceFromStage(
          namespace,
          pipeline[pipeline.length - 1]
        )
      );
    } catch (error: any) {
      dispatch({
        type: OutputStageActionTypes.FetchFailed,
        serverError: error,
      });
    }
  };
};

export const gotoOutputStageCollection =
  (): PipelineBuilderThunkAction<void> => {
    return (dispatch, getState) => {
      const {
        namespace,
        pipelineBuilder: {
          textEditor: {
            pipeline: { pipeline },
          },
        },
      } = getState();
      const outNamespace = getDestinationNamespaceFromStage(
        namespace,
        // $out or $merge is always last stage
        pipeline[pipeline.length - 1]
      );
      if (outNamespace) {
        dispatch(gotoOutResults(outNamespace));
      }
    };
  };

export default reducer;
