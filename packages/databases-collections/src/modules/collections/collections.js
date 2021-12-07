/**
 * The module prefix.
 */
const PREFIX = 'databases-collections/collections';

/**
 * The load collections action name.
 */
export const LOAD_COLLECTIONS = `${PREFIX}/LOAD_COLLECTIONS`;

/**
 * The initial state of the collections attribute.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to collections.
 *
 * @param {Array} state - The collections state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === LOAD_COLLECTIONS) {
    return action.collections;
  }
  return state;
}

/**
 * Action creator for load collections events.
 *
 * @param {Array} collections - The raw collection list.
 *
 * @returns {Object} The load collections action.
 */
export const loadCollections = (collections) => ({
  type: LOAD_COLLECTIONS,
  collections: collections
});
