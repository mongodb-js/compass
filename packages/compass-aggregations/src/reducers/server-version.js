import { SERVER_VERSION_CHANGED } from 'action-creators';

/**
 * The initial state.
 */
const INITIAL_STATE = '3.6.0';

/**
 * Reducer function for handle state changes to stages.
 *
 * @param {String} state - The version state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
const stages = (state = INITIAL_STATE, action) => {
  if (action.type === SERVER_VERSION_CHANGED) {
    return action.version;
  }
  return state;
};

export default stages;
