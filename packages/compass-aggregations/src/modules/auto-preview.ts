import type { AnyAction } from "redux";
import type { PipelineBuilderThunkAction } from ".";
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';
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
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
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
  return (dispatch) => {
    dispatch({
      type: ActionTypes.AutoPreviewToggled,
      value: newVal
    });
    dispatch(updatePipelinePreview());
  };
};
