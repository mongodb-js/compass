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
    case AggregationActionTypes.AggregationStarted:
      return 'results';
    case NEW_PIPELINE:
      return INITIAL_STATE;
    default:
      return state;
  }
};

export const changeWorkspace = (view: Workspace): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    // As user switches to builder view, we cancel running ops
    if (view === 'builder') {
      dispatch(cancelAggregation());
      dispatch(cancelCount());
    }
    dispatch({
      type: ActionTypes.WorkspaceChanged,
      view,
    });
  };
};
export default reducer;
