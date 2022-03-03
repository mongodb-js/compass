import queryParser from 'mongodb-query-parser';

/**
 * Collation action.
 */
export const COLLATION_CHANGED = 'aggregations/collation/COLLATION_CHANGED';

/**
 * The collation initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle collation state changes.
 *
 * @param {any} state - The collation state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COLLATION_CHANGED) {
    return action.collation;
  }
  return state;
}

/**
 * Action creator for collation event.
 *
 * @param {String} collation - The collation value.
 *
 * @returns {Object} The collation changed action.
 */
export const collationChanged = (collation) => {
  return {
    type: COLLATION_CHANGED,
    collation: queryParser.isCollationValid(collation)
  };
};
