import type { Reducer } from 'redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import preferences from 'compass-preferences-model';
import { openToast } from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';

import type { PipelineBuilderThunkAction } from '../';
import { isAction } from '../../utils/is-action';
import type { PipelineParserError } from './pipeline-parser/utils';
import type Stage from './stage';
import { updatePipelinePreview } from './builder-helpers';
import type { AtlasServiceNetworkError } from '@mongodb-js/atlas-service/renderer';

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-PIPELINE-UI');

const emptyPipelineError =
  'No pipeline was returned. Please try again with a different prompt.';

type AIPipelineStatus = 'ready' | 'fetching' | 'success';

export type AIPipelineState = {
  errorMessage: string | undefined;
  isInputVisible: boolean;
  aiPromptText: string;
  status: AIPipelineStatus;
  aiPipelineFetchId: number; // Maps to the AbortController of the current fetch (or -1).
  isAggregationGeneratedFromQuery: boolean;
};

export const initialState: AIPipelineState = {
  status: 'ready',
  aiPromptText: '',
  errorMessage: undefined,
  isInputVisible: false,
  aiPipelineFetchId: -1,
  isAggregationGeneratedFromQuery: false,
};

export const enum AIPipelineActionTypes {
  AIPipelineStarted = 'compass-aggregations/pipeline-builder/pipeline-ai/AIPipelineStarted',
  AIPipelineCancelled = 'compass-aggregations/pipeline-builder/pipeline-ai/AIPipelineCancelled',
  AIPipelineFailed = 'compass-aggregations/pipeline-builder/pipeline-ai/AIPipelineFailed',
  CancelAIPipelineGeneration = 'compass-aggregations/pipeline-builder/pipeline-ai/CancelAIPipelineGeneration',
  resetIsAggregationGeneratedFromQuery = 'compass-aggregations/pipeline-builder/pipeline-ai/resetIsAggregationGeneratedFromQuery',
  ShowInput = 'compass-aggregations/pipeline-builder/pipeline-ai/ShowInput',
  HideInput = 'compass-aggregations/pipeline-builder/pipeline-ai/HideInput',
  ChangeAIPromptText = 'compass-aggregations/pipeline-builder/pipeline-ai/ChangeAIPromptText',
  LoadGeneratedPipeline = 'compass-aggregations/LoadGeneratedPipeline',
  PipelineGeneratedFromQuery = 'compass-aggregations/PipelineGeneratedFromQuery',
}

const NUM_DOCUMENTS_TO_SAMPLE = 4;

const AIPipelineAbortControllerMap = new Map<number, AbortController>();

let aiPipelineFetchId = 0;

function getAbortSignal() {
  const id = ++aiPipelineFetchId;
  const controller = new AbortController();
  AIPipelineAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = AIPipelineAbortControllerMap.get(id);
  controller?.abort();
  return AIPipelineAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
  return AIPipelineAbortControllerMap.delete(id);
}

type ShowInputAction = {
  type: AIPipelineActionTypes.ShowInput;
};

type HideInputAction = {
  type: AIPipelineActionTypes.HideInput;
};

type ChangeAIPromptTextAction = {
  type: AIPipelineActionTypes.ChangeAIPromptText;
  text: string;
};

export const changeAIPromptText = (text: string): ChangeAIPromptTextAction => ({
  type: AIPipelineActionTypes.ChangeAIPromptText,
  text,
});

export type LoadGeneratedPipelineAction = {
  type: AIPipelineActionTypes.LoadGeneratedPipeline;
  pipelineText: string;
  pipeline: Document[] | null;
  syntaxErrors: PipelineParserError[];
  stages: Stage[];
};

export const generateAggregationFromQuery = ({
  aggregation,
  userInput,
}: {
  aggregation: { pipeline: string };
  userInput: string;
}): PipelineBuilderThunkAction<void, PipelineGeneratedFromQueryAction> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    const pipelineText = String(aggregation?.pipeline);

    pipelineBuilder.reset(pipelineText);

    dispatch({
      type: AIPipelineActionTypes.PipelineGeneratedFromQuery,
      stages: pipelineBuilder.stages,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
      text: userInput,
    });

    dispatch(updatePipelinePreview());
  };
};

type AIPipelineStartedAction = {
  type: AIPipelineActionTypes.AIPipelineStarted;
  fetchId: number;
};

type AIPipelineFailedAction = {
  type: AIPipelineActionTypes.AIPipelineFailed;
  errorMessage: string;
  networkErrorCode?: number;
};

export type PipelineGeneratedFromQueryAction = {
  type: AIPipelineActionTypes.PipelineGeneratedFromQuery;
  text: string;
};

type FailedResponseTrackMessage = {
  editor_view_type: 'stages' | 'text';
  errorCode?: number;
  errorMessage: string;
  errorName: string;
};

function trackAndLogFailed({
  editor_view_type,
  errorCode,
  errorMessage,
  errorName,
}: FailedResponseTrackMessage) {
  log.warn(
    mongoLogId(1_001_000_230),
    'AIPipeline',
    'AI pipeline request failed',
    {
      errorCode,
      errorMessage,
      errorName,
    }
  );
  track('AI Response Failed', () => ({
    editor_view_type,
    error_code: errorCode,
    error_name: errorName,
  }));
}

export const runAIPipelineGeneration = (
  userInput: string
): PipelineBuilderThunkAction<
  Promise<void>,
  AIPipelineStartedAction | AIPipelineFailedAction | LoadGeneratedPipelineAction
> => {
  return async (dispatch, getState, { atlasService, pipelineBuilder }) => {
    const {
      pipelineBuilder: {
        aiPipeline: { aiPipelineFetchId: existingFetchId },
        pipelineMode,
      },
      namespace,
      dataService: { dataService },
    } = getState();

    const editor_view_type = pipelineMode === 'builder-ui' ? 'stages' : 'text';
    track('AI Prompt Submitted', () => ({
      editor_view_type,
      user_input_length: userInput.length,
    }));

    if (aiPipelineFetchId !== -1) {
      // Cancel the active request as this one will override.
      abort(existingFetchId);
    }

    const abortController = new AbortController();
    const { id: fetchId, signal } = getAbortSignal();

    dispatch({
      type: AIPipelineActionTypes.AIPipelineStarted,
      fetchId,
    });

    let jsonResponse;
    try {
      const sampleDocuments =
        (await dataService?.sample?.(
          namespace,
          {
            query: {},
            size: NUM_DOCUMENTS_TO_SAMPLE,
          },
          {
            maxTimeMS: preferences.getPreferences().maxTimeMS,
            promoteValues: false,
          },
          {
            abortSignal: signal,
          }
        )) || [];
      const schema = await getSimplifiedSchema(sampleDocuments);

      const { collection: collectionName, database: databaseName } =
        toNS(namespace);
      jsonResponse = await atlasService.getAggregationFromUserInput({
        signal: abortController.signal,
        userInput,
        collectionName,
        databaseName,
        schema,
        // sampleDocuments, // For now we are not passing sample documents to the ai.
      });
    } catch (err) {
      if (signal.aborted) {
        // If we already aborted so we ignore the error.
        return;
      }
      trackAndLogFailed({
        editor_view_type,
        errorCode: (err as AtlasServiceNetworkError).statusCode,
        errorMessage: (err as AtlasServiceNetworkError).message,
        errorName: 'request_error',
      });
      // We're going to reset input state with this error, show the error in the
      // toast instead
      if ((err as AtlasServiceNetworkError).statusCode === 401) {
        openToast('ai-unauthorized', {
          variant: 'important',
          title: 'Network Error',
          description: 'Unauthorized',
          timeout: 5000,
        });
      }
      dispatch({
        type: AIPipelineActionTypes.AIPipelineFailed,
        errorMessage: (err as AtlasServiceNetworkError).message,
        networkErrorCode: (err as AtlasServiceNetworkError).statusCode ?? -1,
      });
      return;
    } finally {
      // Remove the AbortController from the Map as we either finished
      // waiting for the fetch or cancelled at this point.
      cleanupAbortSignal(fetchId);
    }

    if (signal.aborted) {
      log.info(
        mongoLogId(1_001_000_231),
        'AIPipeline',
        'Cancelled ai pipeline request'
      );
      return;
    }

    const pipelineText = jsonResponse.content.aggregation?.pipeline;
    try {
      if (!pipelineText) {
        throw new Error(emptyPipelineError);
      }
    } catch (err) {
      trackAndLogFailed({
        editor_view_type,
        errorCode: (err as AtlasServiceNetworkError).statusCode,
        errorMessage: (err as Error).message,
        errorName: 'empty_pipeline_error',
      });
      dispatch({
        type: AIPipelineActionTypes.AIPipelineFailed,
        errorMessage: (err as Error).message,
      });
      return;
    }

    log.info(
      mongoLogId(1_001_000_228),
      'AIPipeline',
      'AI pipeline request succeeded',
      {
        pipelineText,
      }
    );

    pipelineBuilder.reset(pipelineText);

    track('AI Prompt Generated', () => ({
      editor_view_type,
      syntax_errors: true,
      query_shape: pipelineBuilder.stages.map((stage) => stage.operator),
    }));

    dispatch({
      type: AIPipelineActionTypes.LoadGeneratedPipeline,
      stages: pipelineBuilder.stages,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
    });

    dispatch(updatePipelinePreview());
  };
};

type CancelAIPipelineGenerationAction = {
  type: AIPipelineActionTypes.CancelAIPipelineGeneration;
};

export const cancelAIPipelineGeneration = (): PipelineBuilderThunkAction<
  void,
  CancelAIPipelineGenerationAction
> => {
  return (dispatch, getState) => {
    // Abort any ongoing op.
    abort(getState().pipelineBuilder.aiPipeline.aiPipelineFetchId);

    dispatch({
      type: AIPipelineActionTypes.CancelAIPipelineGeneration,
    });
  };
};

type resetIsAggregationGeneratedFromQueryAction = {
  type: AIPipelineActionTypes.resetIsAggregationGeneratedFromQuery;
};

export const resetIsAggregationGeneratedFromQuery =
  (): PipelineBuilderThunkAction<
    void,
    resetIsAggregationGeneratedFromQueryAction
  > => {
    return (dispatch) => {
      dispatch({
        type: AIPipelineActionTypes.resetIsAggregationGeneratedFromQuery,
      });
    };
  };

export const showInput = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasService }) => {
    try {
      if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN !== 'true') {
        await atlasService.signIn({ promptType: 'ai-promo-modal' });
      }
      dispatch({
        type: AIPipelineActionTypes.ShowInput,
      });
    } catch {
      // if sign in failed / user canceled we just don't show the input
    }
  };
};

export const hideInput = (): PipelineBuilderThunkAction<
  void,
  HideInputAction
> => {
  return (dispatch) => {
    // Cancel any ongoing op when we hide.
    dispatch(cancelAIPipelineGeneration());
    dispatch({ type: AIPipelineActionTypes.HideInput });
  };
};

const aiPipelineReducer: Reducer<AIPipelineState> = (
  state = initialState,
  action
) => {
  if (
    isAction<AIPipelineStartedAction>(
      action,
      AIPipelineActionTypes.AIPipelineStarted
    )
  ) {
    return {
      ...state,
      status: 'fetching',
      errorMessage: undefined,
      aiPipelineFetchId: action.fetchId,
    };
  }

  if (
    isAction<AIPipelineFailedAction>(
      action,
      AIPipelineActionTypes.AIPipelineFailed
    )
  ) {
    // If fetching query failed due to authentication error, reset the state to
    // hide the input and show the "Ask AI" button again: this should start the
    // sign in flow for the user when clicked
    if (action.networkErrorCode === 401) {
      return { ...initialState };
    }

    return {
      ...state,
      status: 'ready',
      aiPipelineFetchId: -1,
      errorMessage: action.errorMessage,
    };
  }

  if (
    isAction<LoadGeneratedPipelineAction>(
      action,
      AIPipelineActionTypes.LoadGeneratedPipeline
    )
  ) {
    return {
      ...state,
      status: 'success',
      aiPipelineFetchId: -1,
    };
  }

  if (
    isAction<PipelineGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.PipelineGeneratedFromQuery
    )
  ) {
    return {
      ...state,
      status: 'success',
      aiPipelineFetchId: -1,
      isInputVisible: true,
      isAggregationGeneratedFromQuery: true,
      aiPromptText: action.text,
    };
  }

  if (
    isAction<CancelAIPipelineGenerationAction>(
      action,
      AIPipelineActionTypes.CancelAIPipelineGeneration
    )
  ) {
    return {
      ...state,
      status: 'ready',
      aiPipelineFetchId: -1,
    };
  }

  if (
    isAction<resetIsAggregationGeneratedFromQueryAction>(
      action,
      AIPipelineActionTypes.resetIsAggregationGeneratedFromQuery
    )
  ) {
    return {
      ...state,
      isAggregationGeneratedFromQuery: false,
    };
  }

  if (isAction<ShowInputAction>(action, AIPipelineActionTypes.ShowInput)) {
    return {
      ...state,
      isInputVisible: true,
    };
  }

  if (isAction<HideInputAction>(action, AIPipelineActionTypes.HideInput)) {
    return {
      ...state,
      isInputVisible: false,
      isAggregationGeneratedFromQuery: false,
    };
  }

  if (
    isAction<ChangeAIPromptTextAction>(
      action,
      AIPipelineActionTypes.ChangeAIPromptText
    )
  ) {
    return {
      ...state,
      // Reset the status after a successful run when the user change's the text.
      status: state.status === 'success' ? 'ready' : state.status,
      aiPromptText: action.text,
    };
  }

  return state;
};

export default aiPipelineReducer;
