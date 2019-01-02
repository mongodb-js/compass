/**
 * The prefix.
 */
const PREFIX = 'ddl/create-database/is-visible';

/**
 * Hide create database action name.
 */
export const HIDE_CREATE_DATABASE = `${PREFIX}/HIDE_CREATE_DATABASE`;

/**
 * Show create database action name.
 */
export const SHOW_CREATE_DATABASE = `${PREFIX}/SHOW_CREATE_DATABASE`;

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
  } else if (action.type === HIDE_CREATE_DATABASE) {
    return false;
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

/**
 * The hide create database action creator.
 *
 * @returns {Object} The action.
 */
export const hideCreateDatabase = () => ({
  type: HIDE_CREATE_DATABASE
});
