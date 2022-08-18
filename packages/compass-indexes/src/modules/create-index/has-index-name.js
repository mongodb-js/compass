/**
 * Change has index name action name.
 */
export const TOGGLE_HAS_INDEX_NAME =
  'indexes/create-indexes/has-index-name/TOGGLE_HAS_INDEX_NAME';

/**
 * The initial state of the has index name
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to has index name.
 *
 * @param {Boolean} state - The has index name state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_HAS_INDEX_NAME) {
    return action.hasIndexName;
  }
  return state;
}

/**
 * The toggle has index name action creator.
 *
 * @param {Boolean} hasIndexName - Has index name.
 *
 * @returns {Object} The action.
 */
export const toggleHasIndexName = (hasIndexName) => ({
  type: TOGGLE_HAS_INDEX_NAME,
  hasIndexName,
});
