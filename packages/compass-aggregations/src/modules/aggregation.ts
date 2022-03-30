import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';

export enum ActionTypes {
  RunAggregationStarted = 'compass-aggregations/runAggregationStarted',
  RunAggregationFinished = 'compass-aggregations/runAggregationFinished',
  RunAggregationCancelled = 'compass-aggregations/runAggregationCancelled',
  RunAggregationFailed = 'compass-aggregations/runAggregationFailed',
  LastPageReached = 'compass-aggregations/lastPageReached',
}

type RunAggregationStartedAction = {
  type: ActionTypes.RunAggregationStarted;
  // abortController: AbortController;
};

type RunAggregationFinishedAction = {
  type: ActionTypes.RunAggregationFinished;
  documents: Document[];
  page: number;
  isLast: boolean;
};

type RunAggregationCancelledAction = {
  type: ActionTypes.RunAggregationCancelled;
};

type RunAggregationFailedAction = {
  type: ActionTypes.RunAggregationFailed;
  error: string;
};

type LastPageReachedAction = {
  type: ActionTypes.LastPageReached;
};

export type Actions =
  | RunAggregationStartedAction
  | RunAggregationFinishedAction
  | RunAggregationCancelledAction
  | RunAggregationFailedAction
  | LastPageReachedAction;

export type State = {
  documents: Document[];
  page: number;
  limit: number;
  isLast: boolean;
  loading: boolean;
  // abortController?: AbortController;
  error?: string;
};

export const INITIAL_STATE: State = {
  documents: [],
  page: 0,
  limit: 20,
  isLast: false,
  loading: false,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.RunAggregationStarted:
      return {
        ...state,
        loading: true,
        error: undefined,
        documents: [],
        // abortController: action.abortController,
      };
    case ActionTypes.RunAggregationFinished:
      return {
        ...state,
        documents: action.documents,
        page: action.page,
        isLast: action.isLast,
        loading: false,
        // abortController: undefined,
      };
    case ActionTypes.RunAggregationCancelled:
      return {
        ...state,
        loading: false,
        documents: [],
        error: 'Action cancelled',
        // abortController: undefined,
      };
    case ActionTypes.RunAggregationFailed:
      return {
        ...state,
        loading: false,
        // abortController: undefined,
        error: action.error,
      };
    case ActionTypes.LastPageReached:
      return {
        ...state,
        isLast: true,
      };
    default:
      return state;
  }
};

export const runAggregation = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch) => dispatch(fetchAggregationData(1));
};

export const fetchPrevPage = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const {
      aggregation: { page }
    } = getState();
    if (page <= 1) {
      return;
    }
    dispatch(fetchAggregationData(page - 1));
  };
};

export const fetchNextPage = (): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return (dispatch, getState) => {
    const {
      aggregation: { isLast, page }
    } = getState();
    if (isLast) {
      return;
    }
    dispatch(fetchAggregationData(page + 1));
  };
};

let abortController: AbortController;
let signal: AbortSignal;

const onAbort = () => {
  abortController?.abort();
};

const fetchAggregationData = (page: number): ThunkAction<
  void,
  RootState,
  void,
  Actions
> => {
  return async (dispatch, getState) => {
    try {
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

      abortController = new AbortController();
      signal = abortController.signal;

      abortController.signal.addEventListener('abort', onAbort, { once: true });


      dispatch({
        type: ActionTypes.RunAggregationStarted,
      });

      const stages = pipeline.map(generateStage);
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation || undefined,
      };
      const cursor = dataService.aggregate(
        namespace,
        stages,
        options
      ).skip((page - 1) * limit).limit(limit);

      if (!await raceWithAbort(cursor.hasNext(), signal)) {
        return dispatch({ type: ActionTypes.LastPageReached });
      }

      const documents = await raceWithAbort(cursor.toArray(), signal);
      dispatch({
        type: ActionTypes.RunAggregationFinished,
        documents,
        page,
        isLast: documents.length < limit,
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.RunAggregationFailed,
        error: (e as Error).message,
      });
    } finally {
      abortController.signal.removeEventListener('abort', onAbort);
    }
  }
};

export const cancelAggregation = (): RunAggregationCancelledAction => {
  onAbort();
  return {
    type: ActionTypes.RunAggregationCancelled,
  }
}


/*
 * Return a promise you can race (just like a timeout from timeouts/promises).
 * It will reject if abortSignal triggers before successSignal
*/
function abortablePromise(abortSignal: AbortSignal, successSignal: AbortSignal) {
  let reject: (reason: unknown) => void;

  const promise = new Promise<never>(function (resolve, _reject) {
    reject = _reject;
  });

  const abort = () => {
    // if this task aborts it will never succeed, so clean up that event listener
    // (abortSignal's event handler is already removed due to { once: true })
    successSignal.removeEventListener('abort', succeed);

    reject(new Error('OPERATION_CANCELLED_MESSAGE'));
  };

  const succeed = () => {
    // if this task succeeds it will never abort, so clean up that event listener
    // (successSignal's event handler is already removed due to { once: true })
    abortSignal.removeEventListener('abort', abort);
  };

  abortSignal.addEventListener('abort', abort, { once: true });
  successSignal.addEventListener('abort', succeed, { once: true });

  return promise;
}

/*
 * We need a promise that will reject as soon as the operation is aborted since
 * closing the cursor isn't enough to immediately make the cursor method's
 * promise reject.
*/
async function raceWithAbort<T>(promise: Promise<T>, signal: AbortSignal): Promise<T> {
  const successController = new AbortController();
  const abortPromise = abortablePromise(signal, successController.signal);
  try {
    return await Promise.race([abortPromise, promise]);
  } finally {
    if (!signal.aborted) {
      // either the operation succeeded or it failed because of some error
      // that's not an abort
      successController.abort();
    }
  }
}


export default reducer;
