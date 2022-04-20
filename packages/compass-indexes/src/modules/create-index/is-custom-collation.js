/**
 * Change is custom collation action name.
 */
export const TOGGLE_IS_CUSTOM_COLLATION =
  'indexes/create-index/is-custom-collation/TOGGLE_IS_CUSTOM_COLLATION';

/**
 * The initial state of the is custom collation attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is custom collation.
 *
 * @param {Boolean} state - The is custom collation state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_CUSTOM_COLLATION) {
    return action.isCustomCollation;
  }
  return state;
}

/**
 * The toggle is custom collation action creator.
 *
 * @param {Boolean} isCustomCollation - Is a custom collation.
 *
 * @returns {Object} The action.
 */
export const toggleIsCustomCollation = (isCustomCollation) => ({
  type: TOGGLE_IS_CUSTOM_COLLATION,
  isCustomCollation: isCustomCollation,
});
