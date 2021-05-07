/**
 * The module prefix.
 */
const PREFIX = 'ddl/databases';

/**
 * The load databases action name.
 */
export const LOAD_DATABASES = `${PREFIX}/LOAD_DATABASES`;

/**
 * The initial state of the databases attribute.
 */
export const INITIAL_STATE = [];

/**
 * Reducer function for handle state changes to databases.
 *
 * @param {Array} state - The databases state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === LOAD_DATABASES) {
    return action.databases;
  }
  return state;
}

/**
 * Action creator for load databases events.
 *
 * @param {Array} databases - The raw database list.
 *
 * @returns {Object} The load databases action.
 */
export const loadDatabases = (databases) => ({
  type: LOAD_DATABASES,
  databases: databases
});
