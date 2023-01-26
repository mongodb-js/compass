import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { isAction } from '../utils/is-action';
import { addStage } from './pipeline-builder/stage-editor';
import createLoggerAndTelemetry from '@mongodb-js/compass-logging';

const { track } = createLoggerAndTelemetry('COMPASS-AGGREGATIONS-UI');

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
  openedAt: number | null;
};

export const INITIAL_STATE: State = {
  isEnabled: false,
  stageIndex: -1,
  openedAt: null,
};

export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): State {
  if (action.type === ActionTypes.FocusModeEnabled) {
    return {
      isEnabled: true,
      stageIndex: action.stageIndex,
      openedAt: Date.now(),
    };
  }
  if (action.type === ActionTypes.FocusModeDisabled) {
    return {
      isEnabled: false,
      stageIndex: -1,
      openedAt: null,
    };
  }
  if (
    isAction<SelectFocusModeStageAction>(
      action,
      ActionTypes.SelectFocusModeStage
    )
  ) {
    return {
      ...state,
      stageIndex: action.index,
    };
  }
  return state;
}

export const enableFocusMode = (
  stageIndex: number
): PipelineBuilderThunkAction<void, FocusModeEnabledAction> => {
  return (dispatch, getState) => {
    track('Focus Mode Opened', {
      num_stages: getState().pipelineBuilder.stageEditor.stages.length,
    });
    dispatch({
      type: ActionTypes.FocusModeEnabled,
      stageIndex,
    });
  };
};

export const disableFocusMode = (): PipelineBuilderThunkAction<
  void,
  FocusModeDisabledAction
> => {
  return (dispatch, getState) => {
    const state = getState();
    track('Focus Mode Closed', {
      num_stages: state.pipelineBuilder.stageEditor.stages.length,
      duration: Number(
        (Date.now() - (state.focusMode.openedAt ?? 0)).toFixed(1)
      ),
    });
    dispatch({ type: ActionTypes.FocusModeDisabled });
  };
};

export const selectFocusModeStage = (index: number) => {
  return {
    type: ActionTypes.SelectFocusModeStage,
    index,
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
