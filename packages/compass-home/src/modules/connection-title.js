/**
 * Instance id action.
 */
export const CHANGE_CONNECTION_TITLE = 'home/connectionTitle/CHANGE_CONNECTION_TITLE';

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
  if (action.type === CHANGE_CONNECTION_TITLE) {
    return action.connectionTitle;
  }
  return state;
}

/**
 * The change connectionTitle action creator.
 *
 * @param {String} connectionTitle - The connectionTitle.
 *
 * @returns {Object} The action.
 */
export const changeConnectionTitle = (connectionTitle) => ({
  type: CHANGE_CONNECTION_TITLE,
  connectionTitle
});
