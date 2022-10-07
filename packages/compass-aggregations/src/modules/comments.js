import { NEW_PIPELINE } from './import-pipeline';
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
    return action.settings.isCommentMode ?? state
  }
  if (action.type === NEW_PIPELINE) {
    return INITIAL_STATE;
  }
  if (action.type === RESTORE_PIPELINE) {
    return action.restoreState.comments;
  }
  return state;
}
