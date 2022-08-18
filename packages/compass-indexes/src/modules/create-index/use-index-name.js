/**
 * Change use index name action name.
 */
export const TOGGLE_USE_INDEX_NAME =
  'indexes/create-indexes/use-index-name/TOGGLE_USE_INDEX_NAME';

/**
 * The initial state of the use index name
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to use index name.
 *
 * @param {Boolean} state - The use index name state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_USE_INDEX_NAME) {
    return action.useIndexName;
  }
  return state;
}

/**
 * The toggle use index name action creator.
 *
 * @param {Boolean} useIndexName - Use index name.
 *
 * @returns {Object} The action.
 */
export const toggleUseIndexName = (useIndexName) => ({
  type: TOGGLE_USE_INDEX_NAME,
  useIndexName,
});
