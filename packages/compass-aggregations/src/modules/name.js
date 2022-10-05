import { CONFIRM_NEW } from './import-pipeline';
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
  if (action.type === CONFIRM_NEW) {
    return INITIAL_STATE;
  }
  return state;
}
