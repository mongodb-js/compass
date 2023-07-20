import type { Reducer } from 'redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import preferences from 'compass-preferences-model';

import type { QueryBarThunkAction } from './query-bar-store';
import { isAction } from '../utils';
import { mapQueryToFormFields } from '../utils/query';
import type { QueryFormFields } from '../constants/query-properties';
import { DEFAULT_FIELD_VALUES } from '../constants/query-bar-store';
import type { AtlasSignInSuccessAction } from './atlas-signin-reducer';
import { AtlasSignInActions, cancelSignIn } from './atlas-signin-reducer';

const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');

type AIQueryStatus = 'ready' | 'fetching' | 'success';

export type AIQueryState = {
  errorMessage: string | undefined;
  isInputVisible: boolean;
  aiPromptText: string;
  status: AIQueryStatus;
  aiQueryFetchId: number; // Maps to the AbortController of the current fetch (or -1).
  isOptInVisible: boolean;
};

export const initialState: AIQueryState = {
  status: 'ready',
  aiPromptText: '',
  errorMessage: undefined,
  isInputVisible: false,
  aiQueryFetchId: -1,
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
  ChangeAIPromptText = 'compass-query-bar/ai-query/ChangeAIPromptText',
  ShowOptIn = 'compass-query-bar/ai-query/ShowOptIn',
  HideOptIn = 'compass-query-bar/ai-query/HideOptIn',
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
};

export type AIQuerySucceededAction = {
  type: AIQueryActionTypes.AIQuerySucceeded;
  fields: QueryFormFields;
};

type ShowOptInAction = {
  type: AIQueryActionTypes.ShowOptIn;
};

type HideOptInAction = {
  type: AIQueryActionTypes.HideOptIn;
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
  return async (dispatch, getState, { dataService, atlasService }) => {
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

      const { collection: collectionName } = toNS(namespace);
      jsonResponse = await atlasService.getQueryFromUserPrompt({
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

    let fields;
    try {
      if (!jsonResponse?.content?.query) {
        throw new Error(
          'No query returned. Please try again with a different prompt.'
        );
      }

      const query = jsonResponse?.content?.query;
      fields = mapQueryToFormFields({
        ...DEFAULT_FIELD_VALUES,
        ...(query ?? {}),
      });
    } catch (err: any) {
      logFailed(err?.message);
      dispatch({
        type: AIQueryActionTypes.AIQueryFailed,
        errorMessage: err?.message,
      });
      return;
    }

    // Error when the response is empty or there is nothing to map.
    if (!fields || Object.keys(fields).length === 0) {
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
        query: {
          ...fields,
        },
      }
    );

    dispatch({
      type: AIQueryActionTypes.AIQuerySucceeded,
      fields,
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

export const showOptIn = () => {
  return { type: AIQueryActionTypes.ShowOptIn };
};

export const hideOptIn = (): QueryBarThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelSignIn());
    dispatch({ type: AIQueryActionTypes.HideOptIn });
  };
};

export const showInput = (): QueryBarThunkAction<void> => {
  return (dispatch, getState) => {
    if (getState().atlasSignIn.state === 'success') {
      dispatch({ type: AIQueryActionTypes.ShowInput });
    } else {
      dispatch(showOptIn());
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

  if (
    isAction<ChangeAIPromptTextAction>(
      action,
      AIQueryActionTypes.ChangeAIPromptText
    )
  ) {
    return {
      ...state,
      aiPromptText: action.text,
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
