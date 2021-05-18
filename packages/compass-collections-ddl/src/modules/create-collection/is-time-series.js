/**
 * Change is time-series action name.
 */
export const TOGGLE_IS_TIME_SERIES = 'ddl/create-collection/is-time-series/TOGGLE_IS_TIME_SERIES';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is time-series.
 *
 * @param {Boolean} state - The is time-series state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_IS_TIME_SERIES) {
    return action.isTimeSeries;
  }
  return state;
}

/**
 * The toggle is time-series action creator.
 *
 * @param {Boolean} isTimeSeries - Is time-series.
 *
 * @returns {Object} The action.
 */
export const toggleIsTimeSeries = (isTimeSeries) => ({
  type: TOGGLE_IS_TIME_SERIES,
  isTimeSeries: isTimeSeries
});
