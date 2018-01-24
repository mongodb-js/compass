/**
 * The module prefix.
 */
const PREFIX = 'aggregations/sample';

/**
 * Sample toggled action.
 */
export const SAMPLE_TOGGLED = `${PREFIX}/SAMPLE_TOGGLED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = {
  isEnabled: true,
  value: 1000
};

/**
 * Reducer function for handle state changes to sample.
 *
 * @param {String} state - The namespace state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SAMPLE_TOGGLED) {
    return { isEnabled: !state.isEnabled, value: state.value };
  }
  return state;
}

/**
 * Action creator for sample toggle actions.
 *
 * @returns {Object} The sample toggled action.
 */
export const sampleToggled = () => ({
  type: SAMPLE_TOGGLED
});
