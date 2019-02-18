/**
 * SSH tunnel action.
 */
export const CHANGE_SSH_TUNNEL = 'home/ssh-tunnel/CHANGE_SSH_TUNNEL';

/**
 * The initial state of the ssh tunnel.
 */
export const INITIAL_STATE = 'NONE';

/**
 * Reducer function for handle state changes to ssh tunnel.
 *
 * @param {String} state - The ssh tunnel state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === CHANGE_SSH_TUNNEL) {
    return action.sshTunnel;
  }
  return state;
}

/**
 * The change ssh tunnel action creator.
 *
 * @param {String} ssh tunnel - The ssh tunnel.
 *
 * @returns {Object} The action.
 */
export const changeSshTunnel = (sshTunnel) => ({
  type: CHANGE_SSH_TUNNEL,
  sshTunnel: sshTunnel
});
