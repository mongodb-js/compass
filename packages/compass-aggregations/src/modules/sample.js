/**
 * Sample toggled action name.
 */
export const TOGGLE_SAMPLE = 'aggregations/sample/TOGGLE_SAMPLE';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to sample.
 *
 * @param {Boolean} state - The sample state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_SAMPLE) {
    return !state;
  }
  return state;
}

/**
 * Action creator for sample toggling.
 *
 * @returns {Object} The toggle sample action.
 */
export const toggleSample = () => ({
  type: TOGGLE_SAMPLE
});
