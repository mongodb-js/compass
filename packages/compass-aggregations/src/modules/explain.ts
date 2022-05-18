import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
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
  ExplainStarted = 'compass-aggregations/explainStarted',
  ExplainFinished = 'compass-aggregations/explainFinished',
  ExplainFailed = 'compass-aggregations/explainFailed',
  ExplainCancelled = 'compass-aggregations/explainCancelled',
}

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
  error: string;
};

type ExplainCancelledAction = {
  type: ActionTypes.ExplainCancelled;
};

export type Actions =
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

export type State = {
  isLoading: boolean;
  isModalOpen: boolean;
  explain?: ExplainData;
  abortController?: AbortController;
  error?: string;
};

export const INITIAL_STATE: State = {
  isLoading: false,
  isModalOpen: false,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ExplainStarted:
      return {
        isModalOpen: true,
        isLoading: true,
        explain: undefined,
        error: undefined,
        abortController: action.abortController,
      };
    case ActionTypes.ExplainFinished:
      return {
        isModalOpen: true,
        isLoading: false,
        explain: action.explain,
        error: undefined,
        abortController: undefined,
      };
    case ActionTypes.ExplainFailed:
      return {
        isModalOpen: true,
        isLoading: false,
        explain: undefined,
        error: action.error,
        abortController: undefined,
      };
    case ActionTypes.ExplainCancelled:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const closeExplainModal = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch) => {
    dispatch(cancelExplain());
  };
};

export const cancelExplain = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const { explain: { abortController } } = getState();
    abortController?.abort();
    dispatch({
      type: ActionTypes.ExplainCancelled
    });
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
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
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
          mongoLogId(1_001_000_137),
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
      // Cancellation is handled in cancelExplain
      if ((e as Error).name !== PROMISE_CANCELLED_ERROR) {
        dispatch({
          type: ActionTypes.ExplainFailed,
          error: (e as Error).message,
        });
        log.error(
          mongoLogId(1_001_000_138),
          'Explain',
          'Failed to run aggregation explain',
          { message: (e as Error).message }
        );
      }
    }
  }
};

export default reducer;