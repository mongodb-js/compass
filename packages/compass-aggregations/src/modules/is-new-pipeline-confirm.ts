import type { AnyAction } from 'redux';
import { PipelineBuilderThunkAction } from '.';
import { updatePipelinePreview } from './pipeline-builder/builder-helpers';

export enum ActionTypes {
  SetConfirmNewPipeline = 'compass-aggregations/is-new-pipeline-confirm/setConfirmNewPipeline',
  NewPipelineConfirmed = 'compass-aggregations/is-new-pipeline-confirm/newPipelineConfirmed',
}

type SetConfirmNewPipelineAction = {
  type: ActionTypes.SetConfirmNewPipeline;
  confirm: boolean;
};

export const INITIAL_STATE = false;

export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === ActionTypes.SetConfirmNewPipeline) {
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
export const setIsNewPipelineConfirm = (confirm: boolean): SetConfirmNewPipelineAction => ({
  type: ActionTypes.SetConfirmNewPipeline,
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
