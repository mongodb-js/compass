import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { isAction } from '@mongodb-js/compass-utils';

import { addStage, pipelineFromStore } from './pipeline-builder/stage-editor';

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

export type FocusModeAction =
  | FocusModeEnabledAction
  | FocusModeDisabledAction
  | SelectFocusModeStageAction;
export type FocusModeState = {
  isEnabled: boolean;
  stageIndex: number;
  openedAt: number | null;
};

export const INITIAL_STATE: FocusModeState = {
  isEnabled: false,
  stageIndex: -1,
  openedAt: null,
};

export default function reducer(
  state: FocusModeState = INITIAL_STATE,
  action: AnyAction
): FocusModeState {
  if (isAction<FocusModeEnabledAction>(action, ActionTypes.FocusModeEnabled)) {
    return {
      isEnabled: true,
      stageIndex: action.stageIndex,
      openedAt: Date.now(),
    };
  }
  if (
    isAction<FocusModeDisabledAction>(action, ActionTypes.FocusModeDisabled)
  ) {
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
  return (dispatch, getState, { track, connectionInfoRef }) => {
    track(
      'Focus Mode Opened',
      {
        num_stages: pipelineFromStore(
          getState().pipelineBuilder.stageEditor.stages
        ).length,
      },
      connectionInfoRef.current
    );
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
  return (dispatch, getState, { track, connectionInfoRef }) => {
    const state = getState();
    track(
      'Focus Mode Closed',
      {
        num_stages: pipelineFromStore(state.pipelineBuilder.stageEditor.stages)
          .length,
        duration: Number(
          (Date.now() - (state.focusMode.openedAt ?? 0)).toFixed(1)
        ),
      },
      connectionInfoRef.current
    );
    dispatch({ type: ActionTypes.FocusModeDisabled });
  };
};

export const selectFocusModeStage = (
  index: number
): SelectFocusModeStageAction => {
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
