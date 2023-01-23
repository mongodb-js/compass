import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { isAction } from '../utils/is-action';
import { addStage } from './pipeline-builder/stage-editor';

enum ActionTypes {
  FocusModeEnabled = 'compass-aggregations/focusModeEnabled',
  FocusModeDisabled = 'compass-aggregations/focusModeDisabled',
  SelectFocusModeStage = 'compass-aggregations/selectFocusModeStage',
}

type FocusModeEnabledAction = {
  type: ActionTypes.FocusModeEnabled;
  stageIndex: number;
};

type FocusModeDisabledAction = {
  type: ActionTypes.FocusModeDisabled;
};

type SelectFocusModeStageAction = {
  type: ActionTypes.SelectFocusModeStage;
  index: number;
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
  if (
    isAction<SelectFocusModeStageAction>(
      action,
      ActionTypes.SelectFocusModeStage
    )
  ) {
    return {
      ...state,
      stageIndex: action.index
    };
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

export const selectFocusModeStage = (index: number) => {
  return {
    type: ActionTypes.SelectFocusModeStage,
    index
  };
};

export const addStageInFocusMode = (
  index: number
): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    dispatch(addStage(index));
    dispatch(selectFocusModeStage(index + 1));
  };
};
