/**
 * Authentication strategy action.
 */
export const CHANGE_AUTH_STRATEGY = 'home/authStrategy/CHANGE_AUTH_STRATEGY';

/**
 * The initial state of the authentication strategy.
 */
export const INITIAL_STATE = 'NONE';

/**
 * Reducer function for handle state changes to authentication strategy.
 *
 * @param {String} state - The authentication strategy state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_AUTH_STRATEGY) {
    return action.authStrategy;
  }
  return state;
}

/**
 * The change authentication strategy action creator.
 *
 * @param {String} authStrategy - The authentication strategy.
 *
 * @returns {Object} The action.
 */
export const changeAuthStrategy = (authStrategy) => ({
  type: CHANGE_AUTH_STRATEGY,
  authStrategy
});
