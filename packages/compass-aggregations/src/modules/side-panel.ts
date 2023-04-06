import type { AnyAction } from 'redux';
import { isAction } from '../utils/is-action';

enum ActionTypes {
  SidePanelToggled = 'compass-aggregations/sidePanelToggled',
}

type SidePanelToggledAction = {
  type: ActionTypes.SidePanelToggled;
};

type State = {
  isPanelOpen: boolean;
};

export const INITIAL_STATE: State = {
  isPanelOpen: false,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (isAction(action, ActionTypes.SidePanelToggled)) {
    return {
      isPanelOpen: !state.isPanelOpen,
    };
  }
  return state;
}

export const toggleSidePanel = (): SidePanelToggledAction => ({
  type: ActionTypes.SidePanelToggled,
});
