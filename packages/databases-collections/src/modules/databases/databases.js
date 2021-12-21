// The module prefix.
const PREFIX = 'compass-databases-collections/databases';

/**
 * The initial state of the databases attribute.
 */
export const INITIAL_STATE = [];

export const SET_DATABASES = `${PREFIX}/SET_DATABASES`;

export const setDatabases = (databases) => ({ type: SET_DATABASES, databases });

/**
 * Reducer function for handle state changes to databases.
 *
 * @param {Array} state - The databases state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  switch (action.type) {
    case SET_DATABASES:
      return action.databases;
    default:
      return state;
  }
}
