/**
 * Change is capped action name.
 */
export const TOGGLE_IS_CAPPED = 'ddl/create-database/is-capped/TOGGLE_IS_CAPPED';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is capped.
 *
 * @param {Boolean} state - The is capped state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_CAPPED) {
    return action.isCapped;
  }
  return state;
}

/**
 * The toggle is capped action creator.
 *
 * @param {Boolean} isCapped - Is capped.
 *
 * @returns {Object} The action.
 */
export const toggleIsCapped = (isCapped) => ({
  type: TOGGLE_IS_CAPPED,
  isCapped: isCapped
});
