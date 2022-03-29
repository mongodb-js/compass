import type { Reducer } from 'redux';
import type { AggregateOptions, Document } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';

export enum ActionTypes {
  RunAggregation = 'compass-aggregations/runAggregation',
  LastPageReached = 'compass-aggregations/lastPageReached',
}

type RunAggregationAction = {
  type: ActionTypes.RunAggregation;
  documents: Document[];
  page: number;
  isLast: boolean;
};

type LastPageReachedAction = {
  type: ActionTypes.LastPageReached;
};

export type Actions =
  | RunAggregationAction
  | LastPageReachedAction;

export type State = {
  documents: Document[];
  page: number;
  limit: number;
  isLast: boolean;
};

export const INITIAL_STATE: State = {
  documents: [],
  page: 0,
  limit: 20,
  isLast: false,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.LastPageReached:
      return {
        ...state,
        isLast: true,
      };
    case ActionTypes.RunAggregation:
      return {
        ...state,
        documents: action.documents,
        page: action.page,
        isLast: action.isLast,
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

const fetchAggregationData = (page: number): ThunkAction<
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
      aggregation: { limit },
    } = getState();

    if (!dataService) {
      return;
    }

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

    if (!await cursor.hasNext()) {
      return dispatch({ type: ActionTypes.LastPageReached });
    }

    const documents = await cursor.toArray();
    return dispatch({
      type: ActionTypes.RunAggregation,
      documents,
      page,
      isLast: documents.length < limit,
    });
  }
};

export default reducer;
