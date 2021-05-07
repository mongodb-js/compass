/**
 * The module action prefix.
 */
const PREFIX = 'sidebar';

/**
 * The isWritable action type.
 */
export const TOGGLE_IS_WRITABLE = `${PREFIX}/is-writable/TOGGLE_IS_WRITABLE`;

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to isWritable.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === TOGGLE_IS_WRITABLE) {
    return action.isWritable;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isWritable events.
 *
 * @param {Boolean} isWritable
 * @returns {Object} The isWritable action.
 */
export const toggleIsWritable = (isWritable) => ({
  type: TOGGLE_IS_WRITABLE,
  isWritable: isWritable
});
