/**
 * Create index wildcard projection action.
 */
export const CHANGE_WILDCARD_PROJECTION =
  'indexes/create-index/wildcard-projection/CHANGE_WILDCARD_PROJECTION';

/**
 * The initial state of the wildcard projection.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create wildcard projection.
 *
 * @param {String} state - The create wildcard projection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_WILDCARD_PROJECTION) {
    return action.wildcardProjection;
  }
  return state;
}

/**
 * The change wildcard projection action creator.
 *
 * @param {String} wildcardProjection - The wildcard projection.
 *
 * @returns {Object} The action.
 */
export const changeWildcardProjection = (wildcardProjection) => ({
  type: CHANGE_WILDCARD_PROJECTION,
  wildcardProjection: wildcardProjection,
});
