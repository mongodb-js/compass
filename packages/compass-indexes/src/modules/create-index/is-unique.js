/**
 * Change is unique action name.
 */
export const TOGGLE_IS_UNIQUE =
  'indexes/create-indexes/is-unique/TOGGLE_IS_UNIQUE';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is unique.
 *
 * @param {Boolean} state - The is unique state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_UNIQUE) {
    return action.isUnique;
  }
  return state;
}

/**
 * The toggle is unique action creator.
 *
 * @param {Boolean} isUnique - Is unique.
 *
 * @returns {Object} The action.
 */
export const toggleIsUnique = (isUnique) => ({
  type: TOGGLE_IS_UNIQUE,
  isUnique,
});
