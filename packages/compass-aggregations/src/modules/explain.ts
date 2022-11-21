import type { AnyAction, Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import type { ExplainExecuteOptions } from 'mongodb-data-service';
import { ExplainPlan } from '@mongodb-js/explain-plan-helper';
import type { IndexInformation } from '@mongodb-js/explain-plan-helper';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';
import type { PipelineBuilderThunkAction } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import type { IndexInfo } from './indexes';
import { NEW_PIPELINE } from './import-pipeline';
import { getPipelineFromBuilderState, mapPipelineModeToEditorViewType } from './pipeline-builder/builder-helpers';
import { capMaxTimeMSAtPreferenceLimit } from 'compass-preferences-model';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
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

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
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
    case NEW_PIPELINE:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const closeExplainModal = (): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelExplain());
  };
};

export const cancelExplain = (): PipelineBuilderThunkAction<void> => {
  return (dispatch, getState) => {
    const { explain: { abortController } } = getState();
    abortController?.abort();
    dispatch({
      type: ActionTypes.ExplainCancelled
    });
  };
};

export const explainAggregation = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineBuilder }) => {
    const {
      isDataLake,
      namespace,
      maxTimeMS,
      dataService: { dataService },
      indexes: collectionIndexes,
      collationString: { value: collation },
      pipelineBuilder: { pipelineMode },
    } = getState();

    if (!dataService) {
      return;
    }

    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);

    try {
      const abortController = new AbortController();
      const abortSignal = abortController.signal;
      dispatch({
        type: ActionTypes.ExplainStarted,
        abortController,
      });

      const options: AggregateOptions = {
        maxTimeMS: capMaxTimeMSAtPreferenceLimit(maxTimeMS ?? DEFAULT_MAX_TIME_MS),
        allowDiskUse: true,
        collation: collation ?? undefined,
      };
      const explainVerbosity = _getExplainVerbosity(pipeline, isDataLake);
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
        const indexes = _mapIndexesInformation(collectionIndexes, usedIndexes);
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
        track('Aggregation Explained', {
          num_stages: pipeline.length,
          index_used: explain.stats?.indexes?.length ?? 0,
          editor_view_type: mapPipelineModeToEditorViewType(pipelineMode),
        });
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

export const _getExplainVerbosity = (
  pipeline: Document[],
  isDataLake: boolean
): ExplainExecuteOptions['explainVerbosity'] => {
  // dataLake does not have $out/$merge operators
  if (isDataLake) {
    return 'queryPlannerExtended';
  }
  const lastStage = pipeline[pipeline.length - 1] ?? {};
  const isOutOrMergePipeline =
    Object.prototype.hasOwnProperty.call(lastStage, '$out') ||
    Object.prototype.hasOwnProperty.call(lastStage, '$merge');
  return isOutOrMergePipeline
    ? 'queryPlanner' // $out & $merge only work with queryPlanner
    : 'allPlansExecution';
};

export const _mapIndexesInformation = function (
  collectionIndexes: IndexInfo[],
  explainIndexes: IndexInformation[]
): ExplainIndex[] {
  return explainIndexes
    .filter(x => x.index)
    .map((explainIndex) => {
      const collectionIndex = collectionIndexes.find(
        (collectionIndex) => collectionIndex.name === explainIndex.index
      );
      return {
        name: explainIndex.index,
        shard: explainIndex.shard,
        key: collectionIndex?.key ?? {},
      };
    })
    .filter(Boolean) as ExplainIndex[];
}

export default reducer;