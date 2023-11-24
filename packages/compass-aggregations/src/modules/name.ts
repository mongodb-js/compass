import type { Reducer } from 'redux';

import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { SAVING_PIPELINE_APPLY } from './saving-pipeline';
import type { RootAction } from '.';

export type NameState = string;

export const INITIAL_STATE: NameState = '';

/**
 * Reducer function for handle state changes to name.
 */
const reducer: Reducer<NameState, RootAction> = (
  state = INITIAL_STATE,
  action
) => {
  if (action.type === SAVING_PIPELINE_APPLY) {
    return action.name;
  }
  if (
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed ||
    action.type === AIPipelineActionTypes.LoadGeneratedPipeline ||
    action.type === AIPipelineActionTypes.PipelineGeneratedFromQuery
  ) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.storedOptions.name;
  }
  return state;
};

export default reducer;
