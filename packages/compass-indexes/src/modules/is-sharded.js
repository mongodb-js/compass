/**
 * The readonly view changed action name.
 */
export const SHARDED_CHANGED = 'indexes/is-sharded/SHARDED_CHANGED';

/**
 * The initial state of the is readonly view attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for is readonly view state.
 *
 * @param {Boolean} state - The state.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === SHARDED_CHANGED) {
    return action.isSharded;
  }
  return state;
}

/**
 * Action creator for readonly view changed events.
 *
 * @param {Boolean} isReadonlyView - Is the view readonly.
 *
 * @returns {import('redux').AnyAction} The readonly view changed action.
 */
export const isShardedChanged = (isSharded) => ({
  type: SHARDED_CHANGED,
  isSharded: isSharded,
});
