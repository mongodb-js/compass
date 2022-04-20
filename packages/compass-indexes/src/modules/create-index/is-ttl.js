/**
 * Change is ttl action name.
 */
export const TOGGLE_IS_TTL = 'indexes/create-indexes/is-ttl/TOGGLE_IS_TTL';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is ttl.
 *
 * @param {Boolean} state - The is ttl state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_TTL) {
    return action.isTtl;
  }
  return state;
}

/**
 * The toggle is ttl action creator.
 *
 * @param {Boolean} isTtl - Is ttl.
 *
 * @returns {Object} The action.
 */
export const toggleIsTtl = (isTtl) => ({
  type: TOGGLE_IS_TTL,
  isTtl: isTtl,
});
