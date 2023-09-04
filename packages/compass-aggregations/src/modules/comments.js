import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { AIPipelineActionTypes } from './pipeline-builder/pipeline-ai';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { APPLY_SETTINGS } from './settings';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to comments.
 *
 * @param {Boolean} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === APPLY_SETTINGS) {
    return action.settings.isCommentMode ?? state;
  }
  if (
    action.type === ConfirmNewPipelineActions.NewPipelineConfirmed ||
    action.type === AIPipelineActionTypes.LoadGeneratedPipeline ||
    action.type === AIPipelineActionTypes.PipelineGeneratedFromQuery
  ) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.storedOptions.comments ?? INITIAL_STATE;
  }
  return state;
}
