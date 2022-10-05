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
  return state;
}
