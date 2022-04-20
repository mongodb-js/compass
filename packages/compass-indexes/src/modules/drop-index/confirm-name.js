/**
 * Create confirm name action.
 */
export const CHANGE_CONFIRM_NAME =
  'indexes/drop-index/confirm-name/CHANGE_CONFIRM_NAME';

/**
 * The initial state of the confirm name.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create confirm name.
 *
 * @param {String} state - The create confirm name state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_CONFIRM_NAME) {
    return action.name;
  }
  return state;
}

/**
 * The change name action creator.
 *
 * @param {String} name - The confirm name.
 *
 * @returns {Object} The action.
 */
export const changeConfirmName = (name) => ({
  type: CHANGE_CONFIRM_NAME,
  name: name,
});
