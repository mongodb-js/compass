/**
 * Change timeseries option action name.
 */
export const CHANGE_TIME_SERIES_OPTION = 'ddl/create-collection/timeseries/CHANGE_TIME_SERIES_OPTION';

/**
 * The initial state of the timeseries.
 */
export const INITIAL_STATE = {};

/**
 * Reducer function for handle state changes to timeseries.
 *
 * @param {Array} state - The timeseries state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_TIME_SERIES_OPTION) {
    return { ...state, [action.field]: action.value };
  }
  return state;
}

/**
 * The change capped size action creator.
 *
 * @param {String} field - The timeseries option.
 * @param {String} value - The timeseries option value.
 *
 * @returns {Object} The action.
 */
export const changeTimeSeriesOption = (field, value) => ({
  type: CHANGE_TIME_SERIES_OPTION,
  field: field,
  value: value
});
