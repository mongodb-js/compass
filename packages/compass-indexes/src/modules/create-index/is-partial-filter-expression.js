/**
 * Change is partial filter expression action name.
 */
export const TOGGLE_IS_PARTIAL_FILTER_EXPRESSION =
  'indexes/create-indexes/is-partial_filter_expression/TOGGLE_IS_PARTIAL_FILTER_EXPRESSION';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is partial filter expression.
 *
 * @param {Boolean} state - The is partial filter expression state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_PARTIAL_FILTER_EXPRESSION) {
    return action.isPartialFilterExpression;
  }
  return state;
}

/**
 * The toggle is partial filter expression action creator.
 *
 * @param {Boolean} isPartialFilterExpression - Is partial filter expression.
 *
 * @returns {Object} The action.
 */
export const toggleIsPartialFilterExpression = (isPartialFilterExpression) => ({
  type: TOGGLE_IS_PARTIAL_FILTER_EXPRESSION,
  isPartialFilterExpression: isPartialFilterExpression,
});
