/**
 * Allow writes action name.
 */
export const ALLOW_WRITES = 'aggregations/allow-writes/ALLOW_WRITES';

/**
 * The initial state.
 */
export const INITIAL_STATE = true;

/**
 * The reducer.
 *
 * @param {Boolean} state The state.
 * @param {Object} action The action.
 *
 * @returns {Boolean} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === ALLOW_WRITES) {
    return action.allowWrites;
  }
  return state;
}

/**
 * Action creator for toggle allow writes events.
 *
 * @param {Boolean} allow - Is the plugin deployed on Atlas.
 *
 * @returns {Object} The action.
 */
export const allowWrites = (allow) => ({
  type: ALLOW_WRITES,
  allowWrites: allow
});
