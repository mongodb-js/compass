import type { Reducer } from 'redux';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import preferences from 'compass-preferences-model';

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

const { log, mongoLogId, track } = createLoggerAndTelemetry('AI-QUERY-UI');

type AIQueryStatus = 'ready' | 'fetching' | 'success';

export type AIQueryState = {
  errorMessage: string | undefined;
  errorCode: string | undefined;
  isInputVisible: boolean;
  aiPromptText: string;
  status: AIQueryStatus;
  aiQueryFetchId: number; // Maps to the AbortController of the current fetch (or -1).
};

export const initialState: AIQueryState = {
  status: 'ready',
  aiPromptText: '',
  errorMessage: undefined,
  errorCode: undefined,
  isInputVisible: false,
  aiQueryFetchId: -1,
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
  AtlasServiceDisableAIFeature = 'compass-query-bar/ai-query/AtlasServiceDisableAIFeature',
}

const NUM_DOCUMENTS_TO_SAMPLE = 4;

const AIQueryAbortControllerMap = new Map<number, AbortController>();

let aiQueryFetchId = 0;

function getAbortSignal() {
  const id = ++aiQueryFetchId;
  const controller = new AbortController();
  AIQueryAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = AIQueryAbortControllerMap.get(id);
  controller?.abort();
  return AIQueryAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
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
  fetchId: number;
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
};

type FailedResponseTrackMessage = {
  statusCode?: number;
  errorCode?: string;
  errorName: string;
  errorMessage: string;
};

function trackAndLogFailed({
  statusCode,
  errorCode,
  errorName,
  errorMessage,
}: FailedResponseTrackMessage) {
  log.warn(mongoLogId(1_001_000_198), 'AIQuery', 'AI query request failed', {
    statusCode,
    errorMessage,
    errorName,
    errorCode,
  });
  track('AI Response Failed', () => ({
    editor_view_type: 'find',
    error_name: errorName,
    status_code: statusCode,
    error_code: errorCode ?? '',
  }));
}

export const runAIQuery = (
  userInput: string
): QueryBarThunkAction<
  Promise<void>,
  AIQueryStartedAction | AIQueryFailedAction | AIQuerySucceededAction
> => {
  track('AI Prompt Submitted', () => ({
    editor_view_type: 'find',
    user_input_length: userInput.length,
  }));

  return async (
    dispatch,
    getState,
    { dataService, atlasService, localAppRegistry }
  ) => {
    const {
      aiQuery: { aiQueryFetchId: existingFetchId },
      queryBar: { namespace },
    } = getState();

    if (aiQueryFetchId !== -1) {
      // Cancel the active request as this one will override.
      abort(existingFetchId);
    }

    const abortController = new AbortController();
    const { id: fetchId, signal } = getAbortSignal();

    dispatch({
      type: AIQueryActionTypes.AIQueryStarted,
      fetchId,
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
      jsonResponse = await atlasService.getQueryFromUserInput({
        signal: abortController.signal,
        userInput,
        collectionName,
        databaseName,
        schema,
        // sampleDocuments, // For now we are not passing sample documents to the ai.
      });
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
      cleanupAbortSignal(fetchId);
    }

    if (signal.aborted) {
      log.info(
        mongoLogId(1_001_000_197),
        'AIQuery',
        'Cancelled ai query request'
      );
      return;
    }

    let query;
    let generatedFields: QueryFormFields;
    try {
      query = jsonResponse?.content?.query;
      generatedFields = parseQueryAttributesToFormFields(query);
    } catch (err: any) {
      trackAndLogFailed({
        errorName: 'could_not_parse_fields',
        statusCode: (err as AtlasServiceError).statusCode,
        errorMessage: err?.message,
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
        });
        const msg =
          'Query requires stages from aggregation framework therefore an aggregation was generated.';
        trackAndLogFailed({
          errorName: 'ai_generated_aggregation_instead_of_query',
          errorMessage: msg,
        });
        return;
      }

      const msg =
        'No query was returned from the ai. Consider re-wording your prompt.';
      trackAndLogFailed({
        errorName: 'no_usable_query_from_ai',
        errorMessage: msg,
      });
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: msg,
      });
      return;
    }

    const queryFields = {
      ...mapQueryToFormFields(DEFAULT_FIELD_VALUES),
      ...generatedFields,
    };

    log.info(
      mongoLogId(1_001_000_199),
      'AIQuery',
      'AI query request succeeded',
      {
        shape: Object.keys(generatedFields),
      }
    );
    track('AI Response Generated', () => ({
      editor_view_type: 'find',
      query_shape: Object.keys(generatedFields),
    }));

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
      fields: queryFields,
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
    abort(getState().aiQuery.aiQueryFetchId);

    dispatch({
      type: AIQueryActionTypes.CancelAIQuery,
    });
  };
};

type AtlasServiceDisableAIFeatureAction = {
  type: AIQueryActionTypes.AtlasServiceDisableAIFeature;
};

export const disableAIFeature = (): QueryBarThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelAIQuery());
    dispatch({ type: AIQueryActionTypes.AtlasServiceDisableAIFeature });
  };
};

export const showInput = (): QueryBarThunkAction<Promise<void>> => {
  return async (dispatch, _getState, { atlasService }) => {
    try {
      if (process.env.COMPASS_E2E_SKIP_ATLAS_SIGNIN !== 'true') {
        await atlasService.signIn({ promptType: 'ai-promo-modal' });
        await atlasService.enableAIFeature();
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

const aiQueryReducer: Reducer<AIQueryState> = (
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
      aiQueryFetchId: action.fetchId,
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
      aiQueryFetchId: -1,
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
      aiQueryFetchId: -1,
    };
  }

  if (isAction<CancelAIQueryAction>(action, AIQueryActionTypes.CancelAIQuery)) {
    return {
      ...state,
      status: 'ready',
      aiQueryFetchId: -1,
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

  if (
    isAction<AtlasServiceDisableAIFeatureAction>(
      action,
      AIQueryActionTypes.AtlasServiceDisableAIFeature
    )
  ) {
    return {
      ...initialState,
    };
  }

  return state;
};

export { aiQueryReducer };
