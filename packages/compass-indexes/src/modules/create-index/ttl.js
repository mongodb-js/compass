/**
 * Create index ttl action.
 */
export const TTL_CHANGED = 'indexes/create-index/ttl/TTL_CHANGED';

/**
 * The initial state of the index ttl.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to create index ttl.
 *
 * @param {String} state - The create index ttl state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === TTL_CHANGED) {
    return action.ttl;
  }
  return state;
}

/**
 * The change ttl action creator.
 *
 * @param {String} ttl - The ttl.
 *
 * @returns {Object} The action.
 */
export const ttlChanged = (ttl) => ({
  type: TTL_CHANGED,
  ttl: ttl,
});
