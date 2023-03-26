import type { AnyAction, Reducer } from 'redux';

export enum ActionTypes {
  PanelToggled = 'compass-aggregations/stageCreator/panelToggled',
}

type PanelToggledAction = {
  type: ActionTypes.PanelToggled;
};

export type State = {
  isPanelOpen: boolean;
};

export const INITIAL_STATE: State = {
  isPanelOpen: false,
};

const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  switch (action.type) {
    case ActionTypes.PanelToggled:
      return {
        isPanelOpen: !state.isPanelOpen,
      };
    default:
      return state;
  }
};

export const toggleStageCreatorPanel = (): PanelToggledAction => ({
  type: ActionTypes.PanelToggled,
});

export default reducer;
