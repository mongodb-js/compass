import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import { ExplainVerbosity } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import type { IndexInformation } from '@mongodb-js/explain-plan-helper';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';
import type { IndexInfo } from './indexes';

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


export type ExplainIndex = {
  name: string;
  shard?: string;
  key: IndexInfo['key'];
}

export type ExplainData = {
  plan: Document;
  stats?: {
    executionTimeMillis: number;
    nReturned: number;
    indexes: ExplainIndex[];
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
      isDataLake,
      pipeline: _pipeline,
      namespace,
      maxTimeMS,
      collation,
      dataService: { dataService },
      indexes: collectionIndexes,
    } = getState();

    if (!dataService) {
      return;
    }

    try {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      dispatch({
        type: ActionTypes.ExplainStarted,
        abortController,
      });

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation || undefined,
      };

      const pipeline = _pipeline.map(generateStage)
        .filter(x => Object.keys(x).length > 0);

      const explainVerbosity = getExplainVerbosity(pipeline, isDataLake);
      const rawExplain = await dataService.explainAggregate(
        namespace,
        pipeline,
        options,
        {
          abortSignal,
          explainVerbosity,
        }
      );

      const explain: ExplainData = {
        plan: rawExplain,
      };
      try {
        const {
          nReturned,
          executionTimeMillis,
          usedIndexes
        } = new ExplainPlan(rawExplain as any);
        const indexes = mapIndexesInformation(collectionIndexes, usedIndexes);
        const stats = {
          executionTimeMillis,
          nReturned,
          indexes,
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
      if (!dataService.isOperationCancelledError(e as Error)) {
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

const getExplainVerbosity = (
  pipeline: Document[],
  isDataLake: boolean
): keyof typeof ExplainVerbosity => {
  // dataLake does not have $out/$merge operators
  if (isDataLake) {
    return ExplainVerbosity.queryPlannerExtended;
  }
  const lastStage = pipeline[pipeline.length - 1] ?? {};
  const isOutOrMergePipeline =
    Object.prototype.hasOwnProperty.call(lastStage, '$out') ||
    Object.prototype.hasOwnProperty.call(lastStage, '$merge');
  return isOutOrMergePipeline
    ? ExplainVerbosity.queryPlanner // $out & $merge only work with queryPlanner
    : ExplainVerbosity.allPlansExecution;
};

const mapIndexesInformation = function (
  collectionIndexes: IndexInfo[],
  explainIndexes: IndexInformation[]
): ExplainIndex[] {
  return explainIndexes
    .filter(x => x.index)
    .map((explainIndex) => {
      const index = collectionIndexes.find(
        (collectionIndex) => collectionIndex.name === explainIndex.index
      );
      if (!index) {
        return null;
      }
      return {
        name: index.name,
        shard: explainIndex.shard,
        key: index.key,
      };
    })
    .filter(Boolean) as ExplainIndex[];
}

export default reducer;