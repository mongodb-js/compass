/**
 * Show create database action name.
 */
export const SHOW_CREATE_DATABASE = 'ddl/create-database/is-visible/SHOW_CREATE_DATABASE';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to create database.
 *
 * @param {Array} state - The create database state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SHOW_CREATE_DATABASE) {
    return true;
  }
  return state;
}

/**
 * The show create database action creator.
 *
 * @returns {Object} The action.
 */
export const showCreateDatabase = () => ({
  type: SHOW_CREATE_DATABASE
});
