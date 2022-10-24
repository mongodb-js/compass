import type { AnyAction, Reducer } from 'redux';
import { ActionTypes as AggregationActionTypes, cancelAggregation } from './aggregation';
import type { PipelineBuilderThunkAction } from '.';
import { cancelCount } from './count-documents';
import { NEW_PIPELINE } from './import-pipeline';

export type Workspace = 'builder' | 'results';

export enum ActionTypes {
  WorkspaceChanged = 'compass-aggregations/workspaceChanged',
}

type WorkspaceChangedAction = {
  type: ActionTypes.WorkspaceChanged;
  view: Workspace;
};

export type Actions = WorkspaceChangedAction;
export type State = Workspace;

export const INITIAL_STATE: State = 'builder';

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.WorkspaceChanged:
      return action.view;
    case AggregationActionTypes.RunAggregation:
      return 'results';
    case NEW_PIPELINE:
      return INITIAL_STATE;
    default:
      return state;
  }
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
