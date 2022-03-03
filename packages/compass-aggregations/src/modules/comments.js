/**
 * Comments toggled action name.
 */
export const TOGGLE_COMMENTS = 'aggregations/comments/TOGGLE_COMMENTS';

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
  if (action.type === TOGGLE_COMMENTS) {
    return !state;
  }
  return state;
}

/**
 * Action creator for comment toggling.
 *
 * @returns {Object} The toggle comments action.
 */
export const toggleComments = () => ({
  type: TOGGLE_COMMENTS
});
