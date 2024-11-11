import type { Action, Reducer } from 'redux';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import { UUID } from 'bson';

import type { QueryBarThunkAction } from './query-bar-store';
import { isAction } from '../utils';
import {
  mapQueryToFormFields,
  parseQueryAttributesToFormFields,
} from '../utils/query';
import type { QueryFormFields } from '../constants/query-properties';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import { openToast } from '@mongodb-js/compass-components';
import type { AtlasServiceError } from '@mongodb-js/atlas-service/renderer';
import type { Logger } from '@mongodb-js/compass-logging/provider';
import { mongoLogId } from '@mongodb-js/compass-logging/provider';
import type { TrackFunction } from '@mongodb-js/compass-telemetry';
import type { ConnectionInfo } from '@mongodb-js/compass-connections/provider';

type AIQueryStatus = 'ready' | 'fetching' | 'success';

export type AIQueryState = {
  errorMessage: string | undefined;
  errorCode: string | undefined;
  isInputVisible: boolean;
  aiPromptText: string;
  status: AIQueryStatus;
  aiQueryRequestId: string | null; // Maps to the AbortController of the current fetch (or null).
  lastAIQueryRequestId: string | null; // We store the last request id so we can pass it when a user provides feedback.
};

export const initialState: AIQueryState = {
  status: 'ready',
  aiPromptText: '',
  errorMessage: undefined,
  errorCode: undefined,
  isInputVisible: false,
  aiQueryRequestId: null,
  lastAIQueryRequestId: null,
};

export const enum AIQueryActionTypes {
  AIQueryStarted = 'compass-query-bar/ai-query/AIQueryStarted',
  AIQueryCancelled = 'compass-query-bar/ai-query/AIQueryCancelled',
  AIQueryFailed = 'compass-query-bar/ai-query/AIQueryFailed',
  AIQuerySucceeded = 'compass-query-bar/ai-query/AIQuerySucceeded',
  CancelAIQuery = 'compass-query-bar/ai-query/CancelAIQuery',
  ShowInput = 'compass-query-bar/ai-query/ShowInput',
  HideInput = 'compass-query-bar/ai-query/HideInput',
  ChangeAIPromptText = 'compass-query-bar/ai-query/ChangeAIPromptText',
}

const NUM_DOCUMENTS_TO_SAMPLE = 4;

const AIQueryAbortControllerMap = new Map<string, AbortController>();

function getAbortSignal() {
  const id = new UUID().toString();
  const controller = new AbortController();
  AIQueryAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: string) {
  const controller = AIQueryAbortControllerMap.get(id);
  controller?.abort();
  return AIQueryAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: string) {
  return AIQueryAbortControllerMap.delete(id);
}

type ShowInputAction = {
  type: AIQueryActionTypes.ShowInput;
};

type HideInputAction = {
  type: AIQueryActionTypes.HideInput;
};

type ChangeAIPromptTextAction = {
  type: AIQueryActionTypes.ChangeAIPromptText;
  text: string;
};

export const changeAIPromptText = (text: string): ChangeAIPromptTextAction => ({
  type: AIQueryActionTypes.ChangeAIPromptText,
  text,
});

type AIQueryStartedAction = {
  type: AIQueryActionTypes.AIQueryStarted;
  requestId: string;
};

type AIQueryFailedAction = {
  type: AIQueryActionTypes.AIQueryFailed;
  errorMessage: string;
  statusCode?: number;
  errorCode?: string;
};

export type AIQuerySucceededAction = {
  type: AIQueryActionTypes.AIQuerySucceeded;
  fields: QueryFormFields;
  requestId: string;
};

type FailedResponseTrackMessage = {
  statusCode?: number;
  errorCode?: string;
  errorName: string;
  errorMessage: string;
  log: Logger['log'];
  track: TrackFunction;
  requestId: string;
  connectionInfo: ConnectionInfo;
};

function trackAndLogFailed({
  statusCode,
  errorCode,
  errorName,
  errorMessage,
  log,
  track,
  requestId,
  connectionInfo,
}: FailedResponseTrackMessage) {
  log.warn(mongoLogId(1_001_000_198), 'AIQuery', 'AI query request failed', {
    statusCode,
    errorMessage,
    errorName,
    errorCode,
    requestId,
  });
  track(
    'AI Response Failed',
    () => ({
      editor_view_type: 'find' as const,
      error_name: errorName,
      status_code: statusCode,
      error_code: errorCode ?? '',
      request_id: requestId,
    }),
    connectionInfo
  );
}

export const runAIQuery = (
  userInput: string
): QueryBarThunkAction<
  Promise<void>,
  AIQueryStartedAction | AIQueryFailedAction | AIQuerySucceededAction
> => {
  return async (
    dispatch,
    getState,
    {
      dataService,
      localAppRegistry,
      preferences,
      atlasAiService,
      logger: { log },
      connectionInfoRef,
      track,
    }
  ) => {
    const provideSampleDocuments =
      preferences.getPreferences().enableGenAISampleDocumentPassing;
    const abortController = new AbortController();
    const { id: requestId, signal } = getAbortSignal();

    const connectionInfo = connectionInfoRef.current;

    track(
      'AI Prompt Submitted',
      () => ({
        editor_view_type: 'find' as const,
        user_input_length: userInput.length,
        has_sample_documents: provideSampleDocuments,
        request_id: requestId,
      }),
      connectionInfo
    );

    const {
      aiQuery: { aiQueryRequestId: existingRequestId },
      queryBar: { namespace },
    } = getState();

    if (existingRequestId !== null) {
      // Cancel the active request as this one will override.
      abort(existingRequestId);
    }

    dispatch({
      type: AIQueryActionTypes.AIQueryStarted,
      requestId,
    });

    let jsonResponse;
    try {
      const sampleDocuments = await dataService.sample(
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
      );
      const schema = await getSimplifiedSchema(sampleDocuments);

      const { collection: collectionName, database: databaseName } =
        toNS(namespace);
      jsonResponse = await atlasAiService.getQueryFromUserInput(
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
        errorName: 'request_error',
        statusCode: (err as AtlasServiceError).statusCode || err?.code,
        errorCode: (err as AtlasServiceError).errorCode || err?.name,
        errorMessage: (err as AtlasServiceError).message,
        log,
        track,
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
        type: AIQueryActionTypes.AIQueryFailed,
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
        mongoLogId(1_001_000_197),
        'AIQuery',
        'Cancelled ai query request',
        {
          requestId,
        }
      );
      return;
    }

    let query;
    let generatedFields: QueryFormFields;
    try {
      query = jsonResponse?.content?.query;
      generatedFields = parseQueryAttributesToFormFields(
        query,
        preferences.getPreferences()
      );
    } catch (err: any) {
      trackAndLogFailed({
        errorName: 'could_not_parse_fields',
        statusCode: (err as AtlasServiceError).statusCode,
        errorMessage: err?.message,
        log,
        track,
        requestId,
        connectionInfo,
      });
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    // Error when the response is empty or there is nothing to map.
    if (!generatedFields || Object.keys(generatedFields).length === 0) {
      const aggregation = jsonResponse?.content?.aggregation;

      // The query endpoint may return the aggregation property in addition to filter, project, etc..
      // It happens when the AI model couldn't generate a query and tried to fulfill a task with the aggregation.
      if (aggregation) {
        localAppRegistry?.emit('generate-aggregation-from-query', {
          userInput,
          aggregation,
          requestId,
        });
        const msg =
          'Query requires stages from aggregation framework therefore an aggregation was generated.';
        trackAndLogFailed({
          errorName: 'ai_generated_aggregation_instead_of_query',
          errorMessage: msg,
          log,
          track,
          requestId,
          connectionInfo,
        });
        return;
      }

      const msg =
        'No query was returned from the ai. Consider re-wording your prompt.';
      trackAndLogFailed({
        errorName: 'no_usable_query_from_ai',
        errorMessage: msg,
        log,
        track,
        requestId,
        connectionInfo,
      });
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: msg,
      });
      return;
    }

    const queryFields = {
      ...mapQueryToFormFields(
        preferences.getPreferences(),
        DEFAULT_FIELD_VALUES
      ),
      ...generatedFields,
    };

    log.info(
      mongoLogId(1_001_000_199),
      'AIQuery',
      'AI query request succeeded',
      {
        requestId,
        shape: Object.keys(generatedFields),
      }
    );
    track(
      'AI Response Generated',
      () => ({
        editor_view_type: 'find' as const,
        query_shape: Object.keys(generatedFields),
        request_id: requestId,
      }),
      connectionInfo
    );

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
      fields: queryFields,
      requestId,
    });
  };
};

type CancelAIQueryAction = {
  type: AIQueryActionTypes.CancelAIQuery;
};

export const cancelAIQuery = (): QueryBarThunkAction<
  void,
  CancelAIQueryAction
> => {
  return (dispatch, getState) => {
    // Abort any ongoing op.
    const existingRequestId = getState().aiQuery.aiQueryRequestId;
    if (existingRequestId !== null) {
      abort(existingRequestId);
    }

    dispatch({
      type: AIQueryActionTypes.CancelAIQuery,
    });
  };
};

export const showInput = (): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasAiService }) => {
    try {
      if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN !== 'true') {
        await atlasAiService.ensureAiFeatureAccess();
      }
      dispatch({ type: AIQueryActionTypes.ShowInput });
    } catch {
      // if sign in failed / user canceled we just don't show the input
    }
  };
};

export const hideInput = (): QueryBarThunkAction<void, HideInputAction> => {
  return (dispatch) => {
    // Cancel any ongoing op when we hide.
    dispatch(cancelAIQuery());
    dispatch({ type: AIQueryActionTypes.HideInput });
  };
};

const aiQueryReducer: Reducer<AIQueryState, Action> = (
  state = initialState,
  action
) => {
  if (
    isAction<AIQueryStartedAction>(action, AIQueryActionTypes.AIQueryStarted)
  ) {
    return {
      ...state,
      status: 'fetching',
      errorMessage: undefined,
      aiQueryRequestId: action.requestId,
    };
  }

  if (isAction<AIQueryFailedAction>(action, AIQueryActionTypes.AIQueryFailed)) {
    // If fetching query failed due to authentication error, reset the state to
    // hide the input and show the "Generate query" button again: this should start
    // the sign in flow for the user when clicked
    if (action.statusCode === 401) {
      return { ...initialState };
    }

    return {
      ...state,
      status: 'ready',
      aiQueryRequestId: null,
      errorMessage: action.errorMessage,
      errorCode: action.errorCode,
    };
  }

  if (
    isAction<AIQuerySucceededAction>(
      action,
      AIQueryActionTypes.AIQuerySucceeded
    )
  ) {
    return {
      ...state,
      status: 'success',
      aiQueryRequestId: null,
      lastAIQueryRequestId: action.requestId,
    };
  }

  if (isAction<CancelAIQueryAction>(action, AIQueryActionTypes.CancelAIQuery)) {
    return {
      ...state,
      status: 'ready',
      aiQueryRequestId: null,
    };
  }

  if (isAction<ShowInputAction>(action, AIQueryActionTypes.ShowInput)) {
    return {
      ...state,
      isInputVisible: true,
    };
  }

  if (isAction<HideInputAction>(action, AIQueryActionTypes.HideInput)) {
    return {
      ...state,
      isInputVisible: false,
    };
  }

  if (
    isAction<ChangeAIPromptTextAction>(
      action,
      AIQueryActionTypes.ChangeAIPromptText
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

export { aiQueryReducer };
