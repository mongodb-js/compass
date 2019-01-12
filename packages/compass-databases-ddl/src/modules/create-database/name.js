/**
 * Create database name.
 */
export const CHANGE_DATABASE_NAME = 'ddl/create-database/name/CHANGE_NAME';

/**
 * The initial state of the database name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create database name.
 *
 * @param {String} state - The create database name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_DATABASE_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} name - The database name.
 *
 * @returns {Object} The action.
 */
export const changeDatabaseName = (name) => ({
  type: CHANGE_DATABASE_NAME,
  name: name
});
