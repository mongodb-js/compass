/**
 * Drop collection name confirmation.
 */
export const CHANGE_COLLECTION_NAME_CONFIRMATION =
  'databases-collections/drop-collection/name/CHANGE_NAME_CONFIRMATION';

/**
 * The initial state of the collection name confirmation.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to drop collection name confirmation.
 *
 * @param {String} state - The drop collection name confirmation state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_COLLECTION_NAME_CONFIRMATION) {
    return action.nameConfirmation;
  }
  return state;
}

/**
 * The change name confirmation action creator.
 *
 * @param {String} nameConfirmation - The collection name confirmation.
 *
 * @returns {Object} The action.
 */
export const changeCollectionNameConfirmation = (nameConfirmation) => ({
  type: CHANGE_COLLECTION_NAME_CONFIRMATION,
  nameConfirmation: nameConfirmation,
});
