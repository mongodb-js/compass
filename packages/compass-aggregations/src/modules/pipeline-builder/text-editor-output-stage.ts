import type { Reducer } from 'redux';
import type { AggregateOptions, MongoServerError } from 'mongodb';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import type { PipelineBuilderThunkAction } from '..';
import { DEFAULT_MAX_TIME_MS } from '../../constants';
import { isAction } from '../../utils/is-action';
import { EditorActionTypes, canRunPipeline } from './text-editor-pipeline';
import type { EditorValueChangeAction } from './text-editor-pipeline';
import { ActionTypes as ConfirmNewPipelineActions } from '../is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from '../saved-pipeline';
import { aggregatePipeline } from '../../utils/cancellable-aggregation';
import { gotoOutResults } from '../out-results-fn';
import type { PipelineModeToggledAction} from './pipeline-mode';
import { ActionTypes as PipelineModeActionTypes } from './pipeline-mode';

const enum OutputStageActionTypes {
  FetchStarted = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchStarted',
  FetchSucceded = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchSucceded',
  FetchFailed = 'compass-aggregations/pipeline-builder/text-editor-output-stage/FetchFailed',
};

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

type OutputStageState = {
  isLoading: boolean,
  serverError: MongoServerError | null,
  isComplete: boolean;
};

const INITIAL_STATE: OutputStageState = {
  isLoading: false,
  isComplete: false,
  serverError: null,
};

const reducer: Reducer<OutputStageState> = (state = INITIAL_STATE, action) => {
  if (
    isAction<EditorValueChangeAction>(
      action,
      EditorActionTypes.EditorValueChange
    ) ||
    isAction<PipelineModeToggledAction>(
      action,
      PipelineModeActionTypes.PipelineModeToggled
    ) ||
    action.type === RESTORE_PIPELINE ||
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed
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

export const runPipelineWithOutputStage = (
): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      autoPreview,
      isAtlasDeployed,
      dataService: { dataService },
      namespace,
      maxTimeMS,
      collationString,
    } = getState();


    if (!dataService || !isAtlasDeployed) {
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
        collation: collationString.value ?? undefined
      };
      const { signal } = new AbortController();
      await aggregatePipeline({
        dataService,
        signal,
        namespace,
        pipeline,
        options
      });
      dispatch({
        type: OutputStageActionTypes.FetchSucceded,
      });
      dispatch(globalAppRegistryEmit('agg-pipeline-out-executed'));
    } catch (error) {
      dispatch({
        type: OutputStageActionTypes.FetchFailed,
        serverError: error,
      });
    }
  };
};

export const gotoOutputStageCollection = (
): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const {
      pipelineBuilder: {
        textEditor: {
          pipeline: { pipeline }
        }
      }
    } = getState();
    // $out or $merge is always last stage
    const lastStageIndex = pipeline.length - 1;
    dispatch(gotoOutResults(lastStageIndex));
  };
};


export default reducer;