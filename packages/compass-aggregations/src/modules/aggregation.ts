import type { Reducer } from 'redux';
import type { AggregateOptions, Document, MongoServerError } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { mapPipelineToStages } from '../utils/stage';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
import { PROMISE_CANCELLED_ERROR } from '../utils/cancellable-promise';
import { aggregatePipeline } from '../utils/cancellable-aggregation';
import { ActionTypes as WorkspaceActionTypes } from './workspace';
import type { Actions as WorkspaceActions } from './workspace';
import { createLoggerAndTelemetry } from '@mongodb-js/compass-logging';

const { log, mongoLogId, track } = createLoggerAndTelemetry(
  'COMPASS-AGGREGATIONS-UI'
);

export enum ActionTypes {
  AggregationStarted = 'compass-aggregations/aggregationStarted',
  AggregationFinished = 'compass-aggregations/aggregationFinished',
  AggregationFailed = 'compass-aggregations/aggregationFailed',
  AggregationCancelledByUser = 'compass-aggregations/aggregationCancelledByUser',
  LastPageReached = 'compass-aggregations/lastPageReached'
}

type PreviousPageData = {
  page: number;
  isLast: boolean;
  documents: Document[];
};

type AggregationStartedAction = {
  type: ActionTypes.AggregationStarted;
  abortController: AbortController;
};

type AggregationFinishedAction = {
  type: ActionTypes.AggregationFinished;
  documents: Document[];
  page: number;
  isLast: boolean;
};

type AggregationFailedAction = {
  type: ActionTypes.AggregationFailed;
  error: string;
  page: number;
};

type AggregationCancelledAction = {
  type: ActionTypes.AggregationCancelledByUser;
};

type LastPageReachedAction = {
  type: ActionTypes.LastPageReached;
  page: number;
};

export type Actions =
  | AggregationStartedAction
  | AggregationFinishedAction
  | AggregationFailedAction
  | AggregationCancelledAction
  | LastPageReachedAction;

export type State = {
  documents: Document[];
  page: number;
  limit: number;
  isLast: boolean;
  loading: boolean;
  abortController?: AbortController;
  error?: string;
  previousPageData?: PreviousPageData;
};

export const INITIAL_STATE: State = {
  documents: [],
  page: 1,
  limit: 20,
  isLast: false,
  loading: false,
};

const reducer: Reducer<State, Actions | WorkspaceActions> = (
  state = INITIAL_STATE,
  action
) => {
  switch (action.type) {
    case WorkspaceActionTypes.WorkspaceChanged:
      return INITIAL_STATE;
    case ActionTypes.AggregationStarted:
      return {
        ...state,
        loading: true,
        error: undefined,
        documents: [],
        abortController: action.abortController,
        previousPageData: {
          page: state.page,
          documents: state.documents,
          isLast: state.isLast,
        },
      };
    case ActionTypes.AggregationFinished:
      return {
        ...state,
        isLast: action.isLast,
        page: action.page,
        documents: action.documents,
        loading: false,
        abortController: undefined,
        error: undefined,
        previousPageData: undefined,
      };
    case ActionTypes.AggregationFailed:
      return {
        ...state,
        documents: [],
        loading: false,
        abortController: undefined,
        error: action.error,
        page: action.page,
        previousPageData: undefined,
      };
    case ActionTypes.AggregationCancelledByUser:
      return {
        ...state,
        loading: false,
        abortController: undefined,
        documents: state.previousPageData?.documents || [],
        page: state.previousPageData?.page || 1,
        isLast: state.previousPageData?.isLast || false,
        previousPageData: undefined,
      };
    case ActionTypes.LastPageReached:
      return {
        ...state,
        isLast: true,
        loading: false,
        page: action.page,
      };
    default:
      return state;
  }
};

export const runAggregation = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const { pipeline } = getState();
    track('Aggregation Executed', () => ({
      num_stages: mapPipelineToStages(pipeline).length,
    }));
    return dispatch(fetchAggregationData());
  };
};

export const fetchPrevPage = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      aggregation: { page }
    } = getState();
    if (page <= 1) {
      return;
    }
    return dispatch(fetchAggregationData(page - 1));
  };
};

export const fetchNextPage = (): ThunkAction<
  Promise<void>,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    const {
      aggregation: { isLast, page }
    } = getState();
    if (isLast) {
      return;
    }
    return dispatch(fetchAggregationData(page + 1));
  };
};

export const retryAggregation = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const {
      aggregation: { page }
    } = getState();
    return dispatch(fetchAggregationData(page));
  };
};

export const cancelAggregation = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    track('Aggregation Canceled');
    const {
      aggregation: { abortController }
    } = getState();
    _abortAggregation(abortController);
    // In order to avoid the race condition between user cancel and cancel triggered
    // in fetchAggregationData, we dispatch ActionTypes.AggregationCancelledByUser here.
    dispatch({
      type: ActionTypes.AggregationCancelledByUser,
    });
  };
};

const _abortAggregation = (controller?: AbortController): void => {
  controller?.abort();
};

const fetchAggregationData = (
  page = 1
): ThunkAction<Promise<void>, RootState, void, Actions> => {
  return async (dispatch, getState) => {
    const {
      id,
      pipeline,
      namespace,
      maxTimeMS,
      collation,
      dataService: { dataService },
      aggregation: { limit, abortController: _abortController },
    } = getState();

    if (!dataService) {
      return;
    }

    // Cancel the existing aggregate
    _abortAggregation(_abortController);

    try {
      const abortController = new AbortController();
      const signal = abortController.signal;

      dispatch({
        type: ActionTypes.AggregationStarted,
        abortController
      });

      const nonEmptyStages = mapPipelineToStages(pipeline);

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collation || undefined
      };

      const lastStage = nonEmptyStages[nonEmptyStages.length - 1] ?? {};

      const isMergeOrOut = ['$merge', '$out'].includes(
        Object.keys(lastStage)[0]
      );

      const documents = await aggregatePipeline({
        dataService,
        signal,
        namespace,
        pipeline: nonEmptyStages,
        options,
        ...(!isMergeOrOut && {
          skip: (page - 1) * limit,
          limit,
        })
      });

      if (isMergeOrOut) {
        dispatch(globalAppRegistryEmit('agg-pipeline-out-executed', { id }));
      }

      if (documents.length === 0) {
        dispatch({ type: ActionTypes.LastPageReached, page });
      } else {
        dispatch({
          type: ActionTypes.AggregationFinished,
          documents,
          page,
          isLast: documents.length < limit,
        });
      }
    } catch (e) {
      // User cancel is handled in cancelAggregation
      if ((e as Error).name === PROMISE_CANCELLED_ERROR) {
        return;
      }
      // Server errors are surfaced to the user
      if ((e as MongoServerError).code) {
        dispatch({
          type: ActionTypes.AggregationFailed,
          error: (e as Error).message,
          page,
        });
        if ((e as MongoServerError).codeName === 'MaxTimeMSExpired') {
          track('Aggregation Timed Out', { max_time_ms: maxTimeMS ?? null });
        }
        log.warn(
          mongoLogId(1001000106),
          'Aggregations',
          'Failed to run aggregation',
          { message: (e as Error).message }
        );
        return;
      }
      // Anything else is not expected, throw
      throw e;
    }
  };
};

export const exportAggregationResults = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const {
      pipeline,
      namespace,
      maxTimeMS,
      collation,
      countDocuments: { count }
    } = getState();

    const stages = mapPipelineToStages(pipeline);

    const options: AggregateOptions = {
      maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
      allowDiskUse: true,
      collation: collation || undefined
    };

    dispatch(
      globalAppRegistryEmit('open-export', {
        namespace,
        aggregation: {
          stages,
          options
        },
        count,
      })
    );
  };
};

export default reducer;
