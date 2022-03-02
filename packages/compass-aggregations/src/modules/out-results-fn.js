/**
 * Out results function changed action.
 */
export const OUT_RESULTS_FN_CHANGED = 'aggregations/out-results-fn/OUT_RESULTS_FN_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to the out results fn.
 *
 * @param {any} state - The fn state.
 * @param {Object} action - The action.
 *
 * @returns {any} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === OUT_RESULTS_FN_CHANGED) {
    return action.outResultsFn;
  }
  return state;
}

/**
 * Action creator for out results fn changed events.
 *
 * @param {Function} fn - The out results fn.
 *
 * @returns {Object} The out results fn changed action.
 */
export const outResultsFnChanged = (fn) => ({
  type: OUT_RESULTS_FN_CHANGED,
  outResultsFn: fn
});
