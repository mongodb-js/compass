import type { AnyAction, Reducer } from 'redux';
import type { AggregateOptions } from 'mongodb';
import type { PipelineBuilderThunkAction } from '.';
import { DEFAULT_MAX_TIME_MS } from '../constants';
import { aggregatePipeline } from '../utils/cancellable-aggregation';
import type { WorkspaceChangedAction } from './workspace';
import { ActionTypes as WorkspaceActionTypes } from './workspace';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { getPipelineFromBuilderState } from './pipeline-builder/builder-helpers';
import { isAction } from '../utils/is-action';

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

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  if (
    isAction<WorkspaceChangedAction>(
      action,
      WorkspaceActionTypes.WorkspaceChanged
    ) ||
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  if (isAction<CountStartedAction>(action, ActionTypes.CountStarted)) {
    return {
      loading: true,
      count: state.count,
      abortController: action.abortController,
    };
  }
  if (isAction<CountFinishedAction>(action, ActionTypes.CountFinished)) {
    return {
      loading: false,
      abortController: undefined,
      count: action.count,
    };
  }
  if (isAction<CountFailedAction>(action, ActionTypes.CountFailed)) {
    return {
      ...state,
      loading: false,
      abortController: undefined,
    };
  }
  return state;
};

export const cancelCount = (): PipelineBuilderThunkAction<void> => {
  return (_dispatch, getState) => {
    const {
      countDocuments: { abortController },
    } = getState();
    abortController?.abort();
  };
};

export const countDocuments = (): PipelineBuilderThunkAction<Promise<void>> => {
  return async (dispatch, getState, { pipelineBuilder, preferences }) => {
    const {
      namespace,
      maxTimeMS,
      dataService: { dataService },
      collationString: { value: collation },
    } = getState();

    if (!dataService) {
      return;
    }

    const pipeline = getPipelineFromBuilderState(getState(), pipelineBuilder);

    try {
      const abortController = new AbortController();
      const signal = abortController.signal;
      dispatch({
        type: ActionTypes.CountStarted,
        abortController,
      });

      const options: AggregateOptions = {
        maxTimeMS: maxTimeMS ?? DEFAULT_MAX_TIME_MS,
        collation: collation ?? undefined,
      };

      const [{ count }] = await aggregatePipeline({
        dataService,
        preferences,
        signal,
        namespace,
        pipeline: [...pipeline, { $count: 'count' }],
        options,
      });

      dispatch({
        type: ActionTypes.CountFinished,
        count: Number(count),
      });
    } catch {
      dispatch({
        type: ActionTypes.CountFailed,
      });
    }
  };
};

export default reducer;
