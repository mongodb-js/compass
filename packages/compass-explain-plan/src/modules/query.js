
/**
 * The query changed action.
 */
export const QUERY_CHANGED = 'explain/query/QUERY_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  filter: {},
  sort: null,
  project: null,
  skip: 0,
  limit: 0,
  collation: null
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
    return action.query;
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
