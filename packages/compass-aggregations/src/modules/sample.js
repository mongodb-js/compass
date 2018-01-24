/**
 * The module prefix.
 */
const PREFIX = 'aggregations/sample';

/**
 * Sample toggled action.
 */
export const SAMPLE_TOGGLED = `${PREFIX}/SAMPLE_TOGGLED`;

/**
 * Sample changed action.
 */
export const SAMPLE_CHANGED = `${PREFIX}/SAMPLE_CHANGED`;

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
  } else if (action.type === SAMPLE_CHANGED) {
    return { isEnabled: state.isEnabled, value: action.value };
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

/**
 * Action creator for sample changed actions.
 *
 * @param {Number} value - The value.
 *
 * @returns {Object} The sample changed action.
 */
export const sampleChanged = (value) => ({
  type: SAMPLE_CHANGED,
  value: value
});
