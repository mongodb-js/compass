import type { Reducer } from 'redux';

import { ActionTypes as AggregationActionTypes } from './aggregation';
import type { Actions as AggregationActions } from './aggregation';

export type Workspace = 'builder' | 'results';

enum ActionTypes {
  ChangeWorkspace = 'compass-aggregations/changeWorkspace',
}

type ChangeWorkspaceAction = {
  type: ActionTypes.ChangeWorkspace;
  view: Workspace;
};

export type Actions = ChangeWorkspaceAction;
export type State = Workspace;

export const INITIAL_STATE: State = 'builder';

const reducer: Reducer<State, Actions | AggregationActions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ChangeWorkspace:
      return action.view;
    case AggregationActionTypes.RunAggregation:
      return 'results';
    default:
      return state;
  }
};

export const changeWorkspace = (view: Workspace): ChangeWorkspaceAction => ({
  type: ActionTypes.ChangeWorkspace,
  view,
});

export default reducer;
