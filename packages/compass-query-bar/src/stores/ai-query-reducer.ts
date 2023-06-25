import type { Action, AnyAction, Reducer } from 'redux';
import type { ThunkAction } from 'redux-thunk';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

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

type AIQuerySucceededAction = {
  type: AIQueryActionTypes.AIQuerySucceeded;
};

function getAIQueryEndpoint(): string {
  if (!process.env.DEV_AI_QUERY_ENDPOINT) {
    throw new Error(
      'No AI Query endpoint to fetch. Please specific in the environment variable `DEV_AI_QUERY_ENDPOINT`'
    );
  }

  return process.env.DEV_AI_QUERY_ENDPOINT;
}

export const runAIQuery = (
  text: string
): AIQueryThunkAction<
  Promise<void>,
  | AIQueryStartedAction
  | AIQueryCancelledAction
  | AIQueryFailedAction
  | AIQuerySucceededAction
> => {
  return async (dispatch, getState) => {
    const { aiQueryAbortController } = getState();

    if (aiQueryAbortController) {
      // Cancel any current request (this one will override).
      aiQueryAbortController.abort();
    }

    const abortController = new AbortController();

    dispatch({
      type: AIQueryActionTypes.AIQueryStarted,
      abortController,
    });

    log.info(mongoLogId(1_001_000_193), 'AIQuery', 'Start AI Query Request', {
      text,
    });

    try {
      // TODO: run ai query with env variable for the endpoint.
      const endpoint = `${getAIQueryEndpoint()}/api/v1/generate-query`;
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text,
        }),
      });
      console.log('res', res);
    } catch (err: any) {
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    if (abortController.signal.aborted) {
      // TODO: Also in the catch?
      dispatch({
        type: AIQueryActionTypes.AIQueryCancelled,
      });
      return;
    }

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
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
    return {
      ...state,
      errorMessage: 'Cancelled', // TODO: Cancelling messaging
    };
  }

  if (isAction<AIQueryFailedAction>(action, AIQueryActionTypes.AIQueryFailed)) {
    return {
      ...state,
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
