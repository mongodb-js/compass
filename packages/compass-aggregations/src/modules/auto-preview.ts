import type { AnyAction } from "redux";
import type { PipelineBuilderThunkAction } from ".";
import { NEW_PIPELINE } from './import-pipeline';
import { runStage } from "./pipeline";
import { RESTORE_PIPELINE } from './saved-pipeline';

export enum ActionTypes {
  AutoPreviewToggled = 'compass-aggregations/autoPreviewToggled',
}

export type AutoPreviewToggledAction = {
  type: ActionTypes.AutoPreviewToggled;
  value: boolean;
};

export const INITIAL_STATE = true;

export default function reducer(state = INITIAL_STATE, action: AnyAction): boolean {
  if (action.type === ActionTypes.AutoPreviewToggled) {
    return action.value;
  }
  if (action.type === NEW_PIPELINE) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.restoreState.autoPreview;
  }
  return state;
}

export const toggleAutoPreview = (
  newVal: boolean
): PipelineBuilderThunkAction<void> => {
  return (dispatch, _getState, { pipelineBuilder }) => {
    dispatch({
      type: ActionTypes.AutoPreviewToggled,
      value: newVal
    });

    if (newVal) {
      dispatch(runStage(0, true /* force execute */));
    } else {
      pipelineBuilder.stopPreview();
    }
  };
};
