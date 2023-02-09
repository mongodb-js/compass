enum ActionTypes {
  ToggleIsSparse = 'indexes/create-indexes/is-sparse/ToggleIsSparse',
}

type ToggleIsSparseAction = {
  type: ActionTypes.ToggleIsSparse;
  isSparse: boolean;
};

type State = boolean;

export const INITIAL_STATE: State = false;

export default function reducer(
  state: State = INITIAL_STATE,
  action: ToggleIsSparseAction
): boolean {
  if (action.type === ActionTypes.ToggleIsSparse) {
    return action.isSparse;
  }
  return state;
}

export const toggleIsSparse = (isSparse: boolean): ToggleIsSparseAction => ({
  type: ActionTypes.ToggleIsSparse,
  isSparse,
});
