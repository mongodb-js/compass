/**
 * The module action prefix.
 */
const PREFIX = 'loading';

/**
 * The change status action type.
 */
export const CHANGE_STATUS = `${PREFIX}/CHANGE_STATUS`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'Initializing';

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === CHANGE_STATUS) {
    return action.status;
  }
  return state;
};

export default reducer;

/**
 * Action creator for change status events.
 *
 * @param {String} status - The new status.
 *
 * @returns {Object} The change status action.
 */
export const changeStatus = (status) => ({
  type: CHANGE_STATUS,
  status: status
});
