/**
 * Collation string changed action.
 */
export const COLLATION_STRING_CHANGED = 'aggregations/collation/COLLATION_STRING_CHANGED';

/**
 * The collation string initial state.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle collation string state changes.
 *
 * @param {String} state - The collation string state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === COLLATION_STRING_CHANGED) {
    return action.collationString;
  }
  return state;
}

/**
 * Action creator for collation string changed event.
 *
 * @param {String} collationString - The collation string value.
 *
 * @returns {import('redux').AnyAction} The collation string changed action.
 */
export const collationStringChanged = (collationString) => {
  return { type: COLLATION_STRING_CHANGED, collationString };
};
