import type { Reducer } from 'redux';

import { ActionTypes as AggregationActionTypes } from './aggregation';
import type { Actions as AggregationActions } from './aggregation';

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

export const changeWorkspace = (view: Workspace): WorkspaceChangedAction => ({
  type: ActionTypes.WorkspaceChanged,
  view,
});

export default reducer;
