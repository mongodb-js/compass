import type { AnyAction } from "redux";

enum ActionTypes {
  FocusModeEnabled = 'compass-aggregations/focusModeEnabled',
  FocusModeDisabled = 'compass-aggregations/focusModeDisabled',
}

type FocusModeEnabledAction = {
  type: ActionTypes.FocusModeEnabled;
  stageIndex: number;
};

type FocusModeDisabledAction = {
  type: ActionTypes.FocusModeDisabled;
};

type State = {
  isEnabled: boolean;
  stageIndex: number;
}

export const INITIAL_STATE: State = {
  isEnabled: false,
  stageIndex: -1,
};

export default function reducer(state = INITIAL_STATE, action: AnyAction): State {
  if (action.type === ActionTypes.FocusModeEnabled) {
    return {
      isEnabled: true,
      stageIndex: action.stageIndex,
    }
  }
  if (action.type === ActionTypes.FocusModeDisabled) {
    return {
      isEnabled: false,
      stageIndex: -1,
    }
  }
  return state;
}

export const enableFocusMode = (
  stageIndex: number
): FocusModeEnabledAction => ({
  type: ActionTypes.FocusModeEnabled,
  stageIndex,
});

export const disableFocusMode = (): FocusModeDisabledAction => ({
  type: ActionTypes.FocusModeDisabled,
});