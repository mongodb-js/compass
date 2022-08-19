import type { AnyAction } from 'redux';

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
 * @param state - The create partial filter expression state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(state = INITIAL_STATE, action: AnyAction) {
  if (action.type === PARTIAL_FILTER_EXPRESSION_CHANGED) {
    return action.partialFilterExpression;
  }
  return state;
}

/**
 * The change partial filter expression action creator.
 *
 * @param partialFilterExpression - The partial filter expression.
 *
 * @returns The action.
 */
export const partialFilterExpressionChanged = (
  partialFilterExpression: string
) => ({
  type: PARTIAL_FILTER_EXPRESSION_CHANGED,
  partialFilterExpression,
});
