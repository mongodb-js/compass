import type { Reducer } from 'redux';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import preferences from 'compass-preferences-model';

import type { QueryBarThunkAction } from './query-bar-store';
import { isAction } from '../utils';
import { runFetchAISuggestions } from '../modules/ai-query-request';

const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');

type AISuggestionsStatus = 'ready' | 'fetching' | 'success';

export type SuggestionsState = {
  errorMessage: string | undefined;
  status: AISuggestionsStatus;
  suggestions: string[];
  aiSuggestionsFetchId: number; // Maps to the AbortController of the current fetch (or -1).
};

export const initialState: SuggestionsState = {
  // TODO: Move suggestions to separate reducer.
  status: 'ready',
  suggestions: [],
  errorMessage: undefined,
  aiSuggestionsFetchId: -1,
};

export const enum SuggestionsActionTypes {
  AISuggestionsStarted = 'compass-query-bar/ai-query/AISuggestionsStarted',
  AISuggestionsCancelled = 'compass-query-bar/ai-query/AISuggestionsCancelled',
  AISuggestionsFailed = 'compass-query-bar/ai-query/AISuggestionsFailed',
  AISuggestionsSucceeded = 'compass-query-bar/ai-query/AISuggestionsSucceeded',
  CancelAISuggestions = 'compass-query-bar/ai-query/CancelAISuggestions',
}

const NUM_DOCUMENTS_TO_SAMPLE = 4;

const AISuggestionsAbortControllerMap = new Map<number, AbortController>();

let aiSuggestionsFetchId = 0;

function getAbortSignal() {
  const id = ++aiSuggestionsFetchId;
  const controller = new AbortController();
  AISuggestionsAbortControllerMap.set(id, controller);
  return { id, signal: controller.signal };
}

function abort(id: number) {
  const controller = AISuggestionsAbortControllerMap.get(id);
  controller?.abort();
  return AISuggestionsAbortControllerMap.delete(id);
}

function cleanupAbortSignal(id: number) {
  return AISuggestionsAbortControllerMap.delete(id);
}

type AISuggestionsStartedAction = {
  type: SuggestionsActionTypes.AISuggestionsStarted;
  fetchId: number;
};

type AISuggestionsFailedAction = {
  type: SuggestionsActionTypes.AISuggestionsFailed;
  errorMessage: string;
};

export type AISuggestionsSucceededAction = {
  type: SuggestionsActionTypes.AISuggestionsSucceeded;
  suggestions: string[];
};

function logFailed(errorMessage: string) {
  log.info(
    mongoLogId(1_001_000_200),
    'AISuggestions',
    'AI suggestions request failed',
    {
      errorMessage,
    }
  );
}

export const runAISuggestions = (): QueryBarThunkAction<
  Promise<void>,
  | AISuggestionsStartedAction
  | AISuggestionsFailedAction
  | AISuggestionsSucceededAction
> => {
  return async (dispatch, getState, { dataProvider }) => {
    const {
      suggestions: { aiSuggestionsFetchId: existingFetchId },
      queryBar: { namespace },
    } = getState();

    if (aiSuggestionsFetchId !== -1) {
      // Cancel the active request as this one will override.
      abort(existingFetchId);
    }

    const abortController = new AbortController();
    const { id: fetchId, signal } = getAbortSignal();

    dispatch({
      type: SuggestionsActionTypes.AISuggestionsStarted,
      fetchId,
    });

    let jsonResponse;
    try {
      // TODO: Share this sampling with the prompt.
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
      const schema = await getSimplifiedSchema(sampleDocuments);

      const { collection: collectionName } = toNS(namespace);
      jsonResponse = await runFetchAISuggestions({
        signal: abortController.signal,
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
        type: SuggestionsActionTypes.AISuggestionsFailed,
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
        mongoLogId(1_001_000_201),
        'AISuggestions',
        'Cancelled ai suggestions request'
      );
      return;
    }

    const rawSuggestions = jsonResponse?.content;

    // Error when the response is empty or there is nothing to map.
    if (!rawSuggestions || !rawSuggestions.length) {
      const msg = 'No suggestions were returned from the ai.';
      logFailed(msg);
      dispatch({
        type: SuggestionsActionTypes.AISuggestionsFailed,
        errorMessage: msg,
      });
      return;
    }

    // TODO: parse suggestion and use the query.
    const suggestions = rawSuggestions.map((suggestion: unknown) =>
      JSON.stringify(suggestion)
    );

    log.info(
      mongoLogId(1_001_000_202),
      'AISuggestions',
      'AI suggestions request succeeded',
      {
        suggestions,
      }
    );

    dispatch({
      type: SuggestionsActionTypes.AISuggestionsSucceeded,
      suggestions,
    });
  };
};

type CancelAISuggestionsAction = {
  type: SuggestionsActionTypes.CancelAISuggestions;
};

export const cancelAISuggestions = (): QueryBarThunkAction<
  void,
  CancelAISuggestionsAction
> => {
  return (dispatch, getState) => {
    // Abort any ongoing op.
    abort(getState().suggestions.aiSuggestionsFetchId);

    dispatch({
      type: SuggestionsActionTypes.CancelAISuggestions,
    });
  };
};

const suggestionsReducer: Reducer<SuggestionsState> = (
  state = initialState,
  action
) => {
  if (
    isAction<AISuggestionsStartedAction>(
      action,
      SuggestionsActionTypes.AISuggestionsStarted
    )
  ) {
    return {
      ...state,
      status: 'fetching',
      errorMessage: undefined,
      aiSuggestionsFetchId: action.fetchId,
    };
  }

  if (
    isAction<AISuggestionsFailedAction>(
      action,
      SuggestionsActionTypes.AISuggestionsFailed
    )
  ) {
    return {
      ...state,
      status: 'ready',
      aiSuggestionsFetchId: -1,
      errorMessage: action.errorMessage,
    };
  }

  if (
    isAction<AISuggestionsSucceededAction>(
      action,
      SuggestionsActionTypes.AISuggestionsSucceeded
    )
  ) {
    return {
      ...state,
      suggestions: action.suggestions,
      status: 'success',
      aiSuggestionsFetchId: -1,
      didSucceed: true,
    };
  }

  if (
    isAction<CancelAISuggestionsAction>(
      action,
      SuggestionsActionTypes.CancelAISuggestions
    )
  ) {
    return {
      ...state,
      aiSuggestionsFetchId: -1,
    };
  }

  return state;
};

export { suggestionsReducer };
