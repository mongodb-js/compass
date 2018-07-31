const PREFIX = 'auto-updates';

/**
 * Update available action name.
 */
export const UPDATE_AVAILABLE = `${PREFIX}/UPDATE_AVAILABLE`;

/**
 * Cancel update action name.
 */
export const CANCEL_UPDATE = `${PREFIX}/CANCEL_UPDATE`;

/**
 * The initial state.
 */
export const INITIAL_STATE = { isVisible: false, version: '' };

/**
 * The reducer.
 *
 * @param {Object} state - The state.
 * @param {Object} action - The action.
 *
 * @returns {Object} The state.
 */
export default function reducer(state = INITIAL_STATE, action) {
  if (action.type === UPDATE_AVAILABLE) {
    return { isVisible: true, version: action.version };
  } else if (action.type === CANCEL_UPDATE) {
    return { isVisible: false, version: '' };
  }
  return state;
}

/**
 * Update available action creator.
 *
 * @param {String} version - The version.
 *
 * @returns {Object} The action.
 */
export const updateAvailable = (version) => ({
  type: UPDATE_AVAILABLE,
  version: version
});

/**
 * Cancel update action creator.
 *
 * @returns {Object} The action.
 */
export const cancelUpdate = () => ({
  type: CANCEL_UPDATE
});
