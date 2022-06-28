import type { ActionCreator, Reducer } from 'redux';

export type State = {
  isOpen: boolean;
};

const INITIAL_STATE: State = {
  isOpen: false,
};

export enum ActionTypes {
  ToggleModal = 'compass-settings/toggleModal',
}

type ToggleModalAction = {
  type: ActionTypes.ToggleModal;
  value: boolean;
};

export type Actions = ToggleModalAction;

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ToggleModal:
      return {
        isOpen: action.value,
      };
    default:
      return state;
  }
};

export const toggleModal: ActionCreator<ToggleModalAction> = (value: boolean) => {
  return { type: ActionTypes.ToggleModal, value };
};

export default reducer;
