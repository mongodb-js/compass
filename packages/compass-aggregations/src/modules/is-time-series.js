/**
 * Is time-series changed action.
 */
export const IS_TIME_SERIES_CHANGED = 'aggregations/env/IS_TIME_SERIES_CHANGED';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isTimeSeries.
 *
 * @param {Boolean} state - The isTimeSeries state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_TIME_SERIES_CHANGED) {
    return action.isTimeSeries;
  }
  return state;
}

/**
 * Action creator for isTimeSeries changed events.
 *
 * @param {Boolean} isTimeSeries - The isTimeSeries value.
 *
 * @returns {Object} The isTimeSeries changed action.
 */
export const isTimeSeriesChanged = (isTimeSeries) => ({
  type: IS_TIME_SERIES_CHANGED,
  isTimeSeries
});
