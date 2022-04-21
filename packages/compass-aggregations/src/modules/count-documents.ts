import type { Reducer } from 'redux';
import type { AggregateOptions } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';
import type { Actions as WorkspaceActions } from './workspace';
import { ActionTypes as WorkspaceActionTypes } from './workspace';


export enum ActionTypes {
  CountStarted = 'compass-aggregations/countStarted',
  CountFinished = 'compass-aggregations/countFinished',
  CountFailed = 'compass-aggregations/countFailed',
};

type CountStartedAction = {
  type: ActionTypes.CountStarted;
};

type CountFinishedAction = {
  type: ActionTypes.CountFinished;
  count: number;
};

type CountFailedAction = {
  type: ActionTypes.CountFailed;
};

export type Actions =
  | CountStartedAction
  | CountFinishedAction
  | CountFailedAction;

export type State = {
  count?: number;
  loading: boolean;
};

export const INITIAL_STATE: State = {
  loading: false,
};

const reducer: Reducer<State, Actions | WorkspaceActions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WorkspaceActionTypes.WorkspaceChanged:
      return {
        ...INITIAL_STATE,
      };
    case ActionTypes.CountStarted:
      return {
        loading: true,
      };
    case ActionTypes.CountFinished:
      return {
        loading: false,
        count: action.count,
      };
    case ActionTypes.CountFailed:
      return {
        ...state,
        loading: false,
      };
    default:
      return state;
  }
};

export const countDocuments = (): ThunkAction<
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
      dataService: { dataService }
    } = getState();

    if (!dataService) {
      return;
    }

    try {
      dispatch({ type: ActionTypes.CountStarted });
      const stages = pipeline.map(generateStage).filter(x => Object.keys(x).length > 0);
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS || DEFAULT_MAX_TIME_MS,
        allowDiskUse: true,
        collation: collation || undefined,
      };
      const cursor = dataService
        .aggregate(namespace, [...stages, { $count: 'count' }], options)
        .skip(0).limit(1)
      const documents = await cursor.toArray();
      dispatch({
        type: ActionTypes.CountFinished,
        count: documents[0].count,
      });
    } catch (e) {
      dispatch({ type: ActionTypes.CountFailed });
    }
  }
}
export default reducer;