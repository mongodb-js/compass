import type { Reducer } from 'redux';
import type { AggregateOptions } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { generateStage } from './stage';
import { aggregatePipeline } from '../utils/cancellable-aggregation';
import type { Actions as WorkspaceActions } from './workspace';
import { ActionTypes as WorkspaceActionTypes } from './workspace';


export enum ActionTypes {
  CountStarted = 'compass-aggregations/countStarted',
  CountFinished = 'compass-aggregations/countFinished',
  CountCancelled = 'compass-aggregations/countCancelled',
  CountFailed = 'compass-aggregations/countFailed',
};

type CountStartedAction = {
  type: ActionTypes.CountStarted;
  abortController: AbortController;
};

type CountFinishedAction = {
  type: ActionTypes.CountFinished;
  count: number;
};

type CountCancelledAction = {
  type: ActionTypes.CountCancelled;
};

type CountFailedAction = {
  type: ActionTypes.CountFailed;
};

export type Actions =
  | CountStartedAction
  | CountFinishedAction
  | CountCancelledAction
  | CountFailedAction;

export type State = {
  count?: number;
  loading: boolean;
  abortController?: AbortController;
};

export const INITIAL_STATE: State = {
  loading: false,
};

const reducer: Reducer<State, Actions | WorkspaceActions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case WorkspaceActionTypes.WorkspaceChanged:
      return INITIAL_STATE;
    case ActionTypes.CountStarted:
      return {
        loading: true,
        abortController: action.abortController,
      };
    case ActionTypes.CountFinished:
      return {
        loading: false,
        abortController: undefined,
        count: action.count,
      };
    case ActionTypes.CountCancelled:
      return {
        ...state,
        abortController: undefined,
      };
    case ActionTypes.CountFailed:
      return {
        ...state,
        loading: false,
        abortController: undefined,
      };
    default:
      return state;
  }
};

export const cancelCount = (): ThunkAction<void, RootState, void, Actions> => {
  return (_dispatch, getState) => {
    const {
      countDocuments: { abortController }
    } = getState();
    abortController?.abort();
  };
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
      const abortController = new AbortController();
      const signal = abortController.signal;
      dispatch({
        type: ActionTypes.CountStarted,
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
        [...stages, { $count: 'count' }],
        options,
        0,
        1,
      );
      dispatch({
        type: ActionTypes.CountFinished,
        count: documents[0]?.count ?? 0,
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.CountFailed,
      });
    }
  }
}
export default reducer;