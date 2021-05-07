import { LOADING_STATE } from 'constants/sidebar-constants';

/**
 * Instance action.
 */
export const CHANGE_INSTANCE = 'sidebar/instance/CHANGE_INSTANCE';

/**
 * The initial state of the sidebar instance.
 */
export const INITIAL_STATE = { databases: LOADING_STATE, collections: LOADING_STATE};

/**
 * Reducer function for handle state changes to sidebar instance.
 *
 * @param {String} state - The sidebar instance state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_INSTANCE) {
    return action.instance;
  }
  return state;
}

/**
 * The change instance action creator.
 *
 * @param {String} instance - The instance.
 *
 * @returns {Object} The action.
 */
export const changeInstance = (instance) => ({
  type: CHANGE_INSTANCE,
  instance: instance
});
