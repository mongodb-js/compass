/**
 * Instance id action.
 */
export const CHANGE_INSTANCE_ID = 'home/instance-id/CHANGE_INSTANCE_ID';

/**
 * The initial state of the instance id.
 */
export const INITIAL_STATE = '';

/**
 * Reducer function for handle state changes to instance id.
 *
 * @param {String} state - The instance id state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_INSTANCE_ID) {
    return action.instanceId;
  }
  return state;
}

/**
 * The change instanceId action creator.
 *
 * @param {String} instanceId - The instanceId.
 *
 * @returns {Object} The action.
 */
export const changeInstanceId = (instanceId) => ({
  type: CHANGE_INSTANCE_ID,
  instanceId: instanceId
});
