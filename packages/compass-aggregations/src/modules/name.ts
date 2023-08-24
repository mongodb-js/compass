import type { AnyAction, Reducer } from 'redux';

import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { SAVING_PIPELINE_APPLY } from './saving-pipeline';

type State = string;

export const INITIAL_STATE: State = '';

/**
 * Reducer function for handle state changes to name.
 */
const reducer: Reducer<State, AnyAction> = (state = INITIAL_STATE, action) => {
  if (action.type === SAVING_PIPELINE_APPLY) {
    return action.name;
  }
  if (
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed ||
    action.type === AIPipelineActionTypes.LoadAIPipeline
  ) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.storedOptions.name;
  }
  return state;
};

export default reducer;
