/**
 * Change use ttl action name.
 */
export const TOGGLE_USE_TTL = 'indexes/create-indexes/use-ttl/TOGGLE_USE_TTL';

/**
 * The initial state of the is writable attribute.
 */
export const INITIAL_STATE = false;

/**
 * Reducer function for handle state changes to use ttl.
 *
 * @param {Boolean} state - The use ttl state.
 * @param {Object} action - The action.
 *
 * @returns {Array} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TOGGLE_USE_TTL) {
    return action.useTtl;
  }
  return state;
}

/**
 * The toggle use ttl action creator.
 *
 * @param {Boolean} useTtl - use ttl.
 *
 * @returns {Object} The action.
 */
export const toggleUseTtl = (useTtl) => ({
  type: TOGGLE_USE_TTL,
  useTtl: useTtl,
});
