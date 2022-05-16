import type { Reducer } from 'redux';

export enum ActionTypes {
  ModalOpened = 'compass-aggregations/modalOpened',
  ModalClosed = 'compass-aggregations/modalClosed',
}

type ModalOpenedAction = {
  type: ActionTypes.ModalOpened;
};

type ModalClosedAction = {
  type: ActionTypes.ModalClosed;
};

export type Actions =
  | ModalOpenedAction
  | ModalClosedAction;

export type State = {
  isModalOpen: boolean;
};

export const INITIAL_STATE: State = {
  isModalOpen: false,
};

const reducer: Reducer<State, Actions> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.ModalOpened:
      return {
        isModalOpen: true,
      };
    case ActionTypes.ModalClosed:
      return {
        isModalOpen: false,
      };
    default:
      return state;
  }
};

export const openExplainModal = (): ModalOpenedAction => ({
  type: ActionTypes.ModalOpened,
});

export const closeExplainModal = (): ModalClosedAction => ({
  type: ActionTypes.ModalClosed,
});

export default reducer;