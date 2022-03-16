enum ActionTypes {
  ToggleOption = 'aggregations/options/toggleOption',
};

type ToggleOptionAction = {
  type: ActionTypes.ToggleOption;
};

type State = boolean;

export const INITIAL_STATE: State = false;

export default function reducer(state = INITIAL_STATE, action: ToggleOptionAction): State {
  if (action.type === ActionTypes.ToggleOption) {
    return !state;
  }
  return state;
}

export const toggleOptions = (): ToggleOptionAction => ({
  type: ActionTypes.ToggleOption,
});
