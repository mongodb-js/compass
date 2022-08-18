/**
 * Change use partial filter expression action name.
 */
export const TOGGLE_USE_PARTIAL_FILTER_EXPRESSION =
  'indexes/create-indexes/is-partial_filter_expression/TOGGLE_USE_PARTIAL_FILTER_EXPRESSION';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to use partial filter expression.
 *
 * @param {Boolean} state - The use partial filter expression state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_USE_PARTIAL_FILTER_EXPRESSION) {
    return action.usePartialFilterExpression;
  }
  return state;
}

/**
 * The toggle use partial filter expression action creator.
 *
 * @param {Boolean} usePartialFilterExpression - use partial filter expression.
 *
 * @returns {Object} The action.
 */
export const toggleUsePartialFilterExpression = (
  usePartialFilterExpression
) => ({
  type: TOGGLE_USE_PARTIAL_FILTER_EXPRESSION,
  usePartialFilterExpression,
});
