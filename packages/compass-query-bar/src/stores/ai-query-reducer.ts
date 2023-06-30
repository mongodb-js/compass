import type { Reducer } from 'redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { runFetchAIQuery } from '../modules/ai-query-request';
import { isAction } from '../utils';
import type { QueryBarThunkAction } from './query-bar-store';
import type { AtlasSignInSuccessAction } from './atlas-signin-reducer';
import { AtlasSignInActions, cancelSignIn } from './atlas-signin-reducer';

const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');

export type AIQueryState = {
  aiQueryAbortController: AbortController | undefined;
  errorMessage: string | undefined;
  // Used to indicate in the UI when an AI query has succeeded.
  didSucceed: boolean;
  isInputVisible: boolean;
  isOptInVisible: boolean;
};

export const initialState: AIQueryState = {
  aiQueryAbortController: undefined,
  errorMessage: undefined,
  didSucceed: false,
  isInputVisible: false,
  isOptInVisible: false,
};

export const enum AIQueryActionTypes {
  AIQueryStarted = 'compass-query-bar/ai-query/AIQueryStarted',
  AIQueryCancelled = 'compass-query-bar/ai-query/AIQueryCancelled',
  AIQueryFailed = 'compass-query-bar/ai-query/AIQueryFailed',
  AIQuerySucceeded = 'compass-query-bar/ai-query/AIQuerySucceeded',
  CancelAIQuery = 'compass-query-bar/ai-query/CancelAIQuery',
  ShowInput = 'compass-query-bar/ai-query/ShowInput',
  HideInput = 'compass-query-bar/ai-query/HideInput',
  ShowOptIn = 'compass-query-bar/ai-query/ShowOptIn',
  HideOptIn = 'compass-query-bar/ai-query/HideOptIn',
}

type ShowInputAction = {
  type: AIQueryActionTypes.ShowInput;
};

type HideInputAction = {
  type: AIQueryActionTypes.HideInput;
};

type ShowOptInAction = {
  type: AIQueryActionTypes.ShowOptIn;
};

type HideOptInAction = {
  type: AIQueryActionTypes.HideOptIn;
};

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
): QueryBarThunkAction<
  Promise<void>,
  | AIQueryStartedAction
  | AIQueryCancelledAction
  | AIQueryFailedAction
  | AIQuerySucceededAction
> => {
  return async (dispatch, getState) => {
    const {
      aiQuery: { aiQueryAbortController: existingAbortController },
    } = getState();

    if (existingAbortController) {
      // Cancel the active request as this one will override.
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
      if (!jsonResponse?.content?.query) {
        throw new Error(
          'No query returned. Please try again with a different prompt.'
        );
      }

      query = jsonResponse?.content?.query;
    } catch (err: any) {
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    // Error if the response is empty.
    if (!query || Object.keys(query).length === 0) {
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage:
          'No query was returned from the ai. Consider re-wording your prompt.',
      });
      return;
    }

    // Rename `find` to `filter` as the AI will use the normal `find` syntax.
    query.filter = query.find;

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

export const showInput = (): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    if (['initial', 'error'].includes(getState().atlasSignIn.state)) {
      dispatch(showOptIn());
    } else {
      dispatch({ type: AIQueryActionTypes.ShowInput });
    }
  };
};

export const hideInput = () => {
  return { type: AIQueryActionTypes.HideInput };
};

export const showOptIn = () => {
  return { type: AIQueryActionTypes.ShowOptIn };
};

export const hideOptIn = (): QueryBarThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelSignIn());
    dispatch({ type: AIQueryActionTypes.HideOptIn });
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

  if (isAction<ShowOptInAction>(action, AIQueryActionTypes.ShowOptIn)) {
    return {
      ...state,
      isOptInVisible: true,
    };
  }

  if (isAction<HideOptInAction>(action, AIQueryActionTypes.HideOptIn)) {
    return {
      ...state,
      isOptInVisible: false,
    };
  }

  if (isAction<AtlasSignInSuccessAction>(action, AtlasSignInActions.Success)) {
    return {
      ...state,
      isOptInVisible: false,
      isInputVisible: true,
    };
  }

  return state;
};

export { aiQueryReducer };
