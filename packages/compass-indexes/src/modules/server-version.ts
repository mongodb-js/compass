/**
 * The prefix.
 */
const PREFIX = 'compass-indexes';

/**
 * Server version changed action.
 */
export const SERVER_VERSION_CHANGED = `${PREFIX}/server-version/SERVER_VERSION_CHANGED`;

type ServerVersion = string;

type ServerVersionChangedAction = {
  type: typeof SERVER_VERSION_CHANGED;
  version: ServerVersion;
};

/**
 * The initial state.
 */
export const INITIAL_STATE: ServerVersion = '4.0.0';

/**
 * Reducer function for handle state changes to server version.
 *
 * @param {String} state - The version state.
 * @param {Object} action - The action.
 *
 * @returns {String} The new state.
 */
export default function reducer(
  state = INITIAL_STATE,
  action: ServerVersionChangedAction
): ServerVersion {
  if (action.type === SERVER_VERSION_CHANGED) {
    return action.version || state;
  }
  return state;
}

/**
 * Action creator for server version changed events.
 *
 * @param {String} version - The version value.
 *
 * @returns {Object} The server version changed action.
 */
export const serverVersionChanged = (
  version: ServerVersion
): ServerVersionChangedAction => ({
  type: SERVER_VERSION_CHANGED,
  version,
});
