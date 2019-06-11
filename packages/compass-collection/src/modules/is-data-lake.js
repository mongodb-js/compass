/**
 * The prefix.
 */
const PREFIX = 'collection';

/**
 * Is data lake changed.
 */
export const IS_DATA_LAKE_CHANGED = `${PREFIX}/is-data-lake/IS_DATA_LAKE_CHANGED`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to is data lake.
 *
 * @param {String} state - The is data lake state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === IS_DATA_LAKE_CHANGED) {
    return action.isDataLake;
  }
  return state;
}

/**
 * Action creator for is data lake changed events.
 *
 * @param {Boolean} isDataLake - Is data lake.
 *
 * @returns {Object} The is data lake changed action.
 */
export const isDataLakeChanged = (isDataLake) => ({
  type: IS_DATA_LAKE_CHANGED,
  isDataLake: isDataLake || false
});
