/**
 * The module action prefix.
 */
const PREFIX = 'compassSchema';

/**
 * The toggle status action type.
 */
export const TOGGLE_STATUS = `${PREFIX}/TOGGLE_STATUS`;

/**
 * The initial state.
 */
export const INITIAL_STATE = 'enabled';

/**
 * Reducer function for handle state changes to status.
 *
 * @param {String} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_STATUS) {
    return (state === 'enabled') ? 'disabled' : 'enabled';
  }
  return state;
};

export default reducer;

/**
 * Action creator for toggle status events.
 *
 * @returns {Object} The toggle status action.
 */
export const toggleStatus = () => ({
  type: TOGGLE_STATUS
});
