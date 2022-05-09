/**
 * The prefix.
 */
const PREFIX = 'explain/query';

/**
 * The query changed action.
 */
export const QUERY_CHANGED = `${PREFIX}/QUERY_CHANGED`;

/**
 * The query executed action.
 */
export const QUERY_EXECUTED = `${PREFIX}/QUERY_EXECUTED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  filter: {},
  sort: null,
  project: null,
  skip: 0,
  limit: 0,
  collation: null,
  maxTimeMS: 5000,
  isChanged: false,
};

/**
 * Reducer function to handle the state.
 *
 * @param {String} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === QUERY_CHANGED) {
    return { ...action.query, isChanged: true };
  }

  if (action.type === QUERY_EXECUTED) {
    return { ...state, isChanged: false };
  }

  return state;
}

/**
 * Action creator for query changed events.
 *
 * @param {Object} query - The query.
 *
 * @returns {Object} The query changed action.
 */
export const queryChanged = (query) => ({ type: QUERY_CHANGED, query });

/**
 * Action creator for query executed events.
 *
 * @returns {Object} The query executed action.
 */
export const queryExecuted = () => ({ type: QUERY_EXECUTED });
