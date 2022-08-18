/**
 * Create index partial filter expression action.
 */
export const PARTIAL_FILTER_EXPRESSION_CHANGED =
  'indexes/create-index/partial-filter-expression/PARTIAL_FILTER_EXPRESSION_CHANGED';

/**
 * The initial state of the partial filter expression.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create partial filter expression.
 *
 * @param {String} state - The create partial filter expression state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === PARTIAL_FILTER_EXPRESSION_CHANGED) {
    return action.partialFilterExpression;
  }
  return state;
}

/**
 * The change partial filter expression action creator.
 *
 * @param {String} partialFilterExpression - The partial filter expression.
 *
 * @returns {Object} The action.
 */
export const partialFilterExpressionChanged = (partialFilterExpression) => ({
  type: PARTIAL_FILTER_EXPRESSION_CHANGED,
  partialFilterExpression: partialFilterExpression,
});
