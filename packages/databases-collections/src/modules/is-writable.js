/**
 * Write state changed action name.
 */
export const WRITE_STATE_CHANGED =
  'databases-collections/is-writable/WRITE_STATE_CHANGED';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = true;

/**
 * Reducer function for handle state changes to is writable.
 *
 * @param {Array} state - The sort column state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === WRITE_STATE_CHANGED) {
    return action.isWritable;
  }
  return state;
}

/**
 * The write state changed action creator.
 *
 * @param {Object} state - The store state.
 *
 * @return {Object} The action.
 */
export const writeStateChanged = (state) => ({
  type: WRITE_STATE_CHANGED,
  isWritable: state.isWritable,
});
