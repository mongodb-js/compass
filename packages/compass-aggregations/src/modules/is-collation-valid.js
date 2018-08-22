import queryParser from 'mongodb-query-parser';

/**
 * Collation validated action.
 */
export const COLLATION_VALIDATED = 'aggregations/collation/COLLATION_VALIDATED';

/**
 * The isCollationValid initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle isCollationValid state changes.
 *
 * @param {String} state - The collation state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COLLATION_VALIDATED) {
    return action.isCollationValid;
  }
  return state;
}

/**
 * Action creator for collation validated event.
 *
 * @param {String} collation - The collation value.
 *
 * @returns {Object} The collation validated action.
 */
export const collationValidated = (collation) => {
  return {
    type: COLLATION_VALIDATED,
    isCollationValid: queryParser.isCollationValid(collation) ? true : false
  };
};
