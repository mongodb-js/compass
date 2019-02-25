/**
 * Create collection.
 */
export const CHANGE_COLLECTION = 'app/collection/CHANGE_COLLECTION';

/**
 * The initial state of the collection.
 */
export const INITIAL_STATE = {};

/**
 * Reducer function for handle state changes to collection.
 *
 * @param {String} state - The collection state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_COLLECTION) {
    return action.collection;
  }
  return state;
}

/**
 * The change collection action creator.
 *
 * @param {String} collection - The collection.
 *
 * @returns {Object} The action.
 */
export const changeCollection = (collection) => ({
  type: CHANGE_COLLECTION,
  collection: collection
});
