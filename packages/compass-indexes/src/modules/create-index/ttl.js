/**
 * Create index ttl action.
 */
export const CHANGE_TTL = 'indexes/create-index/ttl/CHANGE_TTL';

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
  if (action.type === CHANGE_TTL) {
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
export const changeTtl = (ttl) => ({
  type: CHANGE_TTL,
  ttl: ttl,
});
