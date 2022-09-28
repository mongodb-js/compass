import type { AnyAction } from 'redux';

/**
 * Partial filter expression changed action name.
 */
export const PARTIAL_FILTER_EXPRESSION_CHANGED =
  'indexes/create-index/partial-filter-expression/PARTIAL_FILTER_EXPRESSION_CHANGED';

/**
 * The initial state of the partial filter expression.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle the partial filter expression state changes.
 *
 * @param state - The create partial filter expression state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): string {
  if (action.type === PARTIAL_FILTER_EXPRESSION_CHANGED) {
    return action.partialFilterExpression;
  }
  return state;
}

/**
 * Action creator for the partial filter expression changed event.
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
