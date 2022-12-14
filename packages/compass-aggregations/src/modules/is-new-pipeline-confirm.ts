import type { AnyAction } from 'redux';
import type { PipelineBuilderThunkAction } from '.';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';

export enum ActionTypes {
  ToggleConfirmNewPipeline = 'compass-aggregations/is-new-pipeline-confirm/toggleConfirmNewPipeline',
  NewPipelineConfirmed = 'compass-aggregations/is-new-pipeline-confirm/newPipelineConfirmed',
}

type SetConfirmNewPipelineAction = {
  type: ActionTypes.ToggleConfirmNewPipeline;
  confirm: boolean;
};

export const INITIAL_STATE = false;

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === ActionTypes.ToggleConfirmNewPipeline) {
    return action.confirm;
  }
  if (action.type === ActionTypes.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  return state;
}

/**
 * Action creator for set isNewPipelineConfirm events.
 */
export const toggleNewPipelineModal = (confirm: boolean): SetConfirmNewPipelineAction => ({
  type: ActionTypes.ToggleConfirmNewPipeline,
  confirm
});

/**
 * Confirm new pipeline action
 */
export const confirmNewPipeline = (): PipelineBuilderThunkAction<void> => (
  dispatch,
  _getState,
  { pipelineBuilder }
) => {
  pipelineBuilder.reset();
  dispatch({
    type: ActionTypes.NewPipelineConfirmed,
    stages: pipelineBuilder.stages,
    pipelineText: pipelineBuilder.source,
    pipeline: pipelineBuilder.pipeline,
    syntaxErrors: pipelineBuilder.syntaxError,
  });
  dispatch(updatePipelinePreview());
};
