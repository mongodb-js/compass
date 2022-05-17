import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import { MongoNetworkError, MongoServerSelectionError } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import type { IndexInformation } from '@mongodb-js/explain-plan-helper';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';
import { PROMISE_CANCELLED_ERROR } from '../utils/cancellable-promise';
import { explainPipeline } from '../utils/cancellable-aggregation';

const { log, mongoLogId } = createLoggerAndTelemetry(
  'COMPASS-AGGREGATIONS-UI'
);
export enum ActionTypes {
  ModalOpened = 'compass-aggregations/modalOpened',
  ModalClosed = 'compass-aggregations/modalClosed',
  ExplainStarted = 'compass-aggregations/explainStarted',
  ExplainFinished = 'compass-aggregations/explainFinished',
  ExplainFailed = 'compass-aggregations/explainFailed',
  ExplainCancelled = 'compass-aggregations/explainCancelled',
}

type ModalOpenedAction = {
  type: ActionTypes.ModalOpened;
};

type ModalClosedAction = {
  type: ActionTypes.ModalClosed;
};

type ExplainStartedAction = {
  type: ActionTypes.ExplainStarted;
  abortController: AbortController;
};

type ExplainFinishedAction = {
  type: ActionTypes.ExplainFinished;
  explain: ExplainData;
};

type ExplainFailedAction = {
  type: ActionTypes.ExplainFailed;
  error: ExplainError;
};

type ExplainCancelledAction = {
  type: ActionTypes.ExplainCancelled;
};

export type Actions =
  | ModalOpenedAction
  | ModalClosedAction
  | ExplainStartedAction
  | ExplainFinishedAction
  | ExplainFailedAction
  | ExplainCancelledAction;

export type ExplainData = {
  plan: Document;
  stats?: {
    executionTimeMillis: number;
    nReturned: number;
    usedIndexes: IndexInformation[];
  };
};

type ExplainError = {
  message: string;
  isNetworkError: boolean;
}

export type State = {
  isLoading: boolean;
  isModalOpen: boolean;
  explain?: ExplainData;
  abortController?: AbortController;
  error?: ExplainError;
};

export const INITIAL_STATE: State = {
  isLoading: false,
  isModalOpen: false,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ModalOpened:
      return {
        isLoading: false,
        abortController: undefined,
        error: undefined,
        explain: undefined,
        isModalOpen: true,
      };
    case ActionTypes.ModalClosed:
    case ActionTypes.ExplainCancelled:
      return INITIAL_STATE;
    case ActionTypes.ExplainStarted:
      return {
        ...state,
        explain: undefined,
        error: undefined,
        isLoading: true,
        abortController: action.abortController,
      };
    case ActionTypes.ExplainFinished:
      return {
        ...state,
        explain: action.explain,
        error: undefined,
        isLoading: false,
        abortController: undefined,
      };
    case ActionTypes.ExplainFailed:
      return {
        ...state,
        explain: undefined,
        error: action.error,
        isLoading: false,
        abortController: undefined,
      };
    default:
      return state;
  }
};

export const openExplainModal = (): ModalOpenedAction => ({
  type: ActionTypes.ModalOpened,
});

export const closeExplainModal = (): ModalClosedAction => ({
  type: ActionTypes.ModalClosed,
});

export const cancelExplain = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (_dispatch, getState) => {
    const { explain: { abortController } } = getState();
    abortController?.abort();
  };
};

export const explainAggregation = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      pipeline,
      namespace,
      maxTimeMS,
      collation,
      dataService: { dataService },
    } = getState();

    if (!dataService) {
      return;
    }

    try {
      const abortController = new AbortController();
      const signal = abortController.signal;
      dispatch({
        type: ActionTypes.ExplainStarted,
        abortController,
      });

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation || undefined,
      };

      const rawExplain = await explainPipeline({
        dataService,
        signal,
        namespace,
        pipeline: pipeline.map(generateStage).filter(x => Object.keys(x).length > 0),
        options
      });

      const explain: ExplainData = {
        plan: rawExplain,
      };
      try {
        const {
          nReturned,
          executionTimeMillis,
          usedIndexes
        } = new ExplainPlan(rawExplain as any);
        const stats = {
          executionTimeMillis,
          nReturned,
          usedIndexes,
        }
        explain.stats = stats;
      } catch (e) {
        log.warn(
          mongoLogId(1_001_000_125),
          'Explain',
          'Failed to parse aggregation explain',
          { message: (e as Error).message }
        );
      } finally {
        // If parsing fails, we still show raw explain json.
        dispatch({
          type: ActionTypes.ExplainFinished,
          explain,
        });
      }
    } catch (e) {
      if ((e as Error).name === PROMISE_CANCELLED_ERROR) {
        dispatch({
          type: ActionTypes.ExplainCancelled
        });
        return;
      }
      dispatch({
        type: ActionTypes.ExplainFailed,
        error: {
          message: (e as Error).message,
          isNetworkError:
            e instanceof MongoNetworkError ||
            e instanceof MongoServerSelectionError,
        },
      });
      log.warn(
        mongoLogId(1_001_000_124),
        'Explain',
        'Failed to run aggregation explain',
        { message: (e as Error).message }
      );
    }
  }
};

export default reducer;