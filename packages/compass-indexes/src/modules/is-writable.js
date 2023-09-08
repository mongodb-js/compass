/**
 * The module action prefix.
 */
const PREFIX = 'indexes';

/**
 * The isWritable action type.
 */
export const WRITE_STATE_CHANGED = `${PREFIX}/is-writable/WRITE_STATE_CHANGED`;

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
  if (action.type === WRITE_STATE_CHANGED) {
    return action.isWritable;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isWritable events.
 *
 * @param {Boolean} isWritable
 * @returns {import('redux').AnyAction} The isWritable action.
 */
export const writeStateChanged = (isWritable) => ({
  type: WRITE_STATE_CHANGED,
  isWritable: isWritable,
});
