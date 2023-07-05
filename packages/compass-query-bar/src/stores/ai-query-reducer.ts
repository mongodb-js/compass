import type { Reducer } from 'redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import preferences from 'compass-preferences-model';

import type { QueryBarThunkAction } from './query-bar-store';
import { isAction } from '../utils';
import { runFetchAIQuery } from '../modules/ai-query-request';

const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');

type AIQueryStatus = 'ready' | 'fetching' | 'success';

export type AIQueryState = {
  errorMessage: string | undefined;
  isInputVisible: boolean;
  status: AIQueryStatus;
  aiQueryFetchId: number; // Maps to the AbortController of the current fetch (or -1).
};

export const initialState: AIQueryState = {
  status: 'ready',
  errorMessage: undefined,
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

type AIQueryStartedAction = {
  type: AIQueryActionTypes.AIQueryStarted;
  fetchId: number;
};

type AIQueryFailedAction = {
  type: AIQueryActionTypes.AIQueryFailed;
  errorMessage: string;
};

export type AIQuerySucceededAction = {
  type: AIQueryActionTypes.AIQuerySucceeded;
  query: unknown;
};

function logFailed(errorMessage: string) {
  log.info(mongoLogId(1_001_000_198), 'AIQuery', 'AI query request failed', {
    errorMessage,
  });
}

export const runAIQuery = (
  userPrompt: string
): QueryBarThunkAction<
  Promise<void>,
  AIQueryStartedAction | AIQueryFailedAction | AIQuerySucceededAction
> => {
  return async (dispatch, getState, { dataProvider }) => {
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
      const sampleDocuments = await dataProvider.sample(
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
      if (signal.aborted) {
        // TODO: Does this error when aborted or should we include this check.
        return;
      }

      const schema = await getSimplifiedSchema(sampleDocuments);

      if (signal.aborted) {
        return;
      }

      const { collection: collectionName } = toNS(namespace);
      jsonResponse = await runFetchAIQuery({
        signal: abortController.signal,
        userPrompt,
        collectionName,
        schema,
        sampleDocuments,
      });
    } catch (err: any) {
      if (signal.aborted) {
        // If we already aborted so we ignore the error.
        return;
      }

      logFailed(err?.message);
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
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
    try {
      if (!jsonResponse?.content?.query) {
        throw new Error(
          'No query returned. Please try again with a different prompt.'
        );
      }

      query = jsonResponse?.content?.query;
    } catch (err: any) {
      logFailed(err?.message);
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    // Error if the response is empty. TODO: We'll want to also parse if no
    // applicable query fields are detected.
    if (!query || Object.keys(query).length === 0) {
      const msg =
        'No query was returned from the ai. Consider re-wording your prompt.';
      logFailed(msg);
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: msg,
      });
      return;
    }

    log.info(
      mongoLogId(1_001_000_199),
      'AIQuery',
      'AI query request succeeded',
      {
        query,
      }
    );

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
      query,
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

export const showInput = (): ShowInputAction => ({
  type: AIQueryActionTypes.ShowInput,
});

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
    return {
      ...state,
      status: 'ready',
      aiQueryFetchId: -1,
      errorMessage: action.errorMessage,
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
      didSucceed: true,
    };
  }

  if (isAction<CancelAIQueryAction>(action, AIQueryActionTypes.CancelAIQuery)) {
    return {
      ...state,
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

  return state;
};

export { aiQueryReducer };
