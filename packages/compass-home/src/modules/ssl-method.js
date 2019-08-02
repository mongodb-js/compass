/**
 * Ssl method action.
 */
export const CHANGE_SSL_METHOD = 'home/ssl/CHANGE_SSL_METHOD';

/**
 * The initial state of the sslMethod.
 */
export const INITIAL_STATE = 'NONE';

/**
 * Reducer function for handle state changes to sslMethod.
 *
 * @param {String} state - The sslMethod state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_SSL_METHOD) {
    return action.sslMethod;
  }
  return state;
}

/**
 * The change sslMethod action creator.
 *
 * @param {String} sslMethod - The ssl method.
 *
 * @returns {Object} The action.
 */
export const changeSslMethod = (sslMethod) => ({
  type: CHANGE_SSL_METHOD,
  sslMethod
});
