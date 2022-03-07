import type { Reducer } from 'redux';

type Workspace = 'builder' | 'results';

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

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ChangeWorkspace:
      return action.view;
    default:
      return state;
  }
};

export const changeWorkspace = (view: Workspace): ChangeWorkspaceAction => ({
  type: ActionTypes.ChangeWorkspace,
  view,
});

export default reducer;
