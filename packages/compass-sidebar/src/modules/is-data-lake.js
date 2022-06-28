/**
 * The module action prefix.
 */
const PREFIX = 'sidebar';

/**
 * The isDataLake action type.
 */
export const TOGGLE_IS_DATA_LAKE = `${PREFIX}/is-data-lake/TOGGLE_IS_DATA_LAKE`;

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to isDataLake.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_DATA_LAKE) {
    return action.isDataLake;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isDataLake events.
 *
 * @param {Boolean} isDataLake
 * @returns {Object} The isDataLake action.
 */
export const toggleIsDataLake = (isDataLake) => ({
  type: TOGGLE_IS_DATA_LAKE,
  isDataLake: isDataLake
});
