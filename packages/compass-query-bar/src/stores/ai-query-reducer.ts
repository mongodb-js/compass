import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

import { runFetchAIQuery } from '../modules/ai-query-request';

const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');

export type AIQueryState = {
  aiQueryAbortController: AbortController | undefined;
  errorMessage: string | undefined;
  // Used to indicate in the UI when an AI query has succeeded.
  didSucceed: boolean;
};

export const initialState: AIQueryState = {
  aiQueryAbortController: undefined,
  errorMessage: undefined,
  didSucceed: false,
};

export const enum AIQueryActionTypes {
  AIQueryStarted = 'compass-query-bar/ai-query/AIQueryStarted',
  AIQueryCancelled = 'compass-query-bar/ai-query/AIQueryCancelled',
  AIQueryFailed = 'compass-query-bar/ai-query/AIQueryFailed',
  AIQuerySucceeded = 'compass-query-bar/ai-query/AIQuerySucceeded',

  CancelAIQuery = 'compass-query-bar/ai-query/CancelAIQuery',
}

function isAction<A extends AnyAction>(
  action: AnyAction,
  type: A['type']
): action is A {
  return action.type === type;
}

type AIQueryStartedAction = {
  type: AIQueryActionTypes.AIQueryStarted;
  abortController: AbortController;
};

type AIQueryCancelledAction = {
  type: AIQueryActionTypes.AIQueryCancelled;
};

type AIQueryFailedAction = {
  type: AIQueryActionTypes.AIQueryFailed;
  errorMessage: string;
};

export type AIQuerySucceededAction = {
  type: AIQueryActionTypes.AIQuerySucceeded;
  query: unknown;
};

export const runAIQuery = (
  userPrompt: string
): AIQueryThunkAction<
  Promise<void>,
  | AIQueryStartedAction
  | AIQueryCancelledAction
  | AIQueryFailedAction
  | AIQuerySucceededAction
> => {
  return async (dispatch, getState) => {
    const { aiQueryAbortController: existingAbortController } = getState();

    if (existingAbortController) {
      // Cancel any current request (this one will override).
      existingAbortController.abort();
    }

    const abortController = new AbortController();

    dispatch({
      type: AIQueryActionTypes.AIQueryStarted,
      abortController,
    });

    let jsonResponse;
    try {
      jsonResponse = await runFetchAIQuery({
        signal: abortController.signal,
        userPrompt,
      });
    } catch (err: any) {
      if (abortController.signal.aborted) {
        // If we already aborted so we ignore the error.
        return;
      }

      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    if (abortController.signal.aborted) {
      dispatch({
        type: AIQueryActionTypes.AIQueryCancelled,
      });
      return;
    }

    let query;
    try {
      if (!jsonResponse?.query) {
        throw new Error(
          'No query returned. Please try again with a different prompt.'
        );
      }

      query = jsonResponse.query;
    } catch (err: any) {
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    // Error if the response is empty.
    if (!query || Object.keys(query)) {
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage:
          'No query was returned from the ai. Consider re-wording your prompt.',
      });
      return;
    }

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
      query,
    });
  };
};

type CancelAIQueryAction = {
  type: AIQueryActionTypes.CancelAIQuery;
};

export const cancelAIQuery = (): CancelAIQueryAction => ({
  type: AIQueryActionTypes.CancelAIQuery,
});

const aiQueryReducer: Reducer<AIQueryState> = (
  state = initialState,
  action
) => {
  if (
    isAction<AIQueryStartedAction>(action, AIQueryActionTypes.AIQueryStarted)
  ) {
    return {
      ...state,
      didSucceed: false,
      errorMessage: undefined,
      aiQueryAbortController: action.abortController,
    };
  }

  if (
    isAction<AIQueryCancelledAction>(
      action,
      AIQueryActionTypes.AIQueryCancelled
    )
  ) {
    log.info(
      mongoLogId(1_001_000_197),
      'AIQuery',
      'Cancelled ai query request'
    );
    return state;
  }

  if (isAction<AIQueryFailedAction>(action, AIQueryActionTypes.AIQueryFailed)) {
    log.info(mongoLogId(1_001_000_198), 'AIQuery', 'AI query request failed', {
      errorMessage: action.errorMessage,
    });

    return {
      ...state,
      aiQueryAbortController: undefined,
      errorMessage: action.errorMessage,
    };
  }

  if (
    isAction<AIQuerySucceededAction>(
      action,
      AIQueryActionTypes.AIQuerySucceeded
    )
  ) {
    log.info(
      mongoLogId(1_001_000_199),
      'AIQuery',
      'AI query request succeeded',
      {
        query: action.query,
      }
    );
    return {
      ...state,
      aiQueryAbortController: undefined,
      didSucceed: true,
    };
  }

  if (isAction<CancelAIQueryAction>(action, AIQueryActionTypes.CancelAIQuery)) {
    if (state.aiQueryAbortController) {
      state.aiQueryAbortController.abort();
    }
    return {
      ...state,
      aiQueryAbortController: undefined,
    };
  }

  return state;
};

type AIQueryThunkAction<R, A extends Action = AnyAction> = ThunkAction<
  R,
  AIQueryState,
  void,
  A
>;

export { aiQueryReducer };
