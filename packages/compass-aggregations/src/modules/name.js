import { ActionTypes as ConfirmNewPipelineActions } from './is-new-pipeline-confirm';
import { RESTORE_PIPELINE } from './saved-pipeline';
import { SAVING_PIPELINE_APPLY } from './saving-pipeline';

/**
 * The initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to name.
 *
 * @param {String} state - The name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SAVING_PIPELINE_APPLY) {
    return action.name;
  }
  if (action.type === ConfirmNewPipelineActions.NewPipelineConfirmed) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.storedOptions.name;
  }
  return state;
}
