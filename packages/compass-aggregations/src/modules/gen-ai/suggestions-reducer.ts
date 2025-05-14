import type { Reducer } from 'redux';
import { getSimplifiedSchema } from 'mongodb-schema';
import toNS from 'mongodb-ns';
import type { Document } from 'bson';

import type { PipelineBuilderThunkAction } from '../';
import { isAction } from '../../utils/is-action';
import { getPipelineSuggestions } from './pipeline-suggestion';
import {
  AIPipelineActionTypes,
  type LoadGeneratedPipelineAction,
} from '../pipeline-builder/pipeline-ai';
import { updatePipelinePreview } from '../pipeline-builder/builder-helpers';

// const { log, mongoLogId } = createLoggerAndTelemetry('AI-QUERY-UI');
// TODO: logs
const log = {
  // eslint-disable-next-line no-console
  info: console.log,
};

type AISuggestionsStatus = 'ready' | 'fetching' | 'success';

export type PipelineSuggestion = {
  text: string;
  pipeline: Document;
};

export type SuggestionsState = {
  errorMessage: string | undefined;
  status: AISuggestionsStatus;
  suggestions: PipelineSuggestion[];
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
  AISuggestionsStarted = 'compass-query-bar/suggestions/AISuggestionsStarted',
  AISuggestionsCancelled = 'compass-query-bar/suggestions/AISuggestionsCancelled',
  AISuggestionsFailed = 'compass-query-bar/suggestions/AISuggestionsFailed',
  AISuggestionsSucceeded = 'compass-query-bar/suggestions/AISuggestionsSucceeded',
  CancelAISuggestions = 'compass-query-bar/suggestions/CancelAISuggestions',
  ApplySuggestion = 'compass-query-bar/suggestions/ApplySuggestion',
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
  suggestions: PipelineSuggestion[];
};

// export type ApplySuggestionAction = {
//   type: SuggestionsActionTypes.ApplySuggestion;
//   pipeline: string;
// };

export const applySuggestion = (
  pipeline: string
): PipelineBuilderThunkAction<
  void,
  // | ApplySuggestionAction
  LoadGeneratedPipelineAction
> => {
  return (dispatch, getState, { pipelineBuilder }) => {
    // (pipeline: string): ApplySuggestionAction => {

    pipelineBuilder.reset(pipeline);

    dispatch({
      type: AIPipelineActionTypes.LoadGeneratedPipeline,
      stages: pipelineBuilder.stages,
      pipelineText: pipelineBuilder.source,
      pipeline: pipelineBuilder.pipeline,
      syntaxErrors: pipelineBuilder.syntaxError,
      requestId: 'test',
    });

    dispatch(updatePipelinePreview());
  };
  // return {
  //   type: SuggestionsActionTypes.ApplySuggestion,
  //   pipeline
  //   // fields: mapQueryToFormFields(
  //   //   {}, // TODO: Preferences type from thunk service
  //   //   {
  //   //     ...DEFAULT_FIELD_VALUES,
  //   //     ...(query ?? {}),
  //   //   }
  //   // ),
  // };
};

function logFailed(errorMessage: string) {
  log.info(
    // mongoLogId(1_001_000_200),
    'AISuggestions',
    'AI suggestions request failed',
    {
      errorMessage,
    }
  );
}

export const runAISuggestions = (): PipelineBuilderThunkAction<
  Promise<void>,
  | AISuggestionsStartedAction
  | AISuggestionsFailedAction
  | AISuggestionsSucceededAction
> => {
  return async (dispatch, getState, { preferences }) => {
    const {
      dataService: { dataService },
      suggestions: { aiSuggestionsFetchId: existingFetchId },
      namespace,
      // names: { namespace },
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

    let response: PipelineSuggestion[] | null;
    try {
      if (!dataService) {
        return;
      }

      // TODO: Share this sampling with the prompt.
      const sampleDocuments = await dataService.sample?.(
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
        // If we already aborted so we return silently.
        return;
      }
      const schema = await getSimplifiedSchema(sampleDocuments ?? []);
      if (signal.aborted) {
        // If we already aborted so we return silently.
        return;
      }

      const { collection: collectionName, database: databaseName } =
        toNS(namespace);
      // TODO: it not json
      response = await getPipelineSuggestions({
        signal: abortController.signal,
        collectionName,
        databaseName,
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
        // mongoLogId(1_001_000_201),
        'AISuggestions',
        'Cancelled ai suggestions request'
      );
      return;
    }

    // TODO: parse suggestion nicer.
    const suggestions = response;

    // Error when the response is empty or there is nothing to map.
    if (!suggestions || !suggestions.length) {
      const msg = 'No suggestions were returned from the ai.';
      logFailed(msg);
      dispatch({
        type: SuggestionsActionTypes.AISuggestionsFailed,
        errorMessage: msg,
      });
      return;
    }

    log.info(
      // mongoLogId(1_001_000_202),
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

export const cancelAISuggestions = (): PipelineBuilderThunkAction<
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
