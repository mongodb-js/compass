/**
 * Change is wildcard action name.
 */
export const TOGGLE_HAS_WILDCARD_PROJECTION =
  'indexes/create-indexes/has-wildcard-projection/TOGGLE_HAS_WILDCARD_PROJECTION';

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
  if (action.type === TOGGLE_HAS_WILDCARD_PROJECTION) {
    return action.hasWildcardProjection;
  }
  return state;
}

/**
 * The toggle is wildcard action creator.
 *
 * @param {Boolean} hasWildcardProjection - Is wildcard.
 *
 * @returns {Object} The action.
 */
export const toggleHasWildcardProjection = (hasWildcardProjection) => ({
  type: TOGGLE_HAS_WILDCARD_PROJECTION,
  hasWildcardProjection: hasWildcardProjection,
});
