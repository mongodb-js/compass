import type { Action, Reducer } from 'redux';
import type { RunAggregation } from './aggregation';
import {
  ActionTypes as AggregationActionTypes,
  cancelAggregation,
} from './aggregation';
import type { PipelineBuilderThunkAction } from '.';
import { cancelCount } from './count-documents';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { isAction } from '@mongodb-js/compass-utils';

export type Workspace = 'builder' | 'results';

export enum ActionTypes {
  WorkspaceChanged = 'compass-aggregations/workspaceChanged',
}

export type WorkspaceChangedAction = {
  type: ActionTypes.WorkspaceChanged;
  view: Workspace;
};

export type Actions = WorkspaceChangedAction;
export type State = Workspace;

export const INITIAL_STATE: State = 'builder';

const reducer: Reducer<State, Action> = (state = INITIAL_STATE, action) => {
  if (isAction<WorkspaceChangedAction>(action, ActionTypes.WorkspaceChanged)) {
    return action.view;
  }
  if (isAction<RunAggregation>(action, AggregationActionTypes.RunAggregation)) {
    return 'results';
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  return state;
};

export const editPipeline = (): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    dispatch(cancelAggregation());
    dispatch(cancelCount());
    dispatch({
      type: ActionTypes.WorkspaceChanged,
      view: 'builder',
    });
  };
};
export default reducer;
