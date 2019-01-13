/**
 * The prefix.
 */
const PREFIX = 'ddl/drop-database/is-visible';

/**
 * Hide drop database action name.
 */
export const HIDE_DROP_DATABASE = `${PREFIX}/HIDE_DROP_DATABASE`;

/**
 * Show drop database action name.
 */
export const SHOW_DROP_DATABASE = `${PREFIX}/SHOW_DROP_DATABASE`;

/**
 * The initial state of the is visible attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to drop database.
 *
 * @param {Boolean} state - The drop database is visible state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SHOW_DROP_DATABASE) {
    return true;
  } else if (action.type === HIDE_DROP_DATABASE) {
    return false;
  }
  return state;
}

/**
 * The show drop database action creator.
 *
 * @returns {Object} The action.
 */
export const showDropDatabase = () => ({
  type: SHOW_DROP_DATABASE
});

/**
 * The hide drop database action creator.
 *
 * @returns {Object} The action.
 */
export const hideDropDatabase = () => ({
  type: HIDE_DROP_DATABASE
});
