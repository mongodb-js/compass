import { LOADING_STATE } from 'constants';

/**
 * Create instance.
 */
export const CHANGE_INSTANCE = 'app/instance/CHANGE_INSTANCE';

/**
 * The initial state of the instance.
 */
export const INITIAL_STATE = {
  databases: LOADING_STATE,
  collections: LOADING_STATE,
  build: {},
  hostname: 'Retrieving host information',
  port: ''
};

/**
 * Reducer function for handle state changes to instance.
 *
 * @param {String} state - The instance state.
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
