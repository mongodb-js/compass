import type { Reducer } from 'redux';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import { openToast } from '@mongodb-js/compass-components';
import type { Document } from 'mongodb';
import { UUID } from 'bson';

import type { PipelineBuilderThunkAction } from '../';
import { isAction } from '../../utils/is-action';
import type { PipelineParserError } from './pipeline-parser/utils';
import type Stage from './stage';
import { updatePipelinePreview } from './builder-helpers';
import type { AtlasServiceError } from '@mongodb-js/atlas-service/renderer';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

const emptyPipelineError =
  'No pipeline was returned. Please try again with a different prompt.';

type AIPipelineStatus = 'ready' | 'fetching' | 'success';

export type AIPipelineState = {
  errorMessage: string | undefined;
  errorCode: string | undefined;
  isInputVisible: boolean;
  aiPromptText: string;
  status: AIPipelineStatus;
  aiPipelineRequestId: string | null; // Maps to the AbortController of the current fetch (or null).
  lastAIPipelineRequestId: string | null; // We store the last request id so we can pass it when a user provides feedback.
  isAggregationGeneratedFromQuery: boolean;
};

export const initialState: AIPipelineState = {
  status: 'ready',
  aiPromptText: '',
  errorMessage: undefined,
  errorCode: undefined,
  isInputVisible: false,
  aiPipelineRequestId: null,
  lastAIPipelineRequestId: null,
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
  LoadGeneratedPipeline = 'compass-aggregations/pipeline-builder/pipeline-ai/LoadGeneratedPipeline',
  PipelineGeneratedFromQuery = 'compass-aggregations/pipeline-builder/pipeline-ai/PipelineGeneratedFromQuery',
}

const NUM_DOCUMENTS_TO_SAMPLE = 4;

const AIPipelineAbortControllerMap = new Map<string, AbortController>();

function getAbortSignal() {
  const id = new UUID().toString();
  const controller = new AbortController();
  AIPipelineAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: string) {
  const controller = AIPipelineAbortControllerMap.get(id);
  controller?.abort();
  return AIPipelineAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: string) {
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
  requestId: string;
};

export const generateAggregationFromQuery = ({
  aggregation,
  userInput,
  requestId,
}: {
  aggregation: { pipeline: string };
  userInput: string;
  requestId: string;
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
      requestId,
    });

    dispatch(updatePipelinePreview());
  };
};

type AIPipelineStartedAction = {
  type: AIPipelineActionTypes.AIPipelineStarted;
  requestId: string;
};

type AIPipelineFailedAction = {
  type: AIPipelineActionTypes.AIPipelineFailed;
  errorMessage: string;
  statusCode?: number;
  errorCode?: string;
};

export type PipelineGeneratedFromQueryAction = {
  type: AIPipelineActionTypes.PipelineGeneratedFromQuery;
  text: string;
  stages: Stage[];
  pipelineText: string;
  pipeline: Document[] | null;
  syntaxErrors: PipelineParserError[];
  requestId: string;
};

type FailedResponseTrackMessage = {
  editor_view_type: 'stages' | 'text';
  statusCode?: number;
  errorMessage: string;
  errorName: string;
  errorCode?: string;
  requestId: string;
  connectionInfo: ConnectionInfo;
  track: TrackFunction;
} & Pick<Logger, 'log'>;

function trackAndLogFailed({
  editor_view_type,
  statusCode,
  errorMessage,
  errorName,
  errorCode,
  log,
  requestId,
  connectionInfo,
  track,
}: FailedResponseTrackMessage) {
  log.warn(
    mongoLogId(1_001_000_230),
    'AIPipeline',
    'AI pipeline request failed',
    {
      statusCode,
      errorMessage,
      errorName,
      errorCode,
      requestId,
    }
  );
  track(
    'AI Response Failed',
    {
      editor_view_type,
      error_code: errorCode || '',
      status_code: statusCode,
      error_name: errorName,
      request_id: requestId,
    },
    connectionInfo
  );
}

export const runAIPipelineGeneration = (
  userInput: string
): PipelineBuilderThunkAction<
  Promise<void>,
  AIPipelineStartedAction | AIPipelineFailedAction | LoadGeneratedPipelineAction
> => {
  return async (
    dispatch,
    getState,
    {
      atlasAiService,
      pipelineBuilder,
      preferences,
      logger: { log, mongoLogId },
      track,
      connectionInfoRef,
    }
  ) => {
    const {
      pipelineBuilder: {
        aiPipeline: { aiPipelineRequestId: existingRequestId },
        pipelineMode,
      },
      namespace,
      dataService: { dataService },
    } = getState();

    const connectionInfo = connectionInfoRef.current;

    const provideSampleDocuments =
      preferences.getPreferences().enableGenAISampleDocumentPassing;

    const editor_view_type: 'stages' | 'text' =
      pipelineMode === 'builder-ui' ? 'stages' : 'text';

    if (existingRequestId !== null) {
      // Cancel the active request as this one will override.
      abort(existingRequestId);
    }

    const abortController = new AbortController();
    const { id: requestId, signal } = getAbortSignal();

    track(
      'AI Prompt Submitted',
      () => ({
        editor_view_type,
        user_input_length: userInput.length,
        request_id: requestId,
        has_sample_documents: provideSampleDocuments,
      }),
      connectionInfo
    );

    dispatch({
      type: AIPipelineActionTypes.AIPipelineStarted,
      requestId,
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
      jsonResponse = await atlasAiService.getAggregationFromUserInput(
        {
          signal: abortController.signal,
          userInput,
          collectionName,
          databaseName,
          schema,
          // Provide sample documents when the user has opted in in their settings.
          ...(provideSampleDocuments
            ? {
                sampleDocuments,
              }
            : undefined),
          requestId,
        },
        connectionInfo
      );
    } catch (err: any) {
      if (signal.aborted) {
        // If we already aborted so we ignore the error.
        return;
      }
      trackAndLogFailed({
        editor_view_type,
        statusCode: (err as AtlasServiceError).statusCode || err?.code,
        errorCode: (err as AtlasServiceError).errorCode || err?.name,
        errorMessage: (err as AtlasServiceError).message,
        errorName: 'request_error',
        track,
        log,
        requestId,
        connectionInfo,
      });
      // We're going to reset input state with this error, show the error in the
      // toast instead
      if ((err as AtlasServiceError).statusCode === 401) {
        openToast('ai-unauthorized', {
          variant: 'important',
          title: 'Network Error',
          description: 'Unauthorized',
          timeout: 5000,
        });
      }
      dispatch({
        type: AIPipelineActionTypes.AIPipelineFailed,
        errorMessage: (err as AtlasServiceError).message,
        statusCode: (err as AtlasServiceError).statusCode ?? -1,
        errorCode: (err as AtlasServiceError).errorCode,
      });
      return;
    } finally {
      // Remove the AbortController from the Map as we either finished
      // waiting for the fetch or cancelled at this point.
      cleanupAbortSignal(requestId);
    }

    if (signal.aborted) {
      log.info(
        mongoLogId(1_001_000_231),
        'AIPipeline',
        'Cancelled ai pipeline request',
        { requestId }
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
        statusCode: (err as AtlasServiceError).statusCode,
        errorMessage: (err as Error).message,
        errorName: 'empty_pipeline_error',
        track,
        log,
        requestId,
        connectionInfo,
      });
      dispatch({
        type: AIPipelineActionTypes.AIPipelineFailed,
        errorMessage: (err as Error).message,
      });
      return;
    }

    pipelineBuilder.reset(pipelineText);

    log.info(
      mongoLogId(1_001_000_228),
      'AIPipeline',
      'AI pipeline request succeeded',
      {
        editorViewType: editor_view_type,
        syntaxErrors: !!(pipelineBuilder.syntaxError?.length > 0),
        shape: pipelineBuilder.stages.map((stage) => stage.operator),
        requestId,
      }
    );

    track(
      'AI Response Generated',
      () => ({
        editor_view_type,
        syntax_errors: !!(pipelineBuilder.syntaxError?.length > 0),
        query_shape: pipelineBuilder.stages.map((stage) => stage.operator),
        request_id: requestId,
      }),
      connectionInfo
    );

    dispatch({
      type: AIPipelineActionTypes.LoadGeneratedPipeline,
      stages: pipelineBuilder.stages,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
      requestId,
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
    const existingRequestId =
      getState().pipelineBuilder.aiPipeline.aiPipelineRequestId;
    if (existingRequestId !== null) {
      abort(existingRequestId);
    }

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
  return async (dispatch, _getState, { atlasAiService }) => {
    try {
      if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN !== 'true') {
        await atlasAiService.ensureAiFeatureAccess();
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

export type AIPipelineAction =
  | AIPipelineStartedAction
  | AIPipelineFailedAction
  | LoadGeneratedPipelineAction
  | PipelineGeneratedFromQueryAction
  | LoadGeneratedPipelineAction
  | CancelAIPipelineGenerationAction
  | resetIsAggregationGeneratedFromQueryAction
  | ShowInputAction
  | HideInputAction
  | ChangeAIPromptTextAction;
const aiPipelineReducer: Reducer<AIPipelineState, AIPipelineAction> = (
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
      aiPipelineRequestId: action.requestId,
    };
  }

  if (
    isAction<AIPipelineFailedAction>(
      action,
      AIPipelineActionTypes.AIPipelineFailed
    )
  ) {
    // If fetching query failed due to authentication error, reset the state to
    // hide the input and show the "Generate aggregation" button again: this should start the
    // sign in flow for the user when clicked
    if (action.statusCode === 401) {
      return { ...initialState };
    }
    return {
      ...state,
      status: 'ready',
      aiPipelineRequestId: null,
      errorMessage: action.errorMessage,
      errorCode: action.errorCode,
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
      aiPipelineRequestId: null,
      lastAIPipelineRequestId: action.requestId,
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
      aiPipelineRequestId: null,
      isInputVisible: true,
      isAggregationGeneratedFromQuery: true,
      lastAIPipelineRequestId: action.requestId,
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
      aiPipelineRequestId: null,
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
