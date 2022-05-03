import type { Reducer } from 'redux';

import { ActionTypes as AggregationActionTypes, cancelAggregation } from './aggregation';
import type { Actions as AggregationActions } from './aggregation';
import type { ThunkAction } from 'redux-thunk';
import type { RootState } from '.';
import { cancelCount } from './count-documents';

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

const reducer: Reducer<State, Actions | AggregationActions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.WorkspaceChanged:
      return action.view;
    case AggregationActionTypes.AggregationStarted:
      return 'results';
    default:
      return state;
  }
};

export const changeWorkspace = (view: Workspace): ThunkAction<void, RootState, void, Actions> => {
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
