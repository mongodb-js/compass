/**
 * Drop collection name.
 */
export const CHANGE_COLLECTION_NAME =
  'databases-collections/drop-collection/name/CHANGE_NAME';

/**
 * The initial state of the collection name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to drop collection.
 *
 * @param {String} state - The drop collection name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_COLLECTION_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} name - The collection name.
 *
 * @returns {Object} The action.
 */
export const changeCollectionName = (name) => ({
  type: CHANGE_COLLECTION_NAME,
  name: name,
});
