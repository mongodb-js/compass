/**
 * Is readonly action.
 */
export const IS_READONLY_CHANGED = 'aggregations/is-readonly/IS_READONLY_CHANGED';

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
  if (action.type === IS_READONLY_CHANGED) {
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
export const isReadonlyChanged = (isReadonly) => ({
  type: IS_READONLY_CHANGED,
  isReadonly: isReadonly
});
