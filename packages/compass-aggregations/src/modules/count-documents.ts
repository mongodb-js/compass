import type { Reducer } from 'redux';
import type { AggregateOptions } from 'mongodb';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { mapPipelineToStages } from '../utils/stage';
import { aggregatePipeline } from '../utils/cancellable-aggregation';
import type { Actions as WorkspaceActions } from './workspace';
import { ActionTypes as WorkspaceActionTypes } from './workspace';

export enum ActionTypes {
  CountStarted = 'compass-aggregations/countStarted',
  CountFinished = 'compass-aggregations/countFinished',
  CountFailed = 'compass-aggregations/countFailed',
}

type CountStartedAction = {
  type: ActionTypes.CountStarted;
  abortController: AbortController;
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
  abortController?: AbortController;
};

export const INITIAL_STATE: State = {
  loading: false,
};

const reducer: Reducer<State, Actions | WorkspaceActions> = (
  state = INITIAL_STATE,
  action
) => {
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
      dataService: { dataService },
      collationString: { value: collation }
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

      const nonEmptyStages = mapPipelineToStages(pipeline);
      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collation ?? undefined,
      };

      const [{ count }] = await aggregatePipeline({
        dataService,
        signal,
        namespace,
        pipeline: [...nonEmptyStages, { $count: 'count' }],
        options,
      });

      dispatch({
        type: ActionTypes.CountFinished,
        count: Number(count),
      });
    } catch (e) {
      dispatch({
        type: ActionTypes.CountFailed,
      });
    }
  };
};

export default reducer;
