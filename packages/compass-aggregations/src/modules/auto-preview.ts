import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import type { NewPipelineConfirmedAction } from './is-new-pipeline-confirm';
import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';
import type { RestorePipelineAction } from './saved-pipeline';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { isAction } from '@mongodb-js/compass-utils';

export enum ActionTypes {
  AutoPreviewToggled = 'compass-aggregations/autoPreviewToggled',
}

export type AutoPreviewToggledAction = {
  type: ActionTypes.AutoPreviewToggled;
  value: boolean;
};
export type AutoPreviewAction = AutoPreviewToggledAction;
export type AutoPreviewState = boolean | undefined;

export const INITIAL_STATE: AutoPreviewState = true;

export default function reducer(
  state: AutoPreviewState = INITIAL_STATE,
  action: AnyAction
): AutoPreviewState {
  if (isAction<AutoPreviewAction>(action, ActionTypes.AutoPreviewToggled)) {
    return action.value;
  }
  if (
    isAction<NewPipelineConfirmedAction>(
      action,
      ConfirmNewPipelineActions.NewPipelineConfirmed
    )
  ) {
    return INITIAL_STATE;
  }
  if (isAction<RestorePipelineAction>(action, RESTORE_PIPELINE)) {
    return action.storedOptions.autoPreview;
  }
  return state;
}

export const toggleAutoPreview = (
  newVal: boolean
): PipelineBuilderThunkAction<void> => {
  return (dispatch) => {
    dispatch({
      type: ActionTypes.AutoPreviewToggled,
      value: newVal,
    });
    dispatch(updatePipelinePreview());
  };
};
