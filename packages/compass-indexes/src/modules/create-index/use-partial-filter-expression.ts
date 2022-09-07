import type { AnyAction } from 'redux';

/**
 * Toggle use partial filter expression action name.
 */
export const TOGGLE_USE_PARTIAL_FILTER_EXPRESSION =
  'indexes/create-indexes/use-partial_filter_expression/TOGGLE_USE_PARTIAL_FILTER_EXPRESSION';

/**
 * The initial state of the use partial filter expression.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to the use partial filter expression.
 *
 * @param state - The use partial filter expression state.
 * @param action - The action.
 *
 * @returns The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: AnyAction
): boolean {
  if (action.type === TOGGLE_USE_PARTIAL_FILTER_EXPRESSION) {
    return action.usePartialFilterExpression;
  }
  return state;
}

/**
 * The toggle use partial filter expression action creator.
 *
 * @param usePartialFilterExpression - use partial filter expression.
 *
 * @returns The action.
 */
export const toggleUsePartialFilterExpression = (
  usePartialFilterExpression: boolean
) => ({
  type: TOGGLE_USE_PARTIAL_FILTER_EXPRESSION,
  usePartialFilterExpression,
});
