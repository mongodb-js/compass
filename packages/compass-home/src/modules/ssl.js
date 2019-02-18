/**
 * Ssl action.
 */
export const CHANGE_SSL = 'home/ssl/CHANGE_SSL';

/**
 * The initial state of the ssl.
 */
export const INITIAL_STATE = 'NONE';

/**
 * Reducer function for handle state changes to ssl.
 *
 * @param {String} state - The ssl state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_SSL) {
    return action.ssl;
  }
  return state;
}

/**
 * The change ssl action creator.
 *
 * @param {String} ssl - The ssl.
 *
 * @returns {Object} The action.
 */
export const changeSsl = (ssl) => ({
  type: CHANGE_SSL,
  ssl: ssl
});
