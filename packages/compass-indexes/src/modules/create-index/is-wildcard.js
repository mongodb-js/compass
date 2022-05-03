/**
 * Change is wildcard action name.
 */
export const TOGGLE_IS_WILDCARD =
  'indexes/create-indexes/is-wildcard/TOGGLE_IS_WILDCARD';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is wildcard.
 *
 * @param {Boolean} state - The is wildcard state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_WILDCARD) {
    return action.isWildcard;
  }
  return state;
}

/**
 * The toggle is wildcard action creator.
 *
 * @param {Boolean} isWildcard - Is wildcard.
 *
 * @returns {Object} The action.
 */
export const toggleIsWildcard = (isWildcard) => ({
  type: TOGGLE_IS_WILDCARD,
  isWildcard: isWildcard,
});
