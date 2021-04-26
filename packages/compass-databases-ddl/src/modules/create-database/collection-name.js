/**
 * Change collection name action name.
 */
export const CHANGE_COLLECTION_NAME = 'ddl/create-database/collection-name/CHANGE_COLLECTION_NAME';

/**
 * The initial state of the collection name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to collection name.
 *
 * @param {Array} state - The colletion name state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
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
  name: name
});
