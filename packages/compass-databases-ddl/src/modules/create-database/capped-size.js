/**
 * Change capped size action name.
 */
export const CHANGE_CAPPED_SIZE = 'ddl/create-database/capped-size/CHANE_CAPPED_SIZE';

/**
 * The initial state of the capped size.
 */
export const INITIAL_STATE = null;

/**
 * Reducer function for handle state changes to capped size.
 *
 * @param {Array} state - The capped size state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_CAPPED_SIZE) {
    return action.size;
  }
  return state;
}

/**
 * The change capped size action creator.
 *
 * @param {String} size - The capped size name.
 *
 * @returns {Object} The action.
 */
export const changeCappedSize = (size) => ({
  type: CHANGE_CAPPED_SIZE,
  size: size
});
