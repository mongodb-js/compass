/**
 * Authentication action.
 */
export const CHANGE_AUTHENTICATION = 'home/authentication/CHANGE_AUTHENTICATION';

/**
 * The initial state of the authentication.
 */
export const INITIAL_STATE = 'NONE';

/**
 * Reducer function for handle state changes to authentication.
 *
 * @param {String} state - The authentication state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_AUTHENTICATION) {
    return action.authentication;
  }
  return state;
}

/**
 * The change authentication action creator.
 *
 * @param {String} authentication - The authentication.
 *
 * @returns {Object} The action.
 */
export const changeAuthentication = (authentication) => ({
  type: CHANGE_AUTHENTICATION,
  authentication: authentication
});
