/**
 * Is reaonly action.
 */
export const SET_IS_READONLY = 'aggregations/is-readonly/SET_IS_READONLY';

/**
 * The initial state.
 */
export const INITIAL_STATE = false;

/**
 * The reducer.
 *
 * @param {Boolean} state The state.
 * @param {Object} action The action.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SET_IS_READONLY) {
    return action.isReadonly;
  }
  return state;
}

/**
 * Action creator for toggle is readonly events.
 *
 * @param {Boolean} isReadonly - Is the source readonly.
 *
 * @returns {Object} The action.
 */
export const setIsReadonly = (isReadonly) => ({
  type: SET_IS_READONLY,
  isReadonly: isReadonly
});
