/**
 * The initial state of the is readonly attribute.
 */
export const INITIAL_STATE = (process.env.HADRON_READONLY === 'true');

/**
 * The module action prefix.
 */
const PREFIX = 'indexes';

/**
 * The isReadonly action type.
 */
export const READ_STATE_CHANGED = `${PREFIX}/is-readonly/READ_STATE_CHANGED`;

/**
 * Reducer function for handle state changes to isReadonly.
 *
 * @param {Boolean} state - The status state.
 * @param {Object} action - The action.
 *
 * @returns {Boolean} The new state.
 */
const reducer = (state = INITIAL_STATE, action) => {
  if (action.type === READ_STATE_CHANGED) {
    return action.isReadonly;
  }
  return state;
};

export default reducer;

/**
 * Action creator for isReadonly events.
 *
 * @param {Boolean} isReadonly
 * @returns {Object} The isReadonly action.
 */
export const readStateChanged = (isReadonly) => ({
  type: READ_STATE_CHANGED,
  isReadonly: isReadonly
});


