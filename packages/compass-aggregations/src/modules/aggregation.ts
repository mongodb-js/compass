import type { Reducer } from 'redux';
import type { AggregateOptions, Document, MongoServerError } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';
import { globalAppRegistryEmit } from '@mongodb-js/mongodb-redux-common/app-registry';
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
  LastPageReached = 'compass-aggregations/lastPageReached',
}

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
};

type LastPageReachedAction = {
  type: ActionTypes.LastPageReached;
  page: number;
};

export type Actions =
  | AggregationStartedAction
  | AggregationFinishedAction
  | AggregationFailedAction
  | LastPageReachedAction;

export type State = {
  documents: Document[];
  page: number;
  limit: number;
  isLast: boolean;
  loading: boolean;
  abortController?: AbortController;
  error?: string;
};

export const INITIAL_STATE: State = {
  documents: [],
  page: 1,
  limit: 20,
  isLast: false,
  loading: false,
};

const reducer: Reducer<State, Actions | WorkspaceActions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WorkspaceActionTypes.WorkspaceChanged:
      return {
        ...INITIAL_STATE,
        page: 1,
        limit: 20,
      };
    case ActionTypes.AggregationStarted:
      return {
        ...state,
        loading: true,
        error: undefined,
        documents: [],
        abortController: action.abortController,
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
      };
    case ActionTypes.AggregationFailed:
      return {
        ...state,
        documents: [],
        loading: false,
        abortController: undefined,
        error: action.error,
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
  return (dispatch) => {
    track('Aggregation Executed');
    return dispatch(fetchAggregationData(1));
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

export const cancelAggregation = (): ThunkAction<void, RootState, void, Actions> => {
  return (_dispatch, getState) => {
    track('Aggregation Canceled');
    const {
      aggregation: { abortController }
    } = getState();
    abortController?.abort();
  };
};

const fetchAggregationData = (page: number): ThunkAction<
  Promise<void>,
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
      aggregation: { limit },
    } = getState();

    if (!dataService) {
      return;
    }

    try {
      const abortController = new AbortController();
      const signal = abortController.signal;
      dispatch({
        type: ActionTypes.AggregationStarted,
        abortController,
      });

      const stages = pipeline.map(generateStage).filter(x => Object.keys(x).length > 0);
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation || undefined,
      };

      const documents = await aggregatePipeline(
        dataService,
        signal,
        namespace,
        stages,
        options,
        (page - 1) * limit,
        limit,
      );

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
      if ((e as MongoServerError).codeName === 'MaxTimeMSExpired') {
        track('Aggregation Timed Out', { max_time_ms: maxTimeMS ?? null });
      }

      dispatch({
        type: ActionTypes.AggregationFailed,
        error: (e as Error).message,
      });
      log.warn(mongoLogId(1001000106), 'Aggregations', 'Failed to run aggregation');
    }
  }
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
    } = getState();

    const stages = pipeline
      .map(generateStage)
      .filter((stage) => Object.keys(stage).length > 0);
    const options: AggregateOptions = {
      maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
      allowDiskUse: true,
      collation: collation || undefined,
    };
    dispatch(
      globalAppRegistryEmit('open-export', {
        namespace,
        aggregation: {
          stages,
          options
        }
      })
    );
    return;
  }
}
export default reducer;