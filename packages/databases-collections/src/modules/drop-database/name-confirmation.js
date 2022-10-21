/**
 * Drop database name confirmation.
 */
export const CHANGE_DATABASE_NAME_CONFIRMATION =
  'databases-collections/drop-database/name/CHANGE_NAME_CONFIRMATION';

/**
 * The initial state of the database name confirmation.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to drop database name confirmation.
 *
 * @param {String} state - The drop database name confirmation state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_DATABASE_NAME_CONFIRMATION) {
    return action.nameConfirmation;
  }
  return state;
}

/**
 * The change name confirmation action creator.
 *
 * @param {String} nameConfirmation - The database name confirmation.
 *
 * @returns {Object} The action.
 */
export const changeDatabaseNameConfirmation = (nameConfirmation) => ({
  type: CHANGE_DATABASE_NAME_CONFIRMATION,
  nameConfirmation: nameConfirmation,
});
